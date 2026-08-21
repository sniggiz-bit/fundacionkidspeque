/**
 * /voluntariado — Formulario de registro de voluntarios
 * ─────────────────────────────────────────────────────────────────
 * SSG: contenido estático + formulario client-side.
 * Captura: nombre, email, tipo de colaborador, habilidades, disponibilidad.
 */

import type { Metadata }    from "next";
import { VolunteerForm }    from "@/components/VolunteerForm";
import { Navbar }           from "@/components/Navbar";
import { Footer }           from "@/components/Footer";
import { Heart, Shield, Users, Star } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.kidspeque.cl";

export const metadata: Metadata = {
  title: "Programa de Voluntariado y Colaboradores | Fundación Kidspeque",
  description:
    "Únete como psicólogo, terapeuta, trabajador social, artista o voluntario a la Fundación Kidspeque en Chile. Regístrate y ayuda a transformar vidas infantiles.",
  keywords: [
    "voluntariado infantil chile",
    "voluntario fundacion niños santiago",
    "psicologos voluntarios chile",
    "artistas voluntarios fundacion",
    "fundacion kidspeque voluntariado",
  ],
  alternates: {
    canonical: `${APP_URL}/voluntariado`,
  },
  openGraph: {
    title: "Programa de Voluntariado | Fundación Kidspeque",
    description: "Psicólogos, artistas, terapeutas y voluntarios que transforman vidas a través de la creatividad.",
    url: `${APP_URL}/voluntariado`,
    siteName: "Fundación Kidspeque",
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: `${APP_URL}/logo.png`,
        width: 1200,
        height: 630,
        alt: "Voluntariado Fundación Kidspeque",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Programa de Voluntariado | Fundación Kidspeque",
    description: "Súmate a nuestra red de voluntarios y profesionales en Chile.",
    images: [`${APP_URL}/logo.png`],
  },
};

const BENEFITS = [
  {
    icon: <Heart size={20} className="text-accent-500" aria-hidden />,
    title: "Impacto real",
    desc: "Cada hora que das cambia directamente la vida de un niño o niña.",
  },
  {
    icon: <Users size={20} className="text-primary-500" aria-hidden />,
    title: "Red de personas comprometidas",
    desc: "Conéctate con psicólogos, artistas y profesionales que comparten tu vocación.",
  },
  {
    icon: <Star size={20} className="text-amber-500" aria-hidden />,
    title: "Certificado de voluntariado",
    desc: "Emitimos certificados oficiales válidos para currículum y portafolio.",
  },
  {
    icon: <Shield size={20} className="text-green-500" aria-hidden />,
    title: "Proceso transparente",
    desc: "Selección responsable con verificación de antecedentes para proteger a los niños.",
  },
] as const;

export default function VoluntariadoPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-neutral-50">

        {/* Hero de la página */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block text-4xl mb-4" aria-hidden>🙋</span>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
              Únete a nuestra red de voluntarios
            </h1>
            <p className="text-primary-100 text-lg leading-relaxed max-w-xl mx-auto">
              Profesionales de la salud, artistas, educadores y personas con ganas
              de hacer el bien. Aquí, cada talento importa.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

            {/* Columna de beneficios */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-neutral-900 mb-6">
                  ¿Por qué ser voluntario/a?
                </h2>
                <div className="space-y-4">
                  {BENEFITS.map((b) => (
                    <div key={b.title} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-soft flex items-center justify-center flex-shrink-0">
                        {b.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900 text-sm">{b.title}</h3>
                        <p className="text-sm text-neutral-600 mt-0.5 leading-relaxed">{b.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tipos de colaboradores */}
              <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5">
                <h3 className="font-semibold text-primary-800 mb-3 text-sm uppercase tracking-wide">
                  Buscamos
                </h3>
                <ul className="space-y-2 text-sm text-primary-700">
                  {[
                    "🧠 Psicólogos y psicólogas",
                    "💙 Terapeutas ocupacionales",
                    "👥 Trabajadores/as sociales",
                    "🎨 Artistas y facilitadores creativos",
                    "🙌 Voluntarios/as generales",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "142", label: "Voluntarios activos" },
                  { value: "28",  label: "Comunas alcanzadas" },
                  { value: "890", label: "Horas donadas este año" },
                  { value: "100%", label: "Gratuito para todos" },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-xl border border-neutral-200 p-3 text-center shadow-xs">
                    <p className="font-display font-extrabold text-xl text-primary-700">{s.value}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulario */}
            <div className="lg:col-span-3">
              <VolunteerForm />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
