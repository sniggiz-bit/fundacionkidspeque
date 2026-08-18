export const dynamic = 'force-dynamic';
/**
 * PATCH /api/admin/donations/[id]
 * ─────────────────────────────────────────────────────────────────
 * Actualiza manualmente el estado de una donación desde el panel admin.
 * Útil para confirmaciones manuales o reembolsos procesados fuera del gateway.
 */

import { NextRequest, NextResponse } from "next/server";
import { z }        from "zod";
import { db }       from "@/lib/db";
import { cookies }  from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? "fallback-dev-secret-change-in-production"
);

async function verifyAdmin(): Promise<boolean> {
  const token = cookies().get("admin_session")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, JWT_SECRET, { issuer: "kidspeque-admin" });
    return true;
  } catch { return false; }
}

const patchSchema = z.object({
  status: z.enum(["pending", "confirmed", "failed", "refunded", "disputed"]),
  note:   z.string().max(500).optional(), // Para auditoría interna
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  const body   = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors } },
      { status: 422 }
    );
  }

  try {
    const donation = await db.donation.update({
      where:  { id: params.id },
      data:   { status: parsed.data.status },
      select: {
        id: true, status: true, amountInCLP: true,
        dream: { select: { title: true } },
      },
    });

    console.log(`[admin/donations PATCH] Status cambiado a '${parsed.data.status}':`, params.id);

    return NextResponse.json({ success: true, data: donation });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      return NextResponse.json({ success: false, error: "Donación no encontrada" }, { status: 404 });
    }
    console.error("[admin/donations PATCH]", err);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const donation = await db.donation.findUnique({
    where: { id: params.id },
    include: {
      contributor: { select: { firstName: true, lastName: true, email: true } },
      dream:       { select: { publicId: true, title: true } },
    },
  });

  if (!donation) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: donation });
}
