/**
 * components/admin/DeleteDreamButton.tsx
 * Botón de eliminación de sueño con confirmación inline.
 * Solo se activa si el sueño no tiene donaciones confirmadas (la API lo valida).
 */

"use client";

import { useState }    from "react";
import { useRouter }   from "next/navigation";
import { Trash2, Loader2, AlertTriangle, X } from "lucide-react";

interface Props {
  dreamId:    string;
  dreamTitle: string;
}

export function DeleteDreamButton({ dreamId, dreamTitle }: Props) {
  const router  = useRouter();
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/admin/dreams/${dreamId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? json?.error ?? "No se pudo eliminar.");
        setLoading(false);
        return;
      }
      router.push("/admin/suenos");
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-900/40 transition-all"
      >
        <Trash2 size={15} aria-hidden />
        Eliminar sueño
      </button>

      {/* Modal de confirmación */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dream-title"
        >
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-950/50 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={18} className="text-red-400" aria-hidden />
                </div>
                <div>
                  <h2 id="delete-dream-title" className="font-semibold text-white text-base">
                    Eliminar sueño
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">Esta acción no se puede deshacer</p>
                </div>
              </div>
              <button
                onClick={() => { setOpen(false); setError(null); }}
                className="text-neutral-500 hover:text-neutral-300 transition-colors"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-neutral-300 mb-2">
              ¿Estás seguro de que quieres eliminar{" "}
              <strong className="text-white">"{dreamTitle}"</strong>?
            </p>
            <p className="text-xs text-neutral-500 mb-5">
              Solo puedes eliminar sueños sin donaciones confirmadas. Si ya tiene donaciones, cámbialo a estado <em>Cancelado</em>.
            </p>

            {error && (
              <div className="flex items-start gap-2 bg-red-950/40 border border-red-800/60 rounded-xl px-3 py-2.5 text-xs text-red-400 mb-4" role="alert">
                <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setOpen(false); setError(null); }}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-700 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
              >
                {loading
                  ? <><Loader2 size={14} className="animate-spin" /> Eliminando…</>
                  : <><Trash2 size={14} /> Sí, eliminar</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
