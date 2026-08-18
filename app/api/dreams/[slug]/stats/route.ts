/**
 * GET /api/dreams/[slug]/stats
 * ─────────────────────────────────────────────────────────────────
 * Endpoint ligero que devuelve solo raised_amount, donorCount y
 * progressPct para polling en tiempo real (15s interval en cliente).
 * Optimizado para ser muy rápido: selección mínima de campos.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const dream = await db.dream.findUnique({
      where:  { slug: params.slug },
      select: {
        id:           true,
        raisedAmount: true,
        donorCount:   true,
        progressPct:  true,
        status:       true,
      },
    });

    if (!dream) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          raisedAmount: Number(dream.raisedAmount),
          donorCount:   dream.donorCount,
          progressPct:  Number(dream.progressPct),
          status:       dream.status,
        },
      },
      {
        status: 200,
        headers: {
          // No cachear — siempre fresco
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("[GET stats]", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
