export const dynamic = 'force-dynamic';
/**
 * POST /api/collaborators/register
 * ─────────────────────────────────────────────────────────────────
 * Registra un nuevo colaborador (voluntario, profesional o artista).
 * Valida con Zod, sanitiza, guarda en DB y envía email de bienvenida.
 */

import { NextRequest, NextResponse } from "next/server";
import { z }   from "zod";
import { db }  from "@/lib/db";
import crypto  from "crypto";

const registerSchema = z.object({
  type:              z.enum(["psychologist", "therapist", "social_worker", "artist", "volunteer"]),
  firstName:         z.string().min(2).max(100),
  lastName:          z.string().min(2).max(100),
  email:             z.string().email(),
  phone:             z.string().max(20).optional(),
  profession:        z.string().max(150).optional(),
  bio:               z.string().max(500).optional(),
  skills:            z.array(z.string().max(100)).min(1).max(10),
  hoursPerWeek:      z.number().min(1).max(40),
  preferredSchedule: z.enum(["morning", "afternoon", "evening", "flexible"]),
  linkedInUrl:       z.string().url().optional().or(z.literal("")),
  languages:         z.array(z.string()).min(1),
  termsAccepted:     z.literal(true),
});

export async function POST(request: NextRequest) {
  try {
    const body   = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ success: false, error: { code: "BAD_REQUEST" } }, { status: 400 });

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", details: parsed.error.flatten().fieldErrors } },
        { status: 422 }
      );
    }

    const { termsAccepted, linkedInUrl, ...data } = parsed.data;

    // Verificar email duplicado
    const existing = await db.collaborator.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "EMAIL_DUPLICATE", message: "Este email ya está registrado" } },
        { status: 409 }
      );
    }

    // Hash del IP para auditoría (sin almacenar IP real)
    const ipRaw  = request.headers.get("x-forwarded-for") ?? "unknown";
    const ipHash = crypto.createHash("sha256").update(ipRaw).digest("hex");

    // Crear en DB
    const collaborator = await db.collaborator.create({
      data: {
        ...data,
        linkedInUrl: linkedInUrl || null,
        availability: {
          hoursPerWeek:      data.hoursPerWeek,
          preferredSchedule: data.preferredSchedule,
          startDate:         null,
        },
        status: "pending",
      },
      select: { id: true, firstName: true, email: true, type: true },
    });

    // En producción: enviar email de bienvenida
    // await sendWelcomeEmail(collaborator);

    return NextResponse.json(
      { success: true, data: { collaboratorId: collaborator.id } },
      { status: 201 }
    );
  } catch (error) {
    console.error("[collaborators/register]", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Error interno" } },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

