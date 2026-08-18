/**
 * GET    /api/admin/products/[id]
 * PUT    /api/admin/products/[id]
 * DELETE /api/admin/products/[id]
 */

import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
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

const productUpdateSchema = z.object({
  name:             z.string().min(3).max(200).optional(),
  slug:             z.string().min(3).max(250).regex(/^[a-z0-9-]+$/).optional(),
  description:      z.string().min(20).optional(),
  shortDescription: z.string().min(10).max(120).optional(),
  category:         z.enum(["ropa_organica", "delantales", "pantalones", "accesorios", "kits"]).optional(),
  tags:             z.array(z.string()).optional(),
  price:            z.number().int().min(1000).optional(),
  compareAtPrice:   z.number().int().nullable().optional(),
  costPerItem:      z.number().int().nullable().optional(),
  stock:            z.number().int().min(0).optional(),
  trackInventory:   z.boolean().optional(),
  images:           z.array(z.object({ url: z.string().url(), alt: z.string(), width: z.number(), height: z.number() })).optional(),
  impactDescription: z.string().min(10).optional(),
  relatedDreamId:   z.string().uuid().nullable().optional(),
  metaTitle:        z.string().max(60).nullable().optional(),
  metaDescription:  z.string().max(160).nullable().optional(),
  isActive:         z.boolean().optional(),
  isFeatured:       z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const product = await db.product.findUnique({
    where: { id: params.id },
    include: { variants: true },
  });
  if (!product) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ success: true, data: product });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  const body   = await request.json().catch(() => null);
  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors } },
      { status: 422 }
    );
  }

  try {
    const product = await db.product.update({
      where:  { id: params.id },
      data:   parsed.data,
      select: { id: true, slug: true, sku: true, updatedAt: true },
    });
    return NextResponse.json({ success: true, data: product });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json({ success: false, error: { code: "DUPLICATE_FIELD", message: "Slug o SKU duplicado." } }, { status: 409 });
    }
    if ((err as { code?: string }).code === "P2025") {
      return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
    }
    console.error("[admin/products PUT]", err);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  // Verificar si tiene órdenes
  const orderCount = await db.orderItem.count({ where: { productId: params.id } });
  if (orderCount > 0) {
    return NextResponse.json(
      { success: false, error: { code: "HAS_ORDERS", message: "No puedes eliminar un producto con pedidos. Desactívalo en su lugar." } },
      { status: 409 }
    );
  }

  try {
    await db.product.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2025") {
      return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
    }
    console.error("[admin/products DELETE]", err);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
