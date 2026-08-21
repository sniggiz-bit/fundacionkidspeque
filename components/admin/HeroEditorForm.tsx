/**
 * components/admin/HeroEditorForm.tsx
 * Editor completo del Hero — Client Component.
 * Permite editar todos los textos, imagen, estadísticas (auto/manual) y tags flotantes.
 * Incluye preview en tiempo real del aspecto de la tarjeta del Hero.
 */

"use client";

import { useState, useRef, useTransition, useCallback } from "react";
import Image from "next/image";
import {
  Save, Loader2, CheckCircle2, AlertCircle, Upload, X, Plus,
  RefreshCw, Eye, ToggleLeft, ToggleRight, Image as ImageIcon,
  Type, BarChart2, Tag, TrendingUp, Heart, Sparkles,
} from "lucide-react";

import type { HeroSettings } from "@/components/Hero";

export type { HeroSettings };

export interface LiveStats {
  dreamsDone:      string;
  totalRaisedCLP:  string;
  donorsToday:     number;
  weeklyDonations: string;
}

interface Props {
  initialSettings: HeroSettings;
  liveStats:       LiveStats;
}

// ── Sub-componentes de UI ─────────────────────────────────────────────────────

function SectionCard({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-neutral-800">
        <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center">
          <Icon size={15} className="text-primary-400" aria-hidden />
        </div>
        <h2 className="font-display font-bold text-white text-sm">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-400 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-neutral-600 mt-1">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, maxLength, id }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  maxLength?: number; id?: string;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 transition-all"
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 transition-all resize-none"
    />
  );
}

