/**
 * /admin/colaboradores — Gestión de voluntarios y colaboradores
 */

import type { Metadata } from "next";
import Link              from "next/link";
import { db }            from "@/lib/db";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export const metadata: Metadata = { title: "Colaboradores" };
export const dynamic = 'force-dynamic';

function fDate(d: Date) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }).format(d);
}

const STATUS_CLASSES: Record<string, string> = {
  pending:  "bg-amber-900/40 text-amber-400",
  active:   "bg-success/20 text-green-400",
  inactive: "bg-neutral-700 text-neutral-400",
  rejected: "bg-error/20 text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  pending:  "Pendiente",
  active:   "Activo",
  inactive: "Inactivo",
  rejected: "Rechazado",
};

const TYPE_LABELS: Record<string, string> = {
  psychologist: "Psicólogo/a",
  therapist:    "Terapeuta",
  social_worker: "Trabajador/a Social",
  artist:       "Artista",
  volunteer:    "Voluntario/a",
};

export default async function AdminColaboradoresPage({
  searchParams,
}: { searchParams: { status?: string; type?: string; page?: string } }) {

  const statusFilter = searchParams.status;
  const typeFilter   = searchParams.type;
  const page  = Math.max(1, Number(searchParams.page ?? 1));
  const limit = 20;

  const where = {
    ...(statusFilter ? { status: statusFilter as "pending" } : {}),
    ...(typeFilter   ? { type:   typeFilter   as "volunteer" } : {}),
  };

  const [collaborators, total, pending] = await Promise.all([
    db.collaborator.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    db.collaborator.count({ where }),
    db.collaborator.count({ where: { status: "pending" } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Colaboradores</h1>
          <p className="text-neutral-500 text-sm mt-0.5">{total} registros</p>
        </div>
        {pending > 0 && (
          <span className="flex items-center gap-1.5 bg-amber-900/30 border border-amber-800 text-amber-400 text-sm font-medium px-4 py-2 rounded-xl">
            <Clock size={15} />
            {pending} solicitud{pending !== 1 ? "es" : ""} pendiente{pending !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Filtros — preservar ambos parámetros al cambiar uno */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { value: "", label: "Todos" },
          { value: "pending",  label: "Pendientes" },
          { value: "active",   label: "Activos" },
          { value: "rejected", label: "Rechazados" },
        ].map((s) => {
          const params = new URLSearchParams();
          if (s.value)    params.set("status", s.value);
          if (typeFilter) params.set("type",   typeFilter);
          const qs = params.toString();
          return (
            <Link key={s.value || "all"}
              href={`/admin/colaboradores${qs ? `?${qs}` : ""}`}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === (s.value || undefined)
                  ? "bg-primary-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
              }`}>
              {s.label}
            </Link>
          );
        })}
        <span className="text-neutral-700 mx-1">|</span>
        {[
          { value: "",             label: "Todos los tipos" },
          { value: "psychologist", label: "Psicólogos" },
          { value: "therapist",    label: "Terapeutas" },
          { value: "artist",       label: "Artistas" },
          { value: "volunteer",    label: "Voluntarios" },
        ].map((t) => {
          const params = new URLSearchParams();
          if (statusFilter) params.set("status", statusFilter);
          if (t.value)      params.set("type",   t.value);
          const qs = params.toString();
          return (
            <Link key={t.value || "all-t"}
              href={`/admin/colaboradores${qs ? `?${qs}` : ""}`}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                typeFilter === (t.value || undefined)
                  ? "bg-accent-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
              }`}>
              {t.label}
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
                {["Nombre", "Email", "Tipo", "Profesión", "Verificado", "Estado", "Registro", "Acciones"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {collaborators.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-neutral-500 text-sm">
                    No hay colaboradores con estos filtros.
                  </td>
                </tr>
              )}
              {collaborators.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-white font-medium">{c.firstName} {c.lastName}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-neutral-400 max-w-[180px] truncate">
                    {c.email}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-neutral-300">
                    {TYPE_LABELS[c.type] ?? c.type}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-neutral-400">
                    {c.profession ?? "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    {c.isVerified
                      ? <CheckCircle size={16} className="text-green-400" />
                      : <XCircle    size={16} className="text-neutral-600" />
                    }
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_CLASSES[c.status] ?? "bg-neutral-700 text-neutral-300"}`}>
                      {STATUS_LABELS[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-neutral-500">
                    {fDate(c.createdAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <CollaboratorActions id={c.id} status={c.status} />
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
                if (statusFilter) p.set("status", statusFilter);
                if (typeFilter)   p.set("type",   typeFilter);
                p.set("page", String(page - 1));
                return <Link href={`/admin/colaboradores?${p}`} className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs hover:bg-neutral-700">← Anterior</Link>;
              })()}
              {page < totalPages && (() => {
                const p = new URLSearchParams();
                if (statusFilter) p.set("status", statusFilter);
                if (typeFilter)   p.set("type",   typeFilter);
                p.set("page", String(page + 1));
                return <Link href={`/admin/colaboradores?${p}`} className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs hover:bg-neutral-700">Siguiente →</Link>;
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Botones de acción (client component) ──────────────────────────────────────

import { CollaboratorActionsClient } from "@/components/admin/CollaboratorActions";

function CollaboratorActions({ id, status }: { id: string; status: string }) {
  return <CollaboratorActionsClient id={id} status={status} />;
}
