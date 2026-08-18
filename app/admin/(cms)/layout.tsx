/**
 * /admin/(cms) layout — Shell protegido del panel CMS
 * Verifica JWT server-side + muestra sidebar con navegación activa.
 */

import type { Metadata } from "next";
import Link              from "next/link";
import { cookies }       from "next/headers";
import { redirect }      from "next/navigation";
import { jwtVerify }     from "jose";
import { AdminNav }      from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title:  { default: "Admin | Fundación Kidspeque", template: "%s | Admin Fundación Kidspeque" },
  robots: { index: false, follow: false },
};

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? "fallback-dev-secret-change-in-production"
);

export default async function AdminCmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificación JWT server-side (el middleware es la primera barrera)
  const token = cookies().get("admin_session")?.value;
  if (!token) redirect("/admin/login");
  try {
    await jwtVerify(token, JWT_SECRET, { issuer: "kidspeque-admin" });
  } catch {
    redirect("/admin/login");
  }

  return (
    <div className="flex h-screen bg-neutral-950 overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className="w-60 flex-shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col"
        aria-label="Panel de navegación"
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-neutral-800">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white font-black text-sm select-none">
              X
            </span>
            <div>
              <p className="font-display font-bold text-white text-sm leading-none">Fundación Kidspeque</p>
              <p className="text-neutral-500 text-[10px] mt-0.5">Panel Admin</p>
            </div>
          </Link>
        </div>

        {/* Navegación con ruta activa — Client Component */}
        <AdminNav />
      </aside>

      {/* ── Contenido principal ──────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-neutral-950">
        {children}
      </main>
    </div>
  );
}
