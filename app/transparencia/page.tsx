import { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FileText, Download, PieChart, ShieldCheck, Heart, Users } from "lucide-react";
import { db } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";

export const metadata: Metadata = {
  title: "Transparencia | Fundación Kidspeque",
  description: "Conoce en detalle cómo administramos los fondos, nuestros reportes financieros y el impacto real de cada donación.",
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface TransparencyDoc {
  id:    string;
  title: string;
  type:  string;
  size:  string;
  date:  string;
  url:   string;
}

export default async function TransparenciaPage() {
  noStore();

  let settings = null;
  try {
    settings = await db.siteSettings.findUnique({ where: { id: "global" } });
  } catch (err) {
    console.error("[TransparenciaPage] Error al cargar DB:", err);
  }

  const defaultDocs: TransparencyDoc[] = [
    { id: "1", title: "Memoria Anual 2024", type: "PDF", size: "2.4 MB", date: "Marzo 2025", url: "#" },
    { id: "2", title: "Balance Financiero Auditado 2024", type: "PDF", size: "1.1 MB", date: "Febrero 2025", url: "#" },
    { id: "3", title: "Certificado de Personalidad Jurídica", type: "PDF", size: "0.5 MB", date: "Vigente", url: "#" },
    { id: "4", title: "Estatutos de la Fundación", type: "PDF", size: "3.2 MB", date: "Actualizado 2024", url: "#" },
  ];

  const docs: TransparencyDoc[] = (settings?.transparencyDocs as any) && Array.isArray(settings?.transparencyDocs) && (settings.transparencyDocs as any).length > 0
    ? (settings.transparencyDocs as any)
    : defaultDocs;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-neutral-50 pb-20">
        
        {/* Hero Section */}
        <section className="bg-primary-900 text-white pt-24 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
          <div className="container-xl relative z-10 text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-800 text-primary-100 text-sm font-semibold mb-6">
              <ShieldCheck size={16} /> Nuestro compromiso
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
              Transparencia Total
            </h1>
            <p className="text-primary-100 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              Creemos que la confianza es la base de todo. Por eso, te mostramos exactamente de dónde vienen nuestros recursos y cómo los invertimos para cumplir sueños.
            </p>
          </div>
        </section>

        {/* Resumen Financiero */}
        <section className="py-16">
          <div className="container-xl">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold text-neutral-900 mb-4">
                El viaje de tu donación
              </h2>
              <p className="text-neutral-600 max-w-2xl mx-auto">
                Por cada $1.000 que donas, nos aseguramos de que el máximo porcentaje posible llegue directamente a los niños, manteniendo los costos operativos al mínimo gracias al trabajo voluntario.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
              <div className="bg-white rounded-3xl p-8 border border-neutral-100 shadow-sm text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent-50 text-accent-500 flex items-center justify-center mx-auto mb-4">
                  <Heart size={32} />
                </div>
                <h3 className="font-display text-4xl font-extrabold text-neutral-900 mb-2">85%</h3>
                <p className="font-semibold text-neutral-800 mb-2">Directo a los Sueños</p>
                <p className="text-sm text-neutral-500">Compra de materiales, insumos, y pago a facilitadores para la realización del sueño del niño.</p>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-neutral-100 shadow-sm text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-500 flex items-center justify-center mx-auto mb-4">
                  <Users size={32} />
                </div>
                <h3 className="font-display text-4xl font-extrabold text-neutral-900 mb-2">10%</h3>
                <p className="font-semibold text-neutral-800 mb-2">Operación y Logística</p>
                <p className="text-sm text-neutral-500">Costos de mantención de la plataforma, servidores, traslados y apoyo psicosocial permanente.</p>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-neutral-100 shadow-sm text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center mx-auto mb-4">
                  <PieChart size={32} />
                </div>
                <h3 className="font-display text-4xl font-extrabold text-neutral-900 mb-2">5%</h3>
                <p className="font-semibold text-neutral-800 mb-2">Fondo de Reserva</p>
                <p className="text-sm text-neutral-500">Un pequeño porcentaje se ahorra para imprevistos o emergencias de casos médicos urgentes.</p>
              </div>
            </div>

            {/* Documentos Legales */}
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-neutral-200 shadow-sm max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
                <div>
                  <h3 className="font-display text-2xl font-bold text-neutral-900 mb-2">Documentos Oficiales</h3>
                  <p className="text-neutral-600">Descarga nuestros balances anuales, actas y certificados de donación vigentes.</p>
                </div>
                <ShieldCheck size={48} className="text-primary-200 hidden sm:block" />
              </div>

              <div className="space-y-4">
                {docs.map((doc) => (
                  <div key={doc.id || doc.title} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-neutral-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-500 flex items-center justify-center flex-shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-neutral-900">{doc.title}</h4>
                        <p className="text-xs text-neutral-500 mt-0.5">{doc.type || "PDF"} · {doc.size || "1 MB"} · {doc.date || "Vigente"}</p>
                      </div>
                    </div>
                    {doc.url && doc.url !== "#" ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
                      >
                        <Download size={16} /> Descargar
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-400 bg-neutral-100 rounded-xl cursor-not-allowed"
                      >
                        <Download size={16} /> Próximamente
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
