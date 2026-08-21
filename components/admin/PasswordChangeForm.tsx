/**
 * components/admin/PasswordChangeForm.tsx
 * Formulario de cambio de contraseña del panel de administración.
 * Client Component — llama a PUT /api/admin/auth con las tres contraseñas.
 */

"use client";

import { useState, useTransition } from "react";
import {
  Lock, Eye, EyeOff, Save, Loader2,
  CheckCircle2, AlertCircle, ShieldCheck, KeyRound,
} from "lucide-react";

type ShowState = { current: boolean; newP: boolean; confirm: boolean };

export function PasswordChangeForm() {
  const [isPending, startTransition] = useTransition();

  const [current,  setCurrent]  = useState("");
  const [newPass,  setNewPass]  = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [show,     setShow]     = useState<ShowState>({ current: false, newP: false, confirm: false });
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const toggleShow = (field: keyof ShowState) =>
    setShow((s) => ({ ...s, [field]: !s[field] }));

  // Validaciones en cliente
  const strength = (() => {
    if (!newPass) return 0;
    let score = 0;
    if (newPass.length >= 8)  score++;
    if (newPass.length >= 12) score++;
    if (/[A-Z]/.test(newPass)) score++;
    if (/[0-9]/.test(newPass)) score++;
    if (/[^A-Za-z0-9]/.test(newPass)) score++;
    return score;
  })();

  const strengthLabel = ["", "Muy débil", "Débil", "Regular", "Buena", "Fuerte"][strength];
  const strengthColor = ["", "bg-red-500", "bg-orange-500", "bg-yellow-400", "bg-lime-400", "bg-green-500"][strength];

  const mismatch = confirm && newPass !== confirm;
  const canSubmit = current && newPass.length >= 8 && newPass === confirm && !isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/auth", {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            currentPassword: current,
            newPassword:     newPass,
            confirmPassword: confirm,
          }),
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error ?? "Error al cambiar la contraseña");
          return;
        }

        setSuccess(true);
        setCurrent(""); setNewPass(""); setConfirm("");
        setTimeout(() => setSuccess(false), 5000);
      } catch {
        setError("No se pudo conectar con el servidor.");
      }
    });
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">

      {/* Encabezado */}
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-neutral-800">
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
          <KeyRound size={15} className="text-amber-400" aria-hidden />
        </div>
        <div>
          <h2 className="font-display font-bold text-white text-sm">Cambiar contraseña del admin</h2>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            La nueva clave se guarda en la base de datos y se aplica de inmediato.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">

        {/* Contraseña actual */}
        <div>
          <label htmlFor="current-password" className="block text-xs font-semibold text-neutral-400 mb-1.5">
            Contraseña actual
          </label>
          <div className="relative">
            <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden />
            <input
              id="current-password"
              type={show.current ? "text" : "password"}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full pl-9 pr-10 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 transition-all"
              placeholder="Tu contraseña actual"
            />
            <button
              type="button"
              onClick={() => toggleShow("current")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
              aria-label={show.current ? "Ocultar" : "Mostrar"}
            >
              {show.current ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Nueva contraseña */}
        <div>
          <label htmlFor="new-password" className="block text-xs font-semibold text-neutral-400 mb-1.5">
            Nueva contraseña
          </label>
          <div className="relative">
            <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden />
            <input
              id="new-password"
              type={show.newP ? "text" : "password"}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full pl-9 pr-10 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 transition-all"
              placeholder="Mínimo 8 caracteres"
            />
            <button
              type="button"
              onClick={() => toggleShow("newP")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
              aria-label={show.newP ? "Ocultar" : "Mostrar"}
            >
              {show.newP ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Barra de fortaleza */}
          {newPass && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1 h-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-all duration-300 ${
                      strength >= i ? strengthColor : "bg-neutral-800"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[11px] text-neutral-500">
                Fortaleza: <span className={`font-semibold ${
                  strength >= 4 ? "text-green-400" :
                  strength >= 3 ? "text-yellow-400" : "text-red-400"
                }`}>{strengthLabel}</span>
                {" "}· Usa mayúsculas, números y símbolos para mejorarla.
              </p>
            </div>
          )}
        </div>

        {/* Confirmar nueva contraseña */}
        <div>
          <label htmlFor="confirm-password" className="block text-xs font-semibold text-neutral-400 mb-1.5">
            Confirmar nueva contraseña
          </label>
          <div className="relative">
            <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden />
            <input
              id="confirm-password"
              type={show.confirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              className={`w-full pl-9 pr-10 py-2.5 bg-neutral-800 border rounded-xl text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-1 transition-all ${
                mismatch
                  ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
                  : "border-neutral-700 focus:border-primary-500 focus:ring-primary-500/30"
              }`}
              placeholder="Repite la nueva contraseña"
            />
            <button
              type="button"
              onClick={() => toggleShow("confirm")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
              aria-label={show.confirm ? "Ocultar" : "Mostrar"}
            >
              {show.confirm ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {mismatch && (
            <p className="text-[11px] text-red-400 mt-1">Las contraseñas no coinciden.</p>
          )}
        </div>

        {/* Feedback */}
        {success && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/25 text-green-400 text-sm rounded-xl px-4 py-3" role="status">
            <CheckCircle2 size={15} />
            <span>¡Contraseña actualizada! La nueva clave está activa desde ahora.</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/25 text-red-400 text-sm rounded-xl px-4 py-3" role="alert">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Info de seguridad */}
        <div className="flex items-start gap-2 bg-neutral-800/50 rounded-xl px-3 py-2.5">
          <ShieldCheck size={13} className="text-neutral-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            La contraseña se guarda como hash <strong className="text-neutral-400">bcrypt (costo 12)</strong> en la base de datos.
            No se almacena en texto plano. El nuevo hash tiene prioridad sobre el archivo <code className="text-neutral-400">.env</code>.
          </p>
        </div>

        {/* Botón guardar */}
        <button
          type="submit"
          id="change-password-btn"
          disabled={!canSubmit}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-900 font-bold text-sm px-5 py-2.5 rounded-xl transition-all"
        >
          {isPending
            ? <><Loader2 size={14} className="animate-spin" /> Guardando…</>
            : <><Save size={14} /> Cambiar contraseña</>
          }
        </button>
      </form>
    </div>
  );
}
