/**
 * /suenos — Listado público de campañas activas
 * SSR con revalidación cada 60s
 */

import type { Metadata }  from "next";
import Link               from "next/link";
import Image              from "next/image";
import { Navbar }         from "@/components/Navbar";
import { Footer }         from "@/components/Footer";
import { db }             from "@/lib/db";
import { dreamCardSelect } from "@/lib/db";
import { Heart, Clock, Users, Search } from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title:       "Sueños que Importan | Fundación Kidspeque",
  description: "Conoce las historias de niños y niñas que necesitan tu ayuda para cumplir sus sueños. Dona hoy y cambia una vida.",
};

function fCLP(n: bigint | number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
  }).format(Number(n));
}

function daysLeft(deadline?: Date | null) {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  return diff > 0 ? diff : 0;
}

const CATEGORIES = [
  { value: "",           label: "Todos" },
  { value: "arte",       label: "Arte" },
  { value: "música",     label: "Música" },
  { value: "deporte",    label: "Deporte" },
  { value: "tecnología", label: "Tecnología" },
  { value: "educación",  label: "Educación" },
  { value: "danza",      label: "Danza" },
  { value: "salud",      label: "Salud" },
];

export default async function SuenosPage({
  searchParams,
}: {
  searchParams: { category?: string; page?: string };
}) {
  const category = searchParams.category ?? "";
  const page     = Math.max(1, Number(searchParams.page ?? 1));
  const limit    = 9;

  const where = {
    status:      "active" as const,
    publishedAt: { not: null as unknown as Date },
    ...(category ? { category } : {}),
  };

  const [dreams, total, funded] = await Promise.all([
    db.dream.findMany({
      where,
      select:  dreamCardSelect,
      orderBy: { publishedAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    db.dream.count({ where }),
    db.dream.count({ where: { status: "funded" } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <Navbar />
      <main>

        {/* Hero de la sección */}
        <section className="bg-gradient-to-b from-primary-950 to-neutral-950 pt-28 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 bg-primary-600/20 text-primary-300 border border-primary-500/30 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
              <Heart size={12} fill="currentColor" /> Sueños que Importan
            </span>
            <h1 className="font-display font-extrabold text-4xl md:text-5xl text-white leading-tight mb-4">
              Cada niño merece<br className="hidden md:block" /> cumplir su sueño
            </h1>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto mb-8">
              Conoce las historias de niños y niñas que necesitan tu apoyo. Con cada donación, acercamos un sueño a la realidad.
            </p>

            {/* Stats rápidas */}
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="text-center">
                <p className="font-display font-bold text-2xl text-white">{total}</p>
                <p className="text-neutral-500">sueños activos</p>
              </div>
              <div className="w-px h-8 bg-neutral-800" />
              <div className="text-center">
                <p className="font-display font-bold text-2xl text-white">{funded}</p>
                <p className="text-neutral-500">sueños cumplidos</p>
              </div>
            </div>
          </div>
        </section>

        {/* Filtros por categoría */}
        <section className="sticky top-0 z-10 bg-neutral-950/95 backdrop-blur border-b border-neutral-800 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                href={cat.value ? `/suenos?category=${cat.value}` : "/suenos"}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all flex-shrink-0 ${
                  category === cat.value
                    ? "bg-primary-600 text-white"
                    : "bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700"
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </section>

        {/* Grid de sueños */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          {dreams.length === 0 ? (
            <div className="text-center py-24">
              <Search size={40} className="text-neutral-700 mx-auto mb-4" />
              <p className="text-neutral-400 font-medium text-lg">No hay sueños en esta categoría</p>
              <Link href="/suenos" className="text-primary-400 hover:text-primary-300 text-sm mt-2 inline-block">
                Ver todos los sueños →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dreams.map((dream) => {
                const cover   = dream.coverImage as { url: string; alt: string };
                const pct     = Number(dream.progressPct);
                const days    = daysLeft(dream.deadline);
                const urgent  = days !== null && days <= 7;

                return (
                  <Link
                    key={dream.id}
                    href={`/suenos/${dream.slug}`}
                    className="group bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-primary-600/50 hover:shadow-lg hover:shadow-primary-900/20 transition-all duration-300"
                  >
                    {/* Imagen */}
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image
                        src={cover.url}
                        alt={cover.alt}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      {/* Overlay urgencia */}
                      {urgent && (
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          <Clock size={11} /> ¡Quedan {days} días!
                        </div>
                      )}
                      {/* Categoría */}
                      {dream.category && (
                        <span className="absolute top-3 right-3 bg-black/60 backdrop-blur text-white text-xs font-medium px-2.5 py-1 rounded-full capitalize">
                          {dream.category}
                        </span>
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="p-5">
                      <p className="text-xs text-primary-400 font-semibold mb-1">{dream.childName}, {dream.childAge} años</p>
                      <h2 className="font-display font-bold text-white text-base leading-snug mb-2 line-clamp-2 group-hover:text-primary-300 transition-colors">
                        {dream.title}
                      </h2>
                      <p className="text-neutral-500 text-sm line-clamp-2 mb-4">{dream.shortDescription}</p>

                      {/* Barra de progreso */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-primary-400 font-bold">{fCLP(dream.raisedAmount)}</span>
                          <span className="text-neutral-500">{pct.toFixed(0)}% de {fCLP(dream.targetAmount)}</span>
                        </div>
                        <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-1 text-xs text-neutral-500">
                          <Users size={11} />
                          <span>{dream.donorCount} donante{dream.donorCount !== 1 ? "s" : ""}</span>
                          {days !== null && !urgent && (
                            <span className="ml-auto">{days} días restantes</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="px-5 pb-5">
                      <div className="w-full bg-primary-600 group-hover:bg-primary-500 text-white text-sm font-semibold py-2.5 rounded-xl text-center transition-colors">
                        Donar ahora
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              {page > 1 && (
                <Link href={`/suenos?page=${page - 1}${category ? `&category=${category}` : ""}`}
                  className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-sm hover:bg-neutral-700 transition-colors">
                  ← Anterior
                </Link>
              )}
              <span className="px-5 py-2.5 text-neutral-500 text-sm">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link href={`/suenos?page=${page + 1}${category ? `&category=${category}` : ""}`}
                  className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-sm hover:bg-neutral-700 transition-colors">
                  Siguiente →
                </Link>
              )}
            </div>
          )}
        </section>

      </main>
      <Footer />
    </>
  );
}
