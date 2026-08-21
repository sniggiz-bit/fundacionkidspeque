import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Chatbot } from "@/components/Chatbot";
import "./globals.css";

// ── Fuentes tipográficas ──────────────────────────────────────────────────────
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.kidspeque.cl";

// ── Metadatos SEO Globales ────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Fundación Kidspeque | Cumple el sueño de cada niño y niña de Chile",
    template: "%s | Fundación Kidspeque",
  },
  description:
    "Plataforma social de impacto en Chile. Financiamo sueños de niños y niñas a través de la creatividad, expresión artística y donaciones transparentes sin intermediarios.",
  keywords: [
    "fundacion niños chile",
    "fundacion kidspeque",
    "donaciones niños chile",
    "cumplir sueños niños",
    "crowdfunding social chile",
    "niños creativos",
    "voluntariado infantil chile",
    "tienda solidaria chile",
    "transparencia donaciones",
  ],
  authors: [{ name: "Fundación Social Niños Creativos", url: APP_URL }],
  creator: "Fundación Kidspeque",
  publisher: "Fundación Social Niños Creativos",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "./",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: APP_URL,
    siteName: "Fundación Kidspeque",
    title: "Fundación Kidspeque | Cumple el sueño de cada niño y niña de Chile",
    description:
      "Plataforma social de impacto que apoya el desarrollo infantil a través de la creatividad. Tu donación llega directamente al sueño de un niño o niña.",
    images: [
      {
        url: `${APP_URL}/logo.png`,
        width: 1200,
        height: 630,
        alt: "Fundación Kidspeque — Cumpliendo sueños de niños y niñas en Chile",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fundación Kidspeque | Cumple el sueño de cada niño y niña de Chile",
    description: "Plataforma social de impacto que financia sueños de niños y niñas en Chile.",
    images: [`${APP_URL}/logo.png`],
    creator: "@kidspeque_cl",
    site: "@kidspeque_cl",
  },
  icons: {
    icon: [{ url: "/logo.png" }],
    apple: [{ url: "/logo.png", sizes: "180x180" }],
    shortcut: "/logo.png",
  },
  category: "Nonprofit & Charity",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)",  color: "#1e1b4b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// ── Layout Principal ──────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Schema.org JSON-LD para Organización (NGO) + WebSite con SearchAction
  const ngoJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NGO",
        "@id": `${APP_URL}/#organization`,
        name: "Fundación Social Niños Creativos",
        alternateName: ["Fundación Kidspeque", "Kidspeque Chile"],
        url: APP_URL,
        logo: {
          "@type": "ImageObject",
          url: `${APP_URL}/logo.png`,
          caption: "Logo Fundación Kidspeque",
        },
        image: `${APP_URL}/logo.png`,
        description:
          "Organización sin fines de lucro en Chile dedicada a financiar sueños creativos, educativos y artísticos para niños y niñas.",
        foundingDate: "2024",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Santiago",
          addressRegion: "Región Metropolitana",
          addressCountry: "CL",
        },
        areaServed: {
          "@type": "Country",
          name: "Chile",
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "Atención al Donante y Voluntarios",
          email: "contacto@kidspeque.cl",
          telephone: "+56-2-2345-6789",
          availableLanguage: ["Spanish"],
        },
        sameAs: [
          "https://www.instagram.com/kidspeque_cl",
          "https://www.facebook.com/kidspeque",
          "https://www.youtube.com/@kidspeque_cl",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${APP_URL}/#website`,
        url: APP_URL,
        name: "Fundación Kidspeque",
        description: "Cumple el sueño de cada niño y niña de Chile.",
        publisher: {
          "@id": `${APP_URL}/#organization`,
        },
        inLanguage: "es-CL",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${APP_URL}/suenos?category={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html
      lang="es-CL"
      className={`${inter.variable} ${plusJakarta.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ngoJsonLd) }}
        />
      </head>
      <body className="font-sans antialiased bg-neutral-50 text-neutral-900">
        {children}
        <Chatbot />
      </body>
    </html>
  );
}
