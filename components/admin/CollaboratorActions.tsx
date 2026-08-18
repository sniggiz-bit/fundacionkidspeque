/**
 * components/admin/CollaboratorActions.tsx
 * Botones de acción inline para cada fila de colaborador.
 * Client component para manejar las mutaciones.
 */

"use client";

import { useState }    from "react";
import { useRouter }   from "next/navigation";
import { CheckCircle, XCircle, UserCheck, Loader2 } from "lucide-react";

interface Props {
  id:     string;
  status: string;
}

export function CollaboratorActionsClient({ id, status }: Props) {
  const router   = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>, label: string) {
    setLoading(label);
    try {
      const res = await fetch(`/api/admin/collaborators/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error al actualizar. Intenta de nuevo.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-1.5">

      {/* Aprobar → activo */}
      {status === "pending" && (
        <button
          onClick={() => patch({ status: "active", isVerified: true }, "approve")}
          disabled={loading !== null}
          title="Aprobar colaborador"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-900/30 hover:bg-green-900/50 text-green-400 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {loading === "approve"
            ? <Loader2 size={13} className="animate-spin" />
            : <CheckCircle size={13} />
          }
          Aprobar
        </button>
      )}

      {/* Rechazar */}
      {(status === "pending" || status === "active") && (
        <button
          onClick={() => patch({ status: "rejected" }, "reject")}
          disabled={loading !== null}
          title="Rechazar colaborador"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {loading === "reject"
            ? <Loader2 size={13} className="animate-spin" />
            : <XCircle size={13} />
          }
          Rechazar
        </button>
      )}

      {/* Reactivar */}
      {(status === "rejected" || status === "inactive") && (
        <button
          onClick={() => patch({ status: "active" }, "reactivate")}
          disabled={loading !== null}
          title="Reactivar colaborador"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {loading === "reactivate"
            ? <Loader2 size={13} className="animate-spin" />
            : <UserCheck size={13} />
          }
          Reactivar
        </button>
      )}

    </div>
  );
}
