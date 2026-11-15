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
import { revalidatePath } from "next/cache";

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
  title:            z.string().min(5, "Título muy corto").max(200),
  childName:        z.string().min(2, "Nombre muy corto").max(100),
  childAge:         z.number().int().min(0).max(17),
  shortDescription: z.string().min(10, "Descripción muy corta").max(160),
  story:            z.string().min(20, "Historia muy corta"),
  targetAmount:     z.number().int().min(1000, "Monto mínimo: $1.000"),
  category:         z.string().min(1, "Categoría requerida"),
  tags:             z.array(z.string()).default([]),
  deadline:         z.string().optional().nullable(),
  coverImageUrl:    z.string().url("URL de imagen inválida"),
  coverImageAlt:    z.string().optional().nullable(),
  slug:             z.string().min(3, "Slug muy corto").max(250).regex(/^[a-z0-9-]+$/, "Slug inválido"),
  metaTitle:        z.string().max(60).optional().nullable(),
  metaDescription:  z.string().max(160).optional().nullable(),
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

  const { coverImageUrl, coverImageAlt, deadline, story, ...data } = parsed.data;
  const validDeadline = deadline && !isNaN(Date.parse(deadline)) ? new Date(deadline) : undefined;
  const safeAlt = (coverImageAlt && coverImageAlt.trim()) ? coverImageAlt.trim() : data.title;

  const normalizedStory = (story && !/<[a-z][\s\S]*>/i.test(story))
    ? story.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).map(p => `<p>${p.replace(/\n/g, "<br />")}</p>`).join("\n")
    : story;

  try {
    const dream = await db.dream.create({
      data: {
        ...data,
        story:       normalizedStory,
        publicId:    generatePublicId(),
        coverImage:  { url: coverImageUrl, alt: safeAlt, width: 1200, height: 630 },
        deadline:    validDeadline,
        publishedAt: data.status === "active" ? new Date() : undefined,
      },
      select: { id: true, publicId: true, slug: true },
    });

    // Revalidar cachés de rutas
    revalidatePath("/", "layout");
    revalidatePath("/suenos", "page");
    revalidatePath("/admin/suenos", "page");
    revalidatePath("/admin", "page");

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

  const formattedDreams = dreams.map(d => ({
    ...d,
    raisedAmount: Number(d.raisedAmount),
    targetAmount: Number(d.targetAmount),
    progressPct: Number(d.progressPct),
  }));

  return NextResponse.json({ success: true, data: formattedDreams });
}

