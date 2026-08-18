/**
 * /admin/configuracion — Ajustes del panel
 * Server Component que carga la config actual, con un Client Component para el formulario.
 */

import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ConfigForm } from "@/components/admin/ConfigForm";

export const metadata: Metadata = { title: "Configuración" };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminConfiguracionPage() {
  const settings = await db.siteSettings.upsert({
    where:  { id: "global" },
    create: { id: "global" },
    update: {},
  });

  function checkKeyStatus(envKey: string, dbVal?: string | null): "ok" | "missing" {
    if (dbVal && dbVal.trim().length > 3 && !dbVal.includes("tu_")) return "ok";
    const val = process.env[envKey];
    if (!val) return "missing";
    const placeholders = ["tu_", "xxxx", "cambiar", "change_", "placeholder", "example"];
    return placeholders.some((p) => val.toLowerCase().includes(p)) ? "missing" : "ok";
  }

  const envVars = [
    { key: "TRANSBANK_API_KEY",  label: "Transbank Webpay", status: checkKeyStatus("TRANSBANK_API_KEY", settings.transbankApiKey) },
    { key: "FLOW_API_KEY",       label: "Flow.cl API Key",  status: checkKeyStatus("FLOW_API_KEY", settings.flowApiKey) },
    { key: "FLOW_SECRET_KEY",    label: "Flow.cl Secret",   status: checkKeyStatus("FLOW_SECRET_KEY", settings.flowSecretKey) },
    { key: "PAYPAL_CLIENT_ID",   label: "PayPal",           status: checkKeyStatus("PAYPAL_CLIENT_ID") },
    { key: "DATABASE_URL",       label: "PostgreSQL",       status: checkKeyStatus("DATABASE_URL") },
    { key: "ADMIN_JWT_SECRET",   label: "JWT Secret",       status: checkKeyStatus("ADMIN_JWT_SECRET") },
    { key: "CLOUDINARY_API_KEY", label: "Cloudinary",       status: checkKeyStatus("CLOUDINARY_API_KEY", settings.cloudinaryApiKey) },
    { key: "RESEND_API_KEY",     label: "Email (Resend)",   status: checkKeyStatus("RESEND_API_KEY", settings.resendApiKey) },
  ];

  return (
    <ConfigForm
      initialSettings={{
        foundationName:        settings.foundationName,
        tagline:               settings.tagline,
        contactEmail:          settings.contactEmail,
        contactPhone:          settings.contactPhone ?? "",
        address:               settings.address ?? "",
        schedule:              settings.schedule ?? "",
        rut:                   settings.rut ?? "",
        legalPersonId:         settings.legalPersonId ?? "",
        instagramUrl:          settings.instagramUrl ?? "",
        facebookUrl:           settings.facebookUrl ?? "",
        youtubeUrl:            settings.youtubeUrl ?? "",
        donationsEmail:        settings.donationsEmail,
        volunteeringEmail:     settings.volunteeringEmail,
        flowApiKey:            settings.flowApiKey ?? "",
        flowSecretKey:         settings.flowSecretKey ?? "",
        flowEnvironment:       settings.flowEnvironment ?? "sandbox",
        transbankCommerceCode: settings.transbankCommerceCode ?? "",
        transbankApiKey:       settings.transbankApiKey ?? "",
        transbankEnvironment:  settings.transbankEnvironment ?? "integration",
        resendApiKey:          settings.resendApiKey ?? "",
        cloudinaryCloudName:   settings.cloudinaryCloudName ?? "",
        cloudinaryApiKey:      settings.cloudinaryApiKey ?? "",
        cloudinaryApiSecret:   settings.cloudinaryApiSecret ?? "",
        transparencyDocs:      (settings.transparencyDocs as any) ?? [
          { id: "1", title: "Memoria Anual 2024", type: "PDF", size: "2.4 MB", date: "Marzo 2025", url: "" },
          { id: "2", title: "Balance Financiero Auditado 2024", type: "PDF", size: "1.1 MB", date: "Febrero 2025", url: "" },
          { id: "3", title: "Certificado de Personalidad Jurídica", type: "PDF", size: "0.5 MB", date: "Vigente", url: "" },
          { id: "4", title: "Estatutos de la Fundación", type: "PDF", size: "3.2 MB", date: "Actualizado 2024", url: "" },
        ],
      }}
      envVars={envVars}
    />
  );
}
