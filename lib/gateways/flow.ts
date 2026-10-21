/**
 * lib/gateways/flow.ts
 * ─────────────────────────────────────────────────────────────────
 * Integración con Flow.cl REST API v3.
 * Flow no tiene SDK oficial para Node.js → se usa fetch + firma HMAC-SHA256.
 * Documentación: https://www.flow.cl/app/web/api.php
 */

import crypto from "crypto";
import { db } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";

function isValidKey(val?: string | null): boolean {
  if (!val || typeof val !== "string") return false;
  const trimmed = val.trim();
  if (trimmed.length < 5) return false;
  const lower = trimmed.toLowerCase();
  const placeholders = ["tu_", "placeholder", "xxxx", "cambiar", "change_", "example"];
  return !placeholders.some((p) => lower.includes(p));
}

async function getFlowConfig() {
  try {
    noStore();
  } catch {
    // Silenciar si se ejecuta fuera del contexto de petición de Next.js
  }

  let apiKey = "";
  let secretKey = "";
  let env = "";
  let source = "none";

  // 1. PRIORIDAD MÁXIMA: Base de datos (SiteSettings id="global")
  try {
    const settings = await db.siteSettings.findUnique({
      where: { id: "global" },
      select: {
        flowApiKey: true,
        flowSecretKey: true,
        flowEnvironment: true,
      },
    });

    if (settings) {
      if (isValidKey(settings.flowApiKey)) {
        apiKey = settings.flowApiKey!.trim();
      }
      if (isValidKey(settings.flowSecretKey)) {
        secretKey = settings.flowSecretKey!.trim();
      }
      if (settings.flowEnvironment) {
        const dbEnv = settings.flowEnvironment.trim().toLowerCase();
        if (dbEnv === "production" || dbEnv === "sandbox") {
          env = dbEnv;
        }
      }
      if (apiKey && secretKey) {
        source = "database";
      }
    }
  } catch (err) {
    console.error("[flow] Error al consultar DB para llaves:", err);
  }

  // 2. FALLBACK: Si no hay llaves válidas en la DB, recurrir a variables de entorno (process.env)
  if (!apiKey && isValidKey(process.env.FLOW_API_KEY)) {
    apiKey = process.env.FLOW_API_KEY!.trim();
    source = "env";
  }
  if (!secretKey && isValidKey(process.env.FLOW_SECRET_KEY)) {
    secretKey = process.env.FLOW_SECRET_KEY!.trim();
  }
  if (!env) {
    const rawEnv = (process.env.FLOW_ENVIRONMENT ?? "").trim().toLowerCase();
    env = rawEnv === "production" ? "production" : "sandbox";
  }

  const baseUrl = env === "production"
    ? "https://www.flow.cl/api"
    : "https://sandbox.flow.cl/api";

  console.log(`[flow] Configuración Flow cargada desde [${source}] | Entorno: ${env} | BaseUrl: ${baseUrl}`);

  return { apiKey, secretKey, baseUrl, env };
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

  if (!isValidKey(apiKey)) {
    throw new Error("Flow.cl no está configurado (falta FLOW_API_KEY válida en el panel admin o .env).");
  }

  if (!isValidKey(secretKey)) {
    throw new Error("Flow.cl no está configurado (falta FLOW_SECRET_KEY válida en el panel admin o .env).");
  }

  // Sanitizar asunto: remover saltos de línea y caracteres problemáticos para la firma
  const cleanSubject = req.subject
    .replace(/[^\w\s\u00C0-\u017F\-\.:]/gi, "")
    .trim()
    .slice(0, 250);

  const params: Record<string, string> = {
    commerceOrder:   req.commerceOrder,
    subject:         cleanSubject,
    currency:        "CLP",
    amount:          String(Math.round(req.amount)),
    email:           req.email.trim(),
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
    cache:   "no-store",
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json || json.code || json.error) {
    const errorCode = json?.code ?? json?.error?.code ?? res.status;
    const errorMessage = json?.message ?? json?.error?.message ?? res.statusText ?? "Error desconocido de Flow";
    console.error(`[Flow createPayment error HTTP ${res.status}]`, json);
    throw new Error(`Flow API Error [${errorCode}]: ${errorMessage}`);
  }

  return {
    redirectUrl: `${json.url}?token=${json.token}`,
    token:       json.token,
    flowOrder:   json.flowOrder,
  };
}

export async function getFlowPaymentStatus(token: string): Promise<FlowStatusResponse> {
  const { apiKey, secretKey, baseUrl } = await getFlowConfig();

  if (!isValidKey(apiKey) || !isValidKey(secretKey)) {
    throw new Error("Flow.cl no está configurado para consultar estado de pago.");
  }

  const params: Record<string, string> = { apiKey, token };
  const signature = signParams(params, secretKey);
  const query     = new URLSearchParams({ ...params, s: signature }).toString();

  const res = await fetch(`${baseUrl}/payment/getStatus?${query}`, {
    method: "GET",
    cache:  "no-store",
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json || json.code || json.error) {
    const errorCode = json?.code ?? json?.error?.code ?? res.status;
    const errorMessage = json?.message ?? json?.error?.message ?? res.statusText ?? "Error desconocido al obtener estado de Flow";
    console.error(`[Flow getStatus error HTTP ${res.status}]`, json);
    throw new Error(`Flow getStatus Error [${errorCode}]: ${errorMessage}`);
  }

  return json as FlowStatusResponse;
}

export function isFlowApproved(status: FlowStatusResponse): boolean {
  return status.status === 2;
}
