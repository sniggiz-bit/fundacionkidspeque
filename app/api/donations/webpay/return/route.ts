export const dynamic = 'force-dynamic';
/**
 * GET + POST /api/donations/webpay/return
 * ─────────────────────────────────────────────────────────────────
 * Transbank redirige al usuario aquí tras el pago (exitoso o fallido).
 * Puede llegar como GET o POST dependiendo de la versión del navegador.
 *
 * Parámetros recibidos:
 *   token_ws     → pago exitoso (o iniciado)
 *   TBK_TOKEN    → pago anulado por el usuario
 *   TBK_ORDEN_COMPRA + TBK_ID_SESION → timeout en el banco
 *
 * Proceso:
 *   1. Extraer token del query/body
 *   2. Llamar commitWebpayTransaction(token)
 *   3. Si aprobado → confirmar donación en DB → redirigir a /donacion/confirmacion
 *   4. Si rechazado → marcar failed en DB → redirigir a /donacion/cancelada
 */

import { NextRequest, NextResponse } from "next/server";
import { db }  from "@/lib/db";
import { commitWebpayTransaction, isWebpayApproved } from "@/lib/gateways/transbank";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

// ── Lógica compartida ─────────────────────────────────────────────────────────

async function handleWebpayReturn(
  tokenWs:    string | null,
  tbkToken:   string | null,
  tbkOrder:   string | null,
) {
  // Caso 1: usuario anuló la transacción (Transbank envía TBK_TOKEN)
  if (tbkToken && !tokenWs) {
    return NextResponse.redirect(`${APP_URL}/donacion/cancelada?reason=user_cancelled`);
  }

  // Caso 2: timeout en el banco (solo TBK_ORDEN_COMPRA, sin token)
  if (!tokenWs && tbkOrder) {
    return NextResponse.redirect(`${APP_URL}/donacion/cancelada?reason=timeout`);
  }

  // Caso 3: flujo normal — hacer commit
  if (!tokenWs) {
    return NextResponse.redirect(`${APP_URL}/donacion/cancelada?reason=unknown`);
  }

  // Buscar la donación por gatewayOrderId (token de Webpay guardado en initiate)
  const donation = await db.donation.findFirst({
    where:  { gatewayOrderId: tokenWs, gateway: "webpay_plus" },
    select: { id: true, status: true },
  });

  if (!donation) {
    console.error("[webpay/return] Donación no encontrada para token:", tokenWs);
    return NextResponse.redirect(`${APP_URL}/donacion/cancelada?reason=not_found`);
  }

  // Evitar doble-commit (idempotencia)
  if (donation.status === "confirmed") {
    return NextResponse.redirect(`${APP_URL}/donacion/confirmacion?id=${donation.id}`);
  }

  try {
    // Confirmar la transacción con Transbank
    const result = await commitWebpayTransaction(tokenWs);

    if (isWebpayApproved(result)) {
      // ── Donación aprobada ─────────────────────────────────────────────────
      await db.donation.update({
        where: { id: donation.id },
        data:  {
          status:              "confirmed",
          gatewayTransactionId: result.authorizationCode,
          paymentMethod:       mapPaymentType(result.paymentTypeCode),
          installments:        result.installmentsNumber ?? 1,
          webhookReceivedAt:   new Date(),
          webhookPayload:      result as object,
        },
      });

      // El trigger de PostgreSQL actualiza raised_amount del sueño automáticamente.
      // En producción: enviar email de recibo aquí.

      return NextResponse.redirect(`${APP_URL}/donacion/confirmacion?id=${donation.id}`);
    } else {
      // ── Pago rechazado ────────────────────────────────────────────────────
      await db.donation.update({
        where: { id: donation.id },
        data:  {
          status:         "failed",
          webhookPayload: result as object,
        },
      });

      return NextResponse.redirect(
        `${APP_URL}/donacion/cancelada?id=${donation.id}&reason=rejected`
      );
    }
  } catch (err) {
    console.error("[webpay/return] Error en commit:", err);
    return NextResponse.redirect(`${APP_URL}/donacion/cancelada?reason=error`);
  }
}

// ── Mapeo de códigos de tipo de pago de Transbank ─────────────────────────────

function mapPaymentType(code: string): string {
  const types: Record<string, string> = {
    VD: "Débito Redcompra",
    VN: "Crédito (sin cuotas)",
    VC: "Crédito (con cuotas)",
    SI: "Crédito (3 cuotas sin interés)",
    S2: "Crédito (2 cuotas sin interés)",
    NC: "Crédito (N cuotas sin interés)",
    VP: "Prepago",
  };
  return types[code] ?? code;
}

// ── Handlers GET y POST ───────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  return handleWebpayReturn(
    searchParams.get("token_ws"),
    searchParams.get("TBK_TOKEN"),
    searchParams.get("TBK_ORDEN_COMPRA"),
  );
}

export async function POST(request: NextRequest) {
  // Transbank puede enviar el token como form-data
  let tokenWs:  string | null = null;
  let tbkToken: string | null = null;
  let tbkOrder: string | null = null;

  try {
    const form = await request.formData();
    tokenWs  = form.get("token_ws")       as string | null;
    tbkToken = form.get("TBK_TOKEN")      as string | null;
    tbkOrder = form.get("TBK_ORDEN_COMPRA") as string | null;
  } catch {
    // Si no es form-data, intentar query params
    const { searchParams } = request.nextUrl;
    tokenWs  = searchParams.get("token_ws");
    tbkToken = searchParams.get("TBK_TOKEN");
    tbkOrder = searchParams.get("TBK_ORDEN_COMPRA");
  }

  return handleWebpayReturn(tokenWs, tbkToken, tbkOrder);
}

