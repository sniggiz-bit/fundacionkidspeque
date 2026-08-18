/**
 * components/StoreCatalog.tsx
 * ─────────────────────────────────────────────────────────────────
 * Catálogo de productos con filtros por categoría, búsqueda y ordenación.
 * Componente CLIENTE para interactividad de filtros sin page reload.
 */

"use client";

import { useState, useMemo } from "react";
import Image       from "next/image";
import Link        from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Star, ShoppingBag, Heart, SlidersHorizontal, X } from "lucide-react";
import { useCartStore }  from "@/store/useCartStore";
import type { Product, ProductVariant } from "@prisma/client";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type ProductWithVariants = Product & { variants: ProductVariant[] };

interface StoreCatalogProps {
  products: ProductWithVariants[];
}

// ── Formato y helpers ─────────────────────────────────────────────────────────

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
  }).format(n);
}

const CATEGORY_LABELS: Record<string, string> = {
  ropa_organica: "Ropa Orgánica",
  delantales:    "Delantales",
  pantalones:    "Pantalones",
  accesorios:    "Accesorios",
  kits:          "Kits Creativos",
};

const SORT_OPTIONS = [
  { value: "featured",   label: "Destacados"       },
  { value: "price_asc",  label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "name_asc",   label: "A → Z"             },
] as const;

import { ProductCard } from "./ProductCard";

// ── Componente Principal ──────────────────────────────────────────────────────

export function StoreCatalog({ products }: StoreCatalogProps) {
  const [query,    setQuery]    = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort,     setSort]     = useState<string>("featured");
  const [showFilters, setShowFilters] = useState(false);

  // Categorías únicas disponibles
  const categories = useMemo(
    () => ["all", ...new Set(products.map((p) => p.category))],
    [products]
  );

  // Filtrado y ordenación
  const filtered = useMemo(() => {
    let result = products
      .filter((p) => category === "all" || p.category === category)
      .filter((p) =>
        !query ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.shortDescription.toLowerCase().includes(query.toLowerCase())
      );

    switch (sort) {
      case "price_asc":  result = result.sort((a, b) => a.price - b.price);         break;
      case "price_desc": result = result.sort((a, b) => b.price - a.price);         break;
      case "name_asc":   result = result.sort((a, b) => a.name.localeCompare(b.name)); break;
      default:           result = result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return result;
  }, [products, category, query, sort]);

  return (
    <div className="space-y-6">

      {/* Barra de búsqueda + filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Búsqueda */}
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar productos…"
            className="input-field pl-10 pr-4"
            aria-label="Buscar productos"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              aria-label="Limpiar búsqueda"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Ordenación */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="input-field w-full sm:w-auto sm:min-w-48"
          aria-label="Ordenar productos"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Filtros de categoría */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            aria-pressed={category === cat}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
              category === cat
                ? "bg-primary-600 text-white shadow-soft"
                : "bg-white border border-neutral-200 text-neutral-700 hover:border-primary-300 hover:text-primary-700"
            }`}
          >
            {cat === "all" ? "Todos" : CATEGORY_LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      {/* Contador de resultados */}
      <p className="text-sm text-neutral-500" aria-live="polite">
        {filtered.length === 0
          ? "No se encontraron productos"
          : `${filtered.length} producto${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`
        }
        {category !== "all" && ` en "${CATEGORY_LABELS[category]}"`}
        {query && ` para "${query}"`}
      </p>

      {/* Grid de productos */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-neutral-600">
            No hay productos que coincidan con tu búsqueda.
          </p>
          <button
            onClick={() => { setQuery(""); setCategory("all"); }}
            className="btn-outline text-sm mt-4"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
