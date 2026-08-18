/**
 * components/admin/DreamForm.tsx
 * ─────────────────────────────────────────────────────────────────
 * Formulario para crear y editar sueños (campañas de crowdfunding).
 * Usado en /admin/suenos/nuevo y /admin/suenos/[id].
 */

"use client";

import { useState, useRef }    from "react";
import { useRouter }   from "next/navigation";
import { useForm }     from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z }           from "zod";
import { Loader2, Save, AlertCircle, UploadCloud, X } from "lucide-react";
import Image from "next/image";

// ── Schema ────────────────────────────────────────────────────────────────────

const dreamSchema = z.object({
  title:            z.string().min(10, "Título muy corto").max(200),
  childName:        z.string().min(2).max(100),
  childAge:         z.number().int().min(0).max(17),
  shortDescription: z.string().min(20, "Descripción muy corta").max(160),
  story:            z.string().min(100, "La historia es muy corta").max(10000),
  targetAmount:     z.number().int().min(10000, "Meta mínima: $10.000 CLP"),
  category:         z.string().min(1, "Selecciona una categoría"),
  tags:             z.string(), // Separados por coma
  deadline:         z.string().optional(),
  coverImageUrl:    z.string().url("URL de imagen inválida"),
  coverImageAlt:    z.string().min(5, "Describe la imagen para accesibilidad"),
  slug:             z.string().min(5).max(250)
                     .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  metaTitle:        z.string().max(60).optional(),
  metaDescription:  z.string().max(160).optional(),
  status:           z.enum(["draft", "active", "paused"]),
});

type DreamFormData = z.infer<typeof dreamSchema>;

