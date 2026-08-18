/**
 * components/VolunteerForm.tsx
 * ─────────────────────────────────────────────────────────────────
 * Formulario de registro de voluntarios con validación Zod.
 * Captura: tipo, datos personales, habilidades y disponibilidad.
 */

"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver }         from "@hookform/resolvers/zod";
import { z }                   from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2, Send, Plus, X } from "lucide-react";

// ── Schema de validación ──────────────────────────────────────────────────────

const volunteerSchema = z.object({
  type: z.enum(
    ["psychologist", "therapist", "social_worker", "artist", "volunteer"],
    { errorMap: () => ({ message: "Selecciona un tipo de colaborador" }) }
  ),
  firstName:    z.string().min(2, "Nombre muy corto").max(100),
  lastName:     z.string().min(2, "Apellido muy corto").max(100),
  email:        z.string().email("Email inválido"),
  phone:        z.string().optional(),
  profession:   z.string().max(150).optional(),
  bio:          z.string().max(500, "Máximo 500 caracteres").optional(),
  skills:       z.array(z.string()).min(1, "Agrega al menos una habilidad").max(10),
  hoursPerWeek: z.number().min(1).max(40),
  preferredSchedule: z.enum(["morning", "afternoon", "evening", "flexible"]),
  linkedInUrl:  z.string().url("URL inválida").optional().or(z.literal("")),
  languages:    z.array(z.string()).min(1),
  termsAccepted:z.boolean().refine((v) => v, "Debes aceptar los términos"),
});

type VolunteerFormData = z.infer<typeof volunteerSchema>;

// ── Constantes ────────────────────────────────────────────────────────────────

const COLLABORATOR_TYPES = [
  { value: "psychologist",  label: "Psicólogo/a",           emoji: "🧠" },
  { value: "therapist",     label: "Terapeuta",              emoji: "💙" },
  { value: "social_worker", label: "Trabajador/a Social",    emoji: "👥" },
  { value: "artist",        label: "Artista / Facilitador",  emoji: "🎨" },
  { value: "volunteer",     label: "Voluntario/a General",   emoji: "🙋" },
] as const;

const SCHEDULES = [
  { value: "morning",   label: "Mañana (08-12h)"   },
  { value: "afternoon", label: "Tarde (12-18h)"    },
  { value: "evening",   label: "Noche (18-22h)"    },
  { value: "flexible",  label: "Horario flexible"  },
] as const;

const SUGGESTED_SKILLS = [
  "Psicología infantil", "Arte terapia", "Música", "Danza", "Teatro",
  "Pintura", "Manualidades", "Fotografía", "Diseño gráfico", "Programación",
  "Carpintería", "Cocina", "Deporte", "Educación especial", "Idiomas",
];

// ── Componente ────────────────────────────────────────────────────────────────

