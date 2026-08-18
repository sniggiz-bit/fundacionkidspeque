/**
 * /admin/productos/[id] — Editar producto existente
 */

import type { Metadata } from "next";
import { notFound }      from "next/navigation";
import Link              from "next/link";
import { db }            from "@/lib/db";
import { ProductForm }   from "@/components/admin/ProductForm";
import { ArrowLeft }     from "lucide-react";

export const metadata: Metadata = { title: "Editar Producto" };
export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function EditProductoPage({ params }: PageProps) {
  const product = await db.product.findUnique({
    where: { id: params.id },
  });

  if (!product) notFound();

  const images = product.images as Array<{ url: string; alt: string }>;
  const thumb  = images?.[0];

  const defaults = {
    name:             product.name,
    slug:             product.slug,
    description:      product.description,
    shortDescription: product.shortDescription,
    category:         product.category,
    tags:             product.tags.join(", "),
    price:            product.price,
    compareAtPrice:   product.compareAtPrice ?? undefined,
    sku:              product.sku,
    stock:            product.stock,
    imageUrl:         thumb?.url ?? "",
    imageAlt:         thumb?.alt ?? "",
    impactDescription: product.impactDescription,
    isActive:         product.isActive,
    isFeatured:       product.isFeatured,
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/productos"
          className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <ArrowLeft size={16} /> Volver
        </Link>
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Editar producto</h1>
          <p className="text-neutral-500 text-sm mt-0.5 font-mono">{product.sku}</p>
        </div>
      </div>

      {/* Métricas de inventario */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Precio",    value: new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(product.price) },
          { label: "Stock",     value: String(product.stock) },
          { label: "Estado",    value: product.isActive ? "Activo" : "Inactivo" },
        ].map((m) => (
          <div key={m.label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <p className="text-xs text-neutral-500">{m.label}</p>
            <p className="font-display font-bold text-lg text-white mt-0.5">{m.value}</p>
          </div>
        ))}
      </div>

      <ProductForm mode="edit" productId={params.id} defaults={defaults} />
    </div>
  );
}
