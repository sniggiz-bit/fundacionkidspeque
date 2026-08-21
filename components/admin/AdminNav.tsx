/**
 * components/admin/AdminNav.tsx
 * Navegación del sidebar con ruta activa resaltada.
 * Client Component necesario para usePathname().
 */

"use client";

import Link       from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Heart, ShoppingBag,
  Users, Star, Settings, ExternalLink, LogOut, LayoutTemplate,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin",               label: "Dashboard",     icon: LayoutDashboard },
  { href: "/admin/hero",          label: "Hero",          icon: LayoutTemplate  },
  { href: "/admin/suenos",        label: "Sueños",        icon: Star            },
  { href: "/admin/donaciones",    label: "Donaciones",    icon: Heart           },
  { href: "/admin/productos",     label: "Productos",     icon: ShoppingBag     },
  { href: "/admin/colaboradores", label: "Colaboradores", icon: Users           },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings        },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex-1 px-3 py-4 overflow-y-auto" aria-label="Menú de administración">
      <ul className="space-y-1" role="list">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  active
                    ? "bg-primary-600/15 text-primary-300 border border-primary-600/30"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                <Icon
                  size={16}
                  className={active ? "text-primary-400" : "group-hover:text-primary-400 transition-colors"}
                  aria-hidden
                />
                {label}
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Separador */}
      <div className="border-t border-neutral-800 mt-4 pt-4">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-all"
        >
          <ExternalLink size={15} aria-hidden />
          Ver sitio web
        </Link>
      </div>

      {/* Logout */}
      <div className="mt-2">
        <LogoutButton />
      </div>
    </nav>
  );
}

function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-neutral-500 hover:text-red-400 hover:bg-red-950/30 transition-all"
    >
      <LogOut size={15} aria-hidden />
      Cerrar sesión
    </button>
  );
}
