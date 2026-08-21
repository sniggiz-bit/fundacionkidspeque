/**
 * lib/hero.ts
 * Utilidades y estadísticas en tiempo real del Hero.
 */

import { db } from "@/lib/db";
import { z }  from "zod";

export const heroSettingsSchema = z.object({
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

export const DEFAULT_HERO_SETTINGS: HeroSettings = heroSettingsSchema.parse({});

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
