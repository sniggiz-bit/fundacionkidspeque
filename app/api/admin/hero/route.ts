export const dynamic = "force-dynamic";
/**
 * GET  /api/admin/hero  — Obtiene configuración del Hero + estadísticas en tiempo real de la BD
 * PUT  /api/admin/hero  — Guarda configuración del Hero en site_settings.hero_settings
 */

import { NextRequest, NextResponse } from "next/server";
import { db }         from "@/lib/db";
import { cookies }    from "next/headers";
import { jwtVerify }  from "jose";
import { revalidatePath } from "next/cache";
import {
  heroSettingsSchema,
  DEFAULT_HERO_SETTINGS,
  getRealTimeHeroStats,
  type HeroSettings
} from "@/lib/hero";

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

export async function GET() {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const [settings, stats] = await Promise.all([
    db.siteSettings.upsert({ where: { id: "global" }, create: { id: "global" }, update: {}, select: { heroSettings: true } }),
    getRealTimeHeroStats(),
  ]);

  const raw = (settings.heroSettings ?? {}) as Record<string, unknown>;
  const heroSettings: HeroSettings = { ...DEFAULT_HERO_SETTINGS, ...raw };

  return NextResponse.json({ success: true, data: { heroSettings, liveStats: stats } });
}

export async function PUT(request: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  const body   = await request.json().catch(() => null);
  const parsed = heroSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors } }, { status: 422 });
  }

  try {
    await db.siteSettings.upsert({
      where:  { id: "global" },
      create: { id: "global", heroSettings: parsed.data as object },
      update: { heroSettings: parsed.data as object },
    });
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/hero PUT]", err);
    return NextResponse.json({ success: false, error: "Error interno al guardar" }, { status: 500 });
  }
}
