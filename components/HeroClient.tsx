/**
 * components/HeroClient.tsx
 * Parte animada del Hero — Client Component.
 * Wraps motion elements que requieren "use client".
 */

"use client";

import { motion } from "framer-motion";
import { Heart, Sparkles, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link  from "next/link";
import type { HeroSettings, LiveHeroData } from "@/components/Hero";

const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] } },
};

const TAG_POSITIONS = [
  "absolute -top-3 right-10 z-20 hidden lg:flex",
  "absolute top-10 -right-5 z-20 hidden lg:flex",
  "absolute bottom-28 -right-5 z-20 hidden lg:flex",
  "absolute bottom-36 -left-5 z-20 hidden lg:flex",
  "absolute top-1/2 -translate-y-1/2 -left-5 z-20 hidden lg:flex",
];
const TAG_DELAYS    = [0.4, 1.0, 1.8, 0.8, 2.4];
const TAG_DURATIONS = [3.2, 3.8, 4.2, 3.5, 4.0];

export function HeroClient({ h, live }: { h: HeroSettings; live: LiveHeroData }) {
  const imgSrc = h.heroImageUrl ||
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1200&h=750&q=85&auto=format&fit=crop";

  return (
    <>
      {/* Blobs animados de color */}
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-52 -left-52 w-[650px] h-[650px] rounded-full bg-violet-300/25 blur-3xl"
          animate={{ scale: [1, 1.18, 1], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-44 -right-32 w-[580px] h-[580px] rounded-full bg-orange-300/20 blur-3xl"
          animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.38, 0.2] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        />
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full bg-pink-300/15 blur-3xl"
          animate={{ x: [-30, 30, -30], opacity: [0.12, 0.25, 0.12] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 xl:gap-20 items-center">

      {/* ── Columna izquierda: Copy ─────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center lg:text-left"
      >
        {/* Chip */}
        <motion.div variants={itemVariants} className="flex justify-center lg:justify-start">
          <span className="section-tag">
            <Sparkles size={12} aria-hidden />
            {h.chipText}
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          id="hero-heading"
          variants={itemVariants}
          className="font-display text-[2.6rem] sm:text-[3.25rem] xl:text-[3.85rem] 2xl:text-[4.25rem] font-extrabold leading-[1.08] tracking-tight text-[#1a1523] mb-5"
        >
          {h.headlinePart1}
          <br />
          de cada{" "}
          <span className="text-gradient">{h.headlineColored1}</span>
          {" "}y{" "}
          <span className="text-gradient-rose">{h.headlineColored2}</span>
          <br />
          {h.headlinePart3}
        </motion.h1>

        {/* Subtítulo */}
        <motion.p
          variants={itemVariants}
          className="text-base sm:text-lg text-neutral-600 max-w-[480px] mx-auto lg:mx-0 leading-relaxed mb-8"
        >
          {h.subtitleBoldText
            ? (() => {
                const parts = h.subtitle.split(h.subtitleBoldText);
                return parts.length === 2 ? (
                  <>
                    {parts[0]}
                    <strong className="text-violet-700 font-semibold">{h.subtitleBoldText}</strong>
                    {parts[1]}
                  </>
                ) : h.subtitle;
              })()
            : h.subtitle}
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 mb-8"
        >
          <Link href="#donar" className="btn-cta text-base px-8 py-4" aria-label="Ir a la sección de donación">
            <Heart size={18} aria-hidden />
            {h.ctaPrimaryText}
          </Link>
          <Link href="#suenos" className="btn-outline text-base px-8 py-4">
            {h.ctaSecondaryText}
          </Link>
        </motion.div>

        {/* Trust signals */}
        <motion.p
          variants={itemVariants}
          className="text-xs text-neutral-500 flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1.5"
        >
          <span className="flex items-center gap-1">{h.trust1}</span>
          <span aria-hidden className="hidden sm:inline text-neutral-300">·</span>
          <span className="flex items-center gap-1">{h.trust2}</span>
          <span aria-hidden className="hidden sm:inline text-neutral-300">·</span>
          <span className="flex items-center gap-1">{h.trust3}</span>
        </motion.p>
      </motion.div>

      {/* ── Columna derecha: Tarjeta glassmorphism ──────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 32 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.85, delay: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative mx-auto w-full max-w-lg lg:max-w-none"
      >
        {/* Badge donantes hoy */}
        <motion.div
          className="absolute -top-5 left-2 sm:-left-4 z-20 glass rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 flex items-center gap-2.5 shadow-card"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <div>
            <p className="text-xs font-bold text-neutral-900 leading-tight whitespace-nowrap">
              +{live.donorsToday} {h.badgeTodayText}
            </p>
            <p className="text-[10px] text-neutral-500">{h.badgeSubText}</p>
          </div>
        </motion.div>

        {/* Tags flotantes */}
        {h.floatingTags.slice(0, 5).map((tag, i) => (
          <motion.span
            key={i}
            aria-hidden
            className={`${TAG_POSITIONS[i]} glass rounded-full px-3 py-1.5 text-xs font-semibold text-violet-800 shadow-soft items-center gap-1.5`}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: TAG_DURATIONS[i], repeat: Infinity, ease: "easeInOut", delay: TAG_DELAYS[i] }}
          >
            {tag}
          </motion.span>
        ))}

        {/* Tarjeta principal */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-2 ring-white/50">

          {/* Imagen */}
          <div className="relative w-full" style={{ aspectRatio: "16/10" }}>
            <Image
              src={imgSrc}
              alt={h.heroImageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
              unoptimized={imgSrc.includes("unsplash")}
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(30,27,75,0.80) 0%, rgba(30,27,75,0.25) 45%, transparent 70%)" }}
            />
          </div>

          {/* Panel de estadísticas */}
          <div
            className="absolute bottom-0 left-0 right-0 glass-dark p-4 sm:p-5"
            role="region"
            aria-label="Estadísticas de impacto de la fundación"
          >
            <div className="grid grid-cols-3 gap-2 divide-x divide-white/20">
              {live.stats.map((stat) => (
                <div key={stat.label} className="text-center px-2 sm:px-3">
                  <p className="font-display font-extrabold text-xl sm:text-2xl text-white leading-none">
                    {stat.value}
                    <span className="text-orange-300">{stat.suffix}</span>
                  </p>
                  <p className="text-[11px] sm:text-xs text-white/70 mt-1 leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-center gap-2">
              <TrendingUp size={12} className="text-green-400" aria-hidden />
              <span className="text-[11px] text-white/60">
                +{live.weeklyValue} {h.weeklyDonationsLabel}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
    </>
  );
}
