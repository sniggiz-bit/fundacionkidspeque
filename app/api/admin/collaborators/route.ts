export const dynamic = 'force-dynamic';
/**
 * GET /api/admin/collaborators  — Listar colaboradores/voluntarios
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

export async function GET(request: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page   = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit  = 20;
  const status = searchParams.get("status");
  const type   = searchParams.get("type");

  const where = {
    ...(status ? { status: status as "pending" } : {}),
    ...(type   ? { type:   type   as "volunteer" } : {}),
  };

  const [collaborators, total] = await Promise.all([
    db.collaborator.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    db.collaborator.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: collaborators,
    meta: { total, page, totalPages: Math.ceil(total / limit) },
  });
}

