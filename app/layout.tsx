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

// ── Metadatos SEO ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL("https://www.kidspeque.cl"),
  title: {
    default: "Fundación Kidspeque",
    template: "%s | Fundación Kidspeque",
  },
  description:
    "Cumple un sueño para cada niño o niña de nuestro país. Apoyamos el desarrollo infantil a través de la creatividad y la libertad de expresión.",
  keywords: [
    "fundación", "niños creativos", "donación Chile", "crowdfunding social",
    "kidspeque", "sueños niños", "voluntariado", "tienda solidaria",
  ],
  authors: [{ name: "Fundación Social Niños Creativos", url: "https://www.kidspeque.cl" }],
  creator: "Fundación Kidspeque",
  publisher: "Fundación Social Niños Creativos",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: "https://www.kidspeque.cl",
    siteName: "Fundación Kidspeque",
    title: "Fundación Kidspeque | Cumple un sueño para cada niño o niña",
    description:
      "Plataforma de crowdfunding social que financia sueños de niños y niñas a través de donaciones y nuestra tienda solidaria.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Fundación Kidspeque",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fundación Kidspeque | Cumple un sueño para cada niño o niña",
    description: "Plataforma de crowdfunding social para niños y niñas de Chile.",
    images: ["/og-image.jpg"],
    creator: "@kidspeque_cl",
  },
  icons: {
    icon:        [{ url: "/favicon.ico" }, { url: "/icon.svg", type: "image/svg+xml" }],
    apple:       [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut:    "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  // Schema.org para NGO (datos estructurados)
  other: {
    "schema:type": "NGO",
    "schema:name": "Fundación Social Niños Creativos",
    "schema:url":  "https://www.kidspeque.cl",
  },
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
  return (
    <html
      lang="es"
      className={`${inter.variable} ${plusJakarta.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Schema.org JSON-LD — NGO / NonProfitOrganization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "NGO",
              name: "Fundación Social Niños Creativos",
              alternateName: "Fundación Kidspeque",
              url: "https://www.kidspeque.cl",
              logo: "https://www.kidspeque.cl/logo.png",
              description:
                "Organización sin fines de lucro que apoya el desarrollo creativo de niños y niñas en Chile.",
              foundingDate: "2024",
              areaServed: {
                "@type": "Country",
                name: "Chile",
              },
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer service",
                availableLanguage: "Spanish",
                hoursAvailable: {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday"],
                  opens: "09:00",
                  closes: "17:00",
                },
              },
              sameAs: [
                "https://www.instagram.com/kidspeque_cl",
                "https://www.facebook.com/kidspeque",
              ],
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased bg-neutral-50 text-neutral-900">
        {children}
        <Chatbot />
      </body>
    </html>
  );
}
