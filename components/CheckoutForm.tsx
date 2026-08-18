/**
 * components/CheckoutForm.tsx
 * ─────────────────────────────────────────────────────────────────
 * Formulario de checkout: datos de envío + resumen + pago.
 * Integra Webpay Plus o Flow para el pago de la orden.
 */

"use client";

import { useState }           from "react";
import { useForm }            from "react-hook-form";
import { zodResolver }        from "@hookform/resolvers/zod";
import { z }                  from "zod";
import Image                  from "next/image";
import { useCartStore }       from "@/store/useCartStore";
import { Lock, Loader2, MapPin, User, CreditCard, ChevronRight, ShoppingBag } from "lucide-react";

// ── Schema ────────────────────────────────────────────────────────────────────

const checkoutSchema = z.object({
  firstName:  z.string().min(2, "Nombre muy corto"),
  lastName:   z.string().min(2, "Apellido muy corto"),
  email:      z.string().email("Email inválido"),
  phone:      z.string().min(8, "Teléfono inválido"),
  rut:        z.string().optional(),

  // Envío
  street:     z.string().min(5, "Dirección requerida"),
  city:       z.string().min(2, "Ciudad requerida"),
  region:     z.string().min(2, "Región requerida"),
  postalCode: z.string().optional(),

  // Pago
  gateway:    z.enum(["webpay_plus", "flow"]),
  notes:      z.string().max(300).optional(),
  termsAccepted: z.boolean().refine(Boolean, "Debes aceptar los términos"),
});

type CheckoutData = z.infer<typeof checkoutSchema>;

// ── Constantes ────────────────────────────────────────────────────────────────

const REGIONS_CL = [
  "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo",
  "Valparaíso", "Metropolitana de Santiago", "O'Higgins", "Maule", "Ñuble",
  "Biobío", "La Araucanía", "Los Ríos", "Los Lagos", "Aysén",
  "Magallanes y Antártica Chilena",
];

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", maximumFractionDigits: 0,
  }).format(n);
}

// ── Sección header de step ────────────────────────────────────────────────────

function StepHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 flex-shrink-0">
        {icon}
      </div>
      <h2 className="font-display font-bold text-base text-neutral-900">{label}</h2>
    </div>
  );
}

// ── Componente Principal ──────────────────────────────────────────────────────

