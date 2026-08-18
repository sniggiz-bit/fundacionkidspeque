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
  Save, Loader2, RefreshCw, FileText, Share2, MapPin, Clock,
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
  address:           string;
  schedule:          string;
  rut:               string;
  legalPersonId:     string;
  instagramUrl:      string;
  facebookUrl:       string;
  youtubeUrl:        string;
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
        <h1 className="font-display font-bold text-2xl text-white">Configuración del Sitio & Footer</h1>
        <p className="text-neutral-500 text-sm mt-0.5">Edita la información global de la fundación, redes sociales, datos del footer y notificaciones.</p>
      </div>

      <div className="space-y-6">

        {/* ── Sección: Sitio web & Contacto (Footer) ─────────────────────────── */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary-600/20 flex items-center justify-center">
              <Globe size={18} className="text-primary-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Información Principal & Contacto (Footer)</h2>
              <p className="text-xs text-neutral-500">Nombre, descripción del footer, emails y datos de contacto.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">Nombre de la fundación</label>
              <input
                type="text"
                value={form.foundationName}
                onChange={(e) => update("foundationName", e.target.value)}
                placeholder="Fundación Kidspeque"
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">Descripción del Footer (Tagline)</label>
              <textarea
                rows={2}
                value={form.tagline}
                onChange={(e) => update("tagline", e.target.value)}
                placeholder="Fundación Social Niños Creativos. Cumplimos sueños de niños y niñas..."
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-2">Email de contacto</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => update("contactEmail", e.target.value)}
                  placeholder="contacto@kidspeque.cl"
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-2">Teléfono de contacto</label>
                <input
                  type="text"
                  value={form.contactPhone}
                  onChange={(e) => update("contactPhone", e.target.value)}
                  placeholder="+56 2 2345 6789"
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-2">Dirección física</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Santiago, Región Metropolitana, Chile"
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-2">Horario de atención</label>
                <input
                  type="text"
                  value={form.schedule}
                  onChange={(e) => update("schedule", e.target.value)}
                  placeholder="Lunes a Viernes 09:00 a 17:00 hrs."
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Sección: Datos Legales (Footer) ───────────────────────────── */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 flex items-center justify-center">
              <FileText size={18} className="text-purple-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Datos Legales de la Fundación (Footer)</h2>
              <p className="text-xs text-neutral-500">RUT y número de personalidad jurídica mostrados en la barra inferior del footer.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">RUT Fundación</label>
              <input
                type="text"
                value={form.rut}
                onChange={(e) => update("rut", e.target.value)}
                placeholder="76.XXX.XXX-X"
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">Personalidad Jurídica N°</label>
              <input
                type="text"
                value={form.legalPersonId}
                onChange={(e) => update("legalPersonId", e.target.value)}
                placeholder="Nº XXXX/2024"
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* ── Sección: Redes Sociales (Footer) ──────────────────────────── */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-pink-600/20 flex items-center justify-center">
              <Share2 size={18} className="text-pink-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Redes Sociales (Footer)</h2>
              <p className="text-xs text-neutral-500">Enlaces a perfiles oficiales de la fundación.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">URL Instagram</label>
              <input
                type="url"
                value={form.instagramUrl}
                onChange={(e) => update("instagramUrl", e.target.value)}
                placeholder="https://instagram.com/kidspeque_cl"
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">URL Facebook</label>
              <input
                type="url"
                value={form.facebookUrl}
                onChange={(e) => update("facebookUrl", e.target.value)}
                placeholder="https://facebook.com/kidspeque"
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">URL YouTube</label>
              <input
                type="url"
                value={form.youtubeUrl}
                onChange={(e) => update("youtubeUrl", e.target.value)}
                placeholder="https://youtube.com/@kidspeque_cl"
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* ── Sección: Notificaciones ────────────────────────────────────── */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary-600/20 flex items-center justify-center">
              <Bell size={18} className="text-primary-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Notificaciones Internas</h2>
              <p className="text-xs text-neutral-500">Emails de destino para alertas y postulaciones.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">Email donaciones</label>
              <input
                type="email"
                value={form.donationsEmail}
                onChange={(e) => update("donationsEmail", e.target.value)}
                placeholder="donaciones@kidspeque.cl"
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">Email voluntariado</label>
              <input
                type="email"
                value={form.volunteeringEmail}
                onChange={(e) => update("volunteeringEmail", e.target.value)}
                placeholder="voluntarios@kidspeque.cl"
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>
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
                Se configuran en el servidor / Vercel.
              </p>
            </div>
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
