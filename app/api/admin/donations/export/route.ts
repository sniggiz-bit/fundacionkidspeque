export const dynamic = 'force-dynamic';
/**
 * GET /api/admin/donations/export
 * ─────────────────────────────────────────────────────────────────
 * Exporta donaciones como CSV descargable.
 * Soporta filtros opcionales: ?status=confirmed&gateway=webpay_plus&from=2024-01-01&to=2024-12-31
 */

import { NextRequest, NextResponse } from "next/server";
import { db }       from "@/lib/db";
import { cookies }  from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? "fallback-dev-secret-change-in-production"
);

async function verifyAdmin(): Promise<boolean> {
  const token = cookies().get("admin_session")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, JWT_SECRET, { issuer: "kidspeque-admin" });
    return true;
  } catch { return false; }
}

// Escapar valor CSV (RFC 4180)
function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  if (!await verifyAdmin()) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status   = searchParams.get("status");
  const gateway  = searchParams.get("gateway");
  const from     = searchParams.get("from");
  const to       = searchParams.get("to");

  const where = {
    ...(status  ? { status:  status as "confirmed"  } : {}),
    ...(gateway ? { gateway: gateway as "webpay_plus" } : {}),
    ...(from || to ? {
      createdAt: {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to   ? { lte: new Date(to + "T23:59:59Z") } : {}),
      },
    } : {}),
  };

  const donations = await db.donation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10000, // Límite de seguridad
    include: {
      contributor: { select: { firstName: true, lastName: true, email: true, isAnonymous: true } },
      dream:       { select: { publicId: true, title: true } },
    },
  });

  // Headers CSV
  const headers = [
    "ID",
    "Fecha",
    "Nombre",
    "Email",
    "Anónimo",
    "Sueño ID",
    "Sueño",
    "Monto (CLP)",
    "Moneda",
    "Tasa de cambio",
    "Gateway",
    "Estado",
    "N° Recibo",
    "Método de pago",
    "Cuotas",
    "Mensaje",
  ];

  const rows = donations.map((d) => [
    d.id,
    d.createdAt.toISOString(),
    d.contributor.isAnonymous ? "Anónimo/a" : `${d.contributor.firstName} ${d.contributor.lastName}`,
    d.contributor.isAnonymous ? "" : d.contributor.email,
    d.contributor.isAnonymous ? "Sí" : "No",
    d.dream.publicId,
    d.dream.title,
    Number(d.amountInCLP),
    d.currency,
    d.exchangeRate ? Number(d.exchangeRate).toFixed(4) : "",
    d.gateway,
    d.status,
    d.receiptNumber ?? "",
    d.paymentMethod ?? "",
    d.installments ?? 1,
    d.message ?? "",
  ]);

  const csvLines = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ];

  const csv = csvLines.join("\r\n");
  const filename = `donaciones-kidspeque-${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

