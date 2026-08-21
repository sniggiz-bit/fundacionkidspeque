/**
 * /suenos/[slug]  — Página individual de un sueño
 * ─────────────────────────────────────────────────────────────────
 * Renderizado: SSR (Server Side Rendering)
 * - Los datos se obtienen en el servidor para SEO y velocidad inicial.
 * - El raised_amount se actualiza en tiempo real en el cliente (polling 15s).
 */

import type { Metadata } from "next";
import { notFound }      from "next/navigation";
import Image             from "next/image";
import Link              from "next/link";
import { db }            from "@/lib/db";
import { DonationWizard }   from "@/components/DonationWizard";
import { DreamStatsLive }   from "@/components/DreamStatsLive";
import { DonorWall }        from "@/components/DonorWall";
import { ArrowLeft, Calendar, Users, Tag } from "lucide-react";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: { slug: string };
}

// ── Generación estática de rutas (ISR) ────────────────────────────────────────

// dynamicParams = true → si el slug no está pre-generado, Next.js lo renderiza
// en el servidor la primera vez (ISR bajo demanda) en lugar de devolver 404.
export const dynamicParams = true;

export async function generateStaticParams() {
  // Si no hay conexión a la DB durante el build (ej: build local sin DB),
  // retornamos array vacío y dejamos que las páginas se generen en runtime.
  try {
    const dreams = await db.dream.findMany({
      where:  { status: "active", publishedAt: { not: null } },
      select: { slug: true },
    });
    return dreams.map((d) => ({ slug: d.slug }));
  } catch {
    return [];
  }
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.kidspeque.cl";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const dream = await db.dream.findUnique({
    where:  { slug: params.slug },
    select: { title: true, shortDescription: true, coverImage: true, metaTitle: true, metaDescription: true, childName: true },
  });

  if (!dream) return { title: "Sueño no encontrado | Fundación Kidspeque" };

  const cover = dream.coverImage as { url: string; alt: string };
  const title = dream.metaTitle ?? `${dream.title} | Sueño de ${dream.childName} en Fundación Kidspeque`;
  const description = dream.metaDescription ?? dream.shortDescription;
  const url = `${APP_URL}/suenos/${params.slug}`;

  return {
    title,
    description,
    keywords: [
      `sueño ${dream.childName}`,
      dream.title,
      "donar sueño niño chile",
      "fundacion kidspeque",
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Fundación Kidspeque",
      locale: "es_CL",
      type: "article",
      images: [{ url: cover.url, alt: cover.alt || dream.title, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [cover.url],
    },
  };
}

// ── Helpers de formato ────────────────────────────────────────────────────────

function formatCLP(n: number | bigint) {
  return new Intl.NumberFormat("es-CL", {
    style:                 "currency",
    currency:              "CLP",
    maximumFractionDigits: 0,
  }).format(Number(n));
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric", month: "long", year: "numeric",
  }).format(new Date(date));
}

// ── Componente: Barra de progreso estática (inicial, SSR) ─────────────────────

