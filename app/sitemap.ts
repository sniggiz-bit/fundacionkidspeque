import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.kidspeque.cl";

  // Rutas estáticas principales
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/suenos`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tienda`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/transparencia`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/voluntariado`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/legales`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Sueños dinámicos
  let dreamRoutes: MetadataRoute.Sitemap = [];
  try {
    const dreams = await db.dream.findMany({
      where: { status: { in: ["active", "funded", "completed"] }, publishedAt: { not: null } },
      select: { slug: true, updatedAt: true },
    });

    dreamRoutes = dreams.map((dream) => ({
      url: `${baseUrl}/suenos/${dream.slug}`,
      lastModified: dream.updatedAt ?? new Date(),
      changeFrequency: "daily" as const,
      priority: 0.85,
    }));
  } catch (err) {
    console.error("[Sitemap] Error cargando sueños:", err);
  }

  // Productos dinámicos de la tienda
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await db.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    productRoutes = products.map((product) => ({
      url: `${baseUrl}/tienda/productos/${product.slug}`,
      lastModified: product.updatedAt ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (err) {
    console.error("[Sitemap] Error cargando productos:", err);
  }

  return [...staticRoutes, ...dreamRoutes, ...productRoutes];
}
