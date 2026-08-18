/**
 * hooks/useDream.ts
 * ─────────────────────────────────────────────────────────────────
 * Custom hooks para fetching de datos de sueños con TanStack Query.
 * Incluye polling en tiempo real para actualizar raised_amount.
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Dream, ApiResponse, PaginatedResponse, CreateDonationDTO, PaymentInitResponse } from "@/types";

// ── Keys de Query (centralizadas para invalidación limpia) ────────────────────

export const dreamKeys = {
  all:    ()                    => ["dreams"]                    as const,
  lists:  ()                    => [...dreamKeys.all(), "list"]  as const,
  list:   (filters: object)     => [...dreamKeys.lists(), filters] as const,
  detail: (slug: string)        => [...dreamKeys.all(), "detail", slug] as const,
  stats:  (dreamId: string)     => [...dreamKeys.all(), "stats", dreamId] as const,
};

// ── Fetchers (reemplaza con tu librería HTTP preferida) ──────────────────────

async function fetchDreams(params?: {
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Dream>> {
  const search = new URLSearchParams();
  if (params?.status)   search.set("status",   params.status);
  if (params?.category) search.set("category", params.category);
  if (params?.page)     search.set("page",     String(params.page));
  if (params?.limit)    search.set("limit",    String(params.limit));

  const res = await fetch(`/api/dreams?${search.toString()}`);
  if (!res.ok) throw new Error(`Error ${res.status} al cargar sueños`);
  return res.json();
}

async function fetchDreamBySlug(slug: string): Promise<ApiResponse<Dream>> {
  const res = await fetch(`/api/dreams/${slug}`);
  if (!res.ok) throw new Error(`Error ${res.status} al cargar el sueño`);
  return res.json();
}

async function fetchDreamStats(dreamId: string) {
  const res = await fetch(`/api/dreams/${dreamId}/stats`);
  if (!res.ok) throw new Error("Error al cargar estadísticas");
  return res.json() as Promise<{ raisedAmount: number; donorCount: number; progressPct: number }>;
}

async function initiateDonation(data: CreateDonationDTO): Promise<ApiResponse<PaymentInitResponse>> {
  const res = await fetch("/api/donations/initiate", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Error ${res.status} al iniciar donación`);
  return res.json();
}

// ── Hooks de lectura ──────────────────────────────────────────────────────────

/**
 * Lista de sueños activos para la sección crowdfunding.
 * Revalida cada 60 segundos (ISR en cliente).
 */
export function useDreams(params?: {
  status?:   string;
  category?: string;
  page?:     number;
  limit?:    number;
}) {
  return useQuery({
    queryKey:    dreamKeys.list(params ?? {}),
    queryFn:     () => fetchDreams(params),
    staleTime:   60 * 1000,      // 1 minuto
    refetchInterval: 60 * 1000,  // Polling cada 60s para totales
    select: (data) => data.data ?? [],
  });
}

/**
 * Sueño individual por slug — para la página de detalle.
 */
export function useDream(slug: string) {
  return useQuery({
    queryKey:  dreamKeys.detail(slug),
    queryFn:   () => fetchDreamBySlug(slug),
    staleTime: 30 * 1000, // 30 segundos
    enabled:   !!slug,
    select:    (data) => data.data,
  });
}

/**
 * Estadísticas en tiempo real de un sueño (solo raised_amount y progress).
 * Poll agresivo de 15s para mostrar actualizaciones inmediatas post-donación.
 */
export function useDreamStats(dreamId: string, enabled = true) {
  return useQuery({
    queryKey:        dreamKeys.stats(dreamId),
    queryFn:         () => fetchDreamStats(dreamId),
    staleTime:       15 * 1000,
    refetchInterval: 15 * 1000, // Actualizar cada 15 segundos
    enabled:         enabled && !!dreamId,
  });
}

// ── Mutation: iniciar donación ────────────────────────────────────────────────

/**
 * Inicia el proceso de pago.
 * En onSuccess → redirigir al redirectUrl del gateway.
 */
export function useInitiateDonation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: initiateDonation,
    onSuccess: (data, variables) => {
      // Invalidar stats del sueño para reflejar la donación pendiente
      queryClient.invalidateQueries({
        queryKey: dreamKeys.stats(variables.dreamId),
      });
    },
  });
}
