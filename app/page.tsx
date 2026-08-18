import type { Metadata } from "next";
import { db }             from "@/lib/db";
import { Navbar }         from "@/components/Navbar";
import { Hero }           from "@/components/Hero";
import { DreamsSection }  from "@/components/DreamsSection";
import { DonationWizard } from "@/components/DonationWizard";
import { StoreSection }   from "@/components/StoreSection";
import { Footer }         from "@/components/Footer";

export const metadata: Metadata = {
  title: "Inicio | Fundación Kidspeque",
  description:
    "Cumple un sueño para cada niño o niña de nuestro país. Dona, compra con propósito o únete como voluntario.",
};

export default async function HomePage() {
  const dreams = await db.dream.findMany({
    where: { status: { in: ["active", "funded", "paused"] } },
    orderBy: { createdAt: "desc" },
    take: 6
  });

  const products = await db.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: { variants: true }
  });

  // Transformar Prisma Dream a Tipo Dream de frontend
  const formattedDreams = dreams.map(d => ({
    ...d,
    targetAmount: Number(d.targetAmount),
    raisedAmount: Number(d.raisedAmount),
    progressPercentage: d.progressPct
  }));

  return (
    <>
      <Navbar />

      <main id="main-content">
        {/* 1. HERO — Propuesta de valor principal */}
        <Hero />

        {/* 2. SUEÑOS — Crowdfunding de campañas activas */}
        <DreamsSection dreams={formattedDreams as any} />

        {/* 3. CÓMO FUNCIONA — 3 pasos */}
        <section
          id="como-funciona"
          className="section bg-surface-2"
          aria-labelledby="how-heading"
          style={{ background: "linear-gradient(160deg, #fdf4ff 0%, #fff7ed 50%, #fdf2f8 100%)" }}
        >
          <div className="container-xl">
            <div className="text-center mb-12">
              <span className="section-tag justify-center">✨ Simple y transparente</span>
              <h2
                id="how-heading"
                className="font-display text-3xl sm:text-4xl font-extrabold text-neutral-900"
              >
                Donar es tan{" "}
                <span className="text-gradient">fácil como 1, 2, 3</span>
              </h2>
              <p className="mt-3 text-neutral-600 max-w-md mx-auto">
                En menos de 2 minutos tu aporte llega directamente al sueño que elegiste.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  step: "01",
                  emoji: "🔍",
                  title: "Elige un sueño",
                  desc: "Explora los sueños activos de niños y niñas. Filtra por categoría y encuentra el que más te inspire.",
                  color: "from-violet-500 to-purple-600",
                },
                {
                  step: "02",
                  emoji: "💳",
                  title: "Elige un monto",
                  desc: "Dona lo que puedas — desde $1.000 CLP. Paga con Webpay, Flow o PayPal de forma 100% segura.",
                  color: "from-orange-400 to-rose-500",
                },
                {
                  step: "03",
                  emoji: "🌟",
                  title: "Transforma una vida",
                  desc: "Recibes un recibo inmediato y seguimiento del sueño. Tu donación es deducible de impuestos.",
                  color: "from-emerald-400 to-teal-500",
                },
              ].map((item, i) => (
                <div key={item.step} className="step-card relative">
                  {/* Conector entre pasos — solo desktop */}
                  {i < 2 && (
                    <div
                      aria-hidden
                      className="hidden sm:block absolute top-10 -right-3 z-10 text-neutral-300 text-xl font-bold"
                    >
                      →
                    </div>
                  )}
                  {/* Número del paso */}
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg`}
                    aria-hidden
                  >
                    <span className="text-2xl">{item.emoji}</span>
                  </div>
                  <span className="absolute top-5 right-5 font-display font-black text-4xl text-neutral-100 select-none" aria-hidden>
                    {item.step}
                  </span>
                  <h3 className="font-display font-bold text-lg text-neutral-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. DONAR — Wizard de donación destacado */}
        <section
          id="donar"
          className="section bg-gradient-to-br from-primary-50 via-white to-accent-50"
          aria-labelledby="donate-section-heading"
        >
          <div className="container-xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

              {/* Copy lateral */}
              <div>
                <span className="section-tag">Dona en segundos</span>
                <h2
                  id="donate-section-heading"
                  className="font-display text-3xl sm:text-4xl font-extrabold text-neutral-900 leading-tight mb-4"
                >
                  Tu donación cumple{" "}
                  <span className="text-gradient">sueños reales</span>{" "}
                  hoy.
                </h2>
                <p className="text-neutral-600 leading-relaxed mb-6">
                  Con solo 3 pasos rápidos, tu aporte llega directamente al niño o niña
                  que elegiste. Sin intermediarios, con total transparencia y un recibo
                  inmediato en tu correo.
                </p>
                <ul className="space-y-3">
                  {[
                    "✅ Elige el sueño y el monto que quieras aportar",
                    "✅ Ingresa tus datos mínimos (nombre y correo)",
                    "✅ Paga con Webpay Plus, Flow o PayPal",
                  ].map((step) => (
                    <li key={step} className="text-sm text-neutral-700 flex items-start gap-2">
                      {step}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-xs text-neutral-500 flex items-center gap-1.5">
                  🔒 Transacción 100% segura · Recibo inmediato · Donación deducible de impuestos (Art. 69 LIR)
                </p>
              </div>

              {/* Wizard de donación */}
              <DonationWizard />
            </div>
          </div>
        </section>

        {/* 5. TIENDA SOLIDARIA */}
        <StoreSection products={products as any} />

        {/* 6. ECOSISTEMA — Colaboradores (placeholder para futura implementación) */}
        <section
          id="ecosistema"
          className="section bg-white"
          aria-labelledby="ecosystem-heading"
        >
          <div className="container-xl text-center">
            <span className="section-tag">Únete al Ecosistema</span>
            <h2
              id="ecosystem-heading"
              className="font-display text-3xl sm:text-4xl font-extrabold text-neutral-900 mb-4"
            >
              ¿Eres profesional, artista o voluntario?
            </h2>
            <p className="text-neutral-600 max-w-xl mx-auto mb-10">
              Únete a nuestra red de psicólogos, terapeutas, trabajadores sociales,
              artistas y voluntarios que cambian vidas a través de la creatividad.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                {
                  emoji: "🧠",
                  title: "Profesionales",
                  desc: "Psicólogos, terapeutas y trabajadores sociales",
                  href: "/voluntariado",
                  color: "bg-primary-50 border-primary-200",
                },
                {
                  emoji: "🎨",
                  title: "Artistas",
                  desc: "Facilitadores de talleres creativos y expresivos",
                  href: "/voluntariado",
                  color: "bg-accent-50 border-accent-200",
                },
                {
                  emoji: "🙋",
                  title: "Voluntarios",
                  desc: "Cualquier persona que quiera aportar su tiempo",
                  href: "/voluntariado",
                  color: "bg-green-50 border-green-200",
                },
              ].map((item) => (
                <a
                  key={item.title}
                  href={item.href}
                  className={`${item.color} border rounded-2xl p-6 text-center hover:shadow-card transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500`}
                >
                  <span className="text-3xl mb-3 block" aria-hidden>{item.emoji}</span>
                  <h3 className="font-display font-bold text-neutral-900 mb-1 group-hover:text-primary-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-neutral-600">{item.desc}</p>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
