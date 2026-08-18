/**
 * components/admin/DonationActions.tsx
 * Botones de acción inline para cambiar el estado de una donación manualmente.
 * Client Component — llama a PATCH /api/admin/donations/[id].
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, RotateCcw, Loader2 } from "lucide-react";

interface Props {
  id:     string;
  status: string;
}

export function DonationActions({ id, status }: Props) {
  const router  = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function patch(newStatus: string, label: string) {
    if (!confirm(`¿Cambiar estado a "${newStatus}"?`)) return;
    setLoading(label);
    try {
      const res = await fetch(`/api/admin/donations/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error al actualizar la donación. Intenta de nuevo.");
    } finally {
      setLoading(null);
    }
  }

  if (status === "confirmed") {
    // Donaciones confirmadas: solo se pueden reembolsar
    return (
      <button
        onClick={() => patch("refunded", "refund")}
        disabled={loading !== null}
        title="Marcar como reembolsada"
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-900/30 hover:bg-orange-900/50 text-orange-400 text-xs font-medium transition-colors disabled:opacity-50"
      >
        {loading === "refund"
          ? <Loader2 size={12} className="animate-spin" />
          : <RotateCcw size={12} />
        }
        Reembolsar
      </button>
    );
  }

  if (status === "pending") {
    // Donaciones pendientes: confirmar manualmente (casos donde el webhook falló)
    return (
      <button
        onClick={() => patch("confirmed", "confirm")}
        disabled={loading !== null}
        title="Confirmar donación manualmente"
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-900/30 hover:bg-green-900/50 text-green-400 text-xs font-medium transition-colors disabled:opacity-50"
      >
        {loading === "confirm"
          ? <Loader2 size={12} className="animate-spin" />
          : <CheckCircle size={12} />
        }
        Confirmar
      </button>
    );
  }

  // Para otros estados (failed, refunded, disputed) no hay acciones disponibles
  return <span className="text-xs text-neutral-600">—</span>;
}
