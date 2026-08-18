/**
 * components/admin/ProductForm.tsx
 * Formulario para crear y editar productos de la tienda.
 */

"use client";

import { useState, useRef, useEffect }    from "react";
import { useRouter }   from "next/navigation";
import { useForm }     from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z }           from "zod";
import { Loader2, Save, UploadCloud, X } from "lucide-react";
import Image from "next/image";

// ── Schema ─────────────────────────────────────────────────────────────────────

const productSchema = z.object({
  name:             z.string().min(3, "Nombre muy corto").max(200),
  slug:             z.string().min(3).max(250).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  description:      z.string().min(20, "Descripción muy corta"),
  shortDescription: z.string().min(10).max(120, "Máximo 120 caracteres"),
  category:         z.string().min(1, "Selecciona una categoría"),
  tags:             z.string(), // CSV
  price:            z.number().int().min(1000, "Precio mínimo: $1.000 CLP"),
  compareAtPrice:   z.number().int().optional(),
  sku:              z.string().min(1, "SKU requerido").max(100),
  stock:            z.number().int().min(0),
  imageUrl:         z.string().url("URL de imagen inválida"),
  imageAlt:         z.string().min(3),
  impactDescription: z.string().min(10, "Describe el impacto social del producto"),
  isActive:         z.boolean().default(true),
  isFeatured:       z.boolean().default(false),
});

type ProductFormData = z.infer<typeof productSchema>;

const DEFAULT_CATEGORIES = [
  { value: "ropa_organica", label: "Ropa Orgánica" },
  { value: "delantales",    label: "Delantales" },
  { value: "pantalones",    label: "Pantalones" },
  { value: "accesorios",    label: "Accesorios" },
  { value: "kits",          label: "Kits creativos" },
];

interface Props {
  mode:       "create" | "edit";
  productId?: string;
  defaults?:  Partial<ProductFormData>;
}

