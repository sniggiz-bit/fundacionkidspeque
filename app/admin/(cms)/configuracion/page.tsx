/**
 * /admin/configuracion — Ajustes del panel
 * Server Component que carga la config actual, con un Client Component para el formulario.
 */

import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ConfigForm } from "@/components/admin/ConfigForm";

export const metadata: Metadata = { title: "Configuración" };
export const dynamic = 'force-dynamic';

export default async function AdminConfiguracionPage() {
  // Cargar o crear la configuración global con upsert
  const settings = await db.siteSettings.upsert({
    where:  { id: "global" },
    create: { id: "global" },
    update: {},
  });

  // Estado real de las variables de entorno (sin revelar valores)
  function envStatus(key: string): "ok" | "missing" {
    const val = process.env[key];
    if (!val) return "missing";
    const placeholders = ["tu_", "xxxx", "cambiar", "change_", "placeholder", "example"];
    return placeholders.some((p) => val.toLowerCase().includes(p)) ? "missing" : "ok";
  }

  const envVars = [
    { key: "TRANSBANK_API_KEY",  label: "Transbank Webpay", status: envStatus("TRANSBANK_API_KEY") },
    { key: "FLOW_API_KEY",       label: "Flow.cl API Key",  status: envStatus("FLOW_API_KEY") },
    { key: "FLOW_SECRET_KEY",    label: "Flow.cl Secret",   status: envStatus("FLOW_SECRET_KEY") },
    { key: "PAYPAL_CLIENT_ID",   label: "PayPal",           status: envStatus("PAYPAL_CLIENT_ID") },
    { key: "DATABASE_URL",       label: "PostgreSQL",       status: envStatus("DATABASE_URL") },
    { key: "ADMIN_JWT_SECRET",   label: "JWT Secret",       status: envStatus("ADMIN_JWT_SECRET") },
    { key: "CLOUDINARY_API_KEY", label: "Cloudinary",       status: envStatus("CLOUDINARY_API_KEY") },
    { key: "RESEND_API_KEY",     label: "Email (Resend)",   status: envStatus("RESEND_API_KEY") },
  ];

  return (
    <ConfigForm
      initialSettings={{
        foundationName:    settings.foundationName,
        tagline:           settings.tagline,
        contactEmail:      settings.contactEmail,
        contactPhone:      settings.contactPhone ?? "",
        donationsEmail:    settings.donationsEmail,
        volunteeringEmail: settings.volunteeringEmail,
      }}
      envVars={envVars}
    />
  );
}
