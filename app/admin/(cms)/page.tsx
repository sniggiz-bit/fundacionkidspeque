/**
 * /admin — Dashboard principal del CMS
 * ─────────────────────────────────────────────────────────────────
 * Métricas clave, últimas donaciones, sueños activos y actividad reciente.
 * Server Component con SSR — datos frescos en cada carga.
 */


import type { Metadata }  from "next";
import Link               from "next/link";
import { db }             from "@/lib/db";

export const dynamic = 'force-dynamic';
import { formatDistanceToNow } from "date-fns";
import { es }             from "date-fns/locale";
import {
  Heart, Star, Users, ShoppingBag, TrendingUp,
  ArrowUpRight, Plus, AlertCircle,
} from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };

// ── Formato CLP ───────────────────────────────────────────────────────────────

function fCLP(n: number | bigint) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
    notation: "compact",
  }).format(Number(n));
}

// ── Componente: Tarjeta de métrica ────────────────────────────────────────────

function MetricCard({
  label, value, sub, icon: Icon, color, href,
}: {
  label: string;
  value: string;
  sub:   string;
  icon:  React.ElementType;
  color: string;
  href:  string;
}) {
  return (
    <Link
      href={href}
      className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex items-start gap-4 hover:border-neutral-700 transition-all group"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} className="text-white" aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-neutral-500 font-medium">{label}</p>
        <p className="font-display font-extrabold text-2xl text-white mt-0.5 leading-none">{value}</p>
        <p className="text-xs text-neutral-500 mt-1">{sub}</p>
      </div>
      <ArrowUpRight size={16} className="text-neutral-600 group-hover:text-neutral-400 transition-colors mt-1 flex-shrink-0" />
    </Link>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default async function AdminDashboard() {
  // Cargar todas las métricas en paralelo
  const [
    totalDonationsResult,
    activeDreamsCount,
    totalContributors,
    pendingCollaborators,
    recentDonations,
    activeDreams,
  ] = await Promise.all([
    db.donation.aggregate({
      where:  { status: "confirmed" },
      _sum:   { amountInCLP: true },
      _count: { id: true },
    }),
    db.dream.count({ where: { status: "active" } }),
    db.contributor.count(),
    db.collaborator.count({ where: { status: "pending" } }),
    db.donation.findMany({
      where:   { status: "confirmed" },
      orderBy: { createdAt: "desc" },
      take:    8,
      include: {
        contributor: { select: { firstName: true, lastName: true, isAnonymous: true } },
        dream:       { select: { title: true, publicId: true } },
      },
    }),
    db.dream.findMany({
      where:   { status: "active" },
      orderBy: { raisedAmount: "desc" },
      take:    5,
      select: {
        id: true, publicId: true, title: true, childName: true,
        targetAmount: true, raisedAmount: true, progressPct: true,
        donorCount: true, deadline: true,
      },
    }),
  ]);

  const totalRaised = Number(totalDonationsResult._sum.amountInCLP ?? 0);
  const totalDonos  = totalDonationsResult._count.id;

  const METRICS = [
    {
      label: "Total recaudado",
      value: fCLP(totalRaised),
      sub:   `${totalDonos} donaciones confirmadas`,
      icon:  Heart,
      color: "bg-primary-600",
      href:  "/admin/donaciones",
    },
    {
      label: "Sueños activos",
      value: String(activeDreamsCount),
      sub:   "Campañas en curso",
      icon:  Star,
      color: "bg-accent-500",
      href:  "/admin/suenos",
    },
    {
      label: "Donantes totales",
      value: String(totalContributors),
      sub:   "Personas registradas",
      icon:  Users,
      color: "bg-green-600",
      href:  "/admin/donaciones",
    },
    {
      label: "Colaboradores pendientes",
      value: String(pendingCollaborators),
      sub:   "Por revisar y aprobar",
      icon:  ShoppingBag,
      color: pendingCollaborators > 0 ? "bg-amber-500" : "bg-neutral-600",
      href:  "/admin/colaboradores",
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Dashboard</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            {new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}
          </p>
        </div>
        <Link
          href="/admin/suenos/nuevo"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} aria-hidden /> Nuevo Sueño
        </Link>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {METRICS.map((m) => <MetricCard key={m.label} {...m} />)}
      </div>

      {/* Alerta de colaboradores pendientes */}
      {pendingCollaborators > 0 && (
        <Link
          href="/admin/colaboradores?filter=pending"
          className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl px-4 py-3 text-sm mb-8 hover:bg-amber-500/20 transition-colors"
        >
          <AlertCircle size={16} aria-hidden />
          <span>
            <strong>{pendingCollaborators} colaborador{pendingCollaborators !== 1 ? "es" : ""} esperando aprobación.</strong>{" "}
            Haz clic para revisarlos.
          </span>
          <ArrowUpRight size={14} className="ml-auto" aria-hidden />
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Últimas donaciones ──────────────────────────────── */}
        <div className="lg:col-span-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-white">Últimas donaciones</h2>
            <Link href="/admin/donaciones" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
              Ver todas →
            </Link>
          </div>

          {recentDonations.length === 0 ? (
            <p className="text-neutral-500 text-sm text-center py-8">No hay donaciones aún.</p>
          ) : (
            <ul className="space-y-3" role="list">
              {recentDonations.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-2 border-b border-neutral-800 last:border-0">
                  {/* Avatar inicial */}
                  <div className="w-8 h-8 rounded-lg bg-primary-900 text-primary-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {d.contributor.isAnonymous
                      ? "A"
                      : d.contributor.firstName[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {d.contributor.isAnonymous
                        ? "Donante anónimo/a"
                        : `${d.contributor.firstName} ${d.contributor.lastName}`}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">{d.dream.title}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-primary-400">{fCLP(d.amountInCLP)}</p>
                    <p className="text-[11px] text-neutral-600">
                      {formatDistanceToNow(d.createdAt, { addSuffix: true, locale: es })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Sueños activos ──────────────────────────────────── */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-white">Sueños activos</h2>
            <Link href="/admin/suenos" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
              Gestionar →
            </Link>
          </div>

          {activeDreams.length === 0 ? (
            <p className="text-neutral-500 text-sm text-center py-8">No hay sueños activos.</p>
          ) : (
            <ul className="space-y-4" role="list">
              {activeDreams.map((dream) => {
                const pct = Number(dream.progressPct);
                return (
                  <li key={dream.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="min-w-0">
                        <p className="text-xs font-mono text-neutral-500">{dream.publicId}</p>
                        <p className="text-sm font-semibold text-white truncate leading-snug">
                          {dream.childName}
                        </p>
                      </div>
                      <span className={`text-xs font-bold flex-shrink-0 ml-2 ${
                        pct >= 100 ? "text-success" :
                        pct >= 75  ? "text-primary-400" :
                        pct >= 50  ? "text-accent-400" : "text-neutral-400"
                      }`}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    {/* Barra de progreso mini */}
                    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-[11px] text-neutral-600">
                      <span>{fCLP(dream.raisedAmount)}</span>
                      <span>{fCLP(dream.targetAmount)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
