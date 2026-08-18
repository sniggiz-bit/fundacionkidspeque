"use client";

/**
 * ─────────────────────────────────────────────────────────────────
 *  WIZARD DE DONACIÓN — Flujo de 3 pasos
 *  Paso 1: Elegir sueño + monto
 *  Paso 2: Datos del donante
 *  Paso 3: Pago + confirmación
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Heart, Shield, ChevronRight, ChevronLeft,
  CreditCard, CheckCircle, Lock, Loader2
} from "lucide-react";

// ── Constantes ──────────────────────────────────────────────────────────────

const PRESET_AMOUNTS_CLP = [5000, 10000, 20000, 50000, 100000] as const;
const MAX_STEP = 3;

// ── Schemas de validación Zod ────────────────────────────────────────────────

const step1Schema = z.object({
  dreamId:      z.string().min(1, "Selecciona un sueño"),
  amount:       z.number({ invalid_type_error: "Ingresa un monto" })
                 .int("Solo números enteros")
                 .min(1000, "El monto mínimo es $1.000 CLP")
                 .max(10_000_000, "El monto máximo es $10.000.000 CLP"),
  isRecurring:  z.boolean().default(false),
});

const step2Schema = z.object({
  firstName:         z.string().min(2, "Nombre demasiado corto").max(100),
  lastName:          z.string().min(2, "Apellido demasiado corto").max(100),
  email:             z.string().email("Email inválido"),
  rut:               z.string()
                      .regex(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/, "RUT inválido (ej: 12.345.678-9)")
                      .optional()
                      .or(z.literal("")),
  isAnonymous:       z.boolean().default(false),
  newsletterConsent: z.boolean().default(false),
  message:           z.string().max(500, "Máximo 500 caracteres").optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

// ── Utilidades ───────────────────────────────────────────────────────────────

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  const labels = ["Monto", "Tus datos", "Pago"];
  return (
    <div className="flex items-center justify-center gap-0 mb-8" role="list" aria-label="Pasos del proceso">
      {Array.from({ length: total }, (_, i) => {
        const step      = i + 1;
        const isActive  = step === current;
        const isDone    = step < current;
        return (
          <div key={step} className="flex items-center" role="listitem">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isDone    ? "bg-success text-white" :
                  isActive  ? "bg-primary-600 text-white shadow-glow" :
                              "bg-neutral-200 text-neutral-500"
                }`}
                aria-current={isActive ? "step" : undefined}
              >
                {isDone ? <CheckCircle size={16} /> : step}
              </div>
              <span className={`text-[11px] font-medium hidden sm:block ${isActive ? "text-primary-700" : "text-neutral-400"}`}>
                {labels[i]}
              </span>
            </div>
            {step < total && (
              <div className={`w-12 sm:w-20 h-0.5 mb-4 mx-1 transition-all duration-500 ${
                isDone ? "bg-success" : "bg-neutral-200"
              }`} aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── PASO 1: Elegir monto ──────────────────────────────────────────────────────

interface Step1Props {
  onNext: (data: Step1Data) => void;
  defaultValues?: Partial<Step1Data>;
}

function Step1Amount({ onNext, defaultValues }: Step1Props) {
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const { handleSubmit, setValue, watch, formState: { errors } } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      dreamId:      defaultValues?.dreamId ?? "SUEÑO-0001",
      amount:       defaultValues?.amount,
      isRecurring:  defaultValues?.isRecurring ?? false,
    },
  });

  const currentAmount = watch("amount");

  const selectPreset = (amount: number) => {
    setSelectedPreset(amount);
    setCustomAmount("");
    setValue("amount", amount, { shouldValidate: true });
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setCustomAmount(raw);
    setSelectedPreset(null);
    if (raw) setValue("amount", Number(raw), { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate>
      <div className="space-y-6">

        {/* Selector de sueño (simplificado) */}
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-2">
            ¿A qué sueño quieres donar?
          </label>
          <select
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                       bg-white text-neutral-800 transition-all"
            onChange={(e) => setValue("dreamId", e.target.value)}
            defaultValue="SUEÑO-0001"
            aria-required
          >
            <option value="SUEÑO-0001">🎨 SUEÑO-0001 — El sueño de Valentina</option>
            <option value="SUEÑO-0003">🎵 SUEÑO-0003 — El sueño de Isidora</option>
            <option value="SUEÑO-0004">🤖 SUEÑO-0004 — El sueño de Diego</option>
            <option value="SUEÑO-0005">💃 SUEÑO-0005 — El sueño de Camila</option>
          </select>
        </div>

        {/* Montos preestablecidos */}
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-3">
            Elige o ingresa un monto <span className="text-neutral-400 font-normal">(en pesos CLP)</span>
          </label>
          <div className="grid grid-cols-3 gap-2 mb-3" role="group" aria-label="Montos sugeridos">
            {PRESET_AMOUNTS_CLP.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => selectPreset(amount)}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-accent-500 ${
                  selectedPreset === amount
                    ? "border-accent-500 bg-accent-50 text-accent-700"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-accent-300"
                }`}
                aria-pressed={selectedPreset === amount}
              >
                {formatCLP(amount)}
              </button>
            ))}
          </div>

          {/* Monto personalizado */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-medium">
              $
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={customAmount}
              onChange={handleCustomChange}
              placeholder="Otro monto personalizado"
              className="w-full pl-8 pr-4 py-3 rounded-xl border border-neutral-200 text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         transition-all placeholder-neutral-400"
              aria-label="Monto personalizado en pesos chilenos"
            />
          </div>
          {errors.amount && (
            <p role="alert" className="text-xs text-error mt-1.5 flex items-center gap-1">
              <span aria-hidden>⚠</span> {errors.amount.message}
            </p>
          )}
        </div>

        {/* Resumen */}
        {currentAmount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-center"
          >
            <p className="text-sm text-neutral-600">Tu donación</p>
            <p className="font-display text-2xl font-extrabold text-primary-700 mt-0.5">
              {formatCLP(currentAmount)}
            </p>
            <p className="text-xs text-neutral-500 mt-1">= 100% va directo al sueño del niño/a</p>
          </motion.div>
        )}

        <button type="submit" className="btn-cta w-full py-3.5">
          Continuar
          <ChevronRight size={16} aria-hidden />
        </button>

        {/* Sello de seguridad */}
        <p className="flex items-center justify-center gap-1.5 text-xs text-neutral-400">
          <Lock size={11} aria-hidden />
          Pago 100% seguro · SSL/TLS · Sin guardar datos de tarjeta
        </p>
      </div>
    </form>
  );
}

// ── PASO 2: Datos del donante ─────────────────────────────────────────────────

interface Step2Props {
  onNext: (data: Step2Data) => void;
  onBack: () => void;
}

function Step2Contributor({ onNext, onBack }: Step2Props) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { isAnonymous: false, newsletterConsent: false },
  });

  watch("isAnonymous"); // mantiene reactividad para el checkbox

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate>
      <div className="space-y-4">

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="block text-xs font-semibold text-neutral-600 mb-1.5">
              Nombre *
            </label>
            <input
              id="firstName"
              {...register("firstName")}
              type="text"
              autoComplete="given-name"
              className="input-field"
              placeholder="María"
              aria-required
              aria-describedby={errors.firstName ? "err-firstName" : undefined}
            />
            {errors.firstName && (
              <p id="err-firstName" role="alert" className="text-xs text-error mt-1">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="lastName" className="block text-xs font-semibold text-neutral-600 mb-1.5">
              Apellido *
            </label>
            <input
              id="lastName"
              {...register("lastName")}
              type="text"
              autoComplete="family-name"
              className="input-field"
              placeholder="González"
              aria-required
            />
            {errors.lastName && (
              <p role="alert" className="text-xs text-error mt-1">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-neutral-600 mb-1.5">
            Correo electrónico *
          </label>
          <input
            id="email"
            {...register("email")}
            type="email"
            autoComplete="email"
            className="input-field"
            placeholder="tu@correo.cl"
            aria-required
          />
          {errors.email && (
            <p role="alert" className="text-xs text-error mt-1">{errors.email.message}</p>
          )}
          <p className="text-xs text-neutral-400 mt-1">Para enviarte el recibo de tu donación</p>
        </div>

        <div>
          <label htmlFor="rut" className="block text-xs font-semibold text-neutral-600 mb-1.5">
            RUT <span className="text-neutral-400 font-normal">(opcional — para boleta tributaria)</span>
          </label>
          <input
            id="rut"
            {...register("rut")}
            type="text"
            placeholder="12.345.678-9"
            className="input-field"
            autoComplete="off"
          />
          {errors.rut && (
            <p role="alert" className="text-xs text-error mt-1">{errors.rut.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="message" className="block text-xs font-semibold text-neutral-600 mb-1.5">
            Mensaje para el niño/a <span className="text-neutral-400 font-normal">(opcional)</span>
          </label>
          <textarea
            id="message"
            {...register("message")}
            rows={2}
            maxLength={500}
            placeholder="Escribe un mensaje de aliento..."
            className="input-field resize-none"
          />
        </div>

        {/* Opciones de privacidad */}
        <div className="space-y-2 border-t border-neutral-100 pt-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              {...register("isAnonymous")}
              className="w-4 h-4 rounded accent-primary-600 cursor-pointer"
            />
            <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
              Quiero donar de forma anónima
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              {...register("newsletterConsent")}
              className="w-4 h-4 rounded accent-primary-600 cursor-pointer"
            />
            <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
              Quiero recibir novedades sobre los sueños que apoyé
            </span>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onBack} className="btn-outline flex-shrink-0 px-4 py-3">
            <ChevronLeft size={16} aria-hidden />
          </button>
          <button type="submit" className="btn-cta flex-1 py-3">
            Ir al pago
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
      </div>
    </form>
  );
}

// ── PASO 3: Confirmación y redirección al gateway ─────────────────────────────

interface Step3Props {
  step1: Step1Data;
  step2: Step2Data;
  onBack: () => void;
}

// Gateways disponibles
const GATEWAYS = [
  { id: "webpay_plus", label: "Webpay Plus", flag: "🇨🇱", sub: "Débito / Crédito Chile", currency: "CLP" },
  { id: "flow",        label: "Flow.cl",     flag: "🇨🇱", sub: "Transferencia y más",   currency: "CLP" },
  { id: "paypal",      label: "PayPal",       flag: "🌍", sub: "Internacional (USD)",   currency: "USD" },
] as const;

type GatewayId = typeof GATEWAYS[number]["id"];

function Step3Payment({ step1, step2, onBack }: Step3Props) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [gateway, setGateway] = useState<GatewayId>("webpay_plus");

  const selectedGw = GATEWAYS.find((g) => g.id === gateway)!;
  const currency   = selectedGw.currency;

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/donations/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...step1,
          ...step2,
          gateway,
          currency, // CLP para webpay/flow, USD para paypal
        }),
      });
      const data = await response.json();
      if (data.success && data.data?.redirectUrl) {
        window.location.href = data.data.redirectUrl;
      } else {
        setError(data.error?.message ?? "Error al iniciar el pago. Intenta de nuevo.");
        setLoading(false);
      }
    } catch {
      setError("No se pudo conectar. Verifica tu conexión e intenta de nuevo.");
      setLoading(false);
    }
  }, [step1, step2, gateway, currency]);

  return (
    <div className="space-y-5">
      {/* Resumen */}
      <div className="bg-neutral-50 rounded-xl p-4 space-y-2 text-sm">
        <h3 className="font-semibold text-neutral-800 mb-3">Resumen de tu donación</h3>
        <div className="flex justify-between">
          <span className="text-neutral-500">Sueño</span>
          <span className="font-medium">{step1.dreamId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Monto</span>
          <span className="font-bold text-primary-700 text-base">{formatCLP(step1.amount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Donante</span>
          <span className="font-medium">
            {step2.isAnonymous ? "Anónimo/a" : `${step2.firstName} ${step2.lastName}`}
          </span>
        </div>
        {currency === "USD" && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5 mt-2">
            ⚠ PayPal procesa en USD · El monto equivalente se calculará al tipo de cambio del día.
          </p>
        )}
      </div>

      {/* Selector de gateway */}
      <div>
        <p className="text-sm font-semibold text-neutral-700 mb-3">Método de pago</p>
        <div className="grid grid-cols-1 gap-2">
          {GATEWAYS.map((gw) => (
            <button
              key={gw.id}
              type="button"
              onClick={() => setGateway(gw.id)}
              className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                gateway === gw.id
                  ? "border-primary-500 bg-primary-50"
                  : "border-neutral-200 hover:border-neutral-300 bg-white"
              }`}
              aria-pressed={gateway === gw.id}
            >
              <span className="text-xl" aria-hidden>{gw.flag}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-neutral-800">{gw.label}</span>
                <p className="text-xs text-neutral-500">{gw.sub}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                gw.currency === "CLP"
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}>
                {gw.currency}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          ⚠ {error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn-outline flex-shrink-0 px-4 py-3" disabled={loading}>
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="btn-cta flex-1 py-3.5 text-base"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" aria-hidden /> Procesando...</>
          ) : (
            <><CreditCard size={16} aria-hidden /> Donar {formatCLP(step1.amount)}</>
          )}
        </button>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-xs text-neutral-400">
        <Shield size={11} aria-hidden />
        Transacción cifrada · No almacenamos datos de tarjeta
      </p>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────

