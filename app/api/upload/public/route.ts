export const dynamic = 'force-dynamic';
/**
 * POST /api/upload/public
 * Recibe un archivo de imagen (multipart/form-data) y lo sube a Cloudinary.
 * Accesible públicamente para el formulario de registro de sueños.
 */

import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    // Límite de tamaño: 3MB para evitar abusos
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 3 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Imagen demasiado grande. Máximo 3 MB." },
        { status: 413 }
      );
    }

    const formData = await request.formData();
    const file     = formData.get("file") as File | null;

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

    const buffer = Buffer.from(await file.arrayBuffer());
    // Subir a la carpeta de envíos del público
    const result = await uploadImage(buffer, "kidspeque/public-submissions");

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
  } catch (err) {
    console.error("[upload-public]", err);
    const msg = err instanceof Error ? err.message : "Error al subir imagen";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

