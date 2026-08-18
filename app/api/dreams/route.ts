export const dynamic = 'force-dynamic';
/**
 * GET  /api/dreams  — Lista paginada de sueños con filtros opcionales.
 * POST /api/dreams  — Crear un nuevo sueño (registro público, se guarda como draft)
 */

import { NextRequest, NextResponse } from "next/server";
import { db, paginate, dreamCardSelect } from "@/lib/db";
import type { DreamStatus } from "@prisma/client";
import { z } from "zod";
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

const dreamSubmitSchema = z.object({
  title:            z.string().min(10).max(200),
  childName:        z.string().min(2).max(100),
  childAge:         z.number().int().min(0).max(17),
  shortDescription: z.string().min(20).max(160),
  story:            z.string().min(100),
  targetAmount:     z.number().int().min(10000),
  category:         z.string().min(1),
  coverImageUrl:    z.string().url(),
  coverImageAlt:    z.string().min(5),
  slug:             z.string().min(5).max(250).regex(/^[a-z0-9-]+$/),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Parámetros de filtro y paginación
    const status   = (searchParams.get("status")   ?? "active") as DreamStatus;
    const category = searchParams.get("category");
    const page     = Math.max(1, Number(searchParams.get("page")  ?? 1));
    const limit    = Math.min(50, Number(searchParams.get("limit") ?? 12));

    // Filtros dinámicos
    const where = {
      status,
      publishedAt: { not: null },
      ...(category ? { category } : {}),
    };

    // Ejecutar consultas en paralelo (total + datos)
    const [total, dreams] = await Promise.all([
      db.dream.count({ where }),
      db.dream.findMany({
        where,
        select:  dreamCardSelect,
        orderBy: { publishedAt: "desc" },
        ...paginate({ page, limit }),
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: dreams,
        meta: {
          total,
          page,
          limit,
          hasMore: page * limit < total,
        },
      },
      {
        status: 200,
        headers: {
          // ISR: revalidar cada 60 segundos en el CDN
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/dreams]", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Error al cargar sueños" } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body   = await request.json().catch(() => null);
    const parsed = dreamSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors } },
        { status: 422 }
      );
    }

    const { coverImageUrl, coverImageAlt, ...data } = parsed.data;

    const dream = await db.dream.create({
      data: {
        ...data,
        publicId:    generatePublicId(),
        coverImage:  { url: coverImageUrl, alt: coverImageAlt, width: 1200, height: 630 },
        status:      "draft", // Las propuestas del público siempre entran como borrador
        publishedAt: null,    // No se publican inicialmente
      },
      select: { id: true, publicId: true, slug: true },
    });

    return NextResponse.json(
      { success: true, data: dream },
      { status: 201 }
    );
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { success: false, error: { code: "DUPLICATE_SLUG", message: "Este título o slug ya está en uso. Prueba con otro título." } },
        { status: 409 }
      );
    }
    console.error("[dreams POST]", err);
    return NextResponse.json({ success: false, error: "Error interno al registrar el sueño" }, { status: 500 });
  }
}

