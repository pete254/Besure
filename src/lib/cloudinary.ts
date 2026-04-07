// src/lib/cloudinary.ts
// Cloudinary upload helper for BeSure Insurance Solutions
// Replace CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env.local

import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from "cloudinary";

// Configure once — safe to call multiple times (idempotent)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

export type CloudinaryFolder =
  | "besure/customers/id"
  | "besure/customers/kra"
  | "besure/customers/passport"
  | "besure/customers/company-docs"
  | "besure/policies/logbooks"
  | "besure/policies/valuations"
  | "besure/claims/docs"
  | "besure/claims/photos";

interface UploadResult {
  publicId: string;
  secureUrl: string;
  format: string;
  bytes: number;
}

/**
 * Upload a file Buffer or base64 string to Cloudinary.
 * Returns the public_id and secure_url for storage in Neon DB.
 */
export async function uploadToCloudinary(
  fileData: Buffer | string,
  folder: CloudinaryFolder,
  filename?: string
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadOptions: Record<string, unknown> = {
      folder,
      resource_type: "auto",
      use_filename: !!filename,
      unique_filename: true,
      overwrite: false,
      ...(filename ? { public_id: sanitizeFilename(filename) } : {}),
    };

    const uploadCallback = (
      error: UploadApiErrorResponse | undefined,
      result: UploadApiResponse | undefined
    ) => {
      if (error) return reject(error);
      if (!result) return reject(new Error("No result from Cloudinary"));
      resolve({
        publicId: result.public_id as string,
        secureUrl: result.secure_url as string,
        format: result.format as string,
        bytes: result.bytes as number,
      });
    };

    if (Buffer.isBuffer(fileData)) {
      cloudinary.uploader
        .upload_stream(uploadOptions, uploadCallback)
        .end(fileData);
    } else {
      // base64 or URL string
      cloudinary.uploader.upload(fileData, uploadOptions, uploadCallback);
    }
  });
}

/**
 * Delete a file from Cloudinary by its public_id.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { invalidate: true });
}

/**
 * Generate a signed URL for temporary private access (useful for sensitive docs).
 */
export function getSignedUrl(publicId: string, expiresInSeconds = 3600): string {
  return cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/\.[^/.]+$/, "") // strip extension
    .replace(/[^a-z0-9_-]/gi, "_")
    .toLowerCase()
    .slice(0, 80);
}

export default cloudinary;