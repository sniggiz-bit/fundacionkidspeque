/**
 * GET    /api/admin/collaborators/[id]
 * PATCH  /api/admin/collaborators/[id]  — Actualizar estado / verificación
 * DELETE /api/admin/collaborators/[id]
 */
export const dynamic = 'force-dynamic';

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
  status:                  z.enum(["pending", "active", "inactive", "rejected"]).optional(),
  isVerified:              z.boolean().optional(),
  backgroundCheckComplete: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const collaborator = await db.collaborator.findUnique({ where: { id: params.id } });
  if (!collaborator) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ success: true, data: collaborator });
}

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
    const collaborator = await db.collaborator.update({
      where:  { id: params.id },
      data:   parsed.data,
      select: { id: true, status: true, isVerified: true, updatedAt: true },
    });
    return NextResponse.json({ success: true, data: collaborator });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
    }
    console.error("[admin/collaborators PATCH]", err);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  try {
    await db.collaborator.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
    }
    console.error("[admin/collaborators DELETE]", err);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
