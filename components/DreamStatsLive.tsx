/**
 * components/DreamStatsLive.tsx
 * ─────────────────────────────────────────────────────────────────
 * Componente CLIENTE que actualiza raised_amount en tiempo real.
 * Recibe los datos iniciales del SSR y hace polling cada 15s.
 * Usa animación de conteo (count-up) para hacer visible la actualización.
 *
 * Sin dependencia de QueryClientProvider — usa useState + useEffect.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TrendingUp, RefreshCw } from "lucide-react";

interface DreamStatsLiveProps {
  dreamSlug:          string;
  initialRaised:      number;
  initialDonorCount:  number;
  initialProgressPct: number;
  targetAmount:       number;
}

interface StatsData {
  raisedAmount: number;
  donorCount:   number;
  progressPct:  number;
}

// ── Animación de conteo ───────────────────────────────────────────────────────

function useCountUp(target: number, duration = 800) {
  const [value, setValue]  = useState(target);
  const prevTarget         = useRef(target);
  const animFrameRef       = useRef<number>();

  useEffect(() => {
    if (prevTarget.current === target) return;
    const start     = prevTarget.current;
    const diff      = target - start;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(Math.round(start + diff * ease));
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        prevTarget.current = target;
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [target, duration]);

  return value;
}

// ── Formato CLP ───────────────────────────────────────────────────────────────

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
  }).format(n);
}

// ── Componente ────────────────────────────────────────────────────────────────

export function DreamStatsLive({
  dreamSlug,
  initialRaised,
  initialDonorCount,
  initialProgressPct,
  targetAmount,
}: DreamStatsLiveProps) {
  const [stats, setStats]           = useState<StatsData>({
    raisedAmount: initialRaised,
    donorCount:   initialDonorCount,
    progressPct:  initialProgressPct,
  });
  const [isRefetching, setRefetching] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setRefetching(true);
      const res = await fetch(`/api/dreams/${dreamSlug}/stats`);
      if (!res.ok) return;
      const json = await res.json() as { data: StatsData };
      if (json.data) setStats(json.data);
    } catch {
      // silenciar errores de red — mantiene los datos anteriores
    } finally {
      setRefetching(false);
    }
  }, [dreamSlug]);

  // Polling cada 15 segundos
  useEffect(() => {
    const id = setInterval(fetchStats, 15_000);
    return () => clearInterval(id);
  }, [fetchStats]);

  const raised     = useCountUp(stats.raisedAmount);
  const pct        = Math.min(Number(stats.progressPct), 100);
  const donorCount = stats.donorCount;
  const remaining  = Math.max(targetAmount - stats.raisedAmount, 0);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-soft space-y-4">

      {/* Cabecera con indicador de live */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
          <TrendingUp size={15} className="text-primary-600" aria-hidden />
          Progreso en tiempo real
        </span>
        <span
          className={`flex items-center gap-1.5 text-xs text-neutral-400 transition-opacity ${
            isRefetching ? "opacity-100" : "opacity-0"
          }`}
          aria-live="polite"
          aria-label="Actualizando datos"
        >
          <RefreshCw size={11} className="animate-spin" aria-hidden />
          Actualizando…
        </span>
      </div>

      {/* Barra de progreso */}
      <div>
        <div
          className="progress-track h-3"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${pct.toFixed(1)}% del objetivo alcanzado`}
        >
          <div
            className="progress-fill h-full"
            style={{
              width: `${pct}%`,
              transition: "width 0.8s cubic-bezier(0.25, 1, 0.5, 1)",
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-neutral-500">
          <span>{pct.toFixed(1)}% alcanzado</span>
          <span>{donorCount.toLocaleString("es-CL")} donantes</span>
        </div>
      </div>

      {/* Montos */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-neutral-500 mb-0.5">Recaudado</p>
          <p
            className="font-display text-xl font-extrabold text-primary-700"
            aria-live="polite"
            aria-label={`${formatCLP(raised)} recaudados`}
          >
            {formatCLP(raised)}
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-500 mb-0.5">Falta para la meta</p>
          <p className="font-display text-xl font-extrabold text-neutral-700">
            {remaining > 0 ? formatCLP(remaining) : "¡Meta alcanzada!"}
          </p>
        </div>
      </div>
    </div>
  );
}
