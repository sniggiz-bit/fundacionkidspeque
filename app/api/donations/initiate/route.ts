export const dynamic = 'force-dynamic';
/**
 * POST /api/donations/initiate
 * ─────────────────────────────────────────────────────────────────
 * Punto de entrada del flujo de donación.
 * Valida → crea registro pending en DB → inicia el gateway → devuelve redirectUrl.
 *
 * Gateways:
 *   webpay_plus  → Transbank SDK real  (CLP)
 *   flow         → Flow REST API       (CLP)
 *   paypal       → PayPal Orders v2    (USD)
 */

import { NextRequest, NextResponse } from "next/server";
import { z }    from "zod";
import { db }   from "@/lib/db";
import crypto   from "crypto";

import { createWebpayTransaction }  from "@/lib/gateways/transbank";
import { createFlowPayment }        from "@/lib/gateways/flow";
import { createPayPalOrder }        from "@/lib/gateways/paypal";

// ── Schema de validación ──────────────────────────────────────────────────────

const initiateSchema = z.object({
  dreamId:   z.string().min(1).max(20),
  amount:    z.number().int().min(1000).max(10_000_000),
  currency:  z.enum(["CLP", "USD"]).default("CLP"),
  gateway:   z.enum(["webpay_plus", "flow", "paypal"]),

  // Datos del donante
  firstName:         z.string().min(2).max(100),
  lastName:          z.string().min(2).max(100),
  email:             z.string().email(),
  rut:               z.string().optional(),
  isAnonymous:       z.boolean().default(false),
  newsletterConsent: z.boolean().default(false),
  message:           z.string().max(500).optional(),
  isPublic:          z.boolean().default(true),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Genera un buyOrder compatible con Webpay (máx 26 chars alfanumérico) */
function makeBuyOrder(donationId: string): string {
  return `XU${donationId.replace(/-/g, "").slice(0, 24).toUpperCase()}`;
}

/** Hashea la IP con SHA-256 para auditoría sin almacenar el dato real */
function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Verificar origen CSRF
  const origin  = request.headers.get("origin") ?? "";
  const allowed = [
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001",
    "https://www.kidspeque.cl",
    "https://kidspeque.cl",
  ];
  if (origin && !allowed.includes(origin)) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN" } },
      { status: 403 }
    );
  }

  // 2. Parsear y validar
  const body   = await request.json().catch(() => null);
  const parsed = initiateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors } },
      { status: 422 }
    );
  }

  const data        = parsed.data;
  const baseUrl     = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
  const ipRaw       = request.headers.get("x-forwarded-for") ?? "unknown";
  const ipHash      = hashIp(ipRaw);

  // 3. Buscar o crear el Contributor
  let contributor = await db.contributor.findUnique({ where: { email: data.email } });

  if (!contributor) {
    contributor = await db.contributor.create({
      data: {
        firstName:         data.firstName,
        lastName:          data.lastName,
        email:             data.email,
        isAnonymous:       data.isAnonymous,
        newsletterConsent: data.newsletterConsent,
        consentDate:       data.newsletterConsent ? new Date() : null,
        ipAddressHash:     ipHash,
      },
    });
  }

  // 4. Buscar el Dream por publicId
  const dream = await db.dream.findUnique({
    where:  { publicId: data.dreamId },
    select: { id: true, title: true, status: true },
  });

  if (!dream || dream.status !== "active") {
    return NextResponse.json(
      { success: false, error: { code: "DREAM_NOT_ACTIVE", message: "Este sueño no está activo" } },
      { status: 400 }
    );
  }

  // 5. Crear donación con status "pending"
  const donation = await db.donation.create({
    data: {
      contributorId:       contributor.id,
      dreamId:             dream.id,
      amount:              data.amount,
      currency:            data.currency,
      amountInCLP:         data.currency === "CLP" ? data.amount : 0, // PayPal actualiza tras captura
      gateway:             data.gateway,
      gatewayTransactionId: `pending_${Date.now()}`, // Placeholder — se actualiza tras commit
      status:              "pending",
      taxDeductible:       data.currency === "CLP",
      message:             data.message,
      isPublic:            data.isPublic,
      displayName:         data.isAnonymous
                             ? "Donante anónimo/a"
                             : `${data.firstName} ${data.lastName[0]}.`,
      ipAddressHash:       ipHash,
    },
    select: { id: true },
  });

  const donationId = donation.id;
  const buyOrder   = makeBuyOrder(donationId);

  // 6. Iniciar transacción en el gateway
  try {
    let redirectUrl: string;
    let gatewayToken: string | undefined;

    switch (data.gateway) {
      // ── Transbank Webpay Plus ──────────────────────────────────────────────
      case "webpay_plus": {
        const returnUrl = `${baseUrl}/api/donations/webpay/return`;
        const result = await createWebpayTransaction(
          buyOrder,
          donationId,
          data.amount,
          returnUrl
        );
        redirectUrl  = result.redirectUrl;
        gatewayToken = result.token;

        // Guardar el token de Webpay para el commit
        await db.donation.update({
          where: { id: donationId },
          data:  { gatewayOrderId: result.token },
        });
        break;
      }

      // ── Flow.cl ────────────────────────────────────────────────────────────
      case "flow": {
        const returnUrl      = `${baseUrl}/donacion/confirmacion?id=${donationId}`;
        const confirmUrl     = `${baseUrl}/api/donations/flow/confirm`;

        const result = await createFlowPayment({
          commerceOrder:   buyOrder,
          subject:         `Donación Fundación Kidspeque — ${dream.title}`.slice(0, 255),
          amount:          data.amount,
          email:           data.email,
          returnUrl,
          confirmationUrl: confirmUrl,
          optional:        JSON.stringify({ donationId }), // Para correlación en webhook
        });
        redirectUrl  = result.redirectUrl;
        gatewayToken = result.token;

        await db.donation.update({
          where: { id: donationId },
          data:  {
            gatewayTransactionId: result.token,
            gatewayOrderId:       buyOrder,
          },
        });
        break;
      }

      // ── PayPal (USD) ───────────────────────────────────────────────────────
      case "paypal": {
        const returnUrl = `${baseUrl}/api/donations/paypal/capture?donationId=${donationId}`;
        const cancelUrl = `${baseUrl}/donacion/cancelada?id=${donationId}`;

        const result = await createPayPalOrder(
          data.amount / 100, // convertir centavos a USD si es necesario — o usar monto directo en USD
          donationId,
          dream.title,
          returnUrl,
          cancelUrl
        );
        redirectUrl  = result.approveUrl;
        gatewayToken = result.orderId;

        await db.donation.update({
          where: { id: donationId },
          data:  {
            gatewayTransactionId: result.orderId,
            gatewayOrderId:       buyOrder,
          },
        });
        break;
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          donationId,
          redirectUrl,
          token:     gatewayToken,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (err) {
    // Si el gateway falla, marcar la donación como failed
    await db.donation.update({
      where: { id: donationId },
      data:  { status: "failed" },
    }).catch(() => {}); // silenciar errores de DB aquí

    console.error(`[donations/initiate] Gateway ${data.gateway} error:`, err);
    return NextResponse.json(
      { success: false, error: { code: "GATEWAY_ERROR", message: "Error al conectar con el proveedor de pago. Intenta de nuevo." } },
      { status: 502 }
    );
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

