"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Check, Loader2 } from "lucide-react";

interface RefreshStatsButtonProps {
  className?: string;
  variant?: "primary" | "secondary";
}

export function RefreshStatsButton({ className = "", variant = "secondary" }: RefreshStatsButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSync = async () => {
    if (loading) return;
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/donations/sync", {
        method: "POST",
      });

      if (res.ok) {
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const json = await res.json().catch(() => null);
        alert(json?.error ?? "Error al sincronizar métricas");
      }
    } catch (err) {
      console.error("[RefreshStatsButton]", err);
      alert("Error de conexión al sincronizar métricas");
    } finally {
      setLoading(false);
    }
  };

  const baseClasses = variant === "primary"
    ? "bg-primary-600 hover:bg-primary-700 text-white"
    : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700";

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={loading}
      className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 ${baseClasses} ${className}`}
      title="Recalcula en tiempo real el progreso de todos los sueños y métricas con la base de datos"
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin text-primary-400" />
          <span>Sincronizando...</span>
        </>
      ) : success ? (
        <>
          <Check size={16} className="text-emerald-400" />
          <span className="text-emerald-400">¡Actualizado!</span>
        </>
      ) : (
        <>
          <RefreshCw size={15} />
          <span>Sincronizar Métricas</span>
        </>
      )}
    </button>
  );
}
