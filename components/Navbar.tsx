"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Heart, ShoppingBag } from "lucide-react";

const NAV_LINKS = [
  { label: "Sueños",        href: "/#suenos"       },
  { label: "Tienda",        href: "/#tienda"        },
  { label: "Colabora",      href: "/#ecosistema"    },
  { label: "Nosotros",      href: "/#nosotros"      },
  { label: "Transparencia", href: "/transparencia" },
] as const;

export function Navbar() {
  const [isScrolled, setIsScrolled]   = useState(false);
  const [isMobileOpen, setMobileOpen] = useState(false);

  // Detectar scroll para cambiar estilo del navbar
  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-neutral-200/80 shadow-xs"
          : "bg-transparent"
      }`}
      role="banner"
    >
      <nav
        className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 lg:h-18"
        aria-label="Navegación principal"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 rounded-lg"
          aria-label="Fundación Kidspeque — Inicio"
        >
          <Image
            src="/logo.png"
            alt="Fundación Kidspeque"
            width={240}
            height={56}
            className="h-12 sm:h-14 lg:h-16 w-auto object-contain"
            priority
          />
        </Link>

        {/* Links desktop */}
        <ul className="hidden lg:flex items-center gap-7" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium text-neutral-600 hover:text-violet-600 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded px-1 py-0.5"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          {/* Carrito tienda solidaria */}
          <button
            className="relative p-2.5 rounded-xl text-neutral-600 hover:text-violet-600 hover:bg-violet-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Ver carrito de compras"
          >
            <ShoppingBag size={20} />
            <span className="absolute top-1 right-1 w-4 h-4 bg-accent-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              0
            </span>
          </button>

          {/* Registrar Sueño CTA */}
          <Link
            href="/suenos/registrar"
            className="btn-outline text-sm px-5 py-2.5 rounded-xl hidden md:inline-flex"
          >
            Registrar Sueño
          </Link>

          {/* CTA Principal */}
          <Link
            href="/#donar"
            className="btn-cta text-sm px-5 py-2.5 hidden sm:inline-flex"
          >
            <Heart size={15} aria-hidden />
            Dona Ahora
          </Link>

          {/* Hamburger mobile — 44×44 px mínimo para accesibilidad táctil */}
          <button
            className="lg:hidden p-2.5 rounded-xl text-neutral-700 hover:bg-violet-50 hover:text-violet-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={isMobileOpen}
            aria-controls="mobile-menu"
            aria-label={isMobileOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Menú mobile */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="lg:hidden bg-white/95 backdrop-blur-xl border-b border-violet-100 overflow-hidden"
          >
            <ul className="px-4 pb-5 pt-2 space-y-1" role="list">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center px-4 py-3.5 text-sm font-medium text-neutral-700
                               hover:text-violet-700 hover:bg-violet-50
                               rounded-2xl transition-colors min-h-[48px]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2 px-0 flex flex-col gap-2">
                <Link
                  href="/suenos/registrar"
                  onClick={() => setMobileOpen(false)}
                  className="btn-outline w-full text-center py-3.5 rounded-2xl"
                >
                  Registra un Sueño
                </Link>
                <Link
                  href="/#donar"
                  onClick={() => setMobileOpen(false)}
                  className="btn-cta w-full text-base py-3.5"
                >
                  <Heart size={16} aria-hidden />
                  Dona Ahora
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
