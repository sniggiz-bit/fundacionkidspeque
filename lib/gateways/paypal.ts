/**
 * lib/gateways/paypal.ts
 * ─────────────────────────────────────────────────────────────────
 * Integración con PayPal Orders API v2 (REST directo — sin SDK).
 * Se usa para donaciones internacionales en USD.
 * Documentación: https://developer.paypal.com/docs/api/orders/v2/
 *
 * Flujo:
 *   1. getAccessToken() → token OAuth2 (cacheable por 9h)
 *   2. createOrder()    → devuelve { id, approveUrl } → redirigir al usuario
 *   3. Usuario aprueba en PayPal
 *   4. PayPal redirige al returnUrl con ?token=ORDER_ID&PayerID=XXXX
 *   5. captureOrder()   → captura el pago y lo confirma
 */

// ── Configuración ─────────────────────────────────────────────────────────────

const isProduction = process.env.PAYPAL_ENVIRONMENT === "live";

const PAYPAL_BASE_URL = isProduction
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

const CLIENT_ID     = process.env.PAYPAL_CLIENT_ID     ?? "";
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET ?? "";

// ── Caché del access token (evita llamadas innecesarias de auth) ──────────────

interface TokenCache {
  token:     string;
  expiresAt: number; // timestamp ms
}

let tokenCache: TokenCache | null = null;

async function getAccessToken(): Promise<string> {
  // Reutilizar si aún es válido (con 60s de margen)
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }

  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method:  "POST",
    headers: {
      Authorization:  `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`PayPal OAuth error: ${response.status}`);
  }

  const data = await response.json() as {
    access_token: string;
    expires_in:   number;
  };

  tokenCache = {
    token:     data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return tokenCache.token;
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface PayPalOrderResult {
  orderId:     string;
  approveUrl:  string; // URL donde el usuario aprueba el pago
}

export interface PayPalCaptureResult {
  orderId:        string;
  status:         "COMPLETED" | "SAVED" | "APPROVED" | "VOIDED" | "PAYER_ACTION_REQUIRED";
  amount:         number; // USD
  currency:       string;
  captureId:      string;
  payerEmail?:    string;
  payerName?:     string;
  createTime:     string;
  updateTime:     string;
}

// ── Funciones públicas ────────────────────────────────────────────────────────

/**
 * Crea una orden de PayPal.
 * El monto debe estar en USD. La fundación puede publicar la equivalencia CLP.
 *
 * @param amountUSD    Monto en USD (ej: 10.00)
 * @param donationId   ID interno de la donación (para correlación)
 * @param dreamTitle   Descripción que verá el donante en PayPal
 * @param returnUrl    URL de retorno exitoso
 * @param cancelUrl    URL de retorno si el usuario cancela
 */
export async function createPayPalOrder(
  amountUSD:  number,
  donationId: string,
  dreamTitle: string,
  returnUrl:  string,
  cancelUrl:  string
): Promise<PayPalOrderResult> {
  const token = await getAccessToken();

  // Redondear a 2 decimales (PayPal lo requiere)
  const formattedAmount = amountUSD.toFixed(2);

  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: donationId,
        description:  `Donación: ${dreamTitle}`.slice(0, 127), // máx 127 chars
        amount: {
          currency_code: "USD",
          value:         formattedAmount,
        },
        custom_id: donationId, // Para correlación en webhooks
      },
    ],
    application_context: {
      brand_name:          "Fundación Kidspeque",
      landing_page:        "LOGIN",
      shipping_preference: "NO_SHIPPING", // Donación, no requiere envío
      user_action:         "PAY_NOW",
      return_url:          returnUrl,
      cancel_url:          cancelUrl,
      locale:              "es-CL",
    },
  };

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": donationId, // Idempotencia
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal create order error ${response.status}: ${error}`);
  }

  const data = await response.json() as {
    id:    string;
    links: Array<{ rel: string; href: string }>;
  };

  const approveLink = data.links.find((l) => l.rel === "approve");
  if (!approveLink) throw new Error("PayPal: no se encontró el link de aprobación");

  return {
    orderId:    data.id,
    approveUrl: approveLink.href,
  };
}

/**
 * Captura el pago después de que el usuario aprueba la orden.
 * Debe llamarse UNA SOLA VEZ con el orderId.
 *
 * @param orderId  El ID de la orden PayPal (recibido en el query param ?token=)
 */
export async function capturePayPalOrder(
  orderId: string
): Promise<PayPalCaptureResult> {
  const token = await getAccessToken();

  const response = await fetch(
    `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
    {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal capture error ${response.status}: ${error}`);
  }

  const data = await response.json() as {
    id:             string;
    status:         PayPalCaptureResult["status"];
    update_time:    string;
    create_time:    string;
    purchase_units: Array<{
      payments: {
        captures: Array<{
          id:     string;
          amount: { value: string; currency_code: string };
          status: string;
        }>;
      };
    }>;
    payer?: {
      email_address?: string;
      name?: { given_name: string; surname: string };
    };
  };

  const capture = data.purchase_units[0]?.payments?.captures?.[0];
  if (!capture) throw new Error("PayPal: no se encontró el capture en la respuesta");

  return {
    orderId:    data.id,
    status:     data.status,
    amount:     parseFloat(capture.amount.value),
    currency:   capture.amount.currency_code,
    captureId:  capture.id,
    payerEmail: data.payer?.email_address,
    payerName:  data.payer?.name
      ? `${data.payer.name.given_name} ${data.payer.name.surname}`
      : undefined,
    createTime: data.create_time,
    updateTime: data.update_time,
  };
}

/**
 * Verifica un webhook de PayPal validando contra la API de PayPal.
 * PayPal recomienda validar en el servidor para mayor seguridad.
 */
export async function verifyPayPalWebhook(
  headers: Record<string, string>,
  rawBody: string
): Promise<boolean> {
  try {
    const token = await getAccessToken();

    const verifyBody = {
      auth_algo:         headers["paypal-auth-algo"],
      cert_url:          headers["paypal-cert-url"],
      transmission_id:   headers["paypal-transmission-id"],
      transmission_sig:  headers["paypal-transmission-sig"],
      transmission_time: headers["paypal-transmission-time"],
      webhook_id:        process.env.PAYPAL_WEBHOOK_ID,
      webhook_event:     JSON.parse(rawBody),
    };

    const response = await fetch(
      `${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`,
      {
        method:  "POST",
        headers: {
          Authorization:  `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(verifyBody),
      }
    );

    if (!response.ok) return false;
    const result = await response.json() as { verification_status: string };
    return result.verification_status === "SUCCESS";
  } catch {
    return false;
  }
}

export function isPayPalCaptureCompleted(result: PayPalCaptureResult): boolean {
  return result.status === "COMPLETED";
}
