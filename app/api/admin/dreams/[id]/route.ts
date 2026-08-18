/**
 * GET    /api/admin/dreams/[id]  — Obtener sueño por ID
 * PUT    /api/admin/dreams/[id]  — Actualizar sueño
 * DELETE /api/admin/dreams/[id]  — Eliminar sueño (solo si no tiene donaciones)
 */

import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
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

const dreamUpdateSchema = z.object({
  title:            z.string().min(10).max(200).optional(),
  childName:        z.string().min(2).max(100).optional(),
  childAge:         z.number().int().min(0).max(17).optional(),
  shortDescription: z.string().min(20).max(160).optional(),
  story:            z.string().min(100).optional(),
  targetAmount:     z.number().int().min(10000).optional(),
  category:         z.string().min(1).optional(),
  tags:             z.array(z.string()).optional(),
  deadline:         z.string().nullable().optional(),
  coverImageUrl:    z.string().url().optional(),
  coverImageAlt:    z.string().min(5).optional(),
  slug:             z.string().min(5).max(250).regex(/^[a-z0-9-]+$/).optional(),
  metaTitle:        z.string().max(60).nullable().optional(),
  metaDescription:  z.string().max(160).nullable().optional(),
  status:           z.enum(["draft", "active", "paused", "funded", "completed", "cancelled"]).optional(),
});

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dream = await db.dream.findUnique({ where: { id: params.id } });
  if (!dream) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json({ success: true, data: dream });
}

// ── PUT ──────────────────────────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  const body   = await request.json().catch(() => null);
  const parsed = dreamUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors } },
      { status: 422 }
    );
  }

  const { coverImageUrl, coverImageAlt, deadline, status, ...rest } = parsed.data;

  // Construir el patch dinámicamente
  const patch: Record<string, unknown> = { ...rest };

  if (coverImageUrl || coverImageAlt) {
    // Obtener imagen actual para fusionarla
    const current = await db.dream.findUnique({ where: { id: params.id }, select: { coverImage: true } });
    const currentCover = (current?.coverImage as { url: string; alt: string; width: number; height: number }) ?? {};
    patch.coverImage = {
      url:    coverImageUrl ?? currentCover.url,
      alt:    coverImageAlt ?? currentCover.alt,
      width:  currentCover.width  ?? 1200,
      height: currentCover.height ?? 630,
    };
  }

  if (deadline !== undefined) {
    patch.deadline = deadline ? new Date(deadline) : null;
  }

  if (status) {
    patch.status = status;
    // Si se publica por primera vez → setear publishedAt
    if (status === "active") {
      const current = await db.dream.findUnique({ where: { id: params.id }, select: { publishedAt: true } });
      if (!current?.publishedAt) patch.publishedAt = new Date();
    }
    if (status === "completed") patch.completedAt = new Date();
  }

  try {
    const dream = await db.dream.update({
      where:  { id: params.id },
      data:   patch,
      select: { id: true, publicId: true, slug: true, status: true, updatedAt: true },
    });
    
    // Invalidar caché público
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/", "layout");
    
    return NextResponse.json({ success: true, data: dream });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { success: false, error: { code: "DUPLICATE_SLUG", message: "Este slug ya existe." } },
        { status: 409 }
      );
    }
    if ((err as { code?: string }).code === "P2025") {
      return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
    }
    console.error("[admin/dreams PUT]", err);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  // No eliminar si ya tiene donaciones confirmadas
  const donationsCount = await db.donation.count({
    where: { dreamId: params.id, status: "confirmed" },
  });

  if (donationsCount > 0) {
    return NextResponse.json(
      { success: false, error: { code: "HAS_DONATIONS", message: "No puedes eliminar un sueño con donaciones confirmadas. Cámbialo a 'cancelado' en su lugar." } },
      { status: 409 }
    );
  }

  try {
    await db.dream.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
    }
    console.error("[admin/dreams DELETE]", err);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
