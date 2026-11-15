/**
 * scripts/sync-stats.ts
 * Ejecuta el recálculo y sincronización de estadísticas de sueños y donantes.
 * Uso: npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" scripts/sync-stats.ts
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando recálculo y sincronización de estadísticas...");

  const dreams = await prisma.dream.findMany({
    select: { id: true, title: true, targetAmount: true, status: true },
  });

  console.log(`Encontrados ${dreams.length} sueños.`);

  for (const dream of dreams) {
    const aggregate = await prisma.donation.aggregate({
      where: { dreamId: dream.id, status: "confirmed" },
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

    let newStatus = dream.status;
    if (progressPct >= 100 && dream.status === "active") {
      newStatus = "funded";
    }

    await prisma.dream.update({
      where: { id: dream.id },
      data: {
        raisedAmount: raisedAmountCLP,
        donorCount,
        progressPct,
        status: newStatus,
      },
    });

    console.log(`- Sueño '${dream.title}': recaudado $${raisedAmountNumber.toLocaleString("es-CL")} CLP, donantes: ${donorCount}, progreso: ${progressPct}%`);
  }

  const contributors = await prisma.contributor.findMany({ select: { id: true } });
  for (const c of contributors) {
    const aggregate = await prisma.donation.aggregate({
      where: { contributorId: c.id, status: "confirmed" },
      _sum: { amountInCLP: true },
      _count: { id: true },
    });

    await prisma.contributor.update({
      where: { id: c.id },
      data: {
        totalDonated: aggregate._sum.amountInCLP ?? BigInt(0),
        donationCount: aggregate._count.id ?? 0,
      },
    });
  }

  console.log(`Actualizados ${contributors.length} donantes.`);
  console.log("¡Sincronización finalizada con éxito!");
}

main()
  .catch((err) => {
    console.error("Error en sincronización:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
