/**
 * components/CartDrawer.tsx
 * ─────────────────────────────────────────────────────────────────
 * Drawer lateral del carrito. Se abre desde el ícono de la Navbar.
 * Accesible: focus trap, Esc para cerrar, aria-modal.
 */

"use client";

import { useEffect, useRef } from "react";
import Image      from "next/image";
import Link       from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Heart } from "lucide-react";
import { useCartStore }  from "@/store/useCartStore";

// ── Formato CLP ───────────────────────────────────────────────────────────────

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
  }).format(n);
}

// ── Componente ────────────────────────────────────────────────────────────────

export function CartDrawer() {
  const {
    items, isOpen, closeCart,
    removeItem, updateQty,
    totalItems, totalPrice,
  } = useCartStore();

  const overlayRef = useRef<HTMLDivElement>(null);
  const closeRef   = useRef<HTMLButtonElement>(null);

  // Focus trap y tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden"; // Bloquear scroll del body

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeCart]);

  const isEmpty    = items.length === 0;
  const itemCount  = totalItems();
  const cartTotal  = totalPrice();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay oscuro */}
          <motion.div
            ref={overlayRef}
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={closeCart}
            aria-hidden="true"
          />

          {/* Panel del carrito */}
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Carrito de compras"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
          >
            {/* Header del drawer */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-primary-600" aria-hidden />
                <h2 className="font-display font-bold text-lg text-neutral-900">
                  Tu carrito
                </h2>
                {!isEmpty && (
                  <span className="badge-primary text-xs">{itemCount}</span>
                )}
              </div>
              <button
                ref={closeRef}
                onClick={closeCart}
                className="p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Cerrar carrito"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto">
              {isEmpty ? (
                /* Carrito vacío */
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-5">
                    <ShoppingBag size={32} className="text-neutral-300" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-neutral-800 mb-2">
                    Tu carrito está vacío
                  </h3>
                  <p className="text-sm text-neutral-500 mb-6 max-w-xs">
                    Agrega productos de nuestra tienda solidaria. El 100% del beneficio va a los niños.
                  </p>
                  <button onClick={closeCart} className="btn-primary text-sm px-6">
                    Explorar tienda
                  </button>
                </div>
              ) : (
                /* Lista de items */
                <ul className="divide-y divide-neutral-100" role="list" aria-label="Productos en el carrito">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.li
                        key={`${item.productId}-${item.variantId ?? ""}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-4 px-5 py-4"
                      >
                        {/* Imagen del producto */}
                        <div className="relative w-18 h-18 flex-shrink-0 rounded-xl overflow-hidden bg-neutral-100">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            sizes="72px"
                            className="object-cover"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-neutral-900 leading-snug line-clamp-2">
                            {item.name}
                          </p>
                          {item.variantName && (
                            <p className="text-xs text-neutral-500 mt-0.5">{item.variantName}</p>
                          )}
                          <p className="font-bold text-primary-700 text-sm mt-1">
                            {formatCLP(item.price)}
                          </p>

                          {/* Controles de cantidad */}
                          <div className="flex items-center gap-2 mt-2">
                            <div
                              className="flex items-center gap-1 border border-neutral-200 rounded-lg"
                              role="group"
                              aria-label={`Cantidad de ${item.name}`}
                            >
                              <button
                                onClick={() => updateQty(item.productId, item.variantId, item.quantity - 1)}
                                className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
                                aria-label="Quitar uno"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="w-8 text-center text-sm font-semibold text-neutral-800" aria-live="polite">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQty(item.productId, item.variantId, item.quantity + 1)}
                                className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
                                aria-label="Agregar uno"
                              >
                                <Plus size={13} />
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(item.productId, item.variantId)}
                              className="ml-auto text-neutral-400 hover:text-error transition-colors p-1 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-error"
                              aria-label={`Eliminar ${item.name}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Subtotal */}
                        <p className="text-sm font-bold text-neutral-800 flex-shrink-0">
                          {formatCLP(item.price * item.quantity)}
                        </p>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* Footer con total y CTA */}
            {!isEmpty && (
              <div className="border-t border-neutral-200 p-5 space-y-4 bg-neutral-50">
                {/* Impacto */}
                <div className="flex items-center gap-2 text-xs text-neutral-600 bg-accent-50 border border-accent-100 rounded-xl px-3 py-2">
                  <Heart size={13} className="text-accent-500 fill-accent-500 flex-shrink-0" aria-hidden />
                  100% del beneficio de tu compra va a la fundación.
                </div>

                {/* Resumen */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal ({itemCount} productos)</span>
                    <span>{formatCLP(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Envío</span>
                    <span className="text-success font-semibold">Gratis ✓</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-neutral-200">
                    <span className="text-neutral-900">Total</span>
                    <span className="text-primary-700">{formatCLP(cartTotal)}</span>
                  </div>
                </div>

                {/* Ir al checkout */}
                <Link
                  href="/tienda/checkout"
                  onClick={closeCart}
                  className="btn-cta w-full py-3.5 text-base"
                >
                  Finalizar compra
                  <ArrowRight size={16} aria-hidden />
                </Link>

                <button
                  onClick={closeCart}
                  className="w-full text-sm text-neutral-500 hover:text-neutral-700 transition-colors text-center py-1"
                >
                  Seguir comprando
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