function ProgressBarSSR({ pct }: { pct: number }) {
  return (
    <div
      className="progress-track h-3"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${pct.toFixed(1)}% del objetivo alcanzado`}
    >
      <div
        className="progress-fill h-full"
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

// ── Página Principal (Server Component) ──────────────────────────────────────

export default async function DreamPage({ params }: PageProps) {
  // Fetch SSR
  const dream = await db.dream.findUnique({
    where: { slug: params.slug },
    include: {
      donations: {
        where:   { status: "confirmed", isPublic: true },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id:          true,
          amountInCLP: true,
          displayName: true,
          message:     true,
          createdAt:   true,
        },
      },
    },
  });

  if (!dream || !dream.publishedAt) notFound();

  const cover      = dream.coverImage as { url: string; alt: string; blurDataURL?: string; width: number; height: number };
  const gallery    = (dream.gallery ?? []) as Array<{ url: string; alt: string; caption?: string }>;
  const progressPct = Number(dream.progressPct);
  const isFunded   = dream.status === "funded" || dream.status === "completed";

  // Schema.org JSON-LD para la campaña + BreadcrumbList
  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "DonateAction",
        name: dream.title,
        description: dream.shortDescription,
        url: `${APP_URL}/suenos/${dream.slug}`,
        image: cover.url,
        recipient: {
          "@type": "NGO",
          name: "Fundación Social Niños Creativos",
          url: APP_URL,
        },
        agent: {
          "@type": "Person",
          name: `${dream.childName} (${dream.childAge} años)`,
        },
        startTime: dream.publishedAt?.toISOString(),
        endTime: dream.deadline?.toISOString(),
        actionStatus: isFunded
          ? "https://schema.org/CompletedActionStatus"
          : "https://schema.org/ActiveActionStatus",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Inicio",
            item: APP_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Sueños",
            item: `${APP_URL}/suenos`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: dream.title,
            item: `${APP_URL}/suenos/${dream.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="min-h-screen bg-neutral-50">

        {/* Breadcrumb */}
        <div className="bg-white border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav aria-label="Migas de pan" className="flex items-center gap-2 text-sm">
              <Link href="/" className="text-neutral-500 hover:text-primary-600 transition-colors">
                Inicio
              </Link>
              <span className="text-neutral-300" aria-hidden>/</span>
              <Link href="/#suenos" className="text-neutral-500 hover:text-primary-600 transition-colors">
                Sueños
              </Link>
              <span className="text-neutral-300" aria-hidden>/</span>
              <span className="text-neutral-800 font-medium truncate max-w-xs" aria-current="page">
                {dream.title}
              </span>
            </nav>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">

          {/* Botón volver */}
          <Link
            href="/#suenos"
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-700 mb-8 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" aria-hidden />
            Ver todos los sueños
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">

            {/* ── Columna principal (3/5) ────────────────────────────── */}
            <div className="lg:col-span-3 space-y-8">

              {/* Imagen principal */}
              <div className="relative rounded-3xl overflow-hidden aspect-video bg-neutral-200 shadow-card">
                <Image
                  src={cover.url}
                  alt={cover.alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover"
                  placeholder={cover.blurDataURL ? "blur" : "empty"}
                  blurDataURL={cover.blurDataURL}
                />
                {/* Badge estado */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="badge bg-white/95 backdrop-blur-sm text-primary-700 font-mono text-xs shadow-xs">
                    {dream.publicId}
                  </span>
                  {isFunded && (
                    <span className="badge bg-success text-white font-semibold">
                      ✓ Sueño Cumplido
                    </span>
                  )}
                </div>
              </div>

              {/* Encabezado */}
              <div>
                {dream.category && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 uppercase tracking-wider mb-3">
                    <Tag size={11} aria-hidden /> {dream.category}
                  </span>
                )}
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-900 leading-tight mb-4">
                  {dream.title}
                </h1>

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                  <span className="flex items-center gap-1.5">
                    <Users size={14} aria-hidden />
                    {dream.donorCount.toLocaleString("es-CL")} donantes
                  </span>
                  {dream.publishedAt && (
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} aria-hidden />
                      Publicado el {formatDate(dream.publishedAt)}
                    </span>
                  )}
                  {dream.deadline && !isFunded && (
                    <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                      <Calendar size={14} aria-hidden />
                      Hasta el {formatDate(dream.deadline)}
                    </span>
                  )}
                </div>
              </div>

              {/* Progreso con datos en tiempo real (componente cliente) */}
              <DreamStatsLive
                dreamSlug={dream.slug}
                initialRaised={Number(dream.raisedAmount)}
                initialDonorCount={dream.donorCount}
                initialProgressPct={progressPct}
                targetAmount={Number(dream.targetAmount)}
              />

              {/* Historia del sueño */}
              <article className="prose prose-neutral max-w-none prose-p:text-neutral-700 prose-headings:font-display">
                <div dangerouslySetInnerHTML={{ __html: dream.story }} />
              </article>

              {/* Tags */}
              {dream.tags.length > 0 && (
                <div className="flex flex-wrap gap-2" role="list" aria-label="Etiquetas">
                  {dream.tags.map((tag) => (
                    <span key={tag} role="listitem" className="badge-primary text-xs capitalize">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Galería */}
              {gallery.length > 0 && (
                <div>
                  <h2 className="font-display font-bold text-lg text-neutral-900 mb-4">
                    Momentos del sueño
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {gallery.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100">
                        <Image
                          src={img.url}
                          alt={img.alt}
                          fill
                          sizes="(max-width: 640px) 50vw, 33vw"
                          className="object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Muro de donantes */}
              <DonorWall donations={dream.donations} dreamTitle={dream.title} />
            </div>

            {/* ── Columna lateral pegajosa (2/5) ──────────────────────── */}
            <aside className="lg:col-span-2">
              <div className="sticky top-24 space-y-6">

                {/* Resumen financiero */}
                <div className="card p-6 space-y-5">
                  <div className="text-center">
                    <p className="text-sm text-neutral-500 mb-1">Meta del sueño</p>
                    <p className="font-display text-3xl font-extrabold text-neutral-900">
                      {formatCLP(dream.targetAmount)}
                    </p>
                  </div>

                  <ProgressBarSSR pct={progressPct} />

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-primary-50 rounded-xl p-3">
                      <p className="font-display text-xl font-extrabold text-primary-700">
                        {formatCLP(dream.raisedAmount)}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">Recaudado</p>
                    </div>
                    <div className="bg-accent-50 rounded-xl p-3">
                      <p className="font-display text-xl font-extrabold text-accent-600">
                        {progressPct.toFixed(0)}%
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">Completado</p>
                    </div>
                  </div>
                </div>

                {/* Wizard de donación */}
                {!isFunded ? (
                  <DonationWizard dreamId={dream.publicId} />
                ) : (
                  <div className="card p-6 text-center">
                    <p className="text-3xl mb-3" aria-hidden>🎉</p>
                    <h3 className="font-display font-bold text-lg text-neutral-900 mb-2">
                      ¡Sueño cumplido!
                    </h3>
                    <p className="text-sm text-neutral-600 mb-4">
                      Gracias a {dream.donorCount} personas, este sueño ya es realidad.
                    </p>
                    <Link href="/#suenos" className="btn-primary w-full text-sm">
                      Ver otros sueños
                    </Link>
                  </div>
                )}

                {/* Compartir */}
                <div className="card p-4">
                  <p className="text-sm font-semibold text-neutral-700 mb-3 text-center">
                    Comparte este sueño 💙
                  </p>
                  <div className="flex gap-2">
                    {[
                      {
                        label: "Facebook",
                        icon: "f",
                        href: `https://facebook.com/sharer/sharer.php?u=https://www.kidspeque.cl/suenos/${dream.slug}`,
                        bg: "bg-[#1877F2]",
                      },
                      {
                        label: "Twitter/X",
                        icon: "𝕏",
                        href: `https://twitter.com/intent/tweet?url=https://www.kidspeque.cl/suenos/${dream.slug}&text=${encodeURIComponent(dream.title)}`,
                        bg: "bg-neutral-900",
                      },
                      {
                        label: "WhatsApp",
                        icon: "W",
                        href: `https://wa.me/?text=${encodeURIComponent(`${dream.title} — Apóyalo en https://www.kidspeque.cl/suenos/${dream.slug}`)}`,
                        bg: "bg-[#25D366]",
                      },
                    ].map(({ label, icon, href, bg }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Compartir en ${label}`}
                        className={`${bg} text-white flex-1 py-2 rounded-xl text-center text-sm font-bold hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500`}
                      >
                        {icon}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}

// Revalidar la página cada 30 segundos (ISR)
export const revalidate = 30;
