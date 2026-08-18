/**
 * lib/db.ts
 * ─────────────────────────────────────────────────────────────────
 * Singleton de Prisma Client con patrón recomendado para Next.js.
 * Evita instanciar múltiples conexiones durante Hot Reload en dev.
 */

import { PrismaClient } from "@prisma/client";

// ── Tipos auxiliares ─────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// ── Factory con logging condicional ──────────────────────────────────────────

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    errorFormat: "pretty",
  });
}

// ── Singleton ─────────────────────────────────────────────────────────────────

export const db: PrismaClient =
  globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = db;
}

// ── Helpers de paginación ─────────────────────────────────────────────────────

export interface PaginationParams {
  page:  number;
  limit: number;
}

export function paginate({ page, limit }: PaginationParams) {
  const safePage  = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100); // Máx 100 por página
  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
}

// ── Tipos de selección frecuente (evitan over-fetching) ──────────────────────

/** Campos mínimos para una DreamCard */
export const dreamCardSelect = {
  id:               true,
  publicId:         true,
  title:            true,
  childName:        true,
  childAge:         true,
  shortDescription: true,
  coverImage:       true,
  targetAmount:     true,
  raisedAmount:     true,
  progressPct:      true,
  donorCount:       true,
  status:           true,
  deadline:         true,
  slug:             true,
  category:         true,
  tags:             true,
} as const;

/** Campos completos para la página individual de un sueño */
export const dreamFullSelect = {
  ...dreamCardSelect,
  story:          true,
  gallery:        true,
  publishedAt:    true,
  completedAt:    true,
  metaTitle:      true,
  metaDescription: true,
  donations: {
    where:   { status: "confirmed", isPublic: true },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id:          true,
      amountInCLP: true,
      displayName: true,
      message:     true,
      createdAt:   true,
    },
  },
} as const;
