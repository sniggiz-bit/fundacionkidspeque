/**
 * store/useDonationStore.ts
 * ─────────────────────────────────────────────────────────────────
 * Estado global de donaciones con Zustand.
 * Actualiza los totales en tiempo real cuando el webhook confirma un pago.
 * Persiste el ID de la donación en curso para el flujo post-pago.
 */

import { create } from "zustand";
import { persist, createJSONStorage, devtools } from "zustand/middleware";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface DreamStats {
  dreamId:      string;
  publicId:     string;
  raisedAmount: number; // CLP
  donorCount:   number;
  progressPct:  number;
}

interface PendingDonation {
  donationId:  string;
  dreamId:     string;
  amount:      number;
  currency:    "CLP" | "USD" | "EUR";
  gateway:     string;
  email:       string;
  displayName: string;
  createdAt:   string; // ISO string
}

interface DonationStore {
  // ── State ────────────────────────────────────────────────────────────────
  dreamStats:     Record<string, DreamStats>; // Indexed by dreamId
  pendingDonation: PendingDonation | null;
  lastConfirmedId: string | null;

  // ── Actions ──────────────────────────────────────────────────────────────

  /** Actualiza estadísticas de un sueño (llamado por webhook SSE) */
  updateDreamStats: (stats: DreamStats) => void;

  /** Registra la donación iniciada (antes de redirigir al gateway) */
  setPendingDonation: (donation: PendingDonation) => void;

  /** Limpia la donación pendiente tras confirmación */
  clearPendingDonation: () => void;

  /** Marca como confirmada y guarda el ID para la página de éxito */
  confirmDonation: (donationId: string) => void;

  /** Obtiene estadísticas de un sueño por su ID */
  getStats: (dreamId: string) => DreamStats | undefined;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useDonationStore = create<DonationStore>()(
  devtools(
    persist(
      (set, get) => ({
        dreamStats:      {},
        pendingDonation: null,
        lastConfirmedId: null,

        updateDreamStats: (stats) =>
          set((state) => ({
            dreamStats: {
              ...state.dreamStats,
              [stats.dreamId]: stats,
            },
          })),

        setPendingDonation: (donation) =>
          set({ pendingDonation: donation }),

        clearPendingDonation: () =>
          set({ pendingDonation: null }),

        confirmDonation: (donationId) =>
          set({ lastConfirmedId: donationId, pendingDonation: null }),

        getStats: (dreamId) => get().dreamStats[dreamId],
      }),
      {
        name:    "kidspeque-donations",
        storage: createJSONStorage(() => sessionStorage), // sessionStorage: no persiste entre sesiones
        partialize: (state) => ({
          // Solo persiste lo necesario para el flujo post-pago
          pendingDonation: state.pendingDonation,
          lastConfirmedId: state.lastConfirmedId,
        }),
      }
    ),
    { name: "DonationStore" }
  )
);
