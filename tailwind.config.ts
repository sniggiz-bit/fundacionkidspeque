import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── DESIGN TOKENS ──────────────────────────────────────────────
      colors: {
        // Primary: Violeta cálido — Creatividad, imaginación infantil
        primary: {
          50:  "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",   // ← color primario principal
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        // Accent: Coral-naranja — Energía, alegría, acción
        accent: {
          50:  "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",   // ← color acento principal
          600: "#ea6c0a",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        // Neutrales para texto, fondos y bordes
        neutral: {
          50:  "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0a0a0a",
        },
        // Semánticos
        success: "#10b981",
        warning: "#f59e0b",
        error:   "#ef4444",
      },

      // ── TIPOGRAFÍA ─────────────────────────────────────────────────
      fontFamily: {
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
        "display-2xl": ["4.5rem",  { lineHeight: "5.625rem", letterSpacing: "-0.02em" }],
        "display-xl":  ["3.75rem", { lineHeight: "4.5rem",   letterSpacing: "-0.02em" }],
        "display-lg":  ["3rem",    { lineHeight: "3.75rem",  letterSpacing: "-0.02em" }],
        "display-md":  ["2.25rem", { lineHeight: "2.75rem",  letterSpacing: "-0.02em" }],
        "display-sm":  ["1.875rem",{ lineHeight: "2.375rem" }],
        "display-xs":  ["1.5rem",  { lineHeight: "2rem" }],
      },

      // ── ESPACIADO Y LAYOUT ─────────────────────────────────────────
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "128": "32rem",
        "144": "36rem",
      },
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },

      // ── SOMBRAS PREMIUM ────────────────────────────────────────────
      boxShadow: {
        "xs":    "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "soft":  "0 2px 8px -2px rgb(0 0 0 / 0.08), 0 4px 16px -4px rgb(0 0 0 / 0.06)",
        "card":  "0 4px 24px -4px rgb(0 0 0 / 0.08), 0 8px 32px -8px rgb(0 0 0 / 0.05)",
        "lift":  "0 12px 40px -8px rgb(0 0 0 / 0.14), 0 4px 16px -4px rgb(0 0 0 / 0.08)",
        "glow":  "0 0 0 3px rgb(124 58 237 / 0.18)",
        "glow-accent": "0 0 0 3px rgb(249 115 22 / 0.28)",
      },

      // ── ANIMACIONES ────────────────────────────────────────────────
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "progress-fill": {
          "0%":   { width: "0%" },
          "100%": { width: "var(--progress-width)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-8px)" },
        },
        "pulse-ring": {
          "0%":   { boxShadow: "0 0 0 0 rgb(124 58 237 / 0.4)" },
          "70%":  { boxShadow: "0 0 0 12px rgb(124 58 237 / 0)" },
          "100%": { boxShadow: "0 0 0 0 rgb(124 58 237 / 0)" },
        },
      },
      animation: {
        "fade-up":       "fade-up 0.6s ease-out forwards",
        "fade-in":       "fade-in 0.4s ease-out forwards",
        shimmer:         "shimmer 2s linear infinite",
        "progress-fill": "progress-fill 1.2s ease-out forwards",
        float:           "float 3s ease-in-out infinite",
        "pulse-ring":    "pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite",
      },

      // ── BORDER RADIUS ──────────────────────────────────────────────
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
