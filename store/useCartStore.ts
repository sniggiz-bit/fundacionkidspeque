/**
 * store/useCartStore.ts
 * ─────────────────────────────────────────────────────────────────
 * Estado global del carrito de la tienda solidaria.
 * Persiste en localStorage para no perder el carrito al navegar.
 */

import { create } from "zustand";
import { persist, createJSONStorage, devtools } from "zustand/middleware";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId:   string;
  variantId?:  string;
  name:        string;
  variantName?: string;
  price:       number; // CLP
  quantity:    number;
  imageUrl:    string;
  slug:        string;
}

interface CartStore {
  // ── State ────────────────────────────────────────────────────────────────
  items:        CartItem[];
  isOpen:       boolean;

  // ── Computed (derived state helpers) ─────────────────────────────────────
  totalItems:   () => number;
  totalPrice:   () => number;

  // ── Actions ──────────────────────────────────────────────────────────────
  addItem:      (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem:   (productId: string, variantId?: string) => void;
  updateQty:    (productId: string, variantId: string | undefined, qty: number) => void;
  clearCart:    () => void;
  openCart:     () => void;
  closeCart:    () => void;
  toggleCart:   () => void;
}

// ── Función identidad de item ─────────────────────────────────────────────────

function isSameItem(a: CartItem, productId: string, variantId?: string) {
  return a.productId === productId && a.variantId === variantId;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useCartStore = create<CartStore>()(
  devtools(
    persist(
      (set, get) => ({
        items:  [],
        isOpen: false,

        // Derived
        totalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
        totalPrice: () => get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),

        // Actions
        addItem: (newItem) =>
          set((state) => {
            const existing = state.items.find((i) =>
              isSameItem(i, newItem.productId, newItem.variantId)
            );
            if (existing) {
              return {
                items: state.items.map((i) =>
                  isSameItem(i, newItem.productId, newItem.variantId)
                    ? { ...i, quantity: i.quantity + (newItem.quantity ?? 1) }
                    : i
                ),
                isOpen: true, // Abrir drawer al agregar
              };
            }
            return {
              items: [...state.items, { ...newItem, quantity: newItem.quantity ?? 1 }],
              isOpen: true,
            };
          }),

        removeItem: (productId, variantId) =>
          set((state) => ({
            items: state.items.filter((i) => !isSameItem(i, productId, variantId)),
          })),

        updateQty: (productId, variantId, qty) =>
          set((state) => ({
            items:
              qty <= 0
                ? state.items.filter((i) => !isSameItem(i, productId, variantId))
                : state.items.map((i) =>
                    isSameItem(i, productId, variantId) ? { ...i, quantity: qty } : i
                  ),
          })),

        clearCart:   () => set({ items: [] }),
        openCart:    () => set({ isOpen: true }),
        closeCart:   () => set({ isOpen: false }),
        toggleCart:  () => set((s) => ({ isOpen: !s.isOpen })),
      }),
      {
        name:    "kidspeque-cart",
        storage: createJSONStorage(() =>
          typeof window !== "undefined" ? localStorage : sessionStorage
        ),
      }
    ),
    { name: "CartStore" }
  )
);
