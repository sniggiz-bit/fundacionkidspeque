/**
 * GET /api/dreams/[slug]
 * ─────────────────────────────────────────────────────────────────
 * Detalle completo de un sueño por su slug.
 * Incluye los últimos donantes públicos para el muro.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const dream = await db.dream.findUnique({
      where: { slug: params.slug },
      include: {
        donations: {
          where:   { status: "confirmed", isPublic: true },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id:          true,
            amountInCLP: true,
            displayName: true,
            message:     true,
            createdAt:   true,
          },
        },
      },
    });

    if (!dream || !dream.publishedAt) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Sueño no encontrado" } },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: dream },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error(`[GET /api/dreams/${params.slug}]`, error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Error al cargar el sueño" } },
      { status: 500 }
    );
  }
}
