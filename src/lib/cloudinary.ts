// src/lib/cloudinary.ts
// Cloudinary upload helper for Myloe Insurance Agency
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
  | "myloe/customers/id"
  | "myloe/customers/kra"
  | "myloe/customers/passport"
  | "myloe/customers/company-docs"
  | "myloe/policies/logbooks"
  | "myloe/policies/valuations"
  | "myloe/claims/docs"
  | "myloe/claims/photos";

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

/**
 * Generate a public URL for PDFs and documents with proper delivery settings.
 * PDFs may require special handling; this ensures inline viewing works.
 */
export function getPdfUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    secure: true,
    format: "pdf",
    fetch_format: "pdf",
    resource_type: "auto",
  });
}

/**
 * Generate a temporary signed URL for PDF access (1 hour default).
 * Use this if Cloudinary requires authentication for PDF delivery.
 */
export function getPdfSignedUrl(publicId: string, expiresInSeconds = 3600): string {
  return cloudinary.url(publicId, {
    secure: true,
    format: "pdf",
    fetch_format: "pdf",
    sign_url: true,
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
}

/**
 * Check if a Cloudinary URL is likely a signed URL and may need refreshing.
 * Returns true if the URL contains signature parameters.
 */
export function isSignedUrl(url: string): boolean {
  return url.includes("s_") && url.includes("signature");
}

/**
 * Refresh a signed URL by generating a new one from the public ID.
 * Extracts the public ID from a Cloudinary URL for regeneration.
 */
export function refreshSignedPdfUrl(url: string, expiresInSeconds = 3600): string | null {
  try {
    // Extract public ID from URL
    // URL format: https://res.cloudinary.com/[cloud_name]/image/upload/[transformations]/[public_id]
    const matches = url.match(/\/([^\/]+)(?:\?|$)/);
    if (!matches || !matches[1]) return null;
    
    const publicId = matches[1].split("?")[0].split("#")[0];
    if (!publicId) return null;
    
    return getPdfSignedUrl(publicId, expiresInSeconds);
  } catch {
    return null;
  }
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/\.[^/.]+$/, "") // strip extension
    .replace(/[^a-z0-9_-]/gi, "_")
    .toLowerCase()
    .slice(0, 80);
}

export default cloudinary;