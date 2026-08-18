/**
 * /tienda/checkout — Página de checkout de la tienda solidaria
 * ─────────────────────────────────────────────────────────────────
 * Formulario de datos de envío + resumen del carrito + pago con Webpay/Flow.
 */

import type { Metadata } from "next";
import { Navbar }   from "@/components/Navbar";
import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata: Metadata = {
  title:  "Checkout | Tienda Kidspeque",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-neutral-50 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-2xl font-bold text-neutral-900 mb-8">
            Finalizar compra
          </h1>
          <CheckoutForm />
        </div>
      </main>
    </>
  );
}
