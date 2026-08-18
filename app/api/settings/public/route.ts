export const dynamic = 'force-dynamic';

/**
 * GET /api/settings/public
 * Retorna la configuración pública del sitio (contacto, redes, chatbot, etc.)
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const settings = await db.siteSettings.findUnique({ where: { id: "global" } });
    return NextResponse.json({
      success: true,
      data: {
        foundationName:        settings?.foundationName ?? "Fundación Kidspeque",
        tagline:               settings?.tagline ?? "Fundación Social Niños Creativos. Cumplimos sueños de niños y niñas a través de la creatividad y la libertad de expresión.",
        contactEmail:          settings?.contactEmail ?? "contacto@kidspeque.cl",
        contactPhone:          settings?.contactPhone ?? "+56 2 2345 6789",
        address:               settings?.address ?? "Santiago, Región Metropolitana, Chile",
        schedule:              settings?.schedule ?? "Lunes a Viernes 09:00 a 17:00 hrs.",
        rut:                   settings?.rut ?? "76.XXX.XXX-X",
        legalPersonId:         settings?.legalPersonId ?? "Nº XXXX/2024",
        instagramUrl:          settings?.instagramUrl ?? "https://instagram.com/kidspeque_cl",
        facebookUrl:           settings?.facebookUrl ?? "https://facebook.com/kidspeque",
        youtubeUrl:            settings?.youtubeUrl ?? "https://youtube.com/@kidspeque_cl",
        chatbotEnabled:        settings?.chatbotEnabled ?? true,
        chatbotWelcomeMessage: settings?.chatbotWelcomeMessage ?? "¡Hola! 🌼 Soy el asistente virtual de Fundación Kidspeque. ¿En qué puedo orientarte hoy? Selecciona una opción rápida o escríbeme directamente.",
        whatsappPhone:         settings?.whatsappPhone ?? "56911223344",
        productCategories:     (settings?.productCategories as any) ?? [
          { slug: "ropa_organica", name: "Ropa Orgánica" },
          { slug: "delantales",    name: "Delantales" },
          { slug: "pantalones",    name: "Pantalones" },
          { slug: "accesorios",    name: "Accesorios" },
          { slug: "kits",          name: "Kits Creativos" },
        ],
      },
    });
  } catch (err) {
    console.error("[settings/public GET]", err);
    return NextResponse.json({ success: false, data: null }, { status: 500 });
  }
}
