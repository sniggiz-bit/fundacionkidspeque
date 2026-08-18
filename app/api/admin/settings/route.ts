export const dynamic = 'force-dynamic';
/**
 * GET  /api/admin/settings  — Obtener configuración del sitio
 * PUT  /api/admin/settings  — Guardar configuración del sitio
 * ─────────────────────────────────────────────────────────────────
 * Lee/escribe la tabla site_settings (único registro con id="global").
 * También devuelve el estado real de las variables de entorno del servidor.
 */

import { NextRequest, NextResponse } from "next/server";
import { z }        from "zod";
import { db }       from "@/lib/db";
import { cookies }  from "next/headers";
import { jwtVerify } from "jose";

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

// Verificar si una variable de entorno está configurada (no vacía ni placeholder)
function envStatus(key: string): "ok" | "missing" {
  const val = process.env[key];
  if (!val) return "missing";
  // Detectar placeholders comunes
  const placeholders = ["tu_", "xxxx", "cambiar", "change_", "example", "placeholder"];
  const isPlaceholder = placeholders.some((p) => val.toLowerCase().includes(p));
  return isPlaceholder ? "missing" : "ok";
}

const settingsSchema = z.object({
  foundationName:   z.string().min(3).max(200),
  tagline:          z.string().min(3).max(300),
  contactEmail:     z.string().email().max(255),
  contactPhone:     z.string().max(30).optional().nullable(),
  donationsEmail:   z.string().email().max(255),
  volunteeringEmail: z.string().email().max(255),
});

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Obtener o crear configuración con upsert (primera vez crea el registro)
  const settings = await db.siteSettings.upsert({
    where:  { id: "global" },
    create: { id: "global" },
    update: {},
  });

  // Estado de variables de entorno (sin revelar valores)
  const envVars = [
    { key: "TRANSBANK_ENVIRONMENT", label: "Transbank",        status: envStatus("TRANSBANK_API_KEY") },
    { key: "FLOW_API_KEY",          label: "Flow.cl",           status: envStatus("FLOW_API_KEY") },
    { key: "PAYPAL_CLIENT_ID",      label: "PayPal",            status: envStatus("PAYPAL_CLIENT_ID") },
    { key: "DATABASE_URL",          label: "PostgreSQL",        status: envStatus("DATABASE_URL") },
    { key: "ADMIN_JWT_SECRET",      label: "JWT Secret",        status: envStatus("ADMIN_JWT_SECRET") },
    { key: "CLOUDINARY_API_KEY",    label: "Cloudinary",        status: envStatus("CLOUDINARY_API_KEY") },
    { key: "RESEND_API_KEY",        label: "Email (Resend)",    status: envStatus("RESEND_API_KEY") },
    { key: "FLOW_SECRET_KEY",       label: "Flow Secret",       status: envStatus("FLOW_SECRET_KEY") },
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
    const settings = await db.siteSettings.upsert({
      where:  { id: "global" },
      create: { id: "global", ...parsed.data },
      update: parsed.data,
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (err) {
    console.error("[admin/settings PUT]", err);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
