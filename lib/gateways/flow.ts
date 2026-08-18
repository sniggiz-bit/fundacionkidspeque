/**
 * lib/gateways/flow.ts
 * ─────────────────────────────────────────────────────────────────
 * Integración con Flow.cl REST API v3.
 * Flow no tiene SDK oficial para Node.js → se usa fetch + firma HMAC-SHA256.
 * Documentación: https://www.flow.cl/app/web/api.php
 *
 * Flujo:
 *   1. createPayment() → devuelve { url, token } → redirigir al usuario
 *   2. Usuario paga en el portal de Flow
 *   3. Flow POST al confirmationUrl (webhook) y GET al returnUrl
 *   4. getPaymentStatus(token) → confirmar estado
 */

import crypto from "crypto";

// ── Configuración ─────────────────────────────────────────────────────────────

const BASE_URL =
  process.env.FLOW_ENVIRONMENT === "production"
    ? "https://www.flow.cl/api"
    : "https://sandbox.flow.cl/api";

const API_KEY    = process.env.FLOW_API_KEY    ?? "";
const SECRET_KEY = process.env.FLOW_SECRET_KEY ?? "";

// ── Firma HMAC-SHA256 ─────────────────────────────────────────────────────────

/**
 * Flow requiere que todos los parámetros sean firmados con HMAC-SHA256.
 * Los parámetros se ordenan alfabéticamente y se concatenan como k+v.
 */
function signParams(params: Record<string, string>): string {
  const sorted  = Object.keys(params).sort();
  const message = sorted.map((k) => `${k}${params[k]}`).join("");
  return crypto
    .createHmac("sha256", SECRET_KEY)
    .update(message)
    .digest("hex");
}

/**
 * Construye un FormData firmado para las llamadas a Flow.
 */
function buildSignedForm(params: Record<string, string>): URLSearchParams {
  const allParams: Record<string, string> = { ...params, apiKey: API_KEY };
  const signature = signParams(allParams);
  const form      = new URLSearchParams({ ...allParams, s: signature });
  return form;
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface FlowPaymentRequest {
  commerceOrder: string;  // ID interno de tu sistema (máx 40 chars)
  subject:       string;  // Descripción del pago (máx 255 chars)
  amount:        number;  // CLP (entero)
  email:         string;  // Email del pagador
  returnUrl:     string;  // URL de retorno al usuario
  confirmationUrl: string; // URL que recibe el webhook POST de confirmación
  currency?:     "CLP";
  optional?:     string;  // JSON string con datos extra (máx 300 chars)
}

export interface FlowPaymentResponse {
  url:   string; // URL base del portal de pago
  token: string; // Token único de la transacción
  redirectUrl: string; // url?token=token → redirigir al usuario
}

export interface FlowPaymentStatus {
  flowOrder:      number;
  commerceOrder:  string;
  requestDate:    string;
  status:         1 | 2 | 3 | 4; // 1=pendiente, 2=pagado, 3=rechazado, 4=anulado
  subject:        string;
  currency:       string;
  amount:         number;
  payer:          string;
  optional?:      string;
  pendingInfo?:   { media: string; date: string };
  paymentData?:   {
    date:           string;
    media:          string;
    conversionDate: string;
    conversionRate: number;
    amount:         number;
    currency:       string;
    fee:            number;
    balance:        number;
    transferDate:   string;
  };
  merchantId?:    string;
}

// ── Funciones públicas ────────────────────────────────────────────────────────

/**
 * Crea un pago en Flow y devuelve la URL de redirección.
 */
export async function createFlowPayment(
  request: FlowPaymentRequest
): Promise<FlowPaymentResponse> {
  const params: Record<string, string> = {
    commerceOrder:   request.commerceOrder,
    subject:         request.subject,
    amount:          String(Math.round(request.amount)),
    email:           request.email,
    urlReturn:       request.returnUrl,
    urlConfirmation: request.confirmationUrl,
    currency:        request.currency ?? "CLP",
  };

  if (request.optional) {
    params.optional = request.optional;
  }

  const form     = buildSignedForm(params);
  const response = await fetch(`${BASE_URL}/payment/create`, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    form.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Flow API error ${response.status}: ${error}`);
  }

  const data = await response.json() as { url: string; token: string; code?: number; message?: string };

  if (data.code && data.code !== 200) {
    throw new Error(`Flow error ${data.code}: ${data.message}`);
  }

  return {
    url:         data.url,
    token:       data.token,
    redirectUrl: `${data.url}?token=${data.token}`,
  };
}

/**
 * Obtiene el estado de un pago por su token.
 * Llamar desde el webhook de confirmación para verificar el pago.
 */
export async function getFlowPaymentStatus(
  token: string
): Promise<FlowPaymentStatus> {
  const params   = buildSignedForm({ token });
  const response = await fetch(
    `${BASE_URL}/payment/getStatus?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Flow status error: ${response.status}`);
  }

  return response.json() as Promise<FlowPaymentStatus>;
}

/**
 * Verifica la firma recibida en el webhook de confirmación de Flow.
 * Flow envía el token como parámetro POST, no una firma HMAC directamente.
 * La verificación consiste en consultar el estado del pago con ese token.
 */
export async function verifyFlowWebhook(
  token: string
): Promise<FlowPaymentStatus | null> {
  try {
    const status = await getFlowPaymentStatus(token);
    return status;
  } catch {
    return null;
  }
}

/** status === 2 significa pagado exitosamente */
export function isFlowApproved(status: FlowPaymentStatus): boolean {
  return status.status === 2;
}
