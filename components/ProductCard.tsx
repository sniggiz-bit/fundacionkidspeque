"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Heart } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import type { Product, ProductVariant } from "@prisma/client";

type ProductWithVariants = Product & { variants: ProductVariant[] };

const CATEGORY_LABELS: Record<string, string> = {
  ropa_organica: "Ropa Orgánica",
  delantales: "Delantales",
  pantalones: "Pantalones",
  accesorios: "Accesorios",
  kits: "Kits Creativos",
};

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function ProductCard({
  product,
  index = 0,
}: {
  product: ProductWithVariants;
  index?: number;
}) {
  const { addItem, openCart } = useCartStore();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants[0] ?? null
  );
  const [adding, setAdding] = useState(false);

  const images = product.images as Array<{ url: string; alt: string; isPrimary: boolean }>;
  const primaryImg = images.find((i) => i.isPrimary) ?? images[0];
  const hoverImg = images[1];
  
  const finalPrice = selectedVariant?.price ?? product.price;
  const inStock = selectedVariant ? selectedVariant.stock > 0 : product.stock > 0;
  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : null;

  const handleAddToCart = () => {
    if (!inStock || adding) return;
    setAdding(true);

    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      variantName: selectedVariant
        ? Object.entries(selectedVariant.attributes as Record<string, string>)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" · ")
        : undefined,
      price: finalPrice,
      imageUrl: primaryImg?.url ?? "/placeholder-product.jpg",
      slug: product.slug,
    });

    setTimeout(() => {
      setAdding(false);
      openCart();
    }, 600);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="card p-0 overflow-hidden group flex flex-col h-full relative"
      aria-labelledby={`prod-${product.id}`}
    >
      <Link 
        href={`/tienda/productos/${product.slug}`} 
        className="absolute inset-0 z-0 outline-none rounded-2xl" 
        aria-label={`Ver detalles de ${product.name}`} 
      />

      {/* Imagen con hover */}
      <div className="relative h-56 overflow-hidden bg-neutral-100 pointer-events-none">
        {primaryImg ? (
          <Image
            src={primaryImg.url}
            alt={primaryImg.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={`object-cover transition-all duration-500 ${hoverImg ? "group-hover:opacity-0" : "group-hover:scale-105"}`}
          />
        ) : (
          <div className="w-full h-full bg-neutral-200 flex items-center justify-center text-neutral-400">
            Sin foto
          </div>
        )}
        
        {hoverImg && (
          <Image
            src={hoverImg.url}
            alt={hoverImg.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isFeatured && (
            <span className="badge bg-accent-500 text-white text-[10px] font-bold shadow-sm">Destacado</span>
          )}
          {discount && (
            <span className="badge bg-error text-white text-[10px] font-bold shadow-sm">-{discount}%</span>
          )}
          {!inStock && (
            <span className="badge bg-neutral-800 text-white text-[10px] shadow-sm">Sin stock</span>
          )}
        </div>

        {/* Wishlist decorativo */}
        <button
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-soft opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 relative z-10 pointer-events-auto"
          aria-label={`Guardar ${product.name}`}
        >
          <Heart size={14} className="text-neutral-500 hover:text-error transition-colors" />
        </button>
      </div>

      {/* Contenido */}
      <div className="flex flex-col flex-1 p-4 gap-3 pointer-events-none bg-white">
        <div>
          <span className="text-[10px] font-semibold text-primary-600 uppercase tracking-wider">
            {CATEGORY_LABELS[product.category] ?? product.category}
          </span>
          <h3
            id={`prod-${product.id}`}
            className="font-display font-bold text-sm text-neutral-900 mt-0.5 leading-snug line-clamp-2 group-hover:text-primary-700 transition-colors"
          >
            {product.name}
          </h3>
          <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        {/* Impacto */}
        <div className="flex items-center gap-1.5 text-[11px] text-accent-700 bg-accent-50 rounded-lg px-2.5 py-1.5">
          <Heart size={11} className="fill-accent-500 text-accent-500" aria-hidden />
          <span className="line-clamp-1">{product.impactDescription}</span>
        </div>

        {/* Selector de variantes */}
        {product.variants && product.variants.length > 0 && (
          <div className="relative z-10 pointer-events-auto mt-1">
            <p className="text-[10px] font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Variante</p>
            <div className="flex flex-wrap gap-1.5">
              {product.variants.map((v) => {
                const attrs = v.attributes as Record<string, string>;
                const label = Object.values(attrs).join(" · ");
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    disabled={v.stock === 0}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                      selectedVariant?.id === v.id
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : v.stock === 0
                        ? "border-neutral-200 text-neutral-300 line-through cursor-not-allowed"
                        : "border-neutral-200 text-neutral-700 hover:border-neutral-400 bg-white"
                    }`}
                    aria-pressed={selectedVariant?.id === v.id}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Precio y CTA */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-neutral-100 gap-2 relative z-10 pointer-events-auto">
          <div>
            {product.compareAtPrice && (
              <p className="text-xs text-neutral-400 line-through leading-none mb-0.5">
                {formatCLP(product.compareAtPrice)}
              </p>
            )}
            <p className="font-display font-extrabold text-lg text-neutral-900 leading-none">
              {formatCLP(finalPrice)}
            </p>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!inStock || adding}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 flex-shrink-0 ${
              !inStock
                ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                : adding
                ? "bg-success text-white scale-95"
                : "bg-accent-500 hover:bg-accent-600 active:scale-95 text-white shadow-sm"
            }`}
            aria-label={inStock ? `Agregar ${product.name} al carrito` : "Sin stock"}
          >
            {adding ? (
              <>✓ Agregado</>
            ) : (
              <><ShoppingBag size={15} aria-hidden /> Agregar</>
            )}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
