/**
 * lib/cloudinary.ts
 * Utilidades para subida de imágenes a Cloudinary.
 * Server-side — lee credenciales de process.env o de la base de datos (SiteSettings).
 */

import { v2 as cloudinary } from 'cloudinary';
import { db } from '@/lib/db';

export interface UploadResult {
  url:       string;
  publicId:  string;
  width:     number;
  height:    number;
  format:    string;
  bytes:     number;
}

async function configureCloudinary(): Promise<boolean> {
  let cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  let api_key    = process.env.CLOUDINARY_API_KEY;
  let api_secret = process.env.CLOUDINARY_API_SECRET?.trim();

  const isPlaceholder = (val?: string | null) => !val || val.includes("tu_") || val.includes("placeholder");

  if (isPlaceholder(cloud_name) || isPlaceholder(api_key) || isPlaceholder(api_secret)) {
    try {
      const settings = await db.siteSettings.findUnique({ where: { id: "global" } });
      if (settings?.cloudinaryCloudName) cloud_name = settings.cloudinaryCloudName;
      if (settings?.cloudinaryApiKey)    api_key    = settings.cloudinaryApiKey;
      if (settings?.cloudinaryApiSecret) api_secret = settings.cloudinaryApiSecret;
    } catch (err) {
      console.error("[Cloudinary] Error leyendo SiteSettings:", err);
    }
  }

  if (isPlaceholder(cloud_name) || isPlaceholder(api_key) || isPlaceholder(api_secret)) {
    return false;
  }

  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
    secure: true,
  });

  return true;
}

export async function uploadDocument(
  file:     Buffer | string,
  folder:   string,
  filename?: string
): Promise<UploadResult> {
  const ok = await configureCloudinary();
  if (!ok) {
    throw new Error("Cloudinary no está configurado (falta Cloud Name, API Key o API Secret en el panel admin o .env).");
  }

  const options = {
    folder,
    public_id: filename,
    resource_type: "auto" as const,
  };

  if (typeof file === "string") {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(file, options, (err, result) => {
        if (err || !result) reject(err);
        else resolve({ url: result.secure_url, publicId: result.public_id, width: result.width ?? 0, height: result.height ?? 0, format: result.format ?? "pdf", bytes: result.bytes ?? 0 });
      });
    });
  } else {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(options, (err, result) => {
        if (err || !result) reject(err);
        else resolve({ url: result.secure_url, publicId: result.public_id, width: result.width ?? 0, height: result.height ?? 0, format: result.format ?? "pdf", bytes: result.bytes ?? 0 });
      });
      uploadStream.end(file);
    });
  }
}

export async function uploadImage(
  file:      Buffer | string,
  folder:    string,
  publicId?: string
): Promise<UploadResult> {
  const ok = await configureCloudinary();
  if (!ok) {
    throw new Error("Cloudinary no está configurado (falta Cloud Name, API Key o API Secret en el panel admin o .env).");
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
  const ok = await configureCloudinary();
  if (!ok) return;

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) reject(error);
      else resolve();
    });
  });
}
