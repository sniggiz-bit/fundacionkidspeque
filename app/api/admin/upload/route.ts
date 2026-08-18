export const dynamic = 'force-dynamic';
/**
 * POST /api/admin/upload
 * Recibe un archivo de imagen (multipart/form-data) y lo sube a Cloudinary.
 * Solo accesible para admins autenticados.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies }     from "next/headers";
import { jwtVerify }   from "jose";
import { uploadImage } from "@/lib/cloudinary";

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

export async function POST(request: NextRequest) {
  if (!await verifyAdmin()) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Límite de tamaño: 5MB
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Imagen demasiado grande. Máximo 5 MB." },
      { status: 413 }
    );
  }

  const formData = await request.formData();
  const file     = formData.get("file") as File | null;
  const folder   = (formData.get("folder") as string) ?? "general";

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
  }

  // Validar tipo MIME
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato no soportado. Usa JPG, PNG, WebP o AVIF." },
      { status: 415 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadImage(buffer, `kidspeque/${folder}`);

    return NextResponse.json({
      success: true,
      data: {
        url:    result.url,
        width:  result.width,
        height: result.height,
        format: result.format,
        bytes:  result.bytes,
      },
    });
  } catch (err: any) {
    console.error("[admin/upload]", err);
    const msg = err?.message || (typeof err === "string" ? err : "Error al subir imagen");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

