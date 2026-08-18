export const dynamic = 'force-dynamic';
/**
 * GET /api/donations/flow/return
 * ─────────────────────────────────────────────────────────────────
 * Ruta de retorno del usuario después de pagar en el portal de Flow.
 * Flow redirige al usuario aquí con el token como query param.
 *
 * Esta ruta verifica el estado y redirige al usuario a la página correcta.
 * NO procesa el pago (eso lo hace el webhook /confirm).
 */

import { NextRequest, NextResponse } from "next/server";
import { getFlowPaymentStatus, isFlowApproved } from "@/lib/gateways/flow";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/donacion/error?reason=no_token`);
  }

  try {
    const flowStatus = await getFlowPaymentStatus(token);

    if (isFlowApproved(flowStatus)) {
      // Pago exitoso — redirigir a página de gracias
      return NextResponse.redirect(
        `${baseUrl}/donacion/gracias?commerceOrder=${flowStatus.commerceOrder}&gateway=flow`
      );
    } else {
      // Pago rechazado o cancelado
      return NextResponse.redirect(
        `${baseUrl}/donacion/error?reason=payment_rejected&commerceOrder=${flowStatus.commerceOrder}&gateway=flow`
      );
    }
  } catch (err) {
    console.error("[flow/return] Error verificando estado:", err);
    return NextResponse.redirect(`${baseUrl}/donacion/error?reason=verification_error`);
  }
}
