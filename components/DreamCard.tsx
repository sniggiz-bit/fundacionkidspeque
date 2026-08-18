"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Heart, Users, Calendar, ArrowRight } from "lucide-react";
import type { Dream } from "@/types";

// ── Colores y emojis por categoría ───────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  arte:        "bg-pink-500/80 text-white",
  música:      "bg-purple-500/80 text-white",
  tecnología:  "bg-blue-500/80 text-white",
  danza:       "bg-rose-500/80 text-white",
  deporte:     "bg-green-500/80 text-white",
};

const CATEGORY_EMOJI: Record<string, string> = {
  arte:        "🎨",
  música:      "🎵",
  tecnología:  "🤖",
  danza:       "💃",
  deporte:     "⚽",
};

// ── Utilidades ────────────────────────────────────────────────────────────────

/** Formatea un número a pesos chilenos */
function formatCLP(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Días restantes para el deadline */
function getDaysLeft(deadline?: Date): number | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ── Componente Barra de Progreso ──────────────────────────────────────────────

interface ProgressBarProps {
  percentage: number;
  animate?: boolean;
}

function ProgressBar({ percentage, animate = true }: ProgressBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -50px 0px" });
  const [width, setWidth] = useState(animate ? 0 : percentage);

  useEffect(() => {
    if (isInView && animate) {
      // Pequeño delay para que el usuario note la animación
      const timer = setTimeout(() => setWidth(Math.min(percentage, 100)), 200);
      return () => clearTimeout(timer);
    }
  }, [isInView, animate, percentage]);

  const clampedPct = Math.min(percentage, 100);

  return (
    <div
      ref={ref}
      className="progress-track"
      role="progressbar"
      aria-valuenow={clampedPct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${clampedPct.toFixed(1)}% del objetivo alcanzado`}
    >
      <div
        className="progress-fill"
        style={{
          width: `${width}%`,
          transition: animate ? "width 1.2s cubic-bezier(0.25, 1, 0.5, 1)" : "none",
        }}
      />
    </div>
  );
}

// ── Componente Skeleton (estado de carga) ─────────────────────────────────────

export function DreamCardSkeleton() {
  return (
    <div className="card p-0 overflow-hidden" aria-busy="true" aria-label="Cargando sueño...">
      <div className="skeleton aspect-card" />
      <div className="p-5 space-y-3">
        <div className="skeleton h-3 w-16 rounded-full" />
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton h-2 w-full rounded-full mt-2" />
        <div className="flex justify-between">
          <div className="skeleton h-4 w-20 rounded" />
          <div className="skeleton h-4 w-20 rounded" />
        </div>
        <div className="skeleton h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

// ── Componente Principal: DreamCard ──────────────────────────────────────────

interface DreamCardProps {
  dream: Dream;
  priority?: boolean;   // Para la primera imagen (LCP optimization)
  index?: number;       // Para stagger de animación
}

export function DreamCard({ dream, priority = false, index = 0 }: DreamCardProps) {
  const percentage = Number(dream.progressPercentage) || 0;
  const daysLeft   = getDaysLeft(dream.deadline);
  const isFunded   = percentage >= 100;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={{ y: -4 }}
      className="card p-0 overflow-hidden group flex flex-col h-full"
      aria-labelledby={`dream-title-${dream.id}`}
    >
      <Link href={`/suenos/${dream.slug}?id=${dream.publicId}`} className="flex flex-col h-full w-full outline-none">
        {/* Imagen de portada */}
        <div className="relative aspect-card overflow-hidden bg-neutral-100">
          <Image
            src={dream.coverImage.url}
            alt={dream.coverImage.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={priority}
            placeholder={dream.coverImage.blurDataURL ? "blur" : "empty"}
            blurDataURL={dream.coverImage.blurDataURL}
          />

          {/* Overlay con ID del sueño */}
          <div className="absolute top-3 left-3">
            <span className="badge bg-white/90 backdrop-blur-sm text-primary-700 font-mono text-[11px] shadow-xs">
              {dream.publicId}
            </span>
          </div>

          {/* Badge estado */}
          {isFunded && (
            <div className="absolute top-3 right-3">
              <span className="badge bg-success/90 text-white font-semibold shadow-xs">
                ✓ Financiado
              </span>
            </div>
          )}

          {/* Categoría — badge con color por tipo */}
          {dream.category && (
            <div className="absolute bottom-3 left-3">
              <span
                className={`badge backdrop-blur-sm text-[11px] capitalize font-semibold ${
                  CATEGORY_COLORS[dream.category] ?? "bg-black/50 text-white"
                }`}
              >
                {CATEGORY_EMOJI[dream.category] ?? ""}{" "}
                {dream.category}
              </span>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="flex flex-col flex-1 p-5 gap-3">

          {/* Título */}
          <h3
            id={`dream-title-${dream.id}`}
            className="font-display font-bold text-base sm:text-lg text-neutral-900 line-clamp-2 leading-snug group-hover:text-primary-700 transition-colors duration-200"
          >
            {dream.title}
          </h3>

          {/* Descripción corta */}
          <p className="text-sm text-neutral-600 line-clamp-2 leading-relaxed flex-1">
            {dream.shortDescription}
          </p>

          {/* Barra de progreso */}
          <div className="space-y-2 mt-1">
            <ProgressBar percentage={percentage} />

            {/* Montos */}
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-primary-700 text-sm">
                  {formatCLP(dream.raisedAmount)}
                </span>
                <span className="text-neutral-400 ml-1">recaudado</span>
              </div>
              <span className="font-semibold text-neutral-700">
                {percentage.toFixed(0)}%
              </span>
            </div>

            <div className="text-xs text-neutral-500">
              Meta:{" "}
              <span className="font-medium text-neutral-700">
                {formatCLP(dream.targetAmount)}
              </span>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-neutral-500 border-t border-neutral-100 pt-3 mt-1">
            <span className="flex items-center gap-1" title="Número de donantes">
              <Users size={12} aria-hidden />
              <span>{dream.donorCount.toLocaleString("es-CL")} donantes</span>
            </span>
            {daysLeft !== null && (
              <span
                className={`flex items-center gap-1 ml-auto ${
                  daysLeft <= 7 ? "text-error font-semibold" : ""
                }`}
                title="Días restantes"
              >
                <Calendar size={12} aria-hidden />
                {daysLeft > 0 ? `${daysLeft}d restantes` : "Último día"}
              </span>
            )}
          </div>

          {/* CTA */}
          <div
            className={`
              mt-1 w-full flex items-center justify-center gap-2
              py-3 px-4 rounded-xl font-semibold text-sm
              transition-all duration-200
              ${isFunded
                ? "bg-success/10 text-success cursor-default"
                : "bg-accent-500 group-hover:bg-accent-600 text-white shadow-sm group-hover:shadow-md"
              }
            `}
            aria-label={`Ver sueño de ${dream.childName}`}
          >
            {isFunded ? (
              <>✓ Sueño cumplido</>
            ) : (
              <>
                <Heart size={15} aria-hidden />
                Dona Aquí
                <ArrowRight size={14} className="ml-auto" aria-hidden />
              </>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