interface DonationWizardProps {
  dreamId?: string;
  className?: string;
}

export function DonationWizard({ dreamId, className = "" }: DonationWizardProps) {
  const [step,  setStep]  = useState<1 | 2 | 3>(1);
  const [step1, setStep1] = useState<Step1Data | null>(null);
  const [step2, setStep2] = useState<Step2Data | null>(null);

  const handleStep1 = (data: Step1Data) => { setStep1(data); setStep(2); };
  const handleStep2 = (data: Step2Data) => { setStep2(data); setStep(3); };

  const slideVariants = {
    enter:  (dir: number) => ({ x: dir > 0 ? 40  : -40,  opacity: 0 }),
    center: {                   x: 0,                     opacity: 1 },
    exit:   (dir: number) => ({ x: dir > 0 ? -40 : 40,   opacity: 0 }),
  };

  return (
    <div
      id="donar"
      className={`bg-white rounded-3xl border border-neutral-200 shadow-card p-6 sm:p-8 max-w-md mx-auto ${className}`}
      role="region"
      aria-label="Formulario de donación"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-accent-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Heart className="text-accent-500" size={22} fill="currentColor" />
        </div>
        <h2 className="font-display text-xl font-bold text-neutral-900">Haz tu donación</h2>
        <p className="text-sm text-neutral-500 mt-1">100% de tu aporte llega al niño o niña</p>
      </div>

      <StepIndicator current={step} total={MAX_STEP} />

      {/* Contenido del paso — con animación de slide */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          custom={step}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {step === 1 && (
            <Step1Amount
              onNext={handleStep1}
              defaultValues={{ dreamId }}
            />
          )}
          {step === 2 && (
            <Step2Contributor
              onNext={handleStep2}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && step1 && step2 && (
            <Step3Payment
              step1={step1}
              step2={step2}
              onBack={() => setStep(2)}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
