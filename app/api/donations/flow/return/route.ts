export const dynamic = 'force-dynamic';
/**
 * /api/donations/flow/return
 * ─────────────────────────────────────────────────────────────────
 * Ruta de retorno del usuario después de pagar en el portal de Flow.
 * Flow redirige al usuario aquí con el token vía GET o POST.
 *
 * Esta ruta verifica el estado y redirige al usuario a la página de confirmación.
 * NO procesa el pago de forma definitiva (eso lo hace el webhook /confirm con idempotencia).
 */

import { NextRequest, NextResponse } from "next/server";
import { getFlowPaymentStatus } from "@/lib/gateways/flow";
import { db } from "@/lib/db";

async function handleReturn(token: string | null) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001").replace(/\/$/, "");

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/donacion/confirmacion`);
  }

  try {
    const flowStatus = await getFlowPaymentStatus(token);
    const donation = await db.donation.findFirst({
      where: {
        gateway: "flow",
        OR: [
          { gatewayOrderId: flowStatus.commerceOrder },
          { gatewayTransactionId: token },
        ],
      },
      select: { id: true },
    });

    const targetId = donation?.id;
    return NextResponse.redirect(
      targetId
        ? `${baseUrl}/donacion/confirmacion?id=${targetId}`
        : `${baseUrl}/donacion/confirmacion`
    );
  } catch (err) {
    console.error("[flow/return] Error al verificar retorno de Flow:", err);
    return NextResponse.redirect(`${baseUrl}/donacion/confirmacion`);
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  return handleReturn(token);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  const token = (formData?.get("token") as string) ?? request.nextUrl.searchParams.get("token");
  return handleReturn(token);
}
