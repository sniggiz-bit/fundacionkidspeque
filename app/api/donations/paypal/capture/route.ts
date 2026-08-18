export const dynamic = 'force-dynamic';
/**
 * GET /api/donations/paypal/capture
 * ─────────────────────────────────────────────────────────────────
 * PayPal redirige aquí tras la aprobación del usuario.
 * Query params: ?token=ORDER_ID&PayerID=XXXX&donationId=UUID
 *
 * Proceso:
 *   1. Capturar la orden con capturePayPalOrder(token)
 *   2. Si exitoso → confirmar donación → redirigir a /donacion/confirmacion
 */

import { NextRequest, NextResponse } from "next/server";
import { db }  from "@/lib/db";
import { capturePayPalOrder, isPayPalCaptureCompleted } from "@/lib/gateways/paypal";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

// Tasa de cambio USD→CLP aproximada (en producción obtener de una API de tipo de cambio)
// ej: https://api.exchangerate-api.com/v4/latest/USD
const APPROX_USD_TO_CLP = 950;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const paypalOrderId    = searchParams.get("token");       // ID de orden PayPal
  const donationId       = searchParams.get("donationId");  // ID interno

  if (!paypalOrderId || !donationId) {
    return NextResponse.redirect(`${APP_URL}/donacion/cancelada?reason=missing_params`);
  }

  // Verificar que la donación existe
  const donation = await db.donation.findUnique({
    where:  { id: donationId },
    select: { id: true, status: true, amount: true },
  });

  if (!donation) {
    return NextResponse.redirect(`${APP_URL}/donacion/cancelada?reason=not_found`);
  }

  if (donation.status === "confirmed") {
    return NextResponse.redirect(`${APP_URL}/donacion/confirmacion?id=${donationId}`);
  }

  try {
    const result = await capturePayPalOrder(paypalOrderId);

    if (isPayPalCaptureCompleted(result)) {
      const amountInCLP = Math.round(result.amount * APPROX_USD_TO_CLP);

      await db.donation.update({
        where: { id: donationId },
        data:  {
          status:              "confirmed",
          gatewayTransactionId: result.captureId,
          amountInCLP,         // Guardar equivalente CLP para métricas
          webhookReceivedAt:   new Date(),
          webhookPayload:      result as object,
        },
      });

      return NextResponse.redirect(`${APP_URL}/donacion/confirmacion?id=${donationId}`);
    } else {
      await db.donation.update({
        where: { id: donationId },
        data:  { status: "failed", webhookPayload: result as object },
      });
      return NextResponse.redirect(
        `${APP_URL}/donacion/cancelada?id=${donationId}&reason=capture_failed`
      );
    }
  } catch (err) {
    console.error("[paypal/capture] Error:", err);
    return NextResponse.redirect(`${APP_URL}/donacion/cancelada?reason=error`);
  }
}

