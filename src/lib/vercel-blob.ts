// src/lib/vercel-blob.ts
// Vercel Blob storage for PDFs and documents

import { put, del } from '@vercel/blob';

export interface BlobUploadResult {
  url: string;
  downloadUrl: string;
  contentType: string;
  proxyUrl: string;
}

/**
 * Upload a file to Vercel Blob storage
 */
export async function uploadToBlob(
  fileData: Buffer | File,
  filename: string,
  contentType: string
): Promise<BlobUploadResult> {
  try {
    const blob = await put(filename, fileData, {
      access: 'public',
      contentType,
    });

    // Generate proxy URL for accessing private blobs
    const proxyUrl = `/api/blob/${filename}`;
    
    return {
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      contentType: blob.contentType,
      proxyUrl,
    };
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    throw new Error('Failed to upload file to blob storage');
  }
}

/**
 * Delete a file from Vercel Blob storage
 */
export async function deleteFromBlob(url: string): Promise<void> {
  try {
    await del(url);
  } catch (error) {
    console.error('Error deleting from Vercel Blob:', error);
    // Don't throw error for deletion failures - it's non-critical
  }
}

/**
 * Generate a blob filename for customer documents
 */
export function generateBlobFilename(
  customerId: string,
  docType: string,
  originalFilename: string
): string {
  const timestamp = Date.now();
  const extension = originalFilename.split('.').pop() || 'pdf';
  return `customers/${customerId}/${docType}/${customerId}_${docType}_${timestamp}.${extension}`;
}

/**
 * Check if a URL is a Vercel Blob URL
 */
export function isBlobUrl(url: string): boolean {
  return url.includes('blob.vercel-storage.com');
}
