/**
 * lib/cloudinary.ts
 * Utilidades para subida de imágenes a Cloudinary.
 * Se usa desde API routes (server-side) — nunca desde el cliente.
 */

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim()
});

export interface UploadResult {
  url:       string;
  publicId:  string;
  width:     number;
  height:    number;
  format:    string;
  bytes:     number;
}

function isConfigured(): boolean {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;

  if (!name || !key || !secret) return false;
  if (name.includes("tu_") || key.includes("tu_") || secret.includes("tu_")) return false;
  return true;
}

export async function uploadImage(
  file:      Buffer | string,
  folder:    string,
  publicId?: string
): Promise<UploadResult> {
  if (!isConfigured()) {
    throw new Error("Cloudinary no está configurado correctamente en .env.local (faltan credenciales reales).");
  }

  const options = {
    folder,
    public_id: publicId,
    transformation: [{ width: 1200, height: 630, crop: "fill", gravity: "auto", fetch_format: "auto", quality: "auto" }]
  };

  if (typeof file === "string") {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(file, options, (err, result) => {
        if (err || !result) reject(err);
        else resolve({ url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height, format: result.format, bytes: result.bytes });
      });
    });
  } else {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(options, (err, result) => {
        if (err || !result) reject(err);
        else resolve({ url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height, format: result.format, bytes: result.bytes });
      });
      uploadStream.end(file);
    });
  }
}

export async function deleteImage(publicId: string): Promise<void> {
  if (!isConfigured()) return;
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) reject(error);
      else resolve();
    });
  });
}
