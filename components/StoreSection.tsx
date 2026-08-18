"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingBag, Star, Leaf, Shield, ArrowRight, Heart } from "lucide-react";

import { ProductCard } from "./ProductCard";
import type { Product, ProductVariant } from "@prisma/client";

type ProductWithVariants = Product & { variants: ProductVariant[] };

interface StoreSectionProps {
  products?: ProductWithVariants[];
}

export function StoreSection({ products = [] }: StoreSectionProps) {
  return (
    <section
      id="tienda"
      className="section bg-neutral-50"
      aria-labelledby="store-heading"
    >
      <div className="container-xl">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="section-tag">
            <ShoppingBag size={12} aria-hidden />
            Tienda de Niños Creativos
          </span>
          <h2
            id="store-heading"
            className="font-display text-3xl sm:text-4xl font-extrabold text-neutral-900 leading-tight"
          >
            Compra con propósito.{" "}
            <span className="text-gradient">100% del beneficio</span>{" "}
            va a la fundación.
          </h2>
          <p className="mt-4 text-neutral-600 max-w-xl mx-auto">
            Productos premium de calidad para los pequeños, diseñados para que
            la creatividad no tenga límites ni manchas preocupantes.
          </p>

          {/* Sellos de confianza */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5"><Leaf size={13} className="text-green-500" /> Materiales ecológicos</span>
            <span className="flex items-center gap-1.5"><Shield size={13} className="text-primary-500" /> Pago 100% seguro</span>
            <span className="flex items-center gap-1.5"><ShoppingBag size={13} className="text-accent-500" /> Envío a todo Chile</span>
          </div>
        </div>

        {/* Grid de productos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.length > 0 ? (
            products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-neutral-500">
              Cargando catálogo...
            </div>
          )}
        </div>

        {/* Ver catálogo completo */}
        <div className="text-center mt-12">
          <a href="/tienda" className="btn-primary inline-flex">
            Ver catálogo completo
            <ArrowRight size={16} aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
