/**
 * components/Hero.tsx
 * Bloque hero de la página principal.
 * Server Component — Lee heroSettings desde la BD en tiempo real en cada request.
 * Las animaciones están en HeroClient.tsx ("use client").
 */

import { db }           from "@/lib/db";
import { HeroClient }   from "@/components/HeroClient";

// ── Tipos exportados (compartidos con HeroClient y HeroEditorForm) ───────────

export interface HeroSettings {
  chipText:              string;
  headlinePart1:         string;
  headlineColored1:      string;
  headlineColored2:      string;
  headlinePart3:         string;
  subtitle:              string;
  subtitleBoldText:      string;
  ctaPrimaryText:        string;
  ctaSecondaryText:      string;
  trust1:                string;
  trust2:                string;
  trust3:                string;
  heroImageUrl:          string;
  heroImageAlt:          string;
  badgeTodayText:        string;
  badgeSubText:          string;
  stat1Label:            string;
  stat1Auto:             boolean;
  stat1ManualValue:      string;
  stat1Suffix:           string;
  stat2Label:            string;
  stat2Auto:             boolean;
  stat2ManualValue:      string;
  stat2Suffix:           string;
  stat3Label:            string;
  stat3Auto:             boolean;
  stat3ManualValue:      string;
  stat3Suffix:           string;
  weeklyDonationsLabel:  string;
  weeklyDonationsAuto:   boolean;
  weeklyDonationsManual: string;
  floatingTags:          string[];
}

export interface LiveHeroData {
  donorsToday:  number;
  weeklyValue:  string;
  stats: Array<{ value: string; suffix: string; label: string }>;
}

// ── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_HERO: HeroSettings = {
  chipText:              "Plataforma Social de Impacto",
  headlinePart1:         "Cumple el sueño",
  headlineColored1:      "niño",
  headlineColored2:      "niña",
  headlinePart3:         "de Chile.",
  subtitle:              "Apoyamos el desarrollo infantil a través de la creatividad y la expresión. Tu donación llega directamente al sueño de un niño o niña, sin intermediarios.",
  subtitleBoldText:      "creatividad y la expresión",
  ctaPrimaryText:        "Dona Ahora",
  ctaSecondaryText:      "Ver Sueños Activos",
  trust1:                "🔒 Pago 100% seguro",
  trust2:                "📃 Recibo inmediato",
  trust3:                "🇨🇱 Fundación Chilena",
  heroImageUrl:          "",
  heroImageAlt:          "Niños y niñas creativos pintando y expresando sus sueños con alegría y colores",
  badgeTodayText:        "donantes hoy",
  badgeSubText:          "¡Únete ahora!",
  stat1Label:            "Sueños cumplidos",
  stat1Auto:             true,
  stat1ManualValue:      "1.247",
  stat1Suffix:           "",
  stat2Label:            "Recaudado CLP",
  stat2Auto:             true,
  stat2ManualValue:      "$48M",
  stat2Suffix:           "+",
  stat3Label:            "Familias",
  stat3Auto:             false,
  stat3ManualValue:      "3.890",
  stat3Suffix:           "+",
  weeklyDonationsLabel:  "donaciones esta semana",
  weeklyDonationsAuto:   true,
  weeklyDonationsManual: "124",
  floatingTags:          ["🎵 Música", "🤖 Tech", "💃 Danza", "🎨 Arte", "⚽ Deporte"],
};

// ── Helper: formatear CLP compacto ───────────────────────────────────────────

function formatCompactCLP(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1).replace(".", ",")}B`;
  if (n >= 1_000_000)     return `$${Math.round(n / 1_000_000)}M`;
  if (n >= 1_000)         return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString("es-CL")}`;
}

// ── Componente ───────────────────────────────────────────────────────────────

export async function Hero() {
  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const weekStart  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Cargar config + estadísticas en paralelo
  const [settings, dreamsDone, donationsSummary, donorsToday, weeklyCount] =
    await Promise.all([
      db.siteSettings.findUnique({
        where:  { id: "global" },
        select: { heroSettings: true },
      }),
      db.dream.count({ where: { status: { in: ["funded", "completed"] } } }),
      db.donation.aggregate({ where: { status: "confirmed" }, _sum: { amountInCLP: true } }),
      db.contributor.count({
        where: { donations: { some: { status: "confirmed", createdAt: { gte: todayStart } } } },
      }),
      db.donation.count({ where: { status: "confirmed", createdAt: { gte: weekStart } } }),
    ]);

  const rawHero = (settings?.heroSettings ?? {}) as Record<string, unknown>;
  const h: HeroSettings = { ...DEFAULT_HERO, ...rawHero };

  const totalRaised = Number(donationsSummary._sum.amountInCLP ?? 0);

  // Resolver valores de las 3 estadísticas
  const stat1Value = h.stat1Auto ? dreamsDone.toLocaleString("es-CL") : h.stat1ManualValue;
  const stat2Value = h.stat2Auto ? formatCompactCLP(totalRaised) : h.stat2ManualValue;
  const stat3Value = h.stat3ManualValue; // siempre manual

  const weeklyValue = h.weeklyDonationsAuto
    ? weeklyCount.toLocaleString("es-CL")
    : h.weeklyDonationsManual;

  const live: LiveHeroData = {
    donorsToday,
    weeklyValue,
    stats: [
      { value: stat1Value, suffix: h.stat1Suffix, label: h.stat1Label },
      { value: stat2Value, suffix: h.stat2Suffix, label: h.stat2Label },
      { value: stat3Value, suffix: h.stat3Suffix, label: h.stat3Label },
    ],
  };

  return (
    <section
      className="relative min-h-[calc(100svh-4rem)] flex items-center bg-hero-warm overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Patrón de puntos sutil */}
      <div aria-hidden className="absolute inset-0 bg-dots opacity-50 pointer-events-none" />

      {/* Contenido con animaciones */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <HeroClient h={h} live={live} />
      </div>
    </section>
  );
}
