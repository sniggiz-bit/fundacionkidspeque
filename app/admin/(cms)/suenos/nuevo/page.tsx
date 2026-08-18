/**
 * /admin/suenos/nuevo — Formulario para crear un nuevo sueño
 */

import type { Metadata } from "next";
import { DreamForm }     from "@/components/admin/DreamForm";

export const metadata: Metadata = { title: "Nuevo Sueño" };

export default function NuevoSuenoPage() {
  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-white">Crear nuevo sueño</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Completa los datos del sueño para publicarlo en la plataforma.
        </p>
      </div>
      <DreamForm mode="create" />
    </div>
  );
}
