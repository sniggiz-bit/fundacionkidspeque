export const dynamic = 'force-dynamic';
/**
 * GET  /api/admin/products  — Listar productos (CMS)
 * POST /api/admin/products  — Crear producto
 */

import { NextRequest, NextResponse } from "next/server";
import { z }        from "zod";
import { db }       from "@/lib/db";
import { cookies }  from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? "fallback-dev-secret-change-in-production"
);

async function verifyAdmin(): Promise<boolean> {
  const token = cookies().get("admin_session")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, JWT_SECRET, { issuer: "kidspeque-admin" });
    return true;
  } catch { return false; }
}

const variantSchema = z.object({
  name:       z.string().min(1),
  sku:        z.string().min(1),
  price:      z.number().int().optional(),
  stock:      z.number().int().default(0),
  attributes: z.record(z.string()),
});

const productSchema = z.object({
  name:             z.string().min(3).max(200),
  slug:             z.string().min(3).max(250).regex(/^[a-z0-9-]+$/),
  description:      z.string().min(20),
  shortDescription: z.string().min(10).max(120),
  category:         z.enum(["ropa_organica", "delantales", "pantalones", "accesorios", "kits"]),
  tags:             z.array(z.string()).default([]),
  price:            z.number().int().min(1000),
  compareAtPrice:   z.number().int().optional(),
  costPerItem:      z.number().int().optional(),
  sku:              z.string().min(1).max(100),
  stock:            z.number().int().min(0).default(0),
  trackInventory:   z.boolean().default(true),
  images:           z.array(z.object({ url: z.string().url(), alt: z.string(), width: z.number(), height: z.number() })).min(1),
  impactDescription: z.string().min(10),
  relatedDreamId:   z.string().uuid().optional(),
  metaTitle:        z.string().max(60).optional(),
  metaDescription:  z.string().max(160).optional(),
  isActive:         z.boolean().default(true),
  isFeatured:       z.boolean().default(false),
  variants:         z.array(variantSchema).default([]),
});

export async function GET(request: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page     = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit    = 20;
  const category = searchParams.get("category");
  const active   = searchParams.get("active");

  const where = {
    ...(category ? { category: category as "ropa_organica" } : {}),
    ...(active !== null ? { isActive: active === "true" } : {}),
  };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, sku: true, category: true,
        price: true, stock: true, isActive: true, isFeatured: true,
        images: true,
      },
    }),
    db.product.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: products,
    meta: { total, page, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  const body   = await request.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors } },
      { status: 422 }
    );
  }

  const { variants, ...data } = parsed.data;

  try {
    const product = await db.product.create({
      data: {
        ...data,
        publishedAt: data.isActive ? new Date() : undefined,
        variants: variants.length > 0 ? { create: variants } : undefined,
      },
      select: { id: true, slug: true, sku: true },
    });
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { success: false, error: { code: "DUPLICATE_FIELD", message: "Slug o SKU duplicado." } },
        { status: 409 }
      );
    }
    console.error("[admin/products POST]", err);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