export function CheckoutForm() {
  const { items, totalPrice, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting]  = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { gateway: "webpay_plus", termsAccepted: false },
  });

  const cartTotal  = totalPrice();
  const itemCount  = items.reduce((a, i) => a + i.quantity, 0);

  // Redirigir al carrito vacío
  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingBag size={40} className="text-neutral-300 mx-auto mb-4" />
        <p className="text-neutral-600 mb-4">Tu carrito está vacío.</p>
        <a href="/tienda" className="btn-primary text-sm px-6">
          Ir a la tienda
        </a>
      </div>
    );
  }

  const onSubmit = async (data: CheckoutData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/orders/create", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...data, items }),
      });
      const json = await res.json();
      if (json.success && json.data?.redirectUrl) {
        clearCart();
        window.location.href = json.data.redirectUrl;
      } else {
        throw new Error(json.error?.message ?? "Error al crear la orden");
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* ── Columna izquierda: formulario (3/5) ─────────────────────── */}
        <div className="lg:col-span-3 space-y-6">

          {/* Datos personales */}
          <div className="card p-6">
            <StepHeader icon={<User size={18} />} label="Tus datos" />

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="c-fn" className="block text-xs font-semibold text-neutral-600 mb-1.5">Nombre *</label>
                  <input id="c-fn" {...register("firstName")} className="input-field" placeholder="María" autoComplete="given-name" />
                  {errors.firstName && <p role="alert" className="text-xs text-error mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label htmlFor="c-ln" className="block text-xs font-semibold text-neutral-600 mb-1.5">Apellido *</label>
                  <input id="c-ln" {...register("lastName")} className="input-field" placeholder="González" autoComplete="family-name" />
                  {errors.lastName && <p role="alert" className="text-xs text-error mt-1">{errors.lastName.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="c-email" className="block text-xs font-semibold text-neutral-600 mb-1.5">Email *</label>
                <input id="c-email" {...register("email")} type="email" className="input-field" placeholder="tu@correo.cl" autoComplete="email" />
                {errors.email && <p role="alert" className="text-xs text-error mt-1">{errors.email.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="c-phone" className="block text-xs font-semibold text-neutral-600 mb-1.5">Teléfono *</label>
                  <input id="c-phone" {...register("phone")} type="tel" className="input-field" placeholder="+56 9 1234 5678" autoComplete="tel" />
                  {errors.phone && <p role="alert" className="text-xs text-error mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <label htmlFor="c-rut" className="block text-xs font-semibold text-neutral-600 mb-1.5">RUT <span className="font-normal text-neutral-400">(boleta)</span></label>
                  <input id="c-rut" {...register("rut")} className="input-field" placeholder="12.345.678-9" />
                </div>
              </div>
            </div>
          </div>

          {/* Dirección de envío */}
          <div className="card p-6">
            <StepHeader icon={<MapPin size={18} />} label="Dirección de envío" />

            <div className="space-y-4">
              <div>
                <label htmlFor="c-street" className="block text-xs font-semibold text-neutral-600 mb-1.5">Calle y número *</label>
                <input id="c-street" {...register("street")} className="input-field" placeholder="Av. Providencia 1234, Depto 5" autoComplete="street-address" />
                {errors.street && <p role="alert" className="text-xs text-error mt-1">{errors.street.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="c-city" className="block text-xs font-semibold text-neutral-600 mb-1.5">Ciudad *</label>
                  <input id="c-city" {...register("city")} className="input-field" placeholder="Santiago" autoComplete="address-level2" />
                  {errors.city && <p role="alert" className="text-xs text-error mt-1">{errors.city.message}</p>}
                </div>
                <div>
                  <label htmlFor="c-postal" className="block text-xs font-semibold text-neutral-600 mb-1.5">Código postal</label>
                  <input id="c-postal" {...register("postalCode")} className="input-field" placeholder="7500000" autoComplete="postal-code" />
                </div>
              </div>

              <div>
                <label htmlFor="c-region" className="block text-xs font-semibold text-neutral-600 mb-1.5">Región *</label>
                <select id="c-region" {...register("region")} className="input-field" autoComplete="address-level1">
                  <option value="">Selecciona una región</option>
                  {REGIONS_CL.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                {errors.region && <p role="alert" className="text-xs text-error mt-1">{errors.region.message}</p>}
              </div>

              <div>
                <label htmlFor="c-notes" className="block text-xs font-semibold text-neutral-600 mb-1.5">Instrucciones de entrega <span className="font-normal text-neutral-400">(opcional)</span></label>
                <textarea id="c-notes" {...register("notes")} rows={2} className="input-field resize-none" placeholder="Portero, timbre 3B, dejar en conserjería…" />
              </div>
            </div>
          </div>

          {/* Método de pago */}
          <div className="card p-6">
            <StepHeader icon={<CreditCard size={18} />} label="Método de pago" />

            <div className="space-y-3">
              {[
                { value: "webpay_plus", title: "Webpay Plus",  sub: "Débito / Crédito nacional",    flag: "🇨🇱" },
                { value: "flow",        title: "Flow.cl",      sub: "Múltiples medios de pago",      flag: "🇨🇱" },
              ].map((gw) => (
                <label
                  key={gw.value}
                  className="flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 border-neutral-200 hover:border-neutral-300"
                >
                  <input
                    type="radio"
                    value={gw.value}
                    {...register("gateway")}
                    className="w-4 h-4 accent-primary-600"
                  />
                  <span className="text-xl" aria-hidden>{gw.flag}</span>
                  <div>
                    <p className="font-semibold text-sm text-neutral-900">{gw.title}</p>
                    <p className="text-xs text-neutral-500">{gw.sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Términos */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              {...register("termsAccepted")}
              className="w-4 h-4 mt-0.5 rounded accent-primary-600 flex-shrink-0"
            />
            <span className="text-sm text-neutral-700 leading-relaxed">
              Acepto los{" "}
              <a href="/terminos" className="text-primary-600 underline hover:text-primary-700">términos y condiciones</a>{" "}
              y la{" "}
              <a href="/privacidad" className="text-primary-600 underline hover:text-primary-700">política de privacidad</a>.
            </span>
          </label>
          {errors.termsAccepted && <p role="alert" className="text-xs text-error">{errors.termsAccepted.message}</p>}
        </div>

        {/* ── Columna derecha: resumen (2/5) ──────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 space-y-5">

            {/* Resumen de productos */}
            <div className="card p-5">
              <h3 className="font-display font-bold text-base text-neutral-900 mb-4">
                Resumen del pedido
              </h3>

              <ul className="space-y-3 mb-5" role="list">
                {items.map((item) => (
                  <li key={`${item.productId}-${item.variantId}`}
                      className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                      <Image src={item.imageUrl} alt={item.name} fill sizes="48px" className="object-cover" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 line-clamp-1">{item.name}</p>
                      {item.variantName && (
                        <p className="text-xs text-neutral-500">{item.variantName}</p>
                      )}
                    </div>
                    <p className="text-sm font-bold text-neutral-800 flex-shrink-0">
                      {formatCLP(item.price * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="space-y-2 pt-4 border-t border-neutral-100 text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal ({itemCount} productos)</span>
                  <span>{formatCLP(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Envío</span>
                  <span className="text-success font-semibold">Gratis</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-neutral-200">
                  <span className="text-neutral-900">Total a pagar</span>
                  <span className="text-primary-700 text-lg">{formatCLP(cartTotal)}</span>
                </div>
              </div>
            </div>

            {/* Botón de pago */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-cta w-full py-4 text-base"
            >
              {isSubmitting ? (
                <><Loader2 size={18} className="animate-spin" /> Procesando…</>
              ) : (
                <>Pagar {formatCLP(cartTotal)} <ChevronRight size={16} /></>
              )}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-xs text-neutral-400">
              <Lock size={11} />
              Pago 100% seguro · Transbank / Flow certificados
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
