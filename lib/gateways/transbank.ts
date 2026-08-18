/**
 * lib/gateways/transbank.ts
 * ─────────────────────────────────────────────────────────────────
 * Integración real con Transbank Webpay Plus SDK oficial.
 * npm: transbank-sdk v6.x
 *
 * Flujo completo:
 *   1. create()   → devuelve { token, url } → redirigir al usuario
 *   2. Usuario paga en el portal de Transbank
 *   3. Transbank POST al returnUrl con token_ws
 *   4. commit()   → confirma la transacción y devuelve el estado final
 *   5. status()   → consultar el estado en cualquier momento
 */

import {
  WebpayPlus,
  Options,
  IntegrationApiKeys,
  IntegrationCommerceCodes,
  Environment,
} from "transbank-sdk";

// ── Configuración según entorno ──────────────────────────────────────────────

const isProduction = process.env.TRANSBANK_ENVIRONMENT === "production";

// En producción se usan las credenciales reales del comercio.
// En integración se usan las credenciales de sandbox de Transbank.
const transbankOptions = isProduction
  ? new Options(
      process.env.TRANSBANK_COMMERCE_CODE!,
      process.env.TRANSBANK_API_KEY!,
      Environment.Production
    )
  : new Options(
      IntegrationCommerceCodes.WEBPAY_PLUS,
      IntegrationApiKeys.WEBPAY,
      Environment.Integration
    );

// Instancia del cliente (singleton)
const tx = new WebpayPlus.Transaction(transbankOptions);

// ── Tipos de resultado ────────────────────────────────────────────────────────

export interface TransbankInitResult {
  token:       string;
  redirectUrl: string; // URL completa para redirigir al usuario
}

export interface TransbankCommitResult {
  vci:              string;   // Resultado de la autenticación (ECI)
  amount:           number;
  status:           "AUTHORIZED" | "FAILED" | "NULLIFIED" | "PARTIALLY_NULLIFIED" | "REVERSED";
  buyOrder:         string;
  sessionId:        string;
  cardDetail:       { cardNumber: string }; // Solo los últimos 4 dígitos
  accountingDate:   string;
  transactionDate:  string;
  authorizationCode: string;
  paymentTypeCode:  string;   // VD=débito, VN=crédito sin cuotas, VC=crédito con cuotas
  responseCode:     number;   // 0 = aprobado
  installmentsAmount?: number;
  installmentsNumber?: number;
  balance?:         number;
}

// ── Funciones públicas ────────────────────────────────────────────────────────

/**
 * Inicia una transacción Webpay Plus.
 * Llámala al crear la donación pendiente en la DB.
 *
 * @param buyOrder    ID único de la orden (máx 26 alfanuméricos, sin espacios)
 * @param sessionId   ID de sesión (máx 61 caracteres — puede ser el donationId)
 * @param amount      Monto en CLP (entero, sin decimales)
 * @param returnUrl   URL a la que Transbank redirigirá al usuario tras el pago
 */
export async function createWebpayTransaction(
  buyOrder:  string,
  sessionId: string,
  amount:    number,
  returnUrl: string
): Promise<TransbankInitResult> {
  // Validar que el monto es un entero positivo (CLP no tiene decimales)
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`Monto inválido para Webpay: ${amount}. Debe ser un entero positivo.`);
  }

  const response = await tx.create(buyOrder, sessionId, amount, returnUrl);

  return {
    token:       response.token,
    redirectUrl: `${response.url}?token_ws=${response.token}`,
  };
}

/**
 * Confirma la transacción después de que el usuario regresa del portal de pago.
 * Debe llamarse UNA SOLA VEZ por token. Webpay invalida el token tras el commit.
 *
 * @param token  El token_ws recibido como query param en el returnUrl
 */
export async function commitWebpayTransaction(
  token: string
): Promise<TransbankCommitResult> {
  const response = await tx.commit(token);
  return response as TransbankCommitResult;
}

/**
 * Consulta el estado de una transacción ya confirmada.
 * Útil para reconciliación y reportes.
 *
 * @param token  El token_ws de la transacción
 */
export async function getWebpayStatus(token: string) {
  return tx.status(token);
}

/**
 * Anula (reversa) una transacción autorizada.
 * Solo disponible dentro del mismo día contable (antes del cierre).
 *
 * En v6 del SDK el primer parámetro es el TOKEN de la transacción,
 * no el buyOrder (cambio de API respecto a versiones anteriores).
 *
 * @param token   Token de la transacción a anular (token_ws)
 * @param amount  Monto a anular en CLP (entero)
 */
export async function refundWebpayTransaction(
  token:  string,
  amount: number
) {
  return tx.refund(token, amount);
}

/**
 * Verifica que una respuesta de Webpay es legítima.
 * responseCode === 0 significa transacción autorizada.
 */
export function isWebpayApproved(result: TransbankCommitResult): boolean {
  return (
    result.status === "AUTHORIZED" &&
    result.responseCode === 0
  );
}
