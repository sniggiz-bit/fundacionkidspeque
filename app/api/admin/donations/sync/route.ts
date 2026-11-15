export const dynamic = 'force-dynamic';
/**
 * POST /api/admin/donations/sync
 * ─────────────────────────────────────────────────────────────────
 * Recalcula en lote las métricas de todos los sueños y donantes
 * a partir de las donaciones confirmadas en la base de datos.
 * Requiere sesión de administrador activa.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { recalculateAllStats } from "@/lib/stats";

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? "fallback-dev-secret-change-in-production"
);

async function verifyAdmin(): Promise<boolean> {
  const token = cookies().get("admin_session")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, JWT_SECRET, { issuer: "kidspeque-admin" });
    return true;
  } catch {
    return false;
  }
}

export async function POST() {
  if (!await verifyAdmin()) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await recalculateAllStats();
    return NextResponse.json({
      success: true,
      message: "Estadísticas recalculadas exitosamente",
      data: result,
    });
  } catch (err) {
    console.error("[admin/donations/sync POST]", err);
    return NextResponse.json({ success: false, error: "Error al sincronizar estadísticas" }, { status: 500 });
  }
}
