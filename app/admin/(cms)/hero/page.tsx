/**
 * /admin/hero — Editor del Hero principal
 * Server Component — carga config actual + estadísticas en tiempo real desde la BD.
 */

import type { Metadata } from "next";
import { db }            from "@/lib/db";
import { LayoutTemplate } from "lucide-react";
import { HeroEditorForm, type HeroSettings } from "@/components/admin/HeroEditorForm";
import { getRealTimeHeroStats }               from "@/app/api/admin/hero/route";

export const dynamic  = "force-dynamic";
export const metadata: Metadata = { title: "Editor Hero" };

// ── Valores por defecto que se usan si aún no hay config guardada ─────────────

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

export default async function HeroEditorPage() {
  // Cargar config guardada + stats reales en paralelo
  const [settings, liveStats] = await Promise.all([
    db.siteSettings.upsert({
      where:  { id: "global" },
      create: { id: "global" },
      update: {},
      select: { heroSettings: true },
    }),
    getRealTimeHeroStats(),
  ]);

  const rawHero   = (settings.heroSettings ?? {}) as Record<string, unknown>;
  const heroSettings: HeroSettings = { ...DEFAULT_HERO, ...rawHero };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-primary-600 rounded-xl flex items-center justify-center">
          <LayoutTemplate size={18} className="text-white" aria-hidden />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Editor del Hero</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            Edita textos, imagen y estadísticas del bloque Hero de la página principal.
          </p>
        </div>

        {/* Indicador estadísticas en vivo */}
        <div className="ml-auto flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-xs text-green-400 font-medium">Stats en tiempo real</span>
        </div>
      </div>

      {/* Live stats info bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Sueños cumplidos",    value: liveStats.dreamsDone,      color: "text-primary-400" },
          { label: "Total recaudado",      value: liveStats.totalRaisedCLP,  color: "text-accent-400" },
          { label: "Donantes hoy",         value: `+${liveStats.donorsToday}`, color: "text-green-400" },
          { label: "Donaciones / semana",  value: liveStats.weeklyDonations, color: "text-orange-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3"
          >
            <p className="text-[11px] text-neutral-500 font-medium">{s.label}</p>
            <p className={`font-display font-extrabold text-lg mt-0.5 ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-neutral-600 mt-0.5">Dato real de BD</p>
          </div>
        ))}
      </div>

      {/* Editor */}
      <HeroEditorForm initialSettings={heroSettings} liveStats={liveStats} />
    </div>
  );
}
