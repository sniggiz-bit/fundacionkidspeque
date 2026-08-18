"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import type { Product, ProductVariant } from "@prisma/client";

type ProductWithVariants = Product & { variants: ProductVariant[] };

interface ProductClientViewProps {
  product: ProductWithVariants;
}

export function ProductClientView({ product }: ProductClientViewProps) {
  const { addItem, openCart } = useCartStore();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants[0] ?? null
  );
  const [adding, setAdding] = useState(false);

  const images = product.images as Array<{ url: string; alt: string; isPrimary: boolean }>;
  const primaryImg = images.find((i) => i.isPrimary) ?? images[0];
  
  const finalPrice = selectedVariant?.price ?? product.price;
  const inStock = selectedVariant ? selectedVariant.stock > 0 : product.stock > 0;

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

  const formatCLP = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div>
      {/* Selector de Variantes */}
      {product.variants.length > 0 && (
        <div className="mb-8">
          <h4 className="text-sm font-semibold text-neutral-900 mb-3">Selecciona una opción</h4>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const attrs = v.attributes as Record<string, string>;
              const label = Object.values(attrs).join(" · ");
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  disabled={v.stock === 0}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    selectedVariant?.id === v.id
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : v.stock === 0
                      ? "border-neutral-100 bg-neutral-50 text-neutral-400 cursor-not-allowed opacity-60"
                      : "border-neutral-200 text-neutral-700 hover:border-neutral-300 bg-white hover:bg-neutral-50"
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

      {/* Precio y Botón Agregar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 bg-neutral-50 rounded-2xl border border-neutral-200">
        <div className="flex-1">
          {product.compareAtPrice && (
            <p className="text-sm text-neutral-400 line-through mb-1">
              {formatCLP(product.compareAtPrice)}
            </p>
          )}
          <p className="font-display text-4xl font-extrabold text-neutral-900">
            {formatCLP(finalPrice)}
          </p>
          <p className={`text-sm mt-2 font-medium ${inStock ? "text-success" : "text-error"}`}>
            {inStock ? "✓ Disponible en stock" : "✗ Producto agotado"}
          </p>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!inStock || adding}
          className={`flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold transition-all duration-200 sm:min-w-[200px] ${
            !inStock
              ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
              : adding
              ? "bg-success text-white scale-95"
              : "bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-500/30"
          }`}
        >
          {adding ? (
            <>✓ Agregado con éxito</>
          ) : !inStock ? (
            <>Agotado</>
          ) : (
            <>
              <ShoppingBag size={20} />
              Agregar al Carrito
            </>
          )}
        </button>
      </div>
    </div>
  );
}
