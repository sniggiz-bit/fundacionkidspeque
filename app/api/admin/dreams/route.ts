export const dynamic = 'force-dynamic';
/**
 * POST /api/admin/dreams   — Crear nuevo sueño
 * GET  /api/admin/dreams   — Listar sueños (para el CMS)
 */

import { NextRequest, NextResponse } from "next/server";
import { z }   from "zod";
import { db }  from "@/lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { randomBytes } from "crypto";

/** Genera un publicId corto estilo "DRM-XXXX" */
function generatePublicId(): string {
  const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ23456789";
  let id = "DRM-";
  for (let i = 0; i < 6; i++) {
    id += chars[randomBytes(1)[0] % chars.length];
  }
  return id;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? "fallback-dev-secret-change-in-production"
);

// Verificar autenticación admin
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

const dreamCreateSchema = z.object({
  title:            z.string().min(10).max(200),
  childName:        z.string().min(2).max(100),
  childAge:         z.number().int().min(0).max(17),
  shortDescription: z.string().min(20).max(160),
  story:            z.string().min(100),
  targetAmount:     z.number().int().min(10000),
  category:         z.string().min(1),
  tags:             z.array(z.string()),
  deadline:         z.string().optional(),
  coverImageUrl:    z.string().url(),
  coverImageAlt:    z.string().min(5),
  slug:             z.string().min(5).max(250).regex(/^[a-z0-9-]+$/),
  metaTitle:        z.string().max(60).optional(),
  metaDescription:  z.string().max(160).optional(),
  status:           z.enum(["draft", "active", "paused"]),
});

export async function POST(request: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  const body   = await request.json().catch(() => null);
  const parsed = dreamCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors } },
      { status: 422 }
    );
  }

  const { coverImageUrl, coverImageAlt, deadline, ...data } = parsed.data;

  try {
    const dream = await db.dream.create({
      data: {
        ...data,
        publicId:    generatePublicId(),
        coverImage:  { url: coverImageUrl, alt: coverImageAlt, width: 1200, height: 630 },
        deadline:    deadline ? new Date(deadline) : undefined,
        publishedAt: data.status === "active" ? new Date() : undefined,
      },
      select: { id: true, publicId: true, slug: true },
    });

    return NextResponse.json(
      { success: true, data: dream },
      { status: 201 }
    );
  } catch (err: unknown) {
    // Detectar violación de unicidad (slug duplicado)
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { success: false, error: { code: "DUPLICATE_SLUG", message: "Este slug ya existe. Elige uno diferente." } },
        { status: 409 }
      );
    }
    console.error("[admin/dreams POST]", err);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dreams = await db.dream.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, publicId: true, title: true, status: true,
      raisedAmount: true, targetAmount: true, progressPct: true,
    },
  });

  return NextResponse.json({ success: true, data: dreams });
}

