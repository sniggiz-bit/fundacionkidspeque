export const dynamic = 'force-dynamic';
/**
 * POST /api/donations/flow/confirm
 * ─────────────────────────────────────────────────────────────────
 * Webhook de confirmación de pago enviado por Flow.cl.
 *
 * ⚠️ IMPORTANTE: Flow envía POST con Content-Type: application/x-www-form-urlencoded
 *    con el parámetro "token" = token de la transacción.
 *
 * Flujo correcto:
 *   1. Recibir token (form-encoded)
 *   2. Consultar getFlowPaymentStatus(token) → obtener commerceOrder real
 *   3. Buscar donación por commerceOrder (= gatewayTransactionId que guardamos al crear)
 *   4. Si status=2 (aprobado) → confirmar; si status=3 (rechazado) → failed
 *   5. Siempre responder 200 para evitar reintentos de Flow
 *
 * Documentación: https://www.flow.cl/app/web/api.php
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getFlowPaymentStatus, isFlowApproved } from "@/lib/gateways/flow";

export async function POST(request: NextRequest) {
  try {
    // Flow envía application/x-www-form-urlencoded (no multipart/form-data)
    const rawBody = await request.text();
    const params  = new URLSearchParams(rawBody);
    const token   = params.get("token");

    if (!token) {
      console.error("[flow/confirm] Token no recibido en el body:", rawBody);
      return NextResponse.json({ error: "Token requerido" }, { status: 400 });
    }

    // Consultar el estado real del pago con la API de Flow (verificación activa)
    const flowStatus = await getFlowPaymentStatus(token);

    console.log("[flow/confirm] Estado de pago recibido:", {
      token,
      commerceOrder: flowStatus.commerceOrder,
      flowOrder:     flowStatus.flowOrder,
      status:        flowStatus.status,   // 1=pendiente, 2=pagado, 3=rechazado, 4=anulado
      amount:        flowStatus.amount,
    });

    // Buscar donación por commerceOrder (= buyOrder que guardamos al iniciar el pago)
    const donation = await db.donation.findFirst({
      where: {
        gateway:             "flow",
        gatewayTransactionId: flowStatus.commerceOrder,
      },
      select: { id: true, status: true },
    });

    if (!donation) {
      console.error("[flow/confirm] Donación no encontrada para commerceOrder:", flowStatus.commerceOrder);
      // Responder 200 para que Flow no reintente indefinidamente
      return NextResponse.json({ received: true, processed: false }, { status: 200 });
    }

    // Idempotencia: no procesar si ya fue confirmada/fallida
    if (donation.status !== "pending") {
      console.log("[flow/confirm] Donación ya procesada:", donation.id, "status:", donation.status);
      return NextResponse.json({ received: true, processed: false }, { status: 200 });
    }

    if (isFlowApproved(flowStatus)) {
      // ✅ Pago aprobado (status=2)
      await db.donation.update({
        where: { id: donation.id },
        data: {
          status:            "confirmed",
          paymentMethod:     flowStatus.paymentData?.media ?? "Flow",
          installments:      1,
          gatewayOrderId:    String(flowStatus.flowOrder),
          webhookReceivedAt: new Date(),
          webhookPayload:    flowStatus as object,
        },
      });
      console.log("[flow/confirm] ✅ Donación confirmada:", donation.id);
    } else {
      // ❌ Rechazado (status=3) o anulado (status=4)
      const failedStatus = flowStatus.status === 4 ? "refunded" : "failed";
      await db.donation.update({
        where: { id: donation.id },
        data: {
          status:            failedStatus,
          webhookReceivedAt: new Date(),
          webhookPayload:    flowStatus as object,
        },
      });
      console.log(`[flow/confirm] ❌ Donación ${failedStatus}:`, donation.id);
    }

    // Flow requiere respuesta 200 para no reintentar el webhook
    return NextResponse.json({ received: true, processed: true }, { status: 200 });

  } catch (err) {
    console.error("[flow/confirm] Error inesperado:", err);
    // Responder 200 igualmente — el error se maneja internamente y no queremos reintentos
    return NextResponse.json({ received: true, processed: false }, { status: 200 });
  }
}

// Flow puede verificar el endpoint con GET
export function GET() {
  return NextResponse.json({ status: "ok", endpoint: "flow-donation-confirmation" });
}
