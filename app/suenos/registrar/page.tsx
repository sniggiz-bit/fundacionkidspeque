/**
 * /suenos/registrar — Formulario público para proponer/registrar un nuevo sueño
 * ─────────────────────────────────────────────────────────────────
 * Genera la página donde representantes, padres o colaboradores proponen un sueño.
 */

import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PublicDreamForm } from "@/components/PublicDreamForm";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Registra un Sueño | Fundación Kidspeque",
  description:
    "Comparte la historia de un niño o niña que sueña en grande. Completa el formulario para que podamos ayudar a hacerlo realidad.",
  openGraph: {
    title: "Registra un Sueño en Fundación Kidspeque",
    description: "Ayúdanos a cumplir más sueños creativos e inspiradores a lo largo de Chile.",
  },
};

export default function RegistrarSuenoPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-neutral-50 pb-20 pt-10">
        
        {/* Encabezado decorativo */}
        <div className="max-w-3xl mx-auto text-center px-4 sm:px-6 mb-10 pt-16">
          <span className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 shadow-sm">
            <Sparkles size={12} className="text-violet-600 animate-pulse" /> Propón un Sueño
          </span>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-neutral-900 leading-tight mb-3">
            Cuéntanos tu historia
          </h1>
          <p className="text-neutral-600 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            ¿Conoces a un niño o niña con un sueño creativo? Completa el formulario para postularlo y comenzar la campaña de crowdfunding.
          </p>
        </div>

        {/* Formulario */}
        <div className="px-4 sm:px-6">
          <PublicDreamForm />
        </div>

      </main>

      <Footer />
    </>
  );
}
