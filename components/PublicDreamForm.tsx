"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send, AlertCircle, Upload, CheckCircle, Image as ImageIcon } from "lucide-react";

// ── Schema de Validación ──────────────────────────────────────────────────────

const dreamSchema = z.object({
  title:            z.string().min(10, "El título debe tener al menos 10 caracteres").max(200),
  childName:        z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  childAge:         z.number().int().min(0, "La edad no puede ser negativa").max(17, "La edad máxima es 17 años"),
  shortDescription: z.string().min(20, "La descripción corta debe tener al menos 20 caracteres").max(160, "Máximo 160 caracteres"),
  story:            z.string().min(100, "Cuéntanos una historia de al menos 100 caracteres"),
  targetAmount:     z.number().int().min(10000, "La meta mínima es de $10.000 CLP"),
  category:         z.string().min(1, "Selecciona una categoría"),
  coverImageUrl:    z.string().url("Debes cargar una imagen de portada"),
  coverImageAlt:    z.string().min(5, "Describe la imagen para accesibilidad"),
  slug:             z.string().min(5).max(250).regex(/^[a-z0-9-]+$/, "Slug inválido"),
});

type DreamFormData = z.infer<typeof dreamSchema>;

const CATEGORIES = [
  "arte", "educación", "salud", "deporte", "música",
  "danza", "teatro", "tecnología", "naturaleza", "otro",
];

