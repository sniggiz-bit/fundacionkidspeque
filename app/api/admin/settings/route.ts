export const dynamic = 'force-dynamic';
/**
 * GET  /api/admin/settings  — Obtener configuración del sitio
 * PUT  /api/admin/settings  — Guardar configuración del sitio
 * ─────────────────────────────────────────────────────────────────
 * Lee/escribe la tabla site_settings (único registro con id="global").
 * Permite configurar las API Keys desde el panel admin o leer .env.
 */

import { NextRequest, NextResponse } from "next/server";
import { z }        from "zod";
import { db }       from "@/lib/db";
import { cookies }  from "next/headers";
import { jwtVerify } from "jose";
import { revalidatePath } from "next/cache";

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? "fallback-dev-secret-change-in-production"
);

async function verifyAdmin(): Promise<boolean> {
  const token = cookies().get("admin_session")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, JWT_SECRET, { issuer: "kidspeque-admin" });
    return true;
  } catch { return false; }
}

const settingsSchema = z.object({
  foundationName:    z.string().min(3).max(200),
  tagline:           z.string().min(3).max(300),
  contactEmail:      z.string().email().max(255),
  contactPhone:      z.string().max(30).optional().nullable(),
  address:           z.string().max(200).optional().nullable(),
  schedule:          z.string().max(150).optional().nullable(),
  rut:               z.string().max(30).optional().nullable(),
  legalPersonId:     z.string().max(50).optional().nullable(),
  instagramUrl:      z.string().url().or(z.literal("")).optional().nullable(),
  facebookUrl:       z.string().url().or(z.literal("")).optional().nullable(),
  youtubeUrl:        z.string().url().or(z.literal("")).optional().nullable(),
  donationsEmail:    z.string().email().max(255),
  volunteeringEmail:  z.string().email().max(255),

  // Keys configurables desde Admin Panel
  flowApiKey:            z.string().optional().nullable(),
  flowSecretKey:         z.string().optional().nullable(),
  flowEnvironment:       z.enum(["sandbox", "production"]).optional().nullable(),
  transbankCommerceCode: z.string().optional().nullable(),
  transbankApiKey:       z.string().optional().nullable(),
  transbankEnvironment:  z.string().optional().nullable(),
  resendApiKey:          z.string().optional().nullable(),
  cloudinaryCloudName:   z.string().optional().nullable(),
  cloudinaryApiKey:      z.string().optional().nullable(),
  cloudinaryApiSecret:   z.string().optional().nullable(),

  // Documentos de transparencia
  transparencyDocs: z.array(z.object({
    id:    z.string(),
    title: z.string(),
    type:  z.string(),
    size:  z.string(),
    date:  z.string(),
    url:   z.string(),
  })).optional().nullable(),

  // Categorías de la Tienda
  productCategories: z.array(z.object({
    slug: z.string(),
    name: z.string(),
  })).optional().nullable(),

  // Chatbot & WhatsApp
  chatbotEnabled:        z.boolean().optional(),
  chatbotWelcomeMessage: z.string().max(500).optional().nullable(),
  whatsappPhone:         z.string().max(30).optional().nullable(),
});

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

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
    { key: "DATABASE_URL",       label: "PostgreSQL",        status: checkKeyStatus("DATABASE_URL") },
    { key: "ADMIN_JWT_SECRET",   label: "JWT Secret",       status: checkKeyStatus("ADMIN_JWT_SECRET") },
    { key: "CLOUDINARY_API_KEY", label: "Cloudinary",       status: checkKeyStatus("CLOUDINARY_API_KEY", settings.cloudinaryApiKey) },
    { key: "RESEND_API_KEY",     label: "Email (Resend)",   status: checkKeyStatus("RESEND_API_KEY", settings.resendApiKey) },
  ];

  return NextResponse.json({
    success: true,
    data: {
      settings,
      envVars,
    },
  });
}

// ── PUT ──────────────────────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  const body   = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors } },
      { status: 422 }
    );
  }

  try {
    const dataToSave = { ...parsed.data } as any;
    const settings = await db.siteSettings.upsert({
      where:  { id: "global" },
      create: { id: "global", ...dataToSave },
      update: dataToSave,
    });

    // Invalidad la caché del sitio público inmediatamente (revalida el layout global)
    revalidatePath("/", "layout");

    return NextResponse.json({ success: true, data: settings });
  } catch (err) {
    console.error("[admin/settings PUT]", err);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