function AutoToggle({ auto, onToggle, autoLabel, manualValue, onManualChange, suffix, onSuffixChange }: {
  auto: boolean; onToggle: () => void;
  autoLabel: string; manualValue: string; onManualChange: (v: string) => void;
  suffix?: string; onSuffixChange?: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
          auto
            ? "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20"
            : "bg-neutral-800 text-neutral-400 border-neutral-700 hover:border-neutral-600"
        }`}
      >
        {auto ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
        {auto ? `Auto (${autoLabel})` : "Manual"}
      </button>
      {!auto && (
        <div className="flex gap-2">
          <input
            type="text"
            value={manualValue}
            onChange={(e) => onManualChange(e.target.value)}
            placeholder="Ej: 1.247"
            maxLength={30}
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-primary-500 transition-all"
          />
          {onSuffixChange !== undefined && (
            <input
              type="text"
              value={suffix ?? ""}
              onChange={(e) => onSuffixChange(e.target.value)}
              placeholder="Sufijo"
              maxLength={10}
              className="w-20 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-primary-500 transition-all"
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Preview mini del Hero ────────────────────────────────────────────────────

function HeroPreview({ form, stats }: { form: HeroSettings; stats: LiveStats }) {
  const imgSrc = form.heroImageUrl ||
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=500&q=80&auto=format&fit=crop";

  const getStat1 = () => form.stat1Auto ? stats.dreamsDone      : form.stat1ManualValue;
  const getStat2 = () => form.stat2Auto ? stats.totalRaisedCLP  : form.stat2ManualValue;
  const getStat3 = () => form.stat3Auto ? "—"                   : form.stat3ManualValue;
  const getWeekly = () => form.weeklyDonationsAuto ? stats.weeklyDonations : form.weeklyDonationsManual;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sticky top-6">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-800">
        <Eye size={14} className="text-primary-400" />
        <span className="text-xs font-bold text-white">Preview en tiempo real</span>
        <span className="ml-auto text-[10px] text-neutral-600 bg-neutral-800 rounded-full px-2 py-0.5">
          Solo visual
        </span>
      </div>

      {/* Mini tarjeta Hero */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-neutral-950">
        {/* Badge donantes hoy */}
        <div className="absolute top-2 left-2 z-20 bg-white/95 backdrop-blur rounded-xl px-2.5 py-1.5 flex items-center gap-2 shadow-sm">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <div>
            <p className="text-[10px] font-bold text-neutral-900 leading-tight whitespace-nowrap">
              +{stats.donorsToday} {form.badgeTodayText}
            </p>
            <p className="text-[9px] text-neutral-500">{form.badgeSubText}</p>
          </div>
        </div>

        {/* Tags flotantes */}
        {form.floatingTags[0] && (
          <div className="absolute top-2 right-2 z-20 bg-white/90 backdrop-blur rounded-full px-2 py-1 text-[9px] font-semibold text-violet-800 shadow-sm">
            {form.floatingTags[0]}
          </div>
        )}

        {/* Imagen */}
        <div className="relative w-full" style={{ aspectRatio: "16/10" }}>
          <Image
            src={imgSrc}
            alt={form.heroImageAlt}
            fill
            sizes="400px"
            className="object-cover"
            unoptimized={imgSrc.includes("unsplash")}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(30,27,75,0.85) 0%, rgba(30,27,75,0.20) 50%, transparent 70%)" }}
          />
        </div>

        {/* Stats panel */}
        <div className="absolute bottom-0 left-0 right-0 bg-neutral-950/90 backdrop-blur-sm p-3">
          <div className="grid grid-cols-3 gap-2 divide-x divide-white/20">
            {[
              { value: getStat1(), suffix: form.stat1Suffix, label: form.stat1Label },
              { value: getStat2(), suffix: form.stat2Suffix, label: form.stat2Label },
              { value: getStat3(), suffix: form.stat3Suffix, label: form.stat3Label },
            ].map((s) => (
              <div key={s.label} className="text-center px-1">
                <p className="font-extrabold text-sm text-white leading-none">
                  {s.value}<span className="text-orange-300">{s.suffix}</span>
                </p>
                <p className="text-[9px] text-white/60 mt-0.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-center gap-1">
            <TrendingUp size={9} className="text-green-400" />
            <span className="text-[9px] text-white/50">+{getWeekly()} {form.weeklyDonationsLabel}</span>
          </div>
        </div>
      </div>

      {/* Textos preview */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-1.5">
          <Sparkles size={10} className="text-violet-400" />
          <span className="text-[10px] text-neutral-400 font-medium">{form.chipText}</span>
        </div>
        <div className="text-sm font-extrabold text-white leading-tight">
          {form.headlinePart1} de cada{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-purple-500">
            {form.headlineColored1}
          </span>{" "}y{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">
            {form.headlineColored2}
          </span>{" "}{form.headlinePart3}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[9px] bg-primary-600 text-white rounded-lg px-2 py-1 font-semibold flex items-center gap-1">
            <Heart size={8} /> {form.ctaPrimaryText}
          </span>
          <span className="text-[9px] border border-neutral-700 text-neutral-300 rounded-lg px-2 py-1 font-semibold">
            {form.ctaSecondaryText}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────

export function HeroEditorForm({ initialSettings, liveStats }: Props) {
  const [form, setForm] = useState<HeroSettings>(initialSettings);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newTag, setNewTag] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = useCallback(<K extends keyof HeroSettings>(key: K, value: HeroSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ── Guardar en BD ──────────────────────────────────────────────────────────

  function handleSave() {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/hero", {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(form),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.error?.details ? "Revisa los campos marcados." : (json.error ?? "Error al guardar"));
          return;
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 3500);
      } catch {
        setError("No se pudo conectar con el servidor.");
      }
    });
  }

  // ── Upload imagen ──────────────────────────────────────────────────────────

  async function handleImageUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "hero");
      const res  = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Error al subir imagen");
      set("heroImageUrl", json.data.url);
    } catch (err: any) {
      setError(err.message ?? "Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  }

  // ── Tags flotantes ──────────────────────────────────────────────────────────

  function addTag() {
    const t = newTag.trim();
    if (!t || form.floatingTags.includes(t)) return;
    set("floatingTags", [...form.floatingTags, t]);
    setNewTag("");
  }

  function removeTag(idx: number) {
    set("floatingTags", form.floatingTags.filter((_, i) => i !== idx));
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">

      {/* ── Columna izquierda: formulario ───────────────────────────── */}
      <div className="space-y-5">

        {/* Textos del Hero */}
        <SectionCard icon={Type} title="Textos del Hero">
          <Field label="Chip / Tag de sección" hint="Aparece encima del título principal">
            <Input id="hero-chip" value={form.chipText} onChange={(v) => set("chipText", v)} placeholder="Plataforma Social de Impacto" maxLength={100} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Headline — parte 1">
              <Input id="hero-headline1" value={form.headlinePart1} onChange={(v) => set("headlinePart1", v)} placeholder="Cumple el sueño" maxLength={200} />
            </Field>
            <Field label="Palabra en violeta" hint="Ej: niño">
              <Input id="hero-colored1" value={form.headlineColored1} onChange={(v) => set("headlineColored1", v)} placeholder="niño" maxLength={100} />
            </Field>
            <Field label="Palabra en rosa" hint="Ej: niña">
              <Input id="hero-colored2" value={form.headlineColored2} onChange={(v) => set("headlineColored2", v)} placeholder="niña" maxLength={100} />
            </Field>
          </div>

          <Field label="Headline — parte 3 (al final)">
            <Input id="hero-headline3" value={form.headlinePart3} onChange={(v) => set("headlinePart3", v)} placeholder="de Chile." maxLength={200} />
          </Field>

          <Field label="Subtítulo" hint="El texto en negrita debe coincidir exactamente con parte del subtítulo">
            <Textarea value={form.subtitle} onChange={(v) => set("subtitle", v)} placeholder="Apoyamos el desarrollo infantil..." rows={3} />
          </Field>
          <Field label="Texto en negrita dentro del subtítulo">
            <Input id="hero-subtitle-bold" value={form.subtitleBoldText} onChange={(v) => set("subtitleBoldText", v)} placeholder="creatividad y la expresión" maxLength={100} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="CTA principal (botón naranja)">
              <Input id="hero-cta1" value={form.ctaPrimaryText} onChange={(v) => set("ctaPrimaryText", v)} placeholder="Dona Ahora" maxLength={60} />
            </Field>
            <Field label="CTA secundario">
              <Input id="hero-cta2" value={form.ctaSecondaryText} onChange={(v) => set("ctaSecondaryText", v)} placeholder="Ver Sueños Activos" maxLength={60} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Trust signal 1">
              <Input id="hero-trust1" value={form.trust1} onChange={(v) => set("trust1", v)} maxLength={60} />
            </Field>
            <Field label="Trust signal 2">
              <Input id="hero-trust2" value={form.trust2} onChange={(v) => set("trust2", v)} maxLength={60} />
            </Field>
            <Field label="Trust signal 3">
              <Input id="hero-trust3" value={form.trust3} onChange={(v) => set("trust3", v)} maxLength={60} />
            </Field>
          </div>
        </SectionCard>

        {/* Imagen principal */}
        <SectionCard icon={ImageIcon} title="Imagen principal">
          <div className="flex items-start gap-4">
            {/* Thumbnail */}
            <div className="relative w-32 h-20 rounded-xl overflow-hidden bg-neutral-800 border border-neutral-700 flex-shrink-0">
              {form.heroImageUrl ? (
                <>
                  <Image
                    src={form.heroImageUrl}
                    alt="Vista previa"
                    fill
                    className="object-cover"
                    unoptimized={form.heroImageUrl.includes("unsplash")}
                  />
                  <button
                    type="button"
                    onClick={() => set("heroImageUrl", "")}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                  >
                    <X size={10} className="text-white" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-neutral-600">
                  <ImageIcon size={20} />
                  <span className="text-[9px] mt-1">Sin imagen</span>
                </div>
              )}
            </div>

            {/* Controles */}
            <div className="flex-1 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                id="hero-image-upload"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageUpload(f);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 text-neutral-300 text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? "Subiendo…" : "Subir imagen"}
              </button>
              <p className="text-[11px] text-neutral-600">JPG, PNG, WebP o AVIF — máx. 10 MB</p>

              <Field label="URL de imagen (alternativa al upload)">
                <Input
                  id="hero-image-url"
                  value={form.heroImageUrl}
                  onChange={(v) => set("heroImageUrl", v)}
                  placeholder="https://..."
                />
              </Field>
              <Field label="Texto alternativo (accesibilidad)">
                <Input
                  id="hero-image-alt"
                  value={form.heroImageAlt}
                  onChange={(v) => set("heroImageAlt", v)}
                  maxLength={300}
                />
              </Field>
            </div>
          </div>
        </SectionCard>

        {/* Estadísticas */}
        <SectionCard icon={BarChart2} title="Estadísticas de la tarjeta">

          {/* Badge donantes hoy — siempre automático */}
          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-green-400">Badge flotante — Donantes hoy</span>
              <span className="ml-auto text-[10px] bg-green-500/20 text-green-400 rounded-full px-2 py-0.5 font-semibold">
                Siempre automático
              </span>
            </div>
            <p className="text-xs text-neutral-500 mb-3">
              Calcula automáticamente el número de donantes únicos del día desde la BD.
              Valor actual: <strong className="text-white">+{liveStats.donorsToday}</strong>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Texto del badge (tras el número)">
                <Input id="hero-badge-today" value={form.badgeTodayText} onChange={(v) => set("badgeTodayText", v)} maxLength={60} />
              </Field>
              <Field label="Sub-texto del badge">
                <Input id="hero-badge-sub" value={form.badgeSubText} onChange={(v) => set("badgeSubText", v)} maxLength={60} />
              </Field>
            </div>
          </div>

          {/* Stat 1 */}
          <div className="border border-neutral-800 rounded-xl p-4 space-y-3">
            <Field label="Etiqueta — Estadística 1">
              <Input id="hero-stat1-label" value={form.stat1Label} onChange={(v) => set("stat1Label", v)} maxLength={60} />
            </Field>
            <div>
              <p className="text-xs font-semibold text-neutral-400 mb-1.5">Valor</p>
              <AutoToggle
                auto={form.stat1Auto}
                onToggle={() => set("stat1Auto", !form.stat1Auto)}
                autoLabel={liveStats.dreamsDone}
                manualValue={form.stat1ManualValue}
                onManualChange={(v) => set("stat1ManualValue", v)}
                suffix={form.stat1Suffix}
                onSuffixChange={(v) => set("stat1Suffix", v)}
              />
              {form.stat1Auto && (
                <p className="text-[11px] text-green-400 mt-1.5">
                  Valor en vivo: <strong>{liveStats.dreamsDone}</strong> sueños cumplidos/financiados
                </p>
              )}
            </div>
          </div>

          {/* Stat 2 */}
          <div className="border border-neutral-800 rounded-xl p-4 space-y-3">
            <Field label="Etiqueta — Estadística 2">
              <Input id="hero-stat2-label" value={form.stat2Label} onChange={(v) => set("stat2Label", v)} maxLength={60} />
            </Field>
            <div>
              <p className="text-xs font-semibold text-neutral-400 mb-1.5">Valor</p>
              <AutoToggle
                auto={form.stat2Auto}
                onToggle={() => set("stat2Auto", !form.stat2Auto)}
                autoLabel={liveStats.totalRaisedCLP}
                manualValue={form.stat2ManualValue}
                onManualChange={(v) => set("stat2ManualValue", v)}
                suffix={form.stat2Suffix}
                onSuffixChange={(v) => set("stat2Suffix", v)}
              />
              {form.stat2Auto && (
                <p className="text-[11px] text-green-400 mt-1.5">
                  Valor en vivo: <strong>{liveStats.totalRaisedCLP}</strong> recaudado (confirmado)
                </p>
              )}
            </div>
          </div>

          {/* Stat 3 — siempre manual (valor independiente) */}
          <div className="border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Field label="Etiqueta — Estadística 3">
                <Input id="hero-stat3-label" value={form.stat3Label} onChange={(v) => set("stat3Label", v)} maxLength={60} />
              </Field>
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-400 mb-1.5">Valor (independiente — no proviene de la BD)</p>
              <div className="flex gap-2">
                <input
                  id="hero-stat3-value"
                  type="text"
                  value={form.stat3ManualValue}
                  onChange={(e) => set("stat3ManualValue", e.target.value)}
                  placeholder="Ej: 3.890"
                  maxLength={30}
                  className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-primary-500 transition-all"
                />
                <input
                  type="text"
                  value={form.stat3Suffix}
                  onChange={(e) => set("stat3Suffix", e.target.value)}
                  placeholder="Sufijo"
                  maxLength={10}
                  className="w-20 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-primary-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Donaciones semanales (footer de la card) */}
          <div className="border border-neutral-800 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-neutral-300">Pie de tarjeta — Donaciones esta semana</p>
            <Field label="Etiqueta">
              <Input id="hero-weekly-label" value={form.weeklyDonationsLabel} onChange={(v) => set("weeklyDonationsLabel", v)} maxLength={60} />
            </Field>
            <AutoToggle
              auto={form.weeklyDonationsAuto}
              onToggle={() => set("weeklyDonationsAuto", !form.weeklyDonationsAuto)}
              autoLabel={liveStats.weeklyDonations}
              manualValue={form.weeklyDonationsManual}
              onManualChange={(v) => set("weeklyDonationsManual", v)}
            />
            {form.weeklyDonationsAuto && (
              <p className="text-[11px] text-green-400">
                Valor en vivo: <strong>{liveStats.weeklyDonations}</strong> donaciones (últimos 7 días)
              </p>
            )}
          </div>
        </SectionCard>

        {/* Tags flotantes de categoría */}
        <SectionCard icon={Tag} title="Tags flotantes de categoría">
          <p className="text-xs text-neutral-500">
            Burbujas decorativas que aparecen flotando alrededor de la imagen (solo en desktop).
            Puedes incluir emojis, ej: <code className="text-primary-400">🎵 Música</code>
          </p>

          {/* Lista de tags */}
          <div className="flex flex-wrap gap-2">
            {form.floatingTags.map((tag, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1.5 bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs rounded-full px-3 py-1.5"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(idx)}
                  className="text-neutral-500 hover:text-red-400 transition-colors"
                  aria-label={`Eliminar tag ${tag}`}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>

          {/* Agregar nuevo tag */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Ej: 🎭 Teatro"
              maxLength={40}
              id="hero-new-tag"
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-primary-500 transition-all"
            />
            <button
              type="button"
              onClick={addTag}
              className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 px-3 py-2 rounded-xl transition-all text-sm"
            >
              <Plus size={14} /> Agregar
            </button>
          </div>
        </SectionCard>

        {/* Barra de guardado */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle2 size={16} />
              <span>¡Guardado! Los cambios se reflejarán en el sitio inmediatamente.</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm flex-1">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {!saved && !error && (
            <p className="text-xs text-neutral-500 flex-1">
              Los cambios se aplican al sitio público al guardar (revalida caché automáticamente).
            </p>
          )}
          <button
            type="button"
            id="hero-save-btn"
            onClick={handleSave}
            disabled={isPending || uploading}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all ml-auto"
          >
            {isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {isPending ? "Guardando…" : "Guardar Hero"}
          </button>
        </div>
      </div>

      {/* ── Columna derecha: preview ────────────────────────────────── */}
      <div>
        <HeroPreview form={form} stats={liveStats} />
      </div>
    </div>
  );
}
