/**
 * /admin/productos — Gestión del catálogo de productos de la tienda
 */

import type { Metadata } from "next";
import Link              from "next/link";
import Image             from "next/image";
import { db }            from "@/lib/db";
import { Plus, Package } from "lucide-react";

export const metadata: Metadata = { title: "Productos" };
export const dynamic = 'force-dynamic';

function fCLP(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
  }).format(n);
}

const CATEGORY_LABELS: Record<string, string> = {
  ropa_organica: "Ropa orgánica",
  delantales:    "Delantales",
  pantalones:    "Pantalones",
  accesorios:    "Accesorios",
  kits:          "Kits",
};

export default async function AdminProductosPage({
  searchParams,
}: { searchParams: { category?: string; active?: string; page?: string } }) {

  const categoryFilter = searchParams.category;
  const activeFilter   = searchParams.active;
  const page  = Math.max(1, Number(searchParams.page ?? 1));
  const limit = 20;

  const where = {
    ...(categoryFilter ? { category: categoryFilter as "ropa_organica" } : {}),
    ...(activeFilter !== undefined ? { isActive: activeFilter === "true" } : {}),
  };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    db.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Productos</h1>
          <p className="text-neutral-500 text-sm mt-0.5">{total} productos</p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> Nuevo producto
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-5">
        <Link href="/admin/productos"
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            !categoryFilter && !activeFilter
              ? "bg-primary-600 text-white"
              : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
          }`}>
          Todos
        </Link>
        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
          <Link key={value}
            href={`/admin/productos?category=${value}`}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              categoryFilter === value
                ? "bg-primary-600 text-white"
                : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}>
            {label}
          </Link>
        ))}
        <span className="text-neutral-700 mx-1">|</span>
        <Link href="/admin/productos?active=true"
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeFilter === "true"
              ? "bg-green-700 text-white"
              : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
          }`}>
          Activos
        </Link>
        <Link href="/admin/productos?active=false"
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeFilter === "false"
              ? "bg-neutral-600 text-white"
              : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
          }`}>
          Inactivos
        </Link>
      </div>

      {/* Grid de productos */}
      {products.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-16 text-center">
          <Package size={40} className="text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-400 font-medium">No hay productos</p>
          <p className="text-neutral-600 text-sm mt-1">Crea el primer producto de la tienda.</p>
          <Link href="/admin/productos/nuevo"
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors mt-5">
            <Plus size={15} /> Nuevo producto
          </Link>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800">
                  {["Imagen", "Producto", "SKU", "Categoría", "Precio", "Stock", "Destacado", "Estado", "Acciones"].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {products.map((p) => {
                  const images = p.images as Array<{ url: string; alt: string }>;
                  const thumb  = images?.[0];
                  return (
                    <tr key={p.id} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="px-4 py-3.5">
                        {thumb ? (
                          <Image
                            src={thumb.url} alt={thumb.alt}
                            width={48} height={48}
                            className="rounded-lg object-cover w-12 h-12 bg-neutral-800"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center">
                            <Package size={18} className="text-neutral-600" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm text-white font-medium line-clamp-1">{p.name}</p>
                        <p className="text-xs text-neutral-500 font-mono">{p.slug}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-neutral-400">{p.sku}</td>
                      <td className="px-4 py-3.5 text-xs text-neutral-400">{CATEGORY_LABELS[p.category] ?? p.category}</td>
                      <td className="px-4 py-3.5 font-bold text-primary-400 whitespace-nowrap">{fCLP(p.price)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-sm font-semibold ${p.stock <= 5 ? "text-amber-400" : "text-neutral-300"}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {p.isFeatured
                          ? <span className="text-xs bg-accent-600/20 text-accent-400 px-2 py-0.5 rounded-full font-semibold">Sí</span>
                          : <span className="text-xs text-neutral-600">—</span>
                        }
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          p.isActive ? "bg-success/20 text-green-400" : "bg-neutral-700 text-neutral-400"
                        }`}>
                          {p.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/productos/${p.id}`}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-800">
              <p className="text-xs text-neutral-500">Página {page} de {totalPages}</p>
              <div className="flex gap-2">
                {page > 1 && <Link href={`/admin/productos?page=${page - 1}`} className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs hover:bg-neutral-700">← Anterior</Link>}
                {page < totalPages && <Link href={`/admin/productos?page=${page + 1}`} className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs hover:bg-neutral-700">Siguiente →</Link>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
