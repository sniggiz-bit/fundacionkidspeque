import { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Shield, FileText, Cookie } from "lucide-react";

export const metadata: Metadata = {
  title: "Políticas y Aspectos Legales | Fundación Kidspeque",
  description: "Conoce nuestras políticas de privacidad, términos de servicio y uso de cookies.",
};

export default function LegalesPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-neutral-50 pb-20">
        <div className="bg-neutral-900 text-white pt-24 pb-16">
          <div className="container-xl text-center">
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Centro Legal
            </h1>
            <p className="text-neutral-400 max-w-2xl mx-auto">
              Toda la información sobre cómo protegemos tus datos, las reglas de uso de nuestra plataforma y nuestra política de cookies.
            </p>
          </div>
        </div>

        <div className="container-xl py-12 max-w-4xl mx-auto">
          {/* Política de Privacidad */}
          <section id="privacidad" className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-neutral-100 mb-8 scroll-mt-24">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-500 flex items-center justify-center">
                <Shield size={24} />
              </div>
              <h2 className="font-display text-3xl font-bold text-neutral-900">Política de Privacidad</h2>
            </div>
            <div className="prose prose-neutral max-w-none text-neutral-600">
              <p>
                En <strong>Fundación Kidspeque</strong> valoramos tu privacidad. Esta política describe cómo recopilamos, usamos y protegemos la información que nos proporcionas al utilizar nuestra plataforma, ya sea como donante, voluntario o comprador en nuestra tienda solidaria.
              </p>
              <h3>1. Información que recopilamos</h3>
              <p>
                Recopilamos información personal (como nombre, correo electrónico y RUT) únicamente cuando la proporcionas voluntariamente al realizar una donación, comprar un producto o postular a un voluntariado. Los pagos son procesados por pasarelas seguras (Webpay, Flow, PayPal) y nosotros <strong>no almacenamos los datos de tus tarjetas</strong>.
              </p>
              <h3>2. Uso de la información</h3>
              <p>
                Tus datos se utilizan exclusivamente para procesar tus transacciones, emitir los certificados de donación correspondientes (Ley de Rentas), y mantenerte informado sobre el impacto de tus aportes (solo si nos autorizas).
              </p>
              <h3>3. Protección de datos</h3>
              <p>
                Mantenemos protocolos estrictos de seguridad para prevenir el acceso no autorizado a tus datos. No vendemos, alquilamos ni compartimos tu información personal con terceros bajo ninguna circunstancia.
              </p>
            </div>
          </section>

          {/* Términos de Servicio */}
          <section id="terminos" className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-neutral-100 mb-8 scroll-mt-24">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-accent-50 text-accent-500 flex items-center justify-center">
                <FileText size={24} />
              </div>
              <h2 className="font-display text-3xl font-bold text-neutral-900">Términos de Servicio</h2>
            </div>
            <div className="prose prose-neutral max-w-none text-neutral-600">
              <p>
                Al utilizar el sitio web de Fundación Kidspeque, aceptas los siguientes términos y condiciones. Te invitamos a leerlos con detenimiento antes de realizar cualquier donación o compra.
              </p>
              <h3>1. Donaciones</h3>
              <p>
                Todas las donaciones realizadas a través de nuestra plataforma son finales. En caso de que se determine que un "sueño" no pueda ser financiado por razones de fuerza mayor, los fondos recaudados serán redirigidos a otro caso similar, lo cual será informado transparentemente en nuestro sitio.
              </p>
              <h3>2. Tienda Solidaria</h3>
              <p>
                Los productos de la tienda solidaria son distribuidos a todo Chile. Si un producto llega defectuoso, ofrecemos cambios o devoluciones dentro de los primeros 30 días tras la recepción del producto, conforme a la Ley del Consumidor en Chile.
              </p>
              <h3>3. Conducta del Voluntariado</h3>
              <p>
                Los voluntarios y colaboradores que postulan a través del sitio se someten a un proceso de selección. Nos reservamos el derecho de aceptar o rechazar solicitudes para garantizar el bienestar de los niños, niñas y adolescentes con los que trabajamos.
              </p>
            </div>
          </section>

          {/* Política de Cookies */}
          <section id="cookies" className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-neutral-100 scroll-mt-24">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
                <Cookie size={24} />
              </div>
              <h2 className="font-display text-3xl font-bold text-neutral-900">Política de Cookies</h2>
            </div>
            <div className="prose prose-neutral max-w-none text-neutral-600">
              <p>
                Utilizamos cookies para mejorar la experiencia de los usuarios en nuestra plataforma. Al continuar navegando en este sitio, aceptas nuestro uso de cookies.
              </p>
              <h3>¿Qué son las cookies?</h3>
              <p>
                Son pequeños archivos de texto que se guardan en tu navegador cuando visitas nuestro sitio. Nos ayudan a recordar tus preferencias y entender cómo interactúas con la plataforma.
              </p>
              <h3>¿Para qué las usamos?</h3>
              <ul>
                <li><strong>Cookies Esenciales:</strong> Necesarias para que el carrito de compras (tienda solidaria) y los procesos de donación funcionen correctamente.</li>
                <li><strong>Cookies Analíticas:</strong> Nos permiten entender, de forma completamente anónima, qué campañas tienen más visitas para optimizar nuestros esfuerzos de difusión.</li>
              </ul>
              <p>
                Puedes configurar tu navegador para bloquear las cookies, pero ten en cuenta que algunas funcionalidades clave del sitio (como el carrito o la sesión de usuario) podrían no funcionar adecuadamente.
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
