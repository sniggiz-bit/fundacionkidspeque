import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fundación Kidspeque — Niños Creativos",
    short_name: "Kidspeque",
    description: "Cumple un sueño de cada niño y niña de Chile a través de la creatividad y la expresión.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1e1b4b",
    lang: "es-CL",
    icons: [
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
