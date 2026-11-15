/**
 * lib/stats.ts
 * ─────────────────────────────────────────────────────────────────
 * Sincronización y recálculo de estadísticas en tiempo real para:
 * - Sueños (recaudado, porcentaje de progreso, donantes, estado funded)
 * - Donantes / Contributors (total donado, cantidad de donaciones)
 * - Invalidación de caché en Next.js
 */

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Recalcula las estadísticas de un sueño específico a partir de sus donaciones confirmadas.
 */
export async function recalculateDreamStats(dreamId: string) {
  if (!dreamId) return null;

  try {
    const dream = await db.dream.findUnique({
      where: { id: dreamId },
      select: { id: true, targetAmount: true, status: true, slug: true },
    });

    if (!dream) return null;

    // Sumar y contar todas las donaciones con status="confirmed"
    const aggregate = await db.donation.aggregate({
      where: { dreamId, status: "confirmed" },
      _sum: { amountInCLP: true },
      _count: { id: true },
    });

    const raisedAmountCLP = aggregate._sum.amountInCLP ?? BigInt(0);
    const donorCount = aggregate._count.id ?? 0;

    const targetAmountNumber = Number(dream.targetAmount);
    const raisedAmountNumber = Number(raisedAmountCLP);

    let progressPct = 0;
    if (targetAmountNumber > 0) {
      progressPct = Math.min(999.99, Number(((raisedAmountNumber / targetAmountNumber) * 100).toFixed(2)));
    }

    // Si alcanzó la meta (100%+) y estaba 'active', pasa a 'funded'
    let newStatus = dream.status;
    if (progressPct >= 100 && dream.status === "active") {
      newStatus = "funded";
    }

    const updated = await db.dream.update({
      where: { id: dreamId },
      data: {
        raisedAmount: raisedAmountCLP,
        donorCount: donorCount,
        progressPct: progressPct,
        status: newStatus,
      },
    });

    // Invalidar caché público de Next.js
    try {
      revalidatePath("/", "layout");
      revalidatePath("/suenos", "page");
      if (dream.slug) {
        revalidatePath(`/suenos/${dream.slug}`, "page");
      }
      revalidatePath("/admin/suenos", "page");
      revalidatePath("/admin/donaciones", "page");
      revalidatePath("/admin", "page");
    } catch {
      // Ignorar si se ejecuta fuera de contexto HTTP (CLI / scripts)
    }

    return updated;
  } catch (error) {
    console.error(`[stats] Error al recalcular sueño ${dreamId}:`, error);
    throw error;
  }
}

/**
 * Recalcula las estadísticas del donante (total donado y número de donaciones).
 */
export async function recalculateContributorStats(contributorId: string) {
  if (!contributorId) return null;

  try {
    const aggregate = await db.donation.aggregate({
      where: { contributorId, status: "confirmed" },
      _sum: { amountInCLP: true },
      _count: { id: true },
    });

    const totalDonated = aggregate._sum.amountInCLP ?? BigInt(0);
    const donationCount = aggregate._count.id ?? 0;

    return await db.contributor.update({
      where: { id: contributorId },
      data: {
        totalDonated,
        donationCount,
      },
    });
  } catch (error) {
    console.error(`[stats] Error al recalcular donante ${contributorId}:`, error);
    return null;
  }
}

/**
 * Sincroniza todas las métricas afectadas tras confirmar o alterar una donación.
 */
export async function syncDonationStats(donationId: string) {
  if (!donationId) return;

  try {
    const donation = await db.donation.findUnique({
      where: { id: donationId },
      select: { id: true, dreamId: true, contributorId: true, status: true },
    });

    if (!donation) return;

    await Promise.all([
      recalculateDreamStats(donation.dreamId),
      recalculateContributorStats(donation.contributorId),
    ]);
  } catch (error) {
    console.error(`[stats] Error al sincronizar donación ${donationId}:`, error);
  }
}

/**
 * Recalcula en lote todos los sueños y donantes (Backfill / Mantenimiento).
 */
export async function recalculateAllStats() {
  const dreams = await db.dream.findMany({ select: { id: true } });
  for (const d of dreams) {
    await recalculateDreamStats(d.id);
  }

  const contributors = await db.contributor.findMany({ select: { id: true } });
  for (const c of contributors) {
    await recalculateContributorStats(c.id);
  }

  return { dreamsCount: dreams.length, contributorsCount: contributors.length };
}