export function VolunteerForm() {
  const [success, setSuccess] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<VolunteerFormData>({
    resolver: zodResolver(volunteerSchema),
    defaultValues: {
      skills:    [],
      languages: ["es"],
      hoursPerWeek: 4,
      preferredSchedule: "flexible",
      termsAccepted: false,
    },
  });

  const selectedType = watch("type");
  const skills       = watch("skills");

  // Agregar habilidad
  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed || skills.includes(trimmed) || skills.length >= 10) return;
    setValue("skills", [...skills, trimmed], { shouldValidate: true });
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setValue("skills", skills.filter((s) => s !== skill), { shouldValidate: true });
  };

  // Submit
  const onSubmit = async (data: VolunteerFormData) => {
    try {
      const res = await fetch("/api/collaborators/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al registrar");
      setSuccess(true);
    } catch (err) {
      console.error(err);
    }
  };

  // ── Pantalla de éxito ─────────────────────────────────────────────────────

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card p-10 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} className="text-success" />
        </div>
        <h2 className="font-display font-bold text-2xl text-neutral-900 mb-3">
          ¡Gracias por inscribirte!
        </h2>
        <p className="text-neutral-600 leading-relaxed max-w-sm mx-auto">
          Tu postulación fue recibida. El equipo de Fundación Kidspeque la revisará y
          te contactará en un plazo de 5 días hábiles.
        </p>
      </motion.div>
    );
  }

  // ── Formulario ────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="card p-6 sm:p-8 space-y-7"
      aria-label="Formulario de registro de voluntarios"
    >
      <div>
        <h2 className="font-display font-bold text-xl text-neutral-900 mb-1">
          Registro de colaborador/a
        </h2>
        <p className="text-sm text-neutral-500">
          Todos los campos marcados con * son obligatorios.
        </p>
      </div>

      {/* Tipo de colaborador */}
      <fieldset>
        <legend className="block text-sm font-semibold text-neutral-700 mb-3">
          Tipo de colaborador *
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {COLLABORATOR_TYPES.map((t) => (
            <label
              key={t.value}
              className={`cursor-pointer flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${
                selectedType === t.value
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-neutral-200 hover:border-neutral-300 text-neutral-700"
              }`}
            >
              <input
                type="radio"
                value={t.value}
                {...register("type")}
                className="sr-only"
              />
              <span className="text-xl" aria-hidden>{t.emoji}</span>
              <span className="text-xs font-semibold leading-tight">{t.label}</span>
            </label>
          ))}
        </div>
        {errors.type && (
          <p role="alert" className="text-xs text-error mt-2">{errors.type.message}</p>
        )}
      </fieldset>

      {/* Datos personales */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-neutral-700">Datos personales</legend>

        <div className="grid grid-cols-2 gap-3">
          {/* Nombre */}
          <div>
            <label htmlFor="v-first" className="block text-xs font-medium text-neutral-600 mb-1.5">
              Nombre *
            </label>
            <input id="v-first" {...register("firstName")} type="text" autoComplete="given-name"
              placeholder="María" className="input-field" aria-required />
            {errors.firstName && <p role="alert" className="text-xs text-error mt-1">{errors.firstName.message}</p>}
          </div>
          {/* Apellido */}
          <div>
            <label htmlFor="v-last" className="block text-xs font-medium text-neutral-600 mb-1.5">
              Apellido *
            </label>
            <input id="v-last" {...register("lastName")} type="text" autoComplete="family-name"
              placeholder="González" className="input-field" aria-required />
            {errors.lastName && <p role="alert" className="text-xs text-error mt-1">{errors.lastName.message}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="v-email" className="block text-xs font-medium text-neutral-600 mb-1.5">
            Correo electrónico *
          </label>
          <input id="v-email" {...register("email")} type="email" autoComplete="email"
            placeholder="tu@correo.cl" className="input-field" aria-required />
          {errors.email && <p role="alert" className="text-xs text-error mt-1">{errors.email.message}</p>}
        </div>

        {/* Teléfono y Profesión */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="v-phone" className="block text-xs font-medium text-neutral-600 mb-1.5">
              Teléfono
            </label>
            <input id="v-phone" {...register("phone")} type="tel" autoComplete="tel"
              placeholder="+56 9 1234 5678" className="input-field" />
          </div>
          <div>
            <label htmlFor="v-profession" className="block text-xs font-medium text-neutral-600 mb-1.5">
              Profesión / Oficio
            </label>
            <input id="v-profession" {...register("profession")} type="text"
              placeholder="Psicóloga clínica" className="input-field" />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="v-bio" className="block text-xs font-medium text-neutral-600 mb-1.5">
            Cuéntanos sobre ti <span className="text-neutral-400 font-normal">(opcional)</span>
          </label>
          <textarea id="v-bio" {...register("bio")} rows={3}
            placeholder="¿Por qué quieres colaborar? ¿Qué experiencia tienes con niños?"
            className="input-field resize-none" maxLength={500} />
          {errors.bio && <p role="alert" className="text-xs text-error mt-1">{errors.bio.message}</p>}
        </div>
      </fieldset>

      {/* Habilidades */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-neutral-700">
          Habilidades o talentos * <span className="font-normal text-neutral-400">(mín. 1, máx. 10)</span>
        </legend>

        {/* Input personalizado */}
        <div className="flex gap-2">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); }
            }}
            placeholder="Escribe una habilidad y presiona Enter"
            className="input-field flex-1"
            aria-label="Agregar habilidad"
          />
          <button
            type="button"
            onClick={() => addSkill(skillInput)}
            className="btn-outline px-3 py-2"
            aria-label="Agregar habilidad"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Sugerencias */}
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addSkill(s)}
              className="badge badge-primary cursor-pointer hover:bg-primary-200 transition-colors text-xs"
              aria-label={`Agregar habilidad: ${s}`}
            >
              + {s}
            </button>
          ))}
        </div>

        {/* Habilidades seleccionadas */}
        <AnimatePresence>
          {skills.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-wrap gap-2"
              role="list"
              aria-label="Habilidades seleccionadas"
            >
              {skills.map((skill) => (
                <motion.span
                  key={skill}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  role="listitem"
                  className="flex items-center gap-1.5 bg-primary-600 text-white text-xs font-medium px-3 py-1.5 rounded-full"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    aria-label={`Quitar habilidad: ${skill}`}
                    className="hover:bg-primary-700 rounded-full p-0.5 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {errors.skills && (
          <p role="alert" className="text-xs text-error">{errors.skills.message}</p>
        )}
      </fieldset>

      {/* Disponibilidad */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-neutral-700">Disponibilidad</legend>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="v-hours" className="block text-xs font-medium text-neutral-600 mb-1.5">
              Horas por semana *
            </label>
            <input id="v-hours" {...register("hoursPerWeek", { valueAsNumber: true })}
              type="number" min={1} max={40} className="input-field" />
          </div>
          <div>
            <label htmlFor="v-schedule" className="block text-xs font-medium text-neutral-600 mb-1.5">
              Horario preferido *
            </label>
            <select id="v-schedule" {...register("preferredSchedule")} className="input-field">
              {SCHEDULES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      {/* Términos */}
      <div className="border-t border-neutral-200 pt-5 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input type="checkbox" {...register("termsAccepted")}
            className="w-4 h-4 mt-0.5 rounded accent-primary-600 cursor-pointer flex-shrink-0" />
          <span className="text-sm text-neutral-700 group-hover:text-neutral-900 leading-relaxed">
            Acepto los{" "}
            <a href="/terminos" className="text-primary-600 underline hover:text-primary-700">
              Términos de Voluntariado
            </a>{" "}
            y la{" "}
            <a href="/privacidad" className="text-primary-600 underline hover:text-primary-700">
              Política de Privacidad
            </a>.
            Entiendo que mi postulación será revisada y que se realizará una verificación de antecedentes.
          </span>
        </label>
        {errors.termsAccepted && (
          <p role="alert" className="text-xs text-error">{errors.termsAccepted.message}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-cta w-full py-4 text-base"
      >
        {isSubmitting ? (
          <><Loader2 size={18} className="animate-spin" aria-hidden /> Enviando postulación…</>
        ) : (
          <><Send size={16} aria-hidden /> Enviar mi postulación</>
        )}
      </button>
    </form>
  );
}
