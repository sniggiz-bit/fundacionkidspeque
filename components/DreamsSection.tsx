"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import { DreamCard, DreamCardSkeleton } from "./DreamCard";
import type { Dream } from "@/types";

// ── Datos de muestra (en producción vendrían del CMS/API) ─────────────────────
const SAMPLE_DREAMS: Dream[] = [
  {
    id: "1",
    publicId: "SUEÑO-0001",
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
    title: "El sueño de Valentina: Aprender a pintar",
    childName: "Valentina",
    childAge: 7,
    story: "",
    shortDescription: "Valentina tiene 7 años y sueña con expresar sus emociones a través de la pintura. Necesita materiales y clases para desarrollar su talento.",
    coverImage: {
      url: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&auto=format",
      alt: "Niña sonriendo con pinturas de colores",
      width: 600,
      height: 450,
    },
    targetAmount: 150000,
    raisedAmount: 112500,
    donorCount: 34,
    progressPercentage: 75,
    status: "active",
    deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    slug: "sueno-valentina-pintura",
    category: "arte",
    tags: ["pintura", "arte", "niña"],
  },
  {
    id: "2",
    publicId: "SUEÑO-0002",
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
    title: "El sueño de Matías: Su primera bicicleta",
    childName: "Matías",
    childAge: 9,
    story: "",
    shortDescription: "Matías vive en una población y camina 3 km diarios para ir al colegio. Una bicicleta cambiaría completamente su vida y sus posibilidades.",
    coverImage: {
      url: "https://images.unsplash.com/photo-1472746729193-54e3ee4a50c0?w=600&auto=format",
      alt: "Niño feliz al aire libre",
      width: 600,
      height: 450,
    },
    targetAmount: 89000,
    raisedAmount: 89000,
    donorCount: 47,
    progressPercentage: 100,
    status: "funded",
    slug: "sueno-matias-bicicleta",
    category: "deporte",
    tags: ["bicicleta", "transporte", "niño"],
  },
  {
    id: "3",
    publicId: "SUEÑO-0003",
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
    title: "El sueño de Isidora: Clases de música",
    childName: "Isidora",
    childAge: 11,
    story: "",
    shortDescription: "Isidora canta sola en su habitación y sueña con aprender guitarra. Su familia no puede pagar las clases, pero su talento es enorme.",
    coverImage: {
      url: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format",
      alt: "Niña con guitarra",
      width: 600,
      height: 450,
    },
    targetAmount: 200000,
    raisedAmount: 58000,
    donorCount: 19,
    progressPercentage: 29,
    status: "active",
    deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    slug: "sueno-isidora-musica",
    category: "música",
    tags: ["guitarra", "música", "niña"],
  },
  {
    id: "4",
    publicId: "SUEÑO-0004",
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
    title: "El sueño de Diego: Kit de robótica",
    childName: "Diego",
    childAge: 12,
    story: "",
    shortDescription: "Diego quiere ser ingeniero y ya construye pequeños inventos con lo que encuentra. Un kit de robótica encendería su pasión por la tecnología.",
    coverImage: {
      url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&auto=format",
      alt: "Niño con kit de robótica",
      width: 600,
      height: 450,
    },
    targetAmount: 120000,
    raisedAmount: 84000,
    donorCount: 28,
    progressPercentage: 70,
    status: "active",
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    slug: "sueno-diego-robotica",
    category: "tecnología",
    tags: ["robótica", "tecnología", "niño"],
  },
  {
    id: "5",
    publicId: "SUEÑO-0005",
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: new Date(),
    title: "El sueño de Camila: Ser bailarina",
    childName: "Camila",
    childAge: 8,
    story: "",
    shortDescription: "Camila baila en cada oportunidad que tiene. Sus zapatos de danza y matrícula en la academia la acercarían a su mayor sueño.",
    coverImage: {
      url: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&auto=format",
      alt: "Niña bailando con alegría",
      width: 600,
      height: 450,
    },
    targetAmount: 180000,
    raisedAmount: 27000,
    donorCount: 11,
    progressPercentage: 15,
    status: "active",
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    slug: "sueno-camila-bailarina",
    category: "danza",
    tags: ["danza", "ballet", "niña"],
  },
];

// ── Filtros de categoría ───────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "",           label: "Todos",   emoji: "✨" },
  { value: "arte",       label: "Arte",    emoji: "🎨" },
  { value: "música",     label: "Música",  emoji: "🎵" },
  { value: "tecnología", label: "Tech",    emoji: "🤖" },
  { value: "danza",      label: "Danza",   emoji: "💃" },
  { value: "deporte",    label: "Deporte", emoji: "⚽" },
] as const;

// ── Componente Principal ──────────────────────────────────────────────────────

interface DreamsSectionProps {
  isLoading?: boolean;
  dreams?: Dream[];
}

export function DreamsSection({ isLoading = false, dreams = [] }: DreamsSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string>("");

  const filtered = activeCategory
    ? dreams.filter((d) => d.category === activeCategory)
    : dreams;

  return (
    <section
      id="suenos"
      className="section bg-white"
      aria-labelledby="dreams-heading"
    >
      <div className="container-xl">

        {/* Encabezado de sección */}
        <div className="text-center mb-10 flex flex-col items-center">
          <span className="section-tag justify-center mb-4">
            <Sparkles size={12} aria-hidden />
            Sueños que Importan
          </span>
          <h2
            id="dreams-heading"
            className="font-display text-3xl sm:text-4xl font-extrabold text-neutral-900 leading-tight text-center"
          >
            Cada sueño cuenta.{" "}
            <span className="text-gradient">El tuyo también.</span>
          </h2>
          <p className="mt-3 text-neutral-600 max-w-lg mx-auto text-center">
            Financia el sueño de un niño o niña. Tu donación va directamente
            a cumplir cada meta con total transparencia.
          </p>
        </div>

        {/* Filtros de categoría */}
        <div
          className="flex flex-wrap justify-center gap-2 mb-8"
          role="group"
          aria-label="Filtrar sueños por categoría"
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.value;
            return (
              <motion.button
                key={cat.value || "all"}
                onClick={() => setActiveCategory(cat.value)}
                whileTap={{ scale: 0.95 }}
                className={`
                  flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold
                  transition-all duration-200 min-h-[40px]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2
                  ${isActive
                    ? "bg-violet-600 text-white shadow-md"
                    : "bg-neutral-100 text-neutral-600 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200"
                  }
                `}
                aria-pressed={isActive}
              >
                <span aria-hidden className="text-base">{cat.emoji}</span>
                {cat.label}
              </motion.button>
            );
          })}
        </div>

        {/* Grid de cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <DreamCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.ul
              key={activeCategory || "all"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              role="list"
              aria-label={`Sueños${activeCategory ? ` de ${activeCategory}` : " activos"}`}
            >
              {filtered.length === 0 ? (
                <li className="col-span-full py-16 text-center">
                  <span className="text-4xl mb-3 block">🔍</span>
                  <p className="text-neutral-500">No hay sueños en esta categoría todavía.</p>
                </li>
              ) : (
                filtered.map((dream, index) => (
                  <li key={dream.id}>
                    <DreamCard dream={dream} priority={index === 0} index={index} />
                  </li>
                ))
              )}
            </motion.ul>
          </AnimatePresence>
        )}

        {/* CTA: ver todos */}
        <div className="text-center mt-12">
          <a
            href="/suenos"
            className="btn-outline inline-flex"
          >
            Ver todos los sueños activos
            <ChevronRight size={16} aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
