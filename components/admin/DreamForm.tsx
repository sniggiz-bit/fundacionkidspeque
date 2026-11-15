/**
 * components/admin/DreamForm.tsx
 * ─────────────────────────────────────────────────────────────────
 * Formulario para crear y editar sueños (campañas de crowdfunding).
 * Usado en /admin/suenos/nuevo y /admin/suenos/[id].
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter }   from "next/navigation";
import { useForm, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z }           from "zod";
import { Loader2, Save, AlertCircle, UploadCloud, X, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import Image from "next/image";

// ── Schema ────────────────────────────────────────────────────────────────────

const dreamSchema = z.object({
  title:            z.string().min(5, "Título muy corto (mín. 5 caracteres)").max(200),
  childName:        z.string().min(2, "Nombre muy corto").max(100),
  childAge:         z.number().int().min(0).max(17),
  shortDescription: z.string().min(10, "Descripción muy corta (mín. 10 caracteres)").max(160),
  story:            z.string().min(20, "La historia debe tener al menos 20 caracteres").max(10000),
  targetAmount:     z.number().int().min(1000, "Meta mínima: $1.000 CLP"),
  category:         z.string().min(1, "Selecciona una categoría"),
  tags:             z.string().optional().default(""), // Separados por coma
  deadline:         z.string().optional(),
  coverImageUrl:    z.string().url("Debes subir una imagen o ingresar una URL válida (ej: https://...)"),
  coverImageAlt:    z.string().optional().default(""),
  slug:             z.string().min(3, "Slug requerido (mín. 3 caracteres)").max(250)
                     .regex(/^[a-z0-9-]+$/, "El slug solo puede contener minúsculas, números y guiones"),
  metaTitle:        z.string().max(60).optional(),
  metaDescription:  z.string().max(160).optional(),
  status:           z.enum(["draft", "active", "paused"]),
});

type DreamFormData = z.infer<typeof dreamSchema>;

// ── Constantes y Helpers ──────────────────────────────────────────────────────

function htmlToPlainText(html?: string): string {
  if (!html) return "";
  if (!/<[a-z][\s\S]*>/i.test(html)) return html;
  return html
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p>/gi, "")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function plainTextToHtml(text?: string): string {
  if (!text) return "";
  if (/<p>|<div|<h[1-6]/i.test(text)) {
    return text.trim();
  }
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return `<p>${text.trim()}</p>`;
  return paragraphs
    .map((p) => `<p>${p.replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

const CATEGORIES = [
  "arte", "educación", "salud", "deporte", "música",
  "danza", "teatro", "tecnología", "naturaleza", "otro",
];

// ── Componente ────────────────────────────────────────────────────────────────

interface DreamFormProps {
  mode:      "create" | "edit";
  dreamId?:  string;
  defaults?: Partial<DreamFormData>;
}

export function DreamForm({ mode, dreamId, defaults }: DreamFormProps) {
  const router = useRouter();
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "media" | "seo">("content");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [useDirectUrl, setUseDirectUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialStory = defaults?.story ? htmlToPlainText(defaults.story) : "";

  const { register, handleSubmit, watch, setValue, formState: { errors, isDirty } } = useForm<DreamFormData>({
    resolver: zodResolver(dreamSchema),
    defaultValues: {
      status: "draft",
      childAge: 8,
      targetAmount: 150000,
      tags: "",
      coverImageAlt: "",
      ...defaults,
      story: initialStory,
    },
  });

  const titleValue    = watch("title");
  const childNameValue = watch("childName");
  const coverUrl      = watch("coverImageUrl");
  const slugValue     = watch("slug");

  // Auto-generar slug si está vacío al escribir el título
  useEffect(() => {
    if (mode === "create" && titleValue && (!slugValue || slugValue.length === 0)) {
      const slug = titleValue
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 150);
      setValue("slug", slug, { shouldValidate: true });
    }
  }, [titleValue, slugValue, mode, setValue]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "dreams");

    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const json = await res.json();
      
      if (!res.ok) {
        setUploadError(json.error ?? "Error al subir la imagen. Puedes pegar una URL directa abajo.");
      } else {
        setValue("coverImageUrl", json.data.url, { shouldValidate: true, shouldDirty: true });
      }
    } catch {
      setUploadError("Error de conexión al subir la imagen. Puedes ingresar una URL directa.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const generateSlug = () => {
    if (!titleValue) return;
    const slug = titleValue
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 200);
    setValue("slug", slug, { shouldValidate: true });
  };

  const onSubmit = async (data: DreamFormData) => {
    setSaving(true);
    setSaveError(null);
    const tags = data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    const coverImageAlt = data.coverImageAlt?.trim() || `Foto de ${data.childName || data.title}`;
    const formattedStory = plainTextToHtml(data.story);

    try {
      const endpoint = mode === "create" ? "/api/admin/dreams" : `/api/admin/dreams/${dreamId}`;
      const method   = mode === "create" ? "POST" : "PUT";

      const res  = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...data, story: formattedStory, tags, coverImageAlt }),
      });
      const json = await res.json();

      if (!res.ok) {
        const msg = json?.error?.message ?? json?.error ?? "Error al guardar. Verifica los datos.";
        setSaveError(typeof msg === "string" ? msg : JSON.stringify(msg));
        setSaving(false);
        return;
      }

      router.push("/admin/suenos");
      router.refresh();
    } catch {
      setSaveError("Error de conexión. Intenta de nuevo.");
      setSaving(false);
    }
  };

  const onInvalid = (formErrors: FieldErrors<DreamFormData>) => {
    // Redirigir al tab que tiene el primer error
    if (
      formErrors.title || formErrors.childName || formErrors.childAge ||
      formErrors.shortDescription || formErrors.story || formErrors.targetAmount ||
      formErrors.category
    ) {
      setActiveTab("content");
    } else if (formErrors.coverImageUrl || formErrors.coverImageAlt) {
      setActiveTab("media");
    } else if (formErrors.slug || formErrors.metaTitle || formErrors.metaDescription) {
      setActiveTab("seo");
    }

    setSaveError("Por favor revisa los campos requeridos marcados en rojo en el formulario.");
  };

  // Detectar errores por pestaña
  const hasContentErrors = Boolean(
    errors.title || errors.childName || errors.childAge ||
    errors.shortDescription || errors.story || errors.targetAmount ||
    errors.category
  );
  const hasMediaErrors = Boolean(errors.coverImageUrl || errors.coverImageAlt);
  const hasSeoErrors   = Boolean(errors.slug || errors.metaTitle || errors.metaDescription);

  const TABS = [
    { id: "content", label: "Contenido",  hasError: hasContentErrors },
    { id: "media",   label: "Medios",     hasError: hasMediaErrors },
    { id: "seo",     label: "SEO & Slug", hasError: hasSeoErrors },
  ] as const;

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="space-y-6">

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-900 rounded-xl p-1 border border-neutral-800 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <span>{tab.label}</span>
            {tab.hasError && (
              <span className="w-2 h-2 rounded-full bg-red-500" title="Hay errores en esta pestaña" />
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: Contenido ─────────────────────────────────────── */}
      <div className={activeTab === "content" ? "space-y-5" : "hidden"}>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">

          {/* Estado */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2">Estado *</label>
            <div className="flex gap-4">
              {[
                { value: "draft",  label: "Borrador (oculto)" },
                { value: "active", label: "Publicar ahora (activo)" },
                { value: "paused", label: "Pausado" },
              ].map((s) => (
                <label key={s.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={s.value} {...register("status")} className="accent-primary-500" />
                  <span className="text-sm text-neutral-300">{s.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2">Título del sueño *</label>
            <input
              {...register("title")}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="El sueño de Valentina: Aprender a pintar"
            />
            {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>}
          </div>

          {/* Nombre del niño y edad */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">Nombre del niño/a *</label>
              <input
                {...register("childName")}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Valentina"
              />
              {errors.childName && <p className="text-xs text-red-400 mt-1">{errors.childName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">Edad *</label>
              <input
                {...register("childAge", { valueAsNumber: true })}
                type="number"
                min={0}
                max={17}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="7"
              />
              {errors.childAge && <p className="text-xs text-red-400 mt-1">{errors.childAge.message}</p>}
            </div>
          </div>

          {/* Descripción corta */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2">
              Descripción corta * <span className="font-normal text-neutral-600">(máx 160 caracteres — para tarjetas y resumen)</span>
            </label>
            <textarea
              {...register("shortDescription")}
              rows={2}
              maxLength={160}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Valentina sueña con aprender a pintar y expresar todo lo que lleva en su corazón."
            />
            {errors.shortDescription && <p className="text-xs text-red-400 mt-1">{errors.shortDescription.message}</p>}
          </div>

          {/* Historia */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2">
              Historia completa * <span className="font-normal text-neutral-500">(texto libre — escribe normalmente y usa Enter para separar párrafos)</span>
            </label>
            <textarea
              {...register("story")}
              rows={8}
              className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={`Escribe aquí la historia con tus propias palabras...

Puedes usar saltos de línea normales con la tecla Enter para separar párrafos libremente. No necesitas ingresar etiquetas HTML ni códigos.`}
            />
            {errors.story && <p className="text-xs text-red-400 mt-1">{errors.story.message}</p>}
          </div>

          {/* Financiero */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">Meta de recaudación (CLP) *</label>
              <input
                {...register("targetAmount", { valueAsNumber: true })}
                type="number"
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="150000"
              />
              {errors.targetAmount && <p className="text-xs text-red-400 mt-1">{errors.targetAmount.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">Fecha límite (opcional)</label>
              <input
                {...register("deadline")}
                type="date"
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Categoría y tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">Categoría *</label>
              <select
                {...register("category")}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 capitalize"
              >
                <option value="">Seleccionar…</option>
                {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
              {errors.category && <p className="text-xs text-red-400 mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">Tags <span className="font-normal text-neutral-600">(separados por coma)</span></label>
              <input
                {...register("tags")}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="pintura, arte, niña"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB: Medios ────────────────────────────────────────── */}
      <div className={activeTab === "media" ? "space-y-5" : "hidden"}>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-neutral-400">Imagen de portada *</label>
              <button
                type="button"
                onClick={() => setUseDirectUrl(!useDirectUrl)}
                className="text-xs text-primary-400 hover:text-primary-300 underline"
              >
                {useDirectUrl ? "← Subir archivo local" : "O ingresar URL directa →"}
              </button>
            </div>

            {/* Input de archivo oculto */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg, image/png, image/webp, image/avif"
              onChange={handleFileUpload}
            />

            {useDirectUrl ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      {...register("coverImageUrl")}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <LinkIcon size={15} className="absolute left-3 top-3 text-neutral-500" />
                  </div>
                </div>
                <p className="text-xs text-neutral-500">Pega un enlace público directo a una imagen JPG, PNG o WebP.</p>
              </div>
            ) : coverUrl ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-neutral-700 group bg-black/50">
                <Image src={coverUrl} alt="Portada" fill className="object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full transition-colors"
                    title="Cambiar imagen"
                  >
                    <UploadCloud size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("coverImageUrl", "", { shouldDirty: true, shouldValidate: true })}
                    className="p-3 bg-red-900/80 hover:bg-red-800 text-red-200 rounded-full transition-colors"
                    title="Quitar imagen"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="w-full h-48 border-2 border-dashed border-neutral-700 hover:border-primary-500/50 bg-neutral-950/50 hover:bg-neutral-900/50 rounded-xl flex flex-col items-center justify-center gap-3 transition-all group"
              >
                {uploadingImage ? (
                  <>
                    <Loader2 className="animate-spin text-primary-500" size={32} />
                    <span className="text-sm font-medium text-neutral-400">Subiendo imagen a Cloudinary...</span>
                  </>
                ) : (
                  <>
                    <div className="p-4 rounded-full bg-neutral-900 group-hover:bg-primary-900/20 text-neutral-400 group-hover:text-primary-400 transition-colors">
                      <UploadCloud size={32} />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-semibold text-neutral-300 block">Click para subir una imagen</span>
                      <span className="text-xs text-neutral-500 mt-1 block">JPG, PNG, WebP (Máx 10MB)</span>
                    </div>
                  </>
                )}
              </button>
            )}

            {/* Vista previa en modo URL directa */}
            {useDirectUrl && coverUrl && (
              <div className="mt-3 relative w-full h-40 rounded-xl overflow-hidden border border-neutral-700 bg-black/40">
                <Image src={coverUrl} alt="Vista previa" fill className="object-cover" />
              </div>
            )}

            {errors.coverImageUrl && <p className="text-xs text-red-400 mt-2">{errors.coverImageUrl.message}</p>}
            {uploadError && <p className="text-xs text-red-400 mt-2">{uploadError}</p>}
            <p className="text-xs text-neutral-600 mt-2">Tamaño recomendado: 1200×630px (proporción 16:9)</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2">
              Texto descriptivo de la imagen (Alt) <span className="font-normal text-neutral-600">(opcional — para accesibilidad)</span>
            </label>
            <input
              {...register("coverImageAlt")}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={`Valentina sonriendo con pinturas`}
            />
          </div>
        </div>
      </div>

      {/* ── TAB: SEO & Slug ────────────────────────────────────── */}
      <div className={activeTab === "seo" ? "space-y-5" : "hidden"}>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2">Slug (identificador en URL) *</label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 text-xs text-neutral-500 bg-neutral-800 border border-neutral-700 rounded-l-xl border-r-0">
                /suenos/
              </span>
              <input
                {...register("slug")}
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-r-xl"
                placeholder="sueno-valentina-pintora"
              />
              <button
                type="button"
                onClick={generateSlug}
                className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 text-xs rounded-xl transition-colors whitespace-nowrap"
              >
                Auto-generar
              </button>
            </div>
            {errors.slug && <p className="text-xs text-red-400 mt-1">{errors.slug.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2">Meta título SEO <span className="font-normal text-neutral-600">(máx 60 chars)</span></label>
            <input
              {...register("metaTitle")}
              maxLength={60}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Deja vacío para usar el título del sueño"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2">Meta descripción SEO <span className="font-normal text-neutral-600">(máx 160 chars)</span></label>
            <textarea
              {...register("metaDescription")}
              maxLength={160}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Deja vacío para usar la descripción corta"
            />
          </div>
        </div>
      </div>

      {/* Error al guardar */}
      {saveError && (
        <div className="flex items-start gap-3 bg-red-950/40 border border-red-800/60 rounded-xl px-4 py-3 text-sm text-red-400" role="alert">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || (mode === "edit" && !isDirty)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          {saving ? (
            <><Loader2 size={15} className="animate-spin" /> Guardando…</>
          ) : (
            <><Save size={15} /> {mode === "create" ? "Crear sueño" : "Guardar cambios"}</>
          )}
        </button>
      </div>
    </form>
  );
}