export function PublicDreamForm() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DreamFormData>({
    resolver: zodResolver(dreamSchema),
    defaultValues: {
      childAge: 8,
      targetAmount: 150000,
      coverImageUrl: "",
      coverImageAlt: "Imagen de portada del sueño",
    },
  });

  const titleValue = watch("title");
  const coverImageUrlValue = watch("coverImageUrl");

  // Generar slug automáticamente al escribir el título
  useEffect(() => {
    if (!titleValue) return;
    const slug = titleValue
      .toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 200);
    setValue("slug", slug, { shouldValidate: true });
  }, [titleValue, setValue]);

  // Manejar subida de archivo
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/public", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Error al subir la imagen");
      }

      setValue("coverImageUrl", json.data.url, { shouldValidate: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al subir imagen";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: DreamFormData) => {
    setSubmitError(null);
    try {
      const res = await fetch("/api/dreams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) {
        const msg = json.error?.message ?? json.error ?? "Error al registrar el sueño. Intenta de nuevo.";
        throw new Error(msg);
      }

      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al enviar formulario";
      setSubmitError(msg);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-xl p-8 md:p-12 text-center max-w-2xl mx-auto space-y-6">
        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner animate-bounce">
          🎉
        </div>
        <h2 className="font-display font-extrabold text-3xl text-neutral-900 leading-tight">
          ¡Sueño Registrado con Éxito!
        </h2>
        <p className="text-neutral-600 leading-relaxed max-w-md mx-auto">
          Gracias por compartir esta hermosa historia. El sueño ha sido guardado como borrador y nuestro equipo de moderación lo revisará pronto. Te notificaremos al correo una vez que sea publicado.
        </p>
        <div className="pt-4">
          <button
            onClick={() => router.push("/suenos")}
            className="btn-primary px-8 py-3.5 rounded-2xl font-bold"
          >
            Ver otros sueños
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-3xl border border-neutral-100 shadow-xl p-6 md:p-10 max-w-3xl mx-auto space-y-8">
      
      {/* Sección 1: El Sueño */}
      <div className="space-y-5">
        <h3 className="font-display font-bold text-lg text-violet-800 border-b border-violet-100 pb-2 flex items-center gap-2">
          <span>✨</span> Datos del Sueño
        </h3>
        
        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Título del Sueño *</label>
          <input
            {...register("title")}
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-neutral-800 transition-colors text-sm"
            placeholder="Ej: Un taller de pintura y atriles para Sofía"
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Categoría *</label>
            <select
              {...register("category")}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-neutral-800 transition-colors text-sm bg-white capitalize"
            >
              <option value="">Seleccionar categoría…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Meta Estimada (CLP) *</label>
            <input
              {...register("targetAmount", { valueAsNumber: true })}
              type="number"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-neutral-800 transition-colors text-sm"
              placeholder="150000"
            />
            {errors.targetAmount && <p className="text-xs text-red-500 mt-1">{errors.targetAmount.message}</p>}
          </div>
        </div>
      </div>

      {/* Sección 2: El Niño o Niña */}
      <div className="space-y-5">
        <h3 className="font-display font-bold text-lg text-violet-800 border-b border-violet-100 pb-2 flex items-center gap-2">
          <span>👶</span> Historia del Niño o Niña
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Nombre del Niño/a *</label>
            <input
              {...register("childName")}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-neutral-800 transition-colors text-sm"
              placeholder="Sofía"
            />
            {errors.childName && <p className="text-xs text-red-500 mt-1">{errors.childName.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Edad *</label>
            <input
              {...register("childAge", { valueAsNumber: true })}
              type="number"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-neutral-800 transition-colors text-sm"
              placeholder="8"
            />
            {errors.childAge && <p className="text-xs text-red-500 mt-1">{errors.childAge.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Resumen corto * (máx 160 caracteres)</label>
          <textarea
            {...register("shortDescription")}
            rows={2}
            maxLength={160}
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-neutral-800 transition-colors text-sm resize-none"
            placeholder="Sofía tiene 8 años y sueña con recibir atriles y acuarelas para plasmar su creatividad..."
          />
          {errors.shortDescription && <p className="text-xs text-red-500 mt-1">{errors.shortDescription.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Cuéntanos la historia completa *</label>
          <textarea
            {...register("story")}
            rows={6}
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-neutral-800 transition-colors text-sm resize-y"
            placeholder="Escribe en detalle la historia de este sueño, qué motiva al niño o niña y cómo este aporte cambiará su vida..."
          />
          {errors.story && <p className="text-xs text-red-500 mt-1">{errors.story.message}</p>}
        </div>
      </div>

      {/* Sección 3: Imagen de Portada */}
      <div className="space-y-5">
        <h3 className="font-display font-bold text-lg text-violet-800 border-b border-violet-100 pb-2 flex items-center gap-2">
          <span>🖼️</span> Imagen de Portada
        </h3>

        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Cargar Foto de Portada *</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-neutral-300 rounded-2xl hover:border-violet-400 transition-colors relative bg-neutral-50/50">
            {coverImageUrlValue ? (
              <div className="text-center space-y-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImageUrlValue}
                  alt="Vista previa"
                  className="mx-auto h-40 w-auto rounded-xl object-cover border shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setValue("coverImageUrl", "", { shouldValidate: true })}
                  className="text-xs font-semibold text-red-600 hover:text-red-800"
                >
                  Eliminar imagen y cargar otra
                </button>
              </div>
            ) : (
              <div className="space-y-1 text-center">
                {uploading ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
                    <p className="text-sm font-medium text-neutral-600">Subiendo imagen a Cloudinary...</p>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="mx-auto h-12 w-12 text-neutral-400" />
                    <div className="flex text-sm text-neutral-600 justify-center">
                      <label className="relative cursor-pointer bg-white rounded-md font-semibold text-violet-600 hover:text-violet-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-violet-500">
                        <span>Sube una imagen</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-neutral-500">PNG, JPG, WebP hasta 3MB (Recomendado 16:9)</p>
                  </>
                )}
              </div>
            )}
          </div>
          {errors.coverImageUrl && <p className="text-xs text-red-500 mt-1">{errors.coverImageUrl.message}</p>}
          {uploadError && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {uploadError}</p>}
        </div>

        {/* Input oculto para que Zod valide */}
        <input type="hidden" {...register("coverImageUrl")} />
        <input type="hidden" {...register("slug")} />
      </div>

      {/* Mensaje de error general de submit */}
      {submitError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700" role="alert">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t border-neutral-100">
        <button
          type="button"
          onClick={() => router.push("/suenos")}
          className="px-6 py-3 rounded-2xl text-sm font-semibold text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || uploading}
          className="btn-cta text-sm px-6 py-3 flex items-center gap-2"
        >
          {isSubmitting ? (
            <><Loader2 size={16} className="animate-spin" /> Enviando...</>
          ) : (
            <><Send size={16} /> Registrar Sueño</>
          )}
        </button>
      </div>

    </form>
  );
}
