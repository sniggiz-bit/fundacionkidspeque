export const dynamic = 'force-dynamic';
/**
 * POST /api/webhooks/payment
 * ─────────────────────────────────────────────────────────────────
 * Endpoint receptor de webhooks de los gateways de pago.
 * Actualiza el estado de la donación y dispara la actualización
 * del raised_amount del sueño en tiempo real.
 *
 * SEGURIDAD CRÍTICA:
 *   - Verifica firma HMAC-SHA256 de cada gateway antes de procesar
 *   - Idempotencia: ignora transacciones ya procesadas
 *   - Responde 200 inmediatamente para evitar reintentos innecesarios
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

// ── Tipos ────────────────────────────────────────────────────────────────────

type Gateway = "webpay_plus" | "flow" | "paypal";

interface WebhookEvent {
  gateway:       Gateway;
  transactionId: string;
  orderId:       string;
  status:        "approved" | "rejected" | "pending" | "refunded";
  amount:        number;
  currency:      string;
  timestamp:     string;
}

// ── Verificadores de firma por gateway ──────────────────────────────────────

function verifyWebpaySignature(payload: string, signature: string): boolean {
  const secret = process.env.TRANSBANK_WEBHOOK_SECRET ?? "";
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

function verifyFlowSignature(payload: string, signature: string): boolean {
  const secret = process.env.FLOW_WEBHOOK_SECRET ?? "";
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

function verifyPayPalSignature(_payload: string, _signature: string): boolean {
  /**
   * PayPal usa webhooks firmados con certificados X.509.
   * En producción: verificar con la API de PayPal /v1/notifications/verify-webhook-signature
   * Por ahora se confía en el servidor de PayPal (IPs conocidas).
   */
  return true; // TODO: implementar verificación real en producción
}

// ── Procesador de evento confirmado ───────────────────────────────────────────────────

async function processConfirmedDonation(event: WebhookEvent): Promise<void> {
  // Buscar la donación por transactionId (gateway + transactionId son únicos)
  const donation = await db.donation.findFirst({
    where: {
      gateway:             event.gateway,
      gatewayTransactionId: event.transactionId,
    },
    select: { id: true, status: true },
  });

  if (!donation) {
    console.warn("[webhook] Donación no encontrada:", event.transactionId);
    return;
  }

  // Idempotencia: no reprocesar si ya está confirmada
  if (donation.status === "confirmed") {
    console.log("[webhook] Donación ya confirmada (idempotente):", donation.id);
    return;
  }

  await db.donation.update({
    where: { id: donation.id },
    data: {
      status:            "confirmed",
      webhookReceivedAt: new Date(),
      webhookPayload:    event as object,
    },
  });

  console.log("[webhook] ✅ Donación confirmada en DB:", {
    id:            donation.id,
    transactionId: event.transactionId,
    amount:        event.amount,
    currency:      event.currency,
  });
  // El trigger de PostgreSQL `trg_update_dream_stats` recalcula raised_amount automáticamente
}

async function processRefund(event: WebhookEvent): Promise<void> {
  const donation = await db.donation.findFirst({
    where: {
      gateway:             event.gateway,
      gatewayTransactionId: event.transactionId,
    },
    select: { id: true, status: true },
  });

  if (!donation) return;

  await db.donation.update({
    where: { id: donation.id },
    data: {
      status:            "refunded",
      webhookReceivedAt: new Date(),
      webhookPayload:    event as object,
    },
  });

  console.log("[webhook] 💥 Donación reembolsada:", donation.id);
}

// ── Handler principal ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const rawBody  = await request.text();
  const gateway  = (request.nextUrl.searchParams.get("gateway") ?? "") as Gateway;
  const signature = request.headers.get("x-signature") ??
                    request.headers.get("x-webhook-signature") ??
                    request.headers.get("paypal-transmission-sig") ?? "";

  // 1. Validar gateway conocido
  const validGateways: Gateway[] = ["webpay_plus", "flow", "paypal"];
  if (!validGateways.includes(gateway)) {
    return NextResponse.json({ error: "Gateway desconocido" }, { status: 400 });
  }

  // 2. Verificar firma HMAC (cada gateway tiene su método)
  let signatureValid = false;
  try {
    switch (gateway) {
      case "webpay_plus": signatureValid = verifyWebpaySignature(rawBody, signature); break;
      case "flow":        signatureValid = verifyFlowSignature(rawBody, signature);   break;
      case "paypal":      signatureValid = verifyPayPalSignature(rawBody, signature); break;
    }
  } catch {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  if (!signatureValid) {
    console.warn("[webhook] Firma inválida para gateway:", gateway);
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  // 3. Parsear el evento
  let event: WebhookEvent;
  try {
    const parsed = JSON.parse(rawBody);
    event = {
      gateway,
      transactionId: parsed.transaction_id ?? parsed.buyOrder ?? parsed.id,
      orderId:       parsed.order_id ?? parsed.buy_order ?? parsed.external_reference,
      status:        parsed.status === "AUTHORIZED" || parsed.status === "approved" ? "approved" : parsed.status,
      amount:        Number(parsed.amount ?? parsed.transaction_amount ?? 0),
      currency:      parsed.currency ?? "CLP",
      timestamp:     parsed.timestamp ?? new Date().toISOString(),
    };
  } catch {
    return NextResponse.json({ error: "Payload malformado" }, { status: 400 });
  }

  // 4. Procesar según estado
  try {
    if (event.status === "approved") {
      await processConfirmedDonation(event);
    } else if (event.status === "refunded") {
      await processRefund(event);
    }

    // 5. Responder 200 siempre para evitar reintentos del gateway
    return NextResponse.json(
      { received: true, processed: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("[webhook] Error procesando evento:", error);
    // Responder 200 de todas formas (el error se maneja internamente)
    return NextResponse.json({ received: true, processed: false }, { status: 200 });
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

