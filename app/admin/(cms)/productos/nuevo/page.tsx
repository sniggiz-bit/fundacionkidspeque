/**
 * /admin/productos/nuevo — Crear nuevo producto
 */

import type { Metadata } from "next";
import Link              from "next/link";
import { ArrowLeft }     from "lucide-react";
import { ProductForm }   from "@/components/admin/ProductForm";

export const metadata: Metadata = { title: "Nuevo Producto" };

export default function NuevoProductoPage() {
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
          <h1 className="font-display font-bold text-2xl text-white">Nuevo producto</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Añadir un producto a la tienda solidaria</p>
        </div>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}
