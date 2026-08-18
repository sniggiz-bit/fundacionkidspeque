/**
 * components/admin/ConfigForm.tsx
 * Formulario interactivo de configuración del panel admin.
 * Client Component — maneja el guardado con fetch a /api/admin/settings.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Key, Globe, Bell, Shield, CheckCircle2, AlertCircle,
  Save, Loader2, RefreshCw,
} from "lucide-react";

interface EnvVar {
  key:    string;
  label:  string;
  status: "ok" | "missing";
}

interface Settings {
  foundationName:    string;
  tagline:           string;
  contactEmail:      string;
  contactPhone:      string;
  donationsEmail:    string;
  volunteeringEmail: string;
}

interface Props {
  initialSettings: Settings;
  envVars:         EnvVar[];
}

export function ConfigForm({ initialSettings, envVars }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form,    setForm]    = useState<Settings>(initialSettings);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  function update(key: keyof Settings, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setError(null);
  }

  async function handleSave() {
    startTransition(async () => {
      setSaved(false);
      setError(null);

      try {
        const res = await fetch("/api/admin/settings", {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(form),
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          const msg = json.error?.details
            ? Object.values(json.error.details).flat().join(", ")
            : (json.error ?? "Error desconocido");
          setError(String(msg));
          return;
        }

        setSaved(true);
        // Refrescar para que Server Components muestren los nuevos datos
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      } catch {
        setError("Error de conexión. Comprueba tu conexión e inténtalo de nuevo.");
      }
    });
  }

  const okCount      = envVars.filter((v) => v.status === "ok").length;
  const missingCount = envVars.filter((v) => v.status === "missing").length;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-white">Configuración</h1>
        <p className="text-neutral-500 text-sm mt-0.5">Ajustes globales del panel de administración.</p>
      </div>

      <div className="space-y-6">

        {/* ── Sección: Sitio web ─────────────────────────────────────────── */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary-600/20 flex items-center justify-center">
              <Globe size={18} className="text-primary-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Sitio web</h2>
              <p className="text-xs text-neutral-500">Nombre de la fundación, descripción y datos de contacto.</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { key: "foundationName" as const, label: "Nombre de la fundación", type: "text",  placeholder: "Fundación Kidspeque" },
              { key: "tagline"        as const, label: "Tagline",                type: "text",  placeholder: "Cada niño merece soñar." },
              { key: "contactEmail"   as const, label: "Email de contacto",      type: "email", placeholder: "contacto@kidspeque.cl" },
              { key: "contactPhone"   as const, label: "Teléfono",               type: "tel",   placeholder: "+56 2 1234 5678" },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-neutral-400 mb-2">{field.label}</label>
                <input
                  type={field.type}
                  value={form[field.key]}
                  onChange={(e) => update(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Sección: Notificaciones ────────────────────────────────────── */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary-600/20 flex items-center justify-center">
              <Bell size={18} className="text-primary-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Notificaciones</h2>
              <p className="text-xs text-neutral-500">Emails de destino para alertas y notificaciones.</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { key: "donationsEmail"    as const, label: "Email para donaciones",   placeholder: "donaciones@kidspeque.cl" },
              { key: "volunteeringEmail" as const, label: "Email para voluntariado", placeholder: "voluntarios@kidspeque.cl" },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-neutral-400 mb-2">{field.label}</label>
                <input
                  type="email"
                  value={form[field.key]}
                  onChange={(e) => update(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Sección: Variables de entorno ──────────────────────────────── */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-amber-600/20 flex items-center justify-center">
              <Key size={18} className="text-amber-400" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-white text-sm">Variables de entorno</h2>
              <p className="text-xs text-neutral-500">
                Se configuran en el archivo <code className="bg-neutral-800 px-1 rounded text-xs">.env.local</code> del servidor.
              </p>
            </div>
            {/* Resumen */}
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-green-400">
                <CheckCircle2 size={12} /> {okCount} ok
              </span>
              {missingCount > 0 && (
                <span className="flex items-center gap-1 text-amber-400">
                  <AlertCircle size={12} /> {missingCount} sin configurar
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            {envVars.map((v) => (
              <div key={v.key} className="flex items-center justify-between py-2.5 border-b border-neutral-800 last:border-0">
                <div>
                  <span className="text-sm text-neutral-200">{v.label}</span>
                  <code className="text-[10px] font-mono text-neutral-600 block">{v.key}</code>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                    v.status === "ok"
                      ? "bg-green-900/30 text-green-400"
                      : "bg-amber-900/30 text-amber-400"
                  }`}
                >
                  {v.status === "ok" ? (
                    <><CheckCircle2 size={11} /> Configurada</>
                  ) : (
                    <><AlertCircle  size={11} /> Sin configurar</>
                  )}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-neutral-600 mt-4 flex items-center gap-1">
            <Shield size={11} />
            Los valores reales nunca se muestran aquí por seguridad.
          </p>
        </div>

        {/* ── Feedback y botón guardar ──────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-2 bg-red-900/20 border border-red-800 text-red-400 rounded-xl px-4 py-3 text-sm">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-2 bg-green-900/20 border border-green-800 text-green-400 rounded-xl px-4 py-3 text-sm">
            <CheckCircle2 size={15} />
            Configuración guardada correctamente.
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => { setForm(initialSettings); setError(null); setSaved(false); }}
            disabled={isPending}
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} />
            Restablecer
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-70"
          >
            {isPending ? (
              <><Loader2 size={15} className="animate-spin" /> Guardando...</>
            ) : (
              <><Save size={15} /> Guardar cambios</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
