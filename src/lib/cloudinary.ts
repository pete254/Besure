// src/lib/cloudinary.ts
// Cloudinary upload helper for Myloe Insurance Agency
// PDFs are uploaded as public resources (access controlled at app level via NextAuth)

import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from "cloudinary";

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
 * All files (including PDFs) are uploaded as public `upload` type so they
 * can be accessed directly via URL — access is controlled at the app layer
 * by NextAuth session checks.
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
      // Use "upload" (public) NOT "authenticated" — authenticated type causes
      // 401 errors when the browser tries to load PDFs in iframes.
      // Security is handled by the NextAuth middleware at the route level.
      type: "upload",
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
      cloudinary.uploader.upload(fileData, uploadOptions, uploadCallback);
    }
  });
}

/**
 * Delete a file from Cloudinary by its public_id.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, {
    invalidate: true,
    resource_type: "auto",
  });
}

/**
 * Generate a standard public HTTPS URL for any Cloudinary resource.
 * Works for images and PDFs alike since they are uploaded as `upload` type.
 */
export function getPublicUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: "auto",
  });
}

/**
 * Generate a public PDF URL with inline delivery flags so browsers
 * display it in an iframe rather than forcing a download.
 */
export function getPdfUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: "image",   // "raw" delivers the file as-is (no image transforms)
    type: "upload",
    flags: "attachment:false", // ✅ ADD THIS
    format: "pdf",
  });
}

/**
 * @deprecated Signed URLs cause 401 errors in browsers for PDFs.
 * Use getPdfUrl() instead. Kept for backwards-compatibility during migration.
 */
export function getPdfSignedUrl(publicId: string, _expiresInSeconds = 3600): string {
  // Return a plain public URL instead of a signed authenticated one
  return getPdfUrl(publicId);
}

/**
 * Always returns false now that all uploads are public type.
 * Kept so existing call-sites compile without changes.
 */
export function isSignedUrl(_url: string): boolean {
  return false;
}

/**
 * No-op — signed URLs are no longer used.
 * Kept so existing call-sites compile without changes.
 */
export function refreshSignedPdfUrl(_url: string, _expiresInSeconds = 3600): string | null {
  return null;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function sanitizeFilename(name: string): string {
  return name
    .replace(/\.[^/.]+$/, "")       // strip extension
    .replace(/[^a-z0-9_-]/gi, "_")  // safe chars only
    .toLowerCase()
    .slice(0, 80);
}

export default cloudinary;