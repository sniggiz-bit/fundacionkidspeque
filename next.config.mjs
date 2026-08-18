/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Optimización de imágenes ──────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "cdn.xubook.cl" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ── Cabeceras de seguridad ────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control",  value: "on" },
          { key: "X-Frame-Options",          value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options",   value: "nosniff" },
          { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",       value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.webpay.cl https://js.paypal.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://cdn.xubook.cl https://res.cloudinary.com https://images.unsplash.com",
              "connect-src 'self' https://www.flow.cl https://api.paypal.com",
              "frame-src https://js.paypal.com https://www.paypal.com https://www.webpay.cl",
            ].join("; "),
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },

  // ── Redirects SEO-friendly ────────────────────────────────────────
  async redirects() {
    return [
      {
        source:      "/donacion",
        destination: "/donar",
        permanent:   true,
      },
    ];
  },

  // ── Experimental features ────────────────────────────────────────
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  
  output: "standalone",
};

export default nextConfig;
