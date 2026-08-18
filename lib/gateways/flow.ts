/**
 * lib/gateways/flow.ts
 * ─────────────────────────────────────────────────────────────────
 * Integración con Flow.cl REST API v3.
 * Flow no tiene SDK oficial para Node.js → se usa fetch + firma HMAC-SHA256.
 * Documentación: https://www.flow.cl/app/web/api.php
 */

import crypto from "crypto";
import { db } from "@/lib/db";

async function getFlowConfig() {
  let apiKey = process.env.FLOW_API_KEY ?? "";
  let secretKey = process.env.FLOW_SECRET_KEY ?? "";
  let env = process.env.FLOW_ENVIRONMENT ?? "sandbox";

  // Si env es placeholder o vacía, buscar en DB
  const isPlaceholder = (val: string) => !val || val.includes("tu_") || val.includes("placeholder");

  if (isPlaceholder(apiKey) || isPlaceholder(secretKey)) {
    try {
      const settings = await db.siteSettings.findUnique({ where: { id: "global" } });
      if (settings?.flowApiKey) apiKey = settings.flowApiKey;
      if (settings?.flowSecretKey) secretKey = settings.flowSecretKey;
      if (settings?.flowEnvironment) env = settings.flowEnvironment;
    } catch (err) {
      console.error("[flow] Error al consultar DB para llaves:", err);
    }
  }

  const baseUrl = env === "production"
    ? "https://www.flow.cl/api"
    : "https://sandbox.flow.cl/api";

  return { apiKey, secretKey, baseUrl };
}

function signParams(params: Record<string, string>, secretKey: string): string {
  const sorted  = Object.keys(params).sort();
  const message = sorted.map((k) => `${k}${params[k]}`).join("");
  return crypto
    .createHmac("sha256", secretKey)
    .update(message)
    .digest("hex");
}

function buildSignedForm(params: Record<string, string>, apiKey: string, secretKey: string): URLSearchParams {
  const allParams: Record<string, string> = { ...params, apiKey };
  const signature = signParams(allParams, secretKey);
  return new URLSearchParams({ ...allParams, s: signature });
}

export interface FlowPaymentRequest {
  commerceOrder:   string;
  subject:         string;
  amount:          number;
  email:           string;
  returnUrl:       string;
  confirmationUrl: string;
  optional?:       string;
}

export interface FlowPaymentResponse {
  url:   string;
  token: string;
  flowOrder: number;
}

export interface FlowStatusResponse {
  flowOrder:     number;
  commerceOrder: string;
  requestDate:   string;
  status:        number; // 1=pendiente, 2=pagado, 3=rechazado, 4=anulado
  subject:       string;
  currency:      string;
  amount:        number;
  payer:         string;
  paymentData?: {
    date:   string;
    media:  string;
    conversionDate: string;
    conversionRate: number;
    amount: number;
    currency: string;
    fee: number;
    balance: number;
  };
}

export async function createFlowPayment(req: FlowPaymentRequest): Promise<{ redirectUrl: string; token: string; flowOrder: number }> {
  const { apiKey, secretKey, baseUrl } = await getFlowConfig();

  if (!apiKey || apiKey.includes("tu_")) {
    throw new Error("Flow.cl no está configurado (falta API Key en el panel admin o .env).");
  }

  const params: Record<string, string> = {
    commerceOrder:   req.commerceOrder,
    subject:         req.subject,
    currency:        "CLP",
    amount:          String(Math.round(req.amount)),
    email:           req.email,
    urlConfirmation: req.confirmationUrl,
    urlReturn:       req.returnUrl,
  };

  if (req.optional) {
    params.optional = req.optional;
  }

  const body = buildSignedForm(params, apiKey, secretKey);

  const res = await fetch(`${baseUrl}/payment/create`, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    body.toString(),
  });

  const json = await res.json();

  if (!res.ok || json.code) {
    console.error("[Flow createPayment error]", json);
    throw new Error(`Flow API Error [${json.code}]: ${json.message}`);
  }

  return {
    redirectUrl: `${json.url}?token=${json.token}`,
    token:       json.token,
    flowOrder:   json.flowOrder,
  };
}

export async function getFlowPaymentStatus(token: string): Promise<FlowStatusResponse> {
  const { apiKey, secretKey, baseUrl } = await getFlowConfig();

  const params: Record<string, string> = { apiKey, token };
  const signature = signParams(params, secretKey);
  const query     = new URLSearchParams({ ...params, s: signature }).toString();

  const res = await fetch(`${baseUrl}/payment/getStatus?${query}`, {
    method: "GET",
  });

  const json = await res.json();

  if (!res.ok || json.code) {
    console.error("[Flow getStatus error]", json);
    throw new Error(`Flow getStatus Error [${json.code}]: ${json.message}`);
  }

  return json as FlowStatusResponse;
}

export function isFlowApproved(status: FlowStatusResponse): boolean {
  return status.status === 2;
}
