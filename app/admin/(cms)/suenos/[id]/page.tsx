/**
 * /admin/suenos/[id] — Editar sueño existente
 */

import type { Metadata } from "next";
import { notFound }      from "next/navigation";
import Link              from "next/link";
import { db }            from "@/lib/db";
import { DreamForm }     from "@/components/admin/DreamForm";
import { DeleteDreamButton } from "@/components/admin/DeleteDreamButton";
import { ArrowLeft }     from "lucide-react";

export const metadata: Metadata = { title: "Editar Sueño" };
export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function EditDreamPage({ params }: PageProps) {
  const dream = await db.dream.findUnique({
    where: { id: params.id },
  });

  if (!dream) notFound();

  const cover = dream.coverImage as { url: string; alt: string };

  const defaults = {
    title:            dream.title,
    childName:        dream.childName,
    childAge:         dream.childAge,
    shortDescription: dream.shortDescription,
    story:            dream.story,
    targetAmount:     Number(dream.targetAmount),
    category:         dream.category ?? "",
    tags:             dream.tags.join(", "),
    deadline:         dream.deadline ? dream.deadline.toISOString().split("T")[0] : undefined,
    coverImageUrl:    cover.url,
    coverImageAlt:    cover.alt,
    slug:             dream.slug,
    metaTitle:        dream.metaTitle ?? undefined,
    metaDescription:  dream.metaDescription ?? undefined,
    // Solo enviar status editable; funded/completed/cancelled se muestran en DreamForm como info
    status:           (["draft", "active", "paused"].includes(dream.status)
                        ? dream.status
                        : "paused") as "draft" | "active" | "paused",
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/suenos"
          className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <ArrowLeft size={16} /> Volver
        </Link>
        <div className="flex-1">
          <h1 className="font-display font-bold text-2xl text-white">Editar sueño</h1>
          <p className="text-neutral-500 text-sm mt-0.5 font-mono">{dream.publicId}</p>
        </div>
        <DeleteDreamButton dreamId={dream.id} dreamTitle={dream.title} />
      </div>

      {/* Métricas actuales */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "Recaudado",
            value: new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Number(dream.raisedAmount)),
          },
          { label: "Donantes", value: String(dream.donorCount) },
          { label: "Progreso", value: `${Number(dream.progressPct).toFixed(1)}%` },
        ].map((m) => (
          <div key={m.label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <p className="text-xs text-neutral-500">{m.label}</p>
            <p className="font-display font-bold text-lg text-white mt-0.5">{m.value}</p>
          </div>
        ))}
      </div>

      <DreamForm mode="edit" dreamId={params.id} defaults={defaults} />
    </div>
  );
}