export function ProductForm({ mode, productId, defaults }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError,    setUploadError]    = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categoriesList, setCategoriesList] = useState<Array<{ value: string; label: string }>>(DEFAULT_CATEGORIES);

  useEffect(() => {
    fetch("/api/settings/public")
      .then((res) => res.json())
      .then((json) => {
        if (json?.success && json?.data?.productCategories && Array.isArray(json.data.productCategories)) {
          const loaded = json.data.productCategories.map((c: { slug: string; name: string }) => ({
            value: c.slug,
            label: c.name,
          }));
          setCategoriesList(loaded);
        }
      })
      .catch(() => {});
  }, []);

  const { register, handleSubmit, watch, setValue, formState: { errors, isDirty } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      isActive:   true,
      isFeatured: false,
      stock:      0,
      category:   "ropa_organica",
      ...defaults,
    },
  });

  const nameValue = watch("name");
  const imageUrl  = watch("imageUrl");

  // Upload de imagen a Cloudinary vía API route
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file",   file);
    formData.append("folder", "products");

    try {
      const res  = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) {
        setUploadError(json.error ?? "Error al subir la imagen");
      } else {
        setValue("imageUrl", json.data.url, { shouldValidate: true, shouldDirty: true });
      }
    } catch {
      setUploadError("Error de conexión al subir la imagen.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const generateSlug = () => {
    if (!nameValue) return;
    const slug = nameValue
      .toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 200);
    setValue("slug", slug, { shouldValidate: true });
  };

  const onSubmit = async (data: ProductFormData) => {
    setSaving(true);
    const tags   = data.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const images = [{ url: data.imageUrl, alt: data.imageAlt, width: 800, height: 800 }];

    const { imageUrl, imageAlt, tags: _tags, ...rest } = data;

    try {
      const endpoint = mode === "create" ? "/api/admin/products" : `/api/admin/products/${productId}`;
      const method   = mode === "create" ? "POST" : "PUT";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rest, tags, images }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message ?? "Error al guardar");
      }

      router.push("/admin/productos");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error al guardar");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

      {/* Información básica */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
        <h2 className="font-semibold text-white text-sm uppercase tracking-wider text-neutral-400">Información básica</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2">Estado</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register("isActive")} className="accent-primary-500" />
                <span className="text-sm text-neutral-300">Activo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register("isFeatured")} className="accent-accent-500" />
                <span className="text-sm text-neutral-300">Destacado</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2">Categoría *</label>
            <select {...register("category")} className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              {categoriesList.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {errors.category && <p className="text-xs text-red-400 mt-1">{errors.category.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-400 mb-2">Nombre del producto *</label>
          <input {...register("name")} className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Delantal Antimanchas Creativo" />
          {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-400 mb-2">Slug (URL) *</label>
          <div className="flex gap-2">
            <span className="flex items-center px-3 text-xs text-neutral-500 bg-neutral-800 border border-neutral-700 rounded-l-xl border-r-0">/tienda/</span>
            <input {...register("slug")} className="flex-1 px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-r-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="delantal-antimanchas-creativo" />
            <button type="button" onClick={generateSlug}
              className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 text-xs rounded-xl transition-colors whitespace-nowrap">
              Auto-generar
            </button>
          </div>
          {errors.slug && <p className="text-xs text-red-400 mt-1">{errors.slug.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-400 mb-2">Descripción corta * <span className="font-normal text-neutral-600">(máx 120 chars)</span></label>
          <textarea {...register("shortDescription")} rows={2} maxLength={120}
            className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Delantal resistente a manchas para niños creativos de 2 a 12 años." />
          {errors.shortDescription && <p className="text-xs text-red-400 mt-1">{errors.shortDescription.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-400 mb-2">Descripción completa *</label>
          <textarea {...register("description")} rows={6}
            className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 resize-y focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Descripción detallada del producto..." />
          {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-400 mb-2">Tags <span className="font-normal text-neutral-600">(separados por coma)</span></label>
          <input {...register("tags")} className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="delantal, arte, niños, ropa" />
        </div>
      </div>

      {/* Precios e inventario */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
        <h2 className="font-semibold text-white text-sm uppercase tracking-wider text-neutral-400">Precios e inventario</h2>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2">Precio (CLP) *</label>
            <input {...register("price", { valueAsNumber: true })} type="number"
              className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="18990" />
            {errors.price && <p className="text-xs text-red-400 mt-1">{errors.price.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2">Precio anterior (CLP)</label>
            <input {...register("compareAtPrice", { valueAsNumber: true })} type="number"
              className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="24990" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2">Stock *</label>
            <input {...register("stock", { valueAsNumber: true })} type="number" min={0}
              className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="50" />
            {errors.stock && <p className="text-xs text-red-400 mt-1">{errors.stock.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-400 mb-2">SKU *</label>
          <input {...register("sku")} className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="DEL-001-ROJO-M" />
          {errors.sku && <p className="text-xs text-red-400 mt-1">{errors.sku.message}</p>}
        </div>
      </div>

      {/* Imagen e impacto */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
        <h2 className="font-semibold text-white text-sm uppercase tracking-wider text-neutral-400">Imagen e impacto social</h2>

        <div>
          <label className="block text-xs font-semibold text-neutral-400 mb-2">Imagen del producto *</label>

          {/* Input oculto para la URL real */}
          <input type="hidden" {...register("imageUrl")} />

          {/* Input de archivo oculto */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFileUpload}
          />

          {imageUrl ? (
            <div className="relative w-full aspect-square max-w-xs rounded-xl overflow-hidden border border-neutral-700 group bg-black/50">
              <Image src={imageUrl} alt="Preview" fill className="object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full transition-colors">
                  <UploadCloud size={18} />
                </button>
                <button type="button" onClick={() => setValue("imageUrl", "", { shouldDirty: true, shouldValidate: true })}
                  className="p-3 bg-red-900/80 hover:bg-red-800 text-red-200 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="w-full max-w-xs aspect-square border-2 border-dashed border-neutral-700 hover:border-primary-500/50 bg-neutral-950/50 hover:bg-neutral-900/50 rounded-xl flex flex-col items-center justify-center gap-3 transition-all group"
            >
              {uploadingImage ? (
                <>
                  <Loader2 className="animate-spin text-primary-500" size={28} />
                  <span className="text-xs font-medium text-neutral-400">Subiendo...</span>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-full bg-neutral-900 group-hover:bg-primary-900/20 text-neutral-400 group-hover:text-primary-400 transition-colors">
                    <UploadCloud size={28} />
                  </div>
                  <div className="text-center px-4">
                    <span className="text-xs font-semibold text-neutral-300 block">Click para subir imagen</span>
                    <span className="text-[11px] text-neutral-500 block mt-1">JPG, PNG, WebP — Máx 5MB</span>
                    <span className="text-[11px] text-neutral-600 block">Recomendado: 800×800px</span>
                  </div>
                </>
              )}
            </button>
          )}

          {errors.imageUrl && <p className="text-xs text-red-400 mt-2">{errors.imageUrl.message}</p>}
          {uploadError    && <p className="text-xs text-red-400 mt-2">{uploadError}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-400 mb-2">Alt text imagen *</label>
          <input {...register("imageAlt")} className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Niña usando delantal de pintura" />
          {errors.imageAlt && <p className="text-xs text-red-400 mt-1">{errors.imageAlt.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-400 mb-2">Descripción de impacto social *</label>
          <textarea {...register("impactDescription")} rows={3}
            className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="El 30% de cada compra financia materiales de arte para niños en situación vulnerable." />
          {errors.impactDescription && <p className="text-xs text-red-400 mt-1">{errors.impactDescription.message}</p>}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-3 justify-end pt-2">
        <button type="button" onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-all">
          Cancelar
        </button>
        <button type="submit" disabled={saving || !isDirty}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
          {saving
            ? <><Loader2 size={15} className="animate-spin" /> Guardando…</>
            : <><Save size={15} /> {mode === "create" ? "Crear producto" : "Guardar cambios"}</>
          }
        </button>
      </div>
    </form>
  );
}
