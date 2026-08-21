export const dynamic = "force-dynamic";
/**
 * GET  /api/admin/hero  — Obtiene configuracion del Hero + estadisticas en tiempo real de la BD
 * PUT  /api/admin/hero  — Guarda configuracion del Hero en site_settings.hero_settings
 */

import { NextRequest, NextResponse } from "next/server";
import { z }          from "zod";
import { db }         from "@/lib/db";
import { cookies }    from "next/headers";
import { jwtVerify }  from "jose";
import { revalidatePath } from "next/cache";

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

const heroSettingsSchema = z.object({
  chipText:              z.string().max(100).optional().default("Plataforma Social de Impacto"),
  headlinePart1:         z.string().max(200).optional().default("Cumple el sueño"),
  headlineColored1:      z.string().max(100).optional().default("niño"),
  headlineColored2:      z.string().max(100).optional().default("niña"),
  headlinePart3:         z.string().max(200).optional().default("de Chile."),
  subtitle:              z.string().max(600).optional().default("Apoyamos el desarrollo infantil a través de la creatividad y la expresión. Tu donación llega directamente al sueño de un niño o niña, sin intermediarios."),
  subtitleBoldText:      z.string().max(100).optional().default("creatividad y la expresión"),
  ctaPrimaryText:        z.string().max(60).optional().default("Dona Ahora"),
  ctaSecondaryText:      z.string().max(60).optional().default("Ver Sueños Activos"),
  trust1:                z.string().max(60).optional().default("🔒 Pago 100% seguro"),
  trust2:                z.string().max(60).optional().default("📃 Recibo inmediato"),
  trust3:                z.string().max(60).optional().default("🇨🇱 Fundación Chilena"),
  heroImageUrl:          z.string().url().or(z.literal("")).optional().default(""),
  heroImageAlt:          z.string().max(300).optional().default("Niños y niñas creativos pintando y expresando sus sueños con alegría y colores"),
  badgeTodayText:        z.string().max(60).optional().default("donantes hoy"),
  badgeSubText:          z.string().max(60).optional().default("¡Únete ahora!"),
  stat1Label:            z.string().max(60).optional().default("Sueños cumplidos"),
  stat1Auto:             z.boolean().optional().default(true),
  stat1ManualValue:      z.string().max(30).optional().default("1.247"),
  stat1Suffix:           z.string().max(10).optional().default(""),
  stat2Label:            z.string().max(60).optional().default("Recaudado CLP"),
  stat2Auto:             z.boolean().optional().default(true),
  stat2ManualValue:      z.string().max(30).optional().default("$48M"),
  stat2Suffix:           z.string().max(10).optional().default("+"),
  stat3Label:            z.string().max(60).optional().default("Familias"),
  stat3Auto:             z.boolean().optional().default(false),
  stat3ManualValue:      z.string().max(30).optional().default("3.890"),
  stat3Suffix:           z.string().max(10).optional().default("+"),
  weeklyDonationsLabel:  z.string().max(60).optional().default("donaciones esta semana"),
  weeklyDonationsAuto:   z.boolean().optional().default(true),
  weeklyDonationsManual: z.string().max(30).optional().default("124"),
  floatingTags:          z.array(z.string().max(40)).optional().default(["🎵 Música", "🤖 Tech", "💃 Danza", "🎨 Arte", "⚽ Deporte"]),
});

export type HeroSettings = z.infer<typeof heroSettingsSchema>;

export async function getRealTimeHeroStats() {
  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const weekStart  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [dreamsDone, donationsSummary, donorsToday, weeklyDonations] = await Promise.all([
    db.dream.count({ where: { status: { in: ["funded", "completed"] } } }),
    db.donation.aggregate({ where: { status: "confirmed" }, _sum: { amountInCLP: true } }),
    db.contributor.count({ where: { donations: { some: { status: "confirmed", createdAt: { gte: todayStart } } } } }),
    db.donation.count({ where: { status: "confirmed", createdAt: { gte: weekStart } } }),
  ]);

  const totalRaisedCLP = Number(donationsSummary._sum.amountInCLP ?? 0);

  const formatCompactCLP = (n: number): string => {
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1).replace(".", ",")}B`;
    if (n >= 1_000_000)     return `$${Math.round(n / 1_000_000)}M`;
    if (n >= 1_000)         return `$${Math.round(n / 1_000)}K`;
    return `$${n.toLocaleString("es-CL")}`;
  };

  return {
    dreamsDone:      dreamsDone.toLocaleString("es-CL"),
    totalRaisedCLP:  formatCompactCLP(totalRaisedCLP),
    donorsToday:     donorsToday,
    weeklyDonations: weeklyDonations.toLocaleString("es-CL"),
  };
}

const DEFAULT_HERO: HeroSettings = heroSettingsSchema.parse({});

export async function GET() {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const [settings, stats] = await Promise.all([
    db.siteSettings.upsert({ where: { id: "global" }, create: { id: "global" }, update: {}, select: { heroSettings: true } }),
    getRealTimeHeroStats(),
  ]);

  const raw = (settings.heroSettings ?? {}) as Record<string, unknown>;
  const heroSettings: HeroSettings = { ...DEFAULT_HERO, ...raw };

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
