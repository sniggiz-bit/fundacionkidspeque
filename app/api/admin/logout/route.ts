export const dynamic = 'force-dynamic';
/**
 * POST /api/admin/logout
 * Alias de logout — borra la cookie y redirige al login.
 * El logout principal lo gestiona AdminNav via DELETE /api/admin/auth.
 */

import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.redirect(
    new URL("/admin/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001")
  );
  response.cookies.delete("admin_session");
  return response;
}

// También aceptar DELETE para consistencia con /api/admin/auth
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("admin_session");
  return response;
}

