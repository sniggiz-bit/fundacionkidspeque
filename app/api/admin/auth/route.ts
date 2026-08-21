export const dynamic = "force-dynamic";
/**
 * POST   /api/admin/auth  — Login del panel de administración.
 * PUT    /api/admin/auth  — Cambio de contraseña (requiere sesión activa + contraseña actual).
 * DELETE /api/admin/auth  — Logout (elimina cookie de sesión).
 *
 * Orden de prioridad del hash de contraseña:
 *   1. site_settings.admin_password_hash  (guardado desde el panel)
 *   2. process.env.ADMIN_PASSWORD_HASH    (variable de entorno)
 *   3. Fallback "admin123"                (solo desarrollo sin configurar)
 */

import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { compare, hash }      from "bcryptjs";
import { cookies }            from "next/headers";
import { db }                 from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? "fallback-dev-secret-change-in-production"
);

// ── Helper: obtener el hash activo (BD tiene prioridad sobre .env) ────────────

async function getActivePasswordHash(): Promise<string | null> {
  try {
    const settings = await db.siteSettings.findUnique({
      where:  { id: "global" },
      select: { adminPasswordHash: true },
    });
    if (settings?.adminPasswordHash?.trim()) {
      return settings.adminPasswordHash.trim();
    }
  } catch { /* continuar con env */ }
  return process.env.ADMIN_PASSWORD_HASH ?? null;
}

// ── Helper: verificar JWT de sesión activa ────────────────────────────────────

async function verifyAdmin(): Promise<boolean> {
  const token = cookies().get("admin_session")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, JWT_SECRET, { issuer: "kidspeque-admin" });
    return true;
  } catch { return false; }
}

// ── POST — Login ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body?.password || typeof body.password !== "string") {
    return NextResponse.json(
      { success: false, error: "Credenciales inválidas" },
      { status: 401 }
    );
  }

  const passwordHash = await getActivePasswordHash();
  let isValid = false;

  if (passwordHash) {
    isValid = await compare(body.password, passwordHash);
  } else {
    // Fallback de desarrollo si no hay hash configurado
    isValid = body.password === "admin123";
  }

  if (!isValid) {
    return NextResponse.json(
      { success: false, error: "Contraseña incorrecta" },
      { status: 401 }
    );
  }

  // Generar JWT con expiración de 8 horas
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("kidspeque-admin")
    .setExpirationTime("8h")
    .sign(JWT_SECRET);

  const response = NextResponse.json({ success: true });

  response.cookies.set("admin_session", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   8 * 60 * 60,
    path:     "/",
  });

  return response;
}

// ── PUT — Cambio de contraseña ────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  // Requiere sesión activa
  if (!await verifyAdmin()) {
    return NextResponse.json(
      { success: false, error: "No autorizado" },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const { currentPassword, newPassword, confirmPassword } = body ?? {};

  // Validaciones básicas
  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { success: false, error: "Todos los campos son obligatorios" },
      { status: 400 }
    );
  }
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return NextResponse.json(
      { success: false, error: "La nueva contraseña debe tener al menos 8 caracteres" },
      { status: 400 }
    );
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { success: false, error: "Las contraseñas nuevas no coinciden" },
      { status: 400 }
    );
  }

  // Verificar contraseña actual
  const activeHash = await getActivePasswordHash();
  let currentIsValid = false;

  if (activeHash) {
    currentIsValid = await compare(currentPassword, activeHash);
  } else {
    currentIsValid = currentPassword === "admin123";
  }

  if (!currentIsValid) {
    return NextResponse.json(
      { success: false, error: "La contraseña actual es incorrecta" },
      { status: 401 }
    );
  }

  // Generar nuevo hash bcrypt (costo 12)
  const newHash = await hash(newPassword, 12);

  // Guardar en site_settings (sobreescribe el .env en el próximo login)
  await db.siteSettings.upsert({
    where:  { id: "global" },
    create: { id: "global", adminPasswordHash: newHash },
    update: { adminPasswordHash: newHash },
  });

  return NextResponse.json({ success: true });
}

// ── DELETE — Logout ───────────────────────────────────────────────────────────

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("admin_session");
  return response;
}
