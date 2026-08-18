/**
 * middleware.ts
 * ─────────────────────────────────────────────────────────────────
 * Protege las rutas /admin/* verificando un JWT de sesión.
 * Si no hay sesión válida → redirige a /admin/login.
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify }                 from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? "fallback-dev-secret-change-in-production"
);

// Rutas que NO requieren autenticación
const PUBLIC_ADMIN = ["/admin/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dejar pasar rutas públicas del admin (login, etc.)
  if (PUBLIC_ADMIN.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Verificar JWT en la cookie de sesión
  const token = request.cookies.get("admin_session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET, { issuer: "kidspeque-admin" });
    return NextResponse.next();
  } catch {
    // Token inválido o expirado → redirigir al login y limpiar cookie
    const response = NextResponse.redirect(new URL("/admin/login", request.url));
    response.cookies.delete("admin_session");
    return response;
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
