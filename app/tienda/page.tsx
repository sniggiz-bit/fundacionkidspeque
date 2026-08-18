/**
 * /tienda — Catálogo completo de la tienda solidaria
 * ─────────────────────────────────────────────────────────────────
 * SSG con revalidación cada 5 minutos.
 * Filtros por categoría, ordenación y búsqueda en el cliente.
 */

import type { Metadata } from "next";
import { Suspense }      from "react";
import { Navbar }        from "@/components/Navbar";
import { Footer }        from "@/components/Footer";
import { CartDrawer }    from "@/components/CartDrawer";
import { StoreCatalog }  from "@/components/StoreCatalog";
import { db }            from "@/lib/db";
import { Leaf, Shield, Truck, RotateCcw } from "lucide-react";

export const metadata: Metadata = {
  title:       "Tienda Solidaria | Fundación Kidspeque",
  description: "Compra ropa y productos creativos para niños. El 100% del beneficio financia los sueños de la fundación.",
  openGraph: {
    title:       "Tienda Solidaria Kidspeque — Compra con propósito",
    description: "Ropa orgánica, delantales y más. 100% del beneficio va a los niños.",
  },
};

export const dynamic = 'force-dynamic';

// ── Datos ─────────────────────────────────────────────────────────────────────

async function getProducts() {
  return db.product.findMany({
    where:   { isActive: true },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    include: { variants: true },
  });
}

// ── Sellos de confianza ───────────────────────────────────────────────────────

const TRUST_BADGES = [
  { icon: <Leaf    size={18} className="text-green-500"   />, label: "Materiales ecológicos"      },
  { icon: <Shield  size={18} className="text-primary-500" />, label: "Pago 100% seguro"            },
  { icon: <Truck   size={18} className="text-accent-500"  />, label: "Envío gratis a todo Chile"   },
  { icon: <RotateCcw size={18} className="text-neutral-500"/>, label: "Cambios en 30 días"         },
] as const;

// ── Página ────────────────────────────────────────────────────────────────────

export default async function TiendaPage() {
  const products = await getProducts();

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className="min-h-screen bg-neutral-50">

        {/* Hero de tienda */}
        <div className="bg-white border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <span className="section-tag">Tienda Solidaria</span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 leading-tight mb-4">
              Compra con <span className="text-gradient">propósito real</span>
            </h1>
            <p className="text-neutral-600 max-w-xl mx-auto text-lg">
              Cada producto que compras financia directamente los sueños de niños y niñas.
              El <strong>100% del beneficio</strong> va a la fundación.
            </p>

            {/* Sellos */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
              {TRUST_BADGES.map((b) => (
                <span key={b.label} className="flex items-center gap-2 text-sm text-neutral-600">
                  {b.icon}
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Catálogo con filtros */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Suspense fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card p-0 overflow-hidden">
                  <div className="skeleton h-52 rounded-none" />
                  <div className="p-4 space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-4 w-1/2" />
                    <div className="skeleton h-10 w-full rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          }>
            <StoreCatalog products={products} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </>
  );
}
