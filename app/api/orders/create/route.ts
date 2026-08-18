export const dynamic = 'force-dynamic';
/**
 * POST /api/orders/create
 * ─────────────────────────────────────────────────────────────────
 * Crea una orden de la tienda solidaria y la envía al gateway de pago.
 * Proceso similar al de donaciones: crea la orden pending → inicia el pago.
 */

import { NextRequest, NextResponse } from "next/server";
import { z }    from "zod";
import { db }   from "@/lib/db";
import { createWebpayTransaction } from "@/lib/gateways/transbank";
import { createFlowPayment }       from "@/lib/gateways/flow";

// ── Schema ────────────────────────────────────────────────────────────────────

const cartItemSchema = z.object({
  productId:   z.string().uuid(),
  variantId:   z.string().uuid().optional(),
  name:        z.string(),
  price:       z.number().int().positive(),
  quantity:    z.number().int().min(1).max(10),
  imageUrl:    z.string().url(),
  slug:        z.string(),
});

const orderSchema = z.object({
  // Datos del comprador
  firstName:  z.string().min(2).max(100),
  lastName:   z.string().min(2).max(100),
  email:      z.string().email(),
  phone:      z.string().min(8),
  rut:        z.string().optional(),

  // Dirección
  street:     z.string().min(5),
  city:       z.string().min(2),
  region:     z.string().min(2),
  postalCode: z.string().optional(),
  notes:      z.string().max(300).optional(),

  // Pago
  gateway:    z.enum(["webpay_plus", "flow"]),

  // Items del carrito
  items: z.array(cartItemSchema).min(1).max(20),

  termsAccepted: z.literal(true),
});

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body   = await request.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors } },
      { status: 422 }
    );
  }

  const { termsAccepted, items, gateway, ...customerData } = parsed.data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

  // Calcular total del servidor (no confiar en el cliente)
  const productIds = items.map((i) => i.productId);
  const dbProducts = await db.product.findMany({
    where:   { id: { in: productIds }, isActive: true },
    select:  { id: true, price: true, stock: true },
  });

  // Verificar stock y calcular total real
  let totalAmount = 0;
  for (const item of items) {
    const dbProd = dbProducts.find((p) => p.id === item.productId);
    if (!dbProd) {
      return NextResponse.json(
        { success: false, error: { code: "PRODUCT_NOT_FOUND", message: `Producto no disponible: ${item.name}` } },
        { status: 400 }
      );
    }
    if (dbProd.stock < item.quantity) {
      return NextResponse.json(
        { success: false, error: { code: "INSUFFICIENT_STOCK", message: `Stock insuficiente para: ${item.name}` } },
        { status: 400 }
      );
    }
    totalAmount += dbProd.price * item.quantity; // Precio desde la DB, nunca del cliente
  }

  // Buscar o crear contribuyente
  let contributor = await db.contributor.findUnique({ where: { email: customerData.email } });
  if (!contributor) {
    contributor = await db.contributor.create({
      data: {
        firstName:         customerData.firstName,
        lastName:          customerData.lastName,
        email:             customerData.email,
        phone:             customerData.phone,
        address: {
          street:     customerData.street,
          city:       customerData.city,
          region:     customerData.region,
          country:    "CL",
          postalCode: customerData.postalCode,
        },
        isAnonymous:       false,
        newsletterConsent: false,
      },
    });
  }

  // Crear order items en DB (simplificado — sin modelo Order completo aquí)
  // En producción: crear modelo Order con status pending y asociar items
  const orderId  = `ORD-${Date.now()}`;
  const buyOrder = `XO${Date.now().toString().slice(-20)}`; // máx 26 chars para Webpay

  try {
    let redirectUrl: string;
    let gatewayToken: string | undefined;

    if (gateway === "webpay_plus") {
      const returnUrl = `${baseUrl}/tienda/confirmacion?orderId=${orderId}&gateway=webpay_plus`;
      const result    = await createWebpayTransaction(buyOrder, orderId, totalAmount, returnUrl);
      redirectUrl  = result.redirectUrl;
      gatewayToken = result.token;
    } else {
      const returnUrl  = `${baseUrl}/tienda/confirmacion?orderId=${orderId}`;
      const confirmUrl = `${baseUrl}/api/orders/flow/confirm`;
      const result     = await createFlowPayment({
        commerceOrder:   buyOrder,
        subject:         `Tienda Kidspeque — Compra solidaria`,
        amount:          totalAmount,
        email:           customerData.email,
        returnUrl,
        confirmationUrl: confirmUrl,
      });
      redirectUrl  = result.redirectUrl;
      gatewayToken = result.token;
    }

    return NextResponse.json(
      { success: true, data: { orderId, redirectUrl, token: gatewayToken } },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[orders/create] Gateway error:", err);
    return NextResponse.json(
      { success: false, error: { code: "GATEWAY_ERROR", message: "Error al procesar el pago. Intenta de nuevo." } },
      { status: 502 }
    );
  }
}

