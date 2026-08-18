"use client";

type DreamStatus = "draft" | "active" | "funded" | "completed" | "paused" | "cancelled";

const STATUS_CONFIG: Record<DreamStatus, { label: string; classes: string }> = {
  draft:     { label: "Borrador",    classes: "bg-neutral-700 text-neutral-300"  },
  active:    { label: "Activo",      classes: "bg-primary-900 text-primary-300"  },
  funded:    { label: "Financiado",  classes: "bg-success/20 text-green-400"     },
  completed: { label: "Completado",  classes: "bg-green-900 text-green-300"      },
  paused:    { label: "Pausado",     classes: "bg-amber-900/40 text-amber-400"   },
  cancelled: { label: "Cancelado",   classes: "bg-error/20 text-red-400"         },
};

export function DreamStatusBadge({ status }: { status: DreamStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.classes}`}>
      {config.label}
    </span>
  );
}
