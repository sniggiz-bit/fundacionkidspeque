/**
 * /donacion/confirmacion
 * ─────────────────────────────────────────────────────────────────
 * Página post-pago exitoso.
 * - Recibe el `?id=` del webhook como query param
 * - Verifica el estado en la DB (server-side)
 * - Muestra celebración y enlace al recibo
 */

import type { Metadata } from "next";
import Link              from "next/link";
import { db }            from "@/lib/db";
import { CheckCircle, Download, Share2, ArrowRight } from "lucide-react";
import { ConfettiEffect } from "@/components/ConfettiEffect";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title:  "¡Donación recibida! | Fundación Kidspeque",
  robots: { index: false }, // No indexar páginas post-pago
};

interface PageProps {
  searchParams: { id?: string };
}

function formatCLP(n: number | bigint) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
  }).format(Number(n));
}

export default async function ConfirmationPage({ searchParams }: PageProps) {
  const donationId = searchParams.id;

  // Buscar donación en la DB
  const donation = donationId
    ? await db.donation.findUnique({
        where:   { id: donationId },
        include: {
          dream:       { select: { title: true, slug: true, childName: true, coverImage: true } },
          contributor: { select: { firstName: true, email: true } },
        },
      })
    : null;

  // Si no existe o está pendiente, mostrar estado de espera
  const isConfirmed = donation?.status === "confirmed";
  const isPending   = donation?.status === "pending";

  if (!donation) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <p className="text-4xl mb-4">🔍</p>
          <h1 className="font-display font-bold text-xl text-neutral-900 mb-3">
            Donación no encontrada
          </h1>
          <p className="text-neutral-600 text-sm mb-6">
            Si realizaste un pago, puede tardar unos minutos en confirmarse.
          </p>
          <Link href="/" className="btn-primary w-full text-sm">
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl" aria-hidden>⏳</span>
          </div>
          <h1 className="font-display font-bold text-xl text-neutral-900 mb-3">
            Confirmando tu donación…
          </h1>
          <p className="text-neutral-600 text-sm mb-6">
            Tu pago está siendo procesado. Recibirás un email de confirmación en{" "}
            <strong>{donation.contributor.email}</strong> en los próximos minutos.
          </p>
          <Link href="/" className="btn-outline w-full text-sm">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  // Estado confirmado — pantalla de celebración
  return (
    <>
      <ConfettiEffect />

      <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-6">

          {/* Card de éxito */}
          <div className="card p-8 text-center">

            {/* Ícono de éxito */}
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={40} className="text-success" aria-hidden />
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-2">
              ¡Gracias, {donation.contributor.firstName}!
            </h1>
            <p className="text-neutral-600 mb-6">
              Tu donación fue recibida con éxito. Juntos hacemos posible el sueño de{" "}
              <strong className="text-primary-700">{donation.dream.childName}</strong>.
            </p>

            {/* Detalle de la donación */}
            <div className="bg-neutral-50 rounded-2xl p-5 text-left space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Sueño apoyado</span>
                <span className="font-semibold text-neutral-800 max-w-[180px] text-right truncate">
                  {donation.dream.title}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Monto donado</span>
                <span className="font-extrabold text-primary-700 text-base">
                  {formatCLP(donation.amountInCLP)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Recibo enviado a</span>
                <span className="font-semibold text-neutral-800">{donation.contributor.email}</span>
              </div>
              {donation.receiptNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">N° de donación</span>
                  <span className="font-mono text-xs text-neutral-600">{donation.receiptNumber}</span>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="space-y-3">
              {donation.receiptUrl && (
                <a
                  href={donation.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline w-full text-sm"
                >
                  <Download size={15} aria-hidden />
                  Descargar recibo tributario
                </a>
              )}
              <Link
                href={`/suenos/${donation.dream.slug}`}
                className="btn-primary w-full text-sm"
              >
                Ver el progreso del sueño
                <ArrowRight size={15} aria-hidden />
              </Link>
            </div>
          </div>

          {/* Compartir */}
          <div className="card p-5 text-center">
            <p className="font-semibold text-neutral-800 mb-1">
              Invita a otros a apoyar este sueño
            </p>
            <p className="text-sm text-neutral-500 mb-4">
              Cada compartir puede traer más donantes y hacer el sueño realidad más rápido.
            </p>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Doné a "${donation.dream.title}" a través de Fundación Kidspeque 💙 Puedes hacerlo tú también: https://www.kidspeque.cl/suenos/${donation.dream.slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cta w-full text-sm"
            >
              <Share2 size={15} aria-hidden />
              Compartir por WhatsApp
            </a>
          </div>

          {/* Volver */}
          <div className="text-center">
            <Link href="/" className="text-sm text-neutral-500 hover:text-primary-600 transition-colors">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
