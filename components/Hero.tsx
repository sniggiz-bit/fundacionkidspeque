"use client";

import { motion } from "framer-motion";
import { Heart, Sparkles, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// ── Datos estáticos ──────────────────────────────────────────────────────────

const STATS = [
  { value: "1.247", suffix: "",  label: "Sueños cumplidos" },
  { value: "$48M",  suffix: "+", label: "Recaudado CLP" },
  { value: "3.890", suffix: "+", label: "Familias" },
] as const;

// ── Variantes Framer Motion ──────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] } },
};

// ── Componente ───────────────────────────────────────────────────────────────

export function Hero() {
  return (
    <section
      className="relative min-h-[calc(100svh-4rem)] flex items-center bg-hero-warm overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Patrón de puntos sutil */}
      <div aria-hidden className="absolute inset-0 bg-dots opacity-50 pointer-events-none" />

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

      {/* ── Contenido principal ──────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
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
                Plataforma Social de Impacto
              </span>
            </motion.div>

            {/* H1 — headline grande con gradientes de color */}
            <motion.h1
              id="hero-heading"
              variants={itemVariants}
              className="font-display text-[2.6rem] sm:text-[3.25rem] xl:text-[3.85rem] 2xl:text-[4.25rem] font-extrabold leading-[1.08] tracking-tight text-[#1a1523] mb-5"
            >
              Cumple el sueño
              <br />
              de cada{" "}
              <span className="text-gradient">niño</span>
              {" "}y{" "}
              <span className="text-gradient-rose">niña</span>
              <br />
              de Chile.
            </motion.h1>

            {/* Subtítulo */}
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg text-neutral-600 max-w-[480px] mx-auto lg:mx-0 leading-relaxed mb-8"
            >
              Apoyamos el desarrollo infantil a través de la{" "}
              <strong className="text-violet-700 font-semibold">creatividad y la expresión</strong>.
              Tu donación llega directamente al sueño de un niño o niña, sin intermediarios.
            </motion.p>

            {/* Botones CTA */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 mb-8"
            >
              <Link
                href="#donar"
                className="btn-cta text-base px-8 py-4"
                aria-label="Ir a la sección de donación"
              >
                <Heart size={18} aria-hidden />
                Dona Ahora
              </Link>
              <Link
                href="#suenos"
                className="btn-outline text-base px-8 py-4"
              >
                Ver Sueños Activos
              </Link>
            </motion.div>

            {/* Trust signals */}
            <motion.p
              variants={itemVariants}
              className="text-xs text-neutral-500 flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1.5"
            >
              <span className="flex items-center gap-1">🔒 Pago 100% seguro</span>
              <span aria-hidden className="hidden sm:inline text-neutral-300">·</span>
              <span className="flex items-center gap-1">📃 Recibo inmediato</span>
              <span aria-hidden className="hidden sm:inline text-neutral-300">·</span>
              <span className="flex items-center gap-1">🇨🇱 Fundación Chilena</span>
            </motion.p>
          </motion.div>

          {/* ── Columna derecha: Tarjeta glassmorphism ──────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative mx-auto w-full max-w-lg lg:max-w-none"
          >
            {/* Badge flotante: contador en vivo */}
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
                <p className="text-xs font-bold text-neutral-900 leading-tight whitespace-nowrap">+34 donantes hoy</p>
                <p className="text-[10px] text-neutral-500">¡Únete ahora!</p>
              </div>
            </motion.div>

            {/* Tags flotantes de categoría — solo desktop lg+ */}
            <motion.span
              aria-hidden
              className="absolute -top-3 right-10 z-20 hidden lg:flex glass rounded-full px-3 py-1.5 text-xs font-semibold text-violet-800 shadow-soft items-center gap-1.5"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            >🎵 Música</motion.span>

            <motion.span
              aria-hidden
              className="absolute top-10 -right-5 z-20 hidden lg:flex glass rounded-full px-3 py-1.5 text-xs font-semibold text-violet-800 shadow-soft items-center gap-1.5"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 1.0 }}
            >🤖 Tech</motion.span>

            <motion.span
              aria-hidden
              className="absolute bottom-28 -right-5 z-20 hidden lg:flex glass rounded-full px-3 py-1.5 text-xs font-semibold text-violet-800 shadow-soft items-center gap-1.5"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 1.8 }}
            >💃 Danza</motion.span>

            <motion.span
              aria-hidden
              className="absolute bottom-36 -left-5 z-20 hidden lg:flex glass rounded-full px-3 py-1.5 text-xs font-semibold text-violet-800 shadow-soft items-center gap-1.5"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            >🎨 Arte</motion.span>

            <motion.span
              aria-hidden
              className="absolute top-1/2 -translate-y-1/2 -left-5 z-20 hidden lg:flex glass rounded-full px-3 py-1.5 text-xs font-semibold text-violet-800 shadow-soft items-center gap-1.5"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4.0, repeat: Infinity, ease: "easeInOut", delay: 2.4 }}
            >⚽ Deporte</motion.span>

            {/* Tarjeta principal con imagen glassmorphism */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-2 ring-white/50">

              {/* Imagen de fondo: niños creativos */}
              <div className="relative w-full" style={{ aspectRatio: "16/10" }}>
                <Image
                  src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1200&h=750&q=85&auto=format&fit=crop"
                  alt="Niños y niñas creativos pintando y expresando sus sueños con alegría y colores"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
                {/* Gradiente: enfría la parte baja para las stats */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(to top, rgba(30,27,75,0.80) 0%, rgba(30,27,75,0.25) 45%, transparent 70%)"
                  }}
                />
              </div>

              {/* Panel de estadísticas — glass oscuro superpuesto en la parte baja */}
              <div
                className="absolute bottom-0 left-0 right-0 glass-dark p-4 sm:p-5"
                role="region"
                aria-label="Estadísticas de impacto de la fundación"
              >
                <div className="grid grid-cols-3 gap-2 divide-x divide-white/20">
                  {STATS.map((stat) => (
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
                  <span className="text-[11px] text-white/60">+124 donaciones esta semana</span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
