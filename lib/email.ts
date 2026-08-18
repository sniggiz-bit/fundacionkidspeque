/**
 * lib/email.ts
 * Servicio de email transaccional con Resend.
 * Envía recibos de donación y confirmaciones de registro.
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.EMAIL_FROM ?? "Fundación Kidspeque <notificaciones@kidspeque.cl>";
const APP    = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface DonationEmailData {
  to:           string;
  donorName:    string;
  dreamTitle:   string;
  amount:       number;   // CLP
  gateway:      string;
  receiptNumber?: string;
  donationId:   string;
}

export interface VolunteerEmailData {
  to:         string;
  firstName:  string;
  type:       string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fCLP(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
  }).format(n);
}

const GATEWAY_LABELS: Record<string, string> = {
  webpay_plus: "Transbank Webpay Plus",
  flow:        "Flow.cl",
  paypal:      "PayPal",
};

// ── Templates ─────────────────────────────────────────────────────────────────

function donationReceiptHtml(d: DonationEmailData): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Inter,-apple-system,sans-serif;background:#0a0a0a;margin:0;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#171717;border-radius:16px;overflow:hidden;border:1px solid #262626">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4f46e5,#3730a3);padding:32px 32px 24px">
      <div style="width:44px;height:44px;background:rgba(255,255,255,0.15);border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:16px">
        <span style="color:white;font-size:22px;font-weight:900">X</span>
      </div>
      <h1 style="color:white;font-size:22px;font-weight:700;margin:0 0 6px">¡Gracias por donar, ${d.donorName}!</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0">Tu donación está cambiando una vida.</p>
    </div>

    <!-- Cuerpo -->
    <div style="padding:32px">

      <!-- Sueño apoyado -->
      <div style="background:#1f1f1f;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin-bottom:24px">
        <p style="color:#737373;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin:0 0 8px">Sueño apoyado</p>
        <p style="color:white;font-size:15px;font-weight:600;margin:0">${d.dreamTitle}</p>
      </div>

      <!-- Detalles del pago -->
      <table style="width:100%;border-collapse:collapse">
        ${(
          [
            ["Monto donado",  `<strong style='color:#818cf8'>${fCLP(d.amount)}</strong>`],
            ["Medio de pago", GATEWAY_LABELS[d.gateway] ?? d.gateway],
            ...(d.receiptNumber ? [["N° Recibo", d.receiptNumber]] : []),
          ] as [string, string][]
        ).map(([label, value]) => `
          <tr>
            <td style="color:#737373;font-size:13px;padding:8px 0;border-bottom:1px solid #262626">${label}</td>
            <td style="color:#d4d4d4;font-size:13px;padding:8px 0;border-bottom:1px solid #262626;text-align:right">${value}</td>
          </tr>
        `).join("")}
      </table>

      <!-- CTA -->
      <div style="margin-top:28px;text-align:center">
        <a href="${APP}/suenos" style="display:inline-block;background:#4f46e5;color:white;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px">
          Ver todos los sueños →
        </a>
      </div>

      <!-- Nota legal -->
      <p style="color:#525252;font-size:11px;text-align:center;margin-top:24px;line-height:1.5">
        Esta donación puede ser deducible de impuestos según el Art. 69 de la Ley de Impuesto a la Renta.<br>
        Fundación Social Niños Creativos · RUT 76.XXX.XXX-X
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#111;padding:16px 32px;border-top:1px solid #1f1f1f;text-align:center">
      <p style="color:#525252;font-size:11px;margin:0">
        Recibiste este email porque realizaste una donación en <a href="${APP}" style="color:#818cf8">kidspeque.cl</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ── Funciones exportadas ───────────────────────────────────────────────────────

async function getResendClient(): Promise<Resend | null> {
  let key = process.env.RESEND_API_KEY;
  if (!key || key.includes("re_xxxx") || key.includes("tu_")) {
    try {
      const settings = await db.siteSettings.findUnique({ where: { id: "global" } });
      if (settings?.resendApiKey) key = settings.resendApiKey;
    } catch (err) {
      console.error("[email] Error al consultar DB para resendApiKey:", err);
    }
  }

  if (!key || key.includes("re_xxxx") || key.includes("tu_")) {
    return null;
  }

  return new Resend(key);
}

/**
 * Envía el recibo de donación al donante.
 * Si Resend no está configurado, lo omite silenciosamente (no bloquea el flujo).
 */
export async function sendDonationReceipt(data: DonationEmailData): Promise<void> {
  const client = await getResendClient();
  if (!client) {
    console.log("[email] Resend no configurado — email omitido para:", data.to);
    return;
  }

  try {
    await client.emails.send({
      from:    FROM,
      to:      data.to,
      subject: `✓ Recibimos tu donación para "${data.dreamTitle}" | Fundación Kidspeque`,
      html:    donationReceiptHtml(data),
    });
  } catch (err) {
    // No lanzar — el pago ya fue procesado, el email es accesorio
    console.error("[email] Error al enviar recibo:", err);
  }
}

/**
 * Confirma el registro de un voluntario.
 */
export async function sendVolunteerConfirmation(data: VolunteerEmailData): Promise<void> {
  const client = await getResendClient();
  if (!client) {
    console.log("[email] Resend no configurado — email de voluntario omitido");
    return;
  }

  const TYPE_LABELS: Record<string, string> = {
    psychologist:  "psicólogo/a",
    therapist:     "terapeuta",
    social_worker: "trabajador/a social",
    artist:        "artista",
    volunteer:     "voluntario/a",
  };

  try {
    await client.emails.send({
      from:    FROM,
      to:      data.to,
      subject: "Tu solicitud de voluntariado fue recibida | Fundación Kidspeque",
      html: `<!DOCTYPE html>
<html lang="es">
<body style="font-family:Inter,sans-serif;background:#0a0a0a;padding:24px">
  <div style="max-width:480px;margin:0 auto;background:#171717;border-radius:16px;padding:32px;border:1px solid #262626">
    <h1 style="color:white;font-size:20px;font-weight:700;margin:0 0 12px">¡Hola, ${data.firstName}!</h1>
    <p style="color:#a3a3a3;font-size:14px;line-height:1.6;margin:0 0 20px">
      Recibimos tu solicitud para unirte a nuestra red como <strong style="color:#c4b5fd">${TYPE_LABELS[data.type] ?? data.type}</strong>.
    </p>
    <p style="color:#a3a3a3;font-size:14px;line-height:1.6;margin:0 0 28px">
      Nuestro equipo revisará tu perfil y te contactará en los próximos días hábiles. Gracias por querer hacer la diferencia.
    </p>
    <a href="${APP}" style="display:inline-block;background:#4f46e5;color:white;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px">
      Volver al sitio
    </a>
    <p style="color:#525252;font-size:11px;margin-top:24px">Fundación Kidspeque</p>
  </div>
</body>
</html>`,
    });
  } catch (err) {
    console.error("[email] Error al enviar confirmación voluntario:", err);
  }
}
