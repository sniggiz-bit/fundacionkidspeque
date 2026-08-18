/**
 * /admin/suenos — Gestión de campañas de crowdfunding
 */

import type { Metadata } from "next";
import Link              from "next/link";
import { db }            from "@/lib/db";
import { DreamStatusBadge } from "@/components/admin/DreamStatusBadge";
import { Plus, Pencil, Eye } from "lucide-react";

export const metadata: Metadata = { title: "Sueños" };
export const dynamic = 'force-dynamic';

function fCLP(n: number | bigint) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
  }).format(Number(n));
}

export default async function AdminSuenosPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  const status = searchParams.status as "draft" | "active" | "funded" | "completed" | "paused" | "cancelled" | undefined;
  const page   = Math.max(1, Number(searchParams.page ?? 1));
  const limit  = 15;

  const [dreams, total] = await Promise.all([
    db.dream.findMany({
      where:   status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
      select: {
        id: true, publicId: true, title: true, childName: true,
        status: true, targetAmount: true, raisedAmount: true,
        progressPct: true, donorCount: true, publishedAt: true,
        slug: true,
      },
    }),
    db.dream.count({ where: status ? { status } : undefined }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const STATUS_TABS = [
    { value: undefined, label: "Todos",      count: null },
    { value: "active",  label: "Activos",    count: null },
    { value: "draft",   label: "Boradores",  count: null },
    { value: "funded",  label: "Financiados",count: null },
    { value: "completed", label: "Completados", count: null },
  ] as const;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Sueños</h1>
          <p className="text-neutral-500 text-sm mt-0.5">{total} campañas en total</p>
        </div>
        <Link
          href="/admin/suenos/nuevo"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> Nuevo sueño
        </Link>
      </div>

      {/* Tabs de estado */}
      <div className="flex gap-1 mb-6 bg-neutral-900 rounded-xl p-1 border border-neutral-800 w-fit">
        {STATUS_TABS.map((tab) => (
          <Link
            key={String(tab.value)}
            href={`/admin/suenos${tab.value ? `?status=${tab.value}` : ""}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              status === tab.value
                ? "bg-neutral-800 text-white"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">ID / Niño/a</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden sm:table-cell">Estado</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Progreso</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Donantes</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {dreams.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-neutral-500">
                    No hay sueños con este estado.
                  </td>
                </tr>
              ) : (
                dreams.map((dream) => {
                  const pct = Number(dream.progressPct);
                  return (
                    <tr key={dream.id} className="hover:bg-neutral-800/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-mono text-xs text-neutral-500">{dream.publicId}</p>
                        <p className="font-semibold text-white text-sm mt-0.5 line-clamp-1">{dream.title}</p>
                        <p className="text-xs text-neutral-500">{dream.childName}</p>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <DreamStatusBadge status={dream.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-sm font-bold ${pct >= 100 ? "text-success" : "text-white"}`}>
                            {pct.toFixed(0)}%
                          </span>
                          <div className="w-20 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-neutral-500">
                            {fCLP(dream.raisedAmount)} / {fCLP(dream.targetAmount)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right hidden md:table-cell">
                        <span className="text-white font-semibold">{dream.donorCount}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <Link
                            href={`/suenos/${dream.slug}`}
                            target="_blank"
                            className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-700 transition-all"
                            aria-label="Ver en el sitio"
                          >
                            <Eye size={15} />
                          </Link>
                          <Link
                            href={`/admin/suenos/${dream.id}`}
                            className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-700 transition-all"
                            aria-label="Editar sueño"
                          >
                            <Pencil size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-800">
            <p className="text-xs text-neutral-500">
              Página {page} de {totalPages} · {total} resultados
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/admin/suenos?${status ? `status=${status}&` : ""}page=${page - 1}`}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs hover:bg-neutral-700 transition-colors">
                  ← Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/admin/suenos?${status ? `status=${status}&` : ""}page=${page + 1}`}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs hover:bg-neutral-700 transition-colors">
                  Siguiente →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
