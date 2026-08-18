import Link from "next/link";
import Image from "next/image";
import { Heart, Instagram, Facebook, Youtube, Mail, Phone, MapPin, Clock } from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer id="nosotros" className="bg-neutral-950 text-neutral-300" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">

        {/* Grid principal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-neutral-800">

          {/* Columna 1: Marca */}
          <div className="space-y-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 group" aria-label="Fundación Kidspeque — inicio">
              <Image
                src="/logo.png"
                alt="Fundación Kidspeque"
                width={240}
                height={56}
                className="h-14 sm:h-16 w-auto object-contain"
              />
            </Link>
            <p className="text-sm leading-relaxed text-neutral-400 max-w-xs">
              Fundación Social Niños Creativos. Cumplimos sueños de niños y niñas
              a través de la creatividad y la libertad de expresión.
            </p>
            {/* Redes sociales */}
            <div className="flex items-center gap-3 pt-2" role="list" aria-label="Redes sociales">
              {[
                { Icon: Instagram, href: "https://instagram.com/kidspeque_cl", label: "Instagram" },
                { Icon: Facebook,  href: "https://facebook.com/kidspeque",  label: "Facebook"  },
                { Icon: Youtube,   href: "https://youtube.com/@kidspeque_cl",  label: "YouTube"   },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="listitem"
                  aria-label={`Síguenos en ${label}`}
                  className="w-9 h-9 rounded-lg bg-neutral-800 hover:bg-primary-600 flex items-center justify-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <Icon size={16} aria-hidden />
                </a>
              ))}
            </div>
          </div>

          {/* Columna 2: Navegación */}
          <nav aria-label="Mapa del sitio">
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">
              Plataforma
            </h3>
            <ul className="space-y-2.5" role="list">
              {[
                { label: "Sueños Activos",        href: "/suenos"          },
                { label: "Tienda Solidaria",       href: "/tienda"          },
                { label: "Registrar un Sueño",     href: "/suenos/registrar"},
                { label: "Cómo Funciona",          href: "/#como-funciona"   },
                { label: "Transparencia",          href: "/transparencia"    },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Columna 3: Ecosistema */}
          <nav aria-label="Ecosistema de colaboradores">
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">
              Únete
            </h3>
            <ul className="space-y-2.5" role="list">
              {[
                { label: "Voluntariado",             href: "/voluntariado"    },
                { label: "Profesionales",            href: "/voluntariado"    },
                { label: "Artistas y Facilitadores", href: "/voluntariado"    },
                { label: "Empresas y ONGs",          href: "/voluntariado"    },
                { label: "Programa de Becas",        href: "/voluntariado"    },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Columna 4: Contacto */}
          <div>
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">
              Contacto
            </h3>
            <ul className="space-y-3" role="list">
              <li>
                <a
                  href="mailto:contacto@kidspeque.cl"
                  className="flex items-start gap-3 text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  <Mail size={15} className="mt-0.5 flex-shrink-0 text-primary-400" aria-hidden />
                  contacto@kidspeque.cl
                </a>
              </li>
              <li>
                <a
                  href="tel:+56223456789"
                  className="flex items-start gap-3 text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  <Phone size={15} className="mt-0.5 flex-shrink-0 text-primary-400" aria-hidden />
                  +56 2 2345 6789
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-neutral-400">
                <Clock size={15} className="mt-0.5 flex-shrink-0 text-primary-400" aria-hidden />
                <span>
                  <strong className="text-neutral-300">Atención al cliente</strong>
                  <br />
                  Lunes a Viernes
                  <br />
                  09:00 a 17:00 hrs.
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm text-neutral-400">
                <MapPin size={15} className="mt-0.5 flex-shrink-0 text-primary-400" aria-hidden />
                <span>Santiago, Región Metropolitana, Chile</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>
            © {CURRENT_YEAR} Fundación Kidspeque.
            Todos los derechos reservados.
          </p>

          {/* Datos legales NGO */}
          <p id="transparencia" className="text-center sm:text-right">
            RUT Fundación: 76.XXX.XXX-X · Personalidad Jurídica N° XXXX/2024
          </p>

          <nav aria-label="Políticas y términos">
            <ul className="flex items-center gap-4" role="list">
              {[
                { label: "Privacidad",  href: "/legales#privacidad" },
                { label: "Términos",    href: "/legales#terminos"   },
                { label: "Cookies",     href: "/legales#cookies"    },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-neutral-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Mensaje de misión */}
        <div className="mt-8 pt-8 border-t border-neutral-800 text-center">
          <p className="text-xs text-neutral-600 flex items-center justify-center gap-1.5">
            Hecho con <Heart size={11} className="text-accent-500 fill-accent-500" aria-hidden /> para los niños y niñas de Chile.
            <span aria-hidden>·</span>
            "Los niños necesitan libertad para moverse y expresar sus ideas creativas."
          </p>
        </div>
      </div>
    </footer>
  );
}