// ── Constantes ────────────────────────────────────────────────────────────────

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors, isDirty } } = useForm<DreamFormData>({
    resolver: zodResolver(dreamSchema),
    defaultValues: {
      status: "draft",
      childAge: 8,
      targetAmount: 150000,
      ...defaults,
    },
  });

  const titleValue = watch("title");
  const coverUrl = watch("coverImageUrl");

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
        setUploadError(json.error ?? "Error al subir la imagen");
      } else {
        setValue("coverImageUrl", json.data.url, { shouldValidate: true, shouldDirty: true });
      }
    } catch (err) {
      setUploadError("Error de conexión al subir la imagen.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Auto-generar slug desde el título
  const generateSlug = () => {
    if (!titleValue) return;
    const slug = titleValue
      .toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 200);
    setValue("slug", slug, { shouldValidate: true });
  };

  const onSubmit = async (data: DreamFormData) => {
    setSaving(true);
    setSaveError(null);
    const tags = data.tags.split(",").map((t) => t.trim()).filter(Boolean);

    try {
      const endpoint = mode === "create" ? "/api/admin/dreams" : `/api/admin/dreams/${dreamId}`;
      const method   = mode === "create" ? "POST" : "PUT";

      const res  = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...data, tags }),
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

  const TABS = [
    { id: "content", label: "Contenido"   },
    { id: "media",   label: "Medios"      },
    { id: "seo",     label: "SEO & Slug"  },
  ] as const;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-900 rounded-xl p-1 border border-neutral-800 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-neutral-800 text-white"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Contenido ─────────────────────────────────────── */}
      {activeTab === "content" && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">

          {/* Estado */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2">Estado *</label>
            <div className="flex gap-2">
              {["draft", "active", "paused"].map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={s} {...register("status")} className="accent-primary-500" />
                  <span className="text-sm text-neutral-300 capitalize">{
                    s === "draft" ? "Borrador" : s === "active" ? "Publicar ahora" : "Pausado"
                  }</span>
                </label>
              ))}
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2">Título del sueño *</label>
            <input {...register("title")} className="input-field bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500"
              placeholder="El sueño de Valentina: Aprender a pintar" />
            {errors.title && <p className="text-xs text-error mt-1">{errors.title.message}</p>}
          </div>

          {/* Nombre del niño y edad */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">Nombre del niño/a *</label>
              <input {...register("childName")} className="input-field bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500"
                placeholder="Valentina" />
              {errors.childName && <p className="text-xs text-error mt-1">{errors.childName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">Edad *</label>
              <input {...register("childAge", { valueAsNumber: true })} type="number" min={0} max={17}
                className="input-field bg-neutral-800 border-neutral-700 text-white" placeholder="7" />
              {errors.childAge && <p className="text-xs text-error mt-1">{errors.childAge.message}</p>}
            </div>
          </div>

          {/* Descripción corta */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2">
              Descripción corta * <span className="font-normal text-neutral-600">(máx 160 chars — para cards y SEO)</span>
            </label>
            <textarea {...register("shortDescription")} rows={2} maxLength={160}
              className="input-field bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500 resize-none"
              placeholder="Valentina sueña con aprender a pintar y expresar todo lo que lleva en su corazón." />
            {errors.shortDescription && <p className="text-xs text-error mt-1">{errors.shortDescription.message}</p>}
          </div>

          {/* Historia */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2">
              Historia completa * <span className="font-normal text-neutral-600">(HTML o Markdown)</span>
            </label>
            <textarea {...register("story")} rows={10}
              className="input-field bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500 resize-y font-mono text-xs"
              placeholder="<p>Valentina tiene 7 años y…</p>" />
            {errors.story && <p className="text-xs text-error mt-1">{errors.story.message}</p>}
          </div>

          {/* Financiero */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">Meta (CLP) *</label>
              <input {...register("targetAmount", { valueAsNumber: true })} type="number"
                className="input-field bg-neutral-800 border-neutral-700 text-white" placeholder="150000" />
              {errors.targetAmount && <p className="text-xs text-error mt-1">{errors.targetAmount.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">Fecha límite</label>
              <input {...register("deadline")} type="date"
                className="input-field bg-neutral-800 border-neutral-700 text-white" />
            </div>
          </div>

          {/* Categoría y tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">Categoría *</label>
              <select {...register("category")} className="input-field bg-neutral-800 border-neutral-700 text-white">
                <option value="">Seleccionar…</option>
                {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
              {errors.category && <p className="text-xs text-error mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-2">Tags <span className="font-normal text-neutral-600">(separados por coma)</span></label>
              <input {...register("tags")} className="input-field bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500"
                placeholder="pintura, arte, niña" />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Medios ────────────────────────────────────────── */}
      {activeTab === "media" && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2">Imagen de portada *</label>
            
            {/* Input oculto real de Cloudinary/Supabase */}
            <input type="hidden" {...register("coverImageUrl")} />
            
            {/* Input de archivo oculto */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg, image/png, image/webp, image/avif"
              onChange={handleFileUpload}
            />

            {coverUrl ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-neutral-700 group bg-black/50">
                <Image src={coverUrl} alt="Portada" fill className="object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full transition-colors">
                    <UploadCloud size={20} />
                  </button>
                  <button type="button" onClick={() => setValue("coverImageUrl", "", { shouldDirty: true, shouldValidate: true })} className="p-3 bg-red-900/80 hover:bg-red-800 text-red-200 rounded-full transition-colors">
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
                    <span className="text-sm font-medium text-neutral-400">Subiendo imagen...</span>
                  </>
                ) : (
                  <>
                    <div className="p-4 rounded-full bg-neutral-900 group-hover:bg-primary-900/20 text-neutral-400 group-hover:text-primary-400 transition-colors">
                      <UploadCloud size={32} />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-semibold text-neutral-300 block">Click para subir una imagen</span>
                      <span className="text-xs text-neutral-500 mt-1 block">JPG, PNG, WebP (Máx 5MB)</span>
                    </div>
                  </>
                )}
              </button>
            )}

            {errors.coverImageUrl && <p className="text-xs text-error mt-2">{errors.coverImageUrl.message}</p>}
            {uploadError && <p className="text-xs text-error mt-2">{uploadError}</p>}
            <p className="text-xs text-neutral-600 mt-2">Tamaño recomendado: 1200×630px (ratio 16:9)</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2">Alt text de la imagen * <span className="font-normal text-neutral-600">(accesibilidad)</span></label>
            <input {...register("coverImageAlt")} className="input-field bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500"
              placeholder="Valentina sonriendo con pinturas de colores" />
            {errors.coverImageAlt && <p className="text-xs text-error mt-1">{errors.coverImageAlt.message}</p>}
          </div>
        </div>
      )}

      {/* ── TAB: SEO ───────────────────────────────────────────── */}
      {activeTab === "seo" && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2">Slug (URL) *</label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 text-xs text-neutral-500 bg-neutral-800 border border-neutral-700 rounded-l-xl border-r-0">
                /suenos/
              </span>
              <input {...register("slug")} className="input-field bg-neutral-800 border-neutral-700 text-white flex-1 rounded-l-none"
                placeholder="sueno-valentina-pintora" />
              <button type="button" onClick={generateSlug}
                className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 text-xs rounded-xl transition-colors whitespace-nowrap">
                Auto-generar
              </button>
            </div>
            {errors.slug && <p className="text-xs text-error mt-1">{errors.slug.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2">Meta título SEO <span className="font-normal text-neutral-600">(máx 60 chars)</span></label>
            <input {...register("metaTitle")} maxLength={60}
              className="input-field bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500"
              placeholder="Deja vacío para usar el título del sueño" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2">Meta descripción SEO <span className="font-normal text-neutral-600">(máx 160 chars)</span></label>
            <textarea {...register("metaDescription")} maxLength={160} rows={3}
              className="input-field bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500 resize-none"
              placeholder="Deja vacío para usar la descripción corta" />
          </div>
        </div>
      )}

      {/* Error al guardar */}
      {saveError && (
        <div className="flex items-start gap-3 bg-red-950/40 border border-red-800/60 rounded-xl px-4 py-3 text-sm text-red-400" role="alert">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center gap-3 justify-end pt-2">
        <button type="button" onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-all">
          Cancelar
        </button>
        <button type="submit" disabled={saving || !isDirty}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
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
