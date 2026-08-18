import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { ArrowLeft, ShoppingBag, Heart, Shield, Truck, RotateCcw } from "lucide-react";
import { ProductClientView } from "./ProductClientView";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await db.product.findUnique({
    where: { slug: params.slug },
  });

  if (!product) return { title: "Producto no encontrado" };

  return {
    title: product.metaTitle || `${product.name} | Tienda Solidaria Kidspeque`,
    description: product.metaDescription || product.shortDescription,
    openGraph: {
      title: product.metaTitle || product.name,
      description: product.metaDescription || product.shortDescription,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await db.product.findUnique({
    where: { slug: params.slug },
    include: { variants: true },
  });

  if (!product || !product.isActive) {
    notFound();
  }

  const images = product.images as Array<{ url: string; alt: string; isPrimary: boolean }>;
  
  return (
    <>
      <Navbar />
      <CartDrawer />
      
      <main className="min-h-screen bg-white pt-24 pb-16">
        <div className="container-xl">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-8">
            <Link href="/tienda" className="hover:text-primary-600 transition-colors flex items-center gap-1">
              <ArrowLeft size={14} /> Volver a la tienda
            </Link>
            <span>/</span>
            <span className="capitalize">{product.category.replace("_", " ")}</span>
            <span>/</span>
            <span className="text-neutral-900 font-medium truncate">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            
            {/* Galería de imágenes (Izquierda) */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-neutral-100 border border-neutral-200">
                <Image
                  src={images[0]?.url || "/placeholder-product.jpg"}
                  alt={images[0]?.alt || product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 cursor-pointer hover:border-primary-500 transition-colors">
                      <Image
                        src={img.url}
                        alt={img.alt}
                        fill
                        className="object-cover"
                        sizes="25vw"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detalles del producto (Derecha) */}
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-widest text-primary-600 uppercase mb-2">
                {product.category.replace("_", " ")}
              </span>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 leading-tight mb-4">
                {product.name}
              </h1>

              {/* Impacto */}
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-accent-50 rounded-xl text-accent-700 font-medium text-sm mb-6 self-start">
                <Heart size={16} className="fill-accent-500 text-accent-500" />
                {product.impactDescription}
              </div>

              {/* Precio y Cliente Componente */}
              <ProductClientView product={product} />

              <hr className="border-neutral-200 my-8" />

              {/* Descripción */}
              <div className="prose prose-neutral prose-p:leading-relaxed max-w-none mb-8">
                <h3 className="font-display text-xl font-bold text-neutral-900 mb-3">Acerca de este producto</h3>
                <p className="whitespace-pre-wrap text-neutral-600">{product.description}</p>
              </div>

              {/* Features / Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-display text-lg font-bold text-neutral-900 mb-3">Características</h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.tags.map(tag => (
                      <li key={tag} className="flex items-center gap-2 text-neutral-600 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-auto pt-6 border-t border-neutral-200">
                <div className="flex flex-col items-center text-center gap-2 p-4 bg-neutral-50 rounded-2xl">
                  <Shield size={24} className="text-primary-500" />
                  <span className="text-xs font-semibold text-neutral-700">Pago 100% Seguro</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2 p-4 bg-neutral-50 rounded-2xl">
                  <Truck size={24} className="text-accent-500" />
                  <span className="text-xs font-semibold text-neutral-700">Envío a todo Chile</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2 p-4 bg-neutral-50 rounded-2xl">
                  <RotateCcw size={24} className="text-neutral-500" />
                  <span className="text-xs font-semibold text-neutral-700">Cambios en 30 días</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}
