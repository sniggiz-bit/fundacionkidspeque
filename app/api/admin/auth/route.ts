export const dynamic = 'force-dynamic';
/**
 * POST /api/admin/auth
 * ─────────────────────────────────────────────────────────────────
 * Login del panel de administración.
 * Compara la contraseña con el hash bcrypt almacenado en env.
 * Devuelve un JWT firmado en una cookie HttpOnly.
 */

import { NextRequest, NextResponse } from "next/server";
import { SignJWT }  from "jose";
import { compare }  from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? "fallback-dev-secret-change-in-production"
);

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body?.password || typeof body.password !== "string") {
    return NextResponse.json(
      { success: false, error: "Credenciales inválidas" },
      { status: 401 }
    );
  }

  // En desarrollo, o si no hay hash en Vercel, aceptar password "admin123" por defecto
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  let isValid = false;

  if (passwordHash) {
    isValid = await compare(body.password, passwordHash);
  } else {
    isValid = body.password === "admin123"; // Fallback por defecto
  }

  if (!isValid) {
    // Rate limiting debería estar aquí (Upstash Redis recomendado)
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

  // Cookie HttpOnly — no accesible desde JavaScript del cliente
  response.cookies.set("admin_session", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   8 * 60 * 60, // 8 horas en segundos
    path:     "/",
  });

  return response;
}

// Logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("admin_session");
  return response;
}

