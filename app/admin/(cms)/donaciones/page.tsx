/**
 * /admin/donaciones — Listado y gestión de donaciones
 */

import type { Metadata } from "next";
import Link              from "next/link";
import { db }            from "@/lib/db";
import { Download }      from "lucide-react";
import { DonationActions } from "@/components/admin/DonationActions";

export const metadata: Metadata = { title: "Donaciones" };
export const dynamic = 'force-dynamic';

function fCLP(n: number | bigint) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
  }).format(Number(n));
}

function fDate(d: Date) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(d);
}

const STATUS_CLASSES: Record<string, string> = {
  confirmed: "bg-success/20 text-green-400",
  pending:   "bg-amber-900/40 text-amber-400",
  failed:    "bg-error/20 text-red-400",
  refunded:  "bg-neutral-700 text-neutral-300",
  disputed:  "bg-orange-900/40 text-orange-400",
};
const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmada", pending: "Pendiente",
  failed: "Fallida", refunded: "Reembolsada", disputed: "Disputada",
};
const GATEWAY_LABELS: Record<string, string> = {
  webpay_plus: "Webpay Plus", flow: "Flow.cl", paypal: "PayPal",
};

export default async function AdminDonacionesPage({
  searchParams,
}: { searchParams: { status?: string; gateway?: string; page?: string } }) {

  const statusFilter  = searchParams.status;
  const gatewayFilter = searchParams.gateway;
  const page  = Math.max(1, Number(searchParams.page ?? 1));
  const limit = 20;

  const where = {
    ...(statusFilter  ? { status:  statusFilter  as "confirmed" } : {}),
    ...(gatewayFilter ? { gateway: gatewayFilter as "webpay_plus" } : {}),
  };

  const [donations, total, summary] = await Promise.all([
    db.donation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        contributor: { select: { firstName: true, lastName: true, email: true, isAnonymous: true } },
        dream:       { select: { publicId: true, title: true } },
      },
    }),
    db.donation.count({ where }),
    db.donation.aggregate({
      where:  { status: "confirmed" },
      _sum:   { amountInCLP: true },
      _count: { id: true },
      _avg:   { amountInCLP: true },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Donaciones</h1>
          <p className="text-neutral-500 text-sm mt-0.5">{total} registros</p>
        </div>
        <a
          href="/api/admin/donations/export"
          className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Download size={15} /> Exportar CSV
        </a>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total recaudado",    value: fCLP(summary._sum.amountInCLP ?? 0) },
          { label: "N° de donaciones",   value: String(summary._count.id) },
          { label: "Promedio por donación", value: fCLP(Number(summary._avg.amountInCLP ?? 0)) },
        ].map((s) => (
          <div key={s.label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <p className="text-xs text-neutral-500">{s.label}</p>
            <p className="font-display font-bold text-xl text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros — preservar ambos parámetros al cambiar uno */}
      <div className="flex flex-wrap gap-2 mb-5">
        {["", "confirmed", "pending", "failed", "refunded"].map((s) => {
          const params = new URLSearchParams();
          if (s)              params.set("status",  s);
          if (gatewayFilter)  params.set("gateway", gatewayFilter);
          const qs = params.toString();
          return (
            <Link key={s || "all"}
              href={`/admin/donaciones${qs ? `?${qs}` : ""}`}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === (s || undefined)
                  ? "bg-primary-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
              }`}>
              {s ? STATUS_LABELS[s] : "Todas"}
            </Link>
          );
        })}
        <span className="text-neutral-700 mx-1">|</span>
        {["", "webpay_plus", "flow", "paypal"].map((g) => {
          const params = new URLSearchParams();
          if (statusFilter)  params.set("status",  statusFilter);
          if (g)             params.set("gateway", g);
          const qs = params.toString();
          return (
            <Link key={g || "all-g"}
              href={`/admin/donaciones${qs ? `?${qs}` : ""}`}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                gatewayFilter === (g || undefined)
                  ? "bg-accent-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
              }`}>
              {g ? GATEWAY_LABELS[g] : "Todos los gateways"}
            </Link>
          );
        })}
      </div>

      {/* Tabla */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                {["Fecha", "Donante", "Sueño", "Monto", "Gateway", "Estado", "Acciones"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {donations.map((d) => (
                <tr key={d.id} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="px-4 py-3.5 text-xs text-neutral-400 whitespace-nowrap">
                    {fDate(d.createdAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-white font-medium">
                      {d.contributor.isAnonymous ? "Anónimo/a" : `${d.contributor.firstName} ${d.contributor.lastName}`}
                    </p>
                    <p className="text-xs text-neutral-500 truncate max-w-[180px]">{d.contributor.email}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-mono text-xs text-neutral-500">{d.dream.publicId}</p>
                    <p className="text-xs text-neutral-400 line-clamp-1">{d.dream.title}</p>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-primary-400 whitespace-nowrap">
                    {fCLP(d.amountInCLP)}
                    {d.currency !== "CLP" && (
                      <span className="text-[10px] text-neutral-500 block font-normal">{d.currency}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-neutral-400">
                    {GATEWAY_LABELS[d.gateway] ?? d.gateway}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_CLASSES[d.status] ?? "bg-neutral-700 text-neutral-300"}`}>
                      {STATUS_LABELS[d.status] ?? d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <DonationActions id={d.id} status={d.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación — preservar filtros activos */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-800">
            <p className="text-xs text-neutral-500">Página {page} de {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (() => {
                const p = new URLSearchParams();
                if (statusFilter)  p.set("status",  statusFilter);
                if (gatewayFilter) p.set("gateway", gatewayFilter);
                p.set("page", String(page - 1));
                return <Link href={`/admin/donaciones?${p}`} className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs hover:bg-neutral-700">← Anterior</Link>;
              })()}
              {page < totalPages && (() => {
                const p = new URLSearchParams();
                if (statusFilter)  p.set("status",  statusFilter);
                if (gatewayFilter) p.set("gateway", gatewayFilter);
                p.set("page", String(page + 1));
                return <Link href={`/admin/donaciones?${p}`} className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs hover:bg-neutral-700">Siguiente →</Link>;
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
