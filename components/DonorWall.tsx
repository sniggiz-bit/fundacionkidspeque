/**
 * components/DonorWall.tsx
 * ─────────────────────────────────────────────────────────────────
 * Muro de donantes públicos de una campaña.
 * Muestra nombre, monto y mensaje de cada donante.
 */

"use client";

import { motion } from "framer-motion";
import { Heart, MessageSquare } from "lucide-react";

interface DonationEntry {
  id:          string;
  amountInCLP: bigint | number;
  displayName: string | null;
  message:     string | null;
  createdAt:   Date | string;
}

interface DonorWallProps {
  donations:  DonationEntry[];
  dreamTitle: string;
}

function formatCLP(n: bigint | number) {
  return new Intl.NumberFormat("es-CL", {
    style:                 "currency",
    currency:              "CLP",
    maximumFractionDigits: 0,
  }).format(Number(n));
}

function timeAgo(date: Date | string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);

  if (mins < 60)    return `hace ${mins}m`;
  if (hours < 24)   return `hace ${hours}h`;
  if (days < 7)     return `hace ${days}d`;
  return new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short" }).format(new Date(date));
}

export function DonorWall({ donations, dreamTitle }: DonorWallProps) {
  if (donations.length === 0) {
    return (
      <section aria-labelledby="donor-wall-heading" className="mt-8">
        <h2 id="donor-wall-heading" className="font-display font-bold text-lg text-neutral-900 mb-4">
          Donantes del sueño
        </h2>
        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-8 text-center">
          <p className="text-3xl mb-3" aria-hidden>💙</p>
          <p className="text-neutral-600 text-sm">
            Sé el primero en apoyar este sueño. Tu nombre aparecerá aquí.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="donor-wall-heading">
      <div className="flex items-center justify-between mb-4">
        <h2 id="donor-wall-heading" className="font-display font-bold text-lg text-neutral-900">
          Quienes apoyan este sueño
        </h2>
        <span className="badge-primary">{donations.length} donantes</span>
      </div>

      <ul className="space-y-3" role="list" aria-label={`Donantes del sueño: ${dreamTitle}`}>
        {donations.map((d, index) => (
          <motion.li
            key={d.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.35 }}
            className="flex items-start gap-4 bg-white border border-neutral-200 rounded-xl p-4 shadow-xs hover:shadow-soft transition-shadow"
          >
            {/* Avatar generado por iniciales */}
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              aria-hidden
            >
              {d.displayName
                ? d.displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                : "♡"}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm text-neutral-900 truncate">
                  {d.displayName ?? "Donante anónimo/a"}
                </span>
                <span className="font-bold text-sm text-primary-700 flex-shrink-0">
                  {formatCLP(d.amountInCLP)}
                </span>
              </div>

              {d.message && (
                <p className="text-sm text-neutral-600 mt-1.5 flex items-start gap-1.5 italic">
                  <MessageSquare size={12} className="text-neutral-400 mt-0.5 flex-shrink-0" aria-hidden />
                  <span className="line-clamp-2">"{d.message}"</span>
                </p>
              )}

              <p className="text-xs text-neutral-400 mt-1.5 flex items-center gap-1">
                <Heart size={10} className="text-accent-400 fill-accent-400" aria-hidden />
                {timeAgo(d.createdAt)}
              </p>
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
