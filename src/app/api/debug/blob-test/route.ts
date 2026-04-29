import { NextRequest, NextResponse } from "next/server";
import { head } from "@vercel/blob";

export async function GET(req: NextRequest) {
  try {
    console.log('[Blob Debug] Testing Vercel Blob configuration...');
    
    // Test if we can access blob head
    const testPath = 'customers/test/test.pdf';
    const blob = await head(testPath);
    
    if (!blob) {
      return NextResponse.json({ 
        error: 'No blob found',
        path: testPath,
        hasToken: !!process.env.BLOB_READ_WRITE_TOKEN
      });
    }

    console.log('[Blob Debug] Blob found:', {
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      hasDownloadUrl: !!blob.downloadUrl
    });

    // Test if we can fetch the blob
    const response = await fetch(blob.downloadUrl || blob.url);
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      blobUrl: blob.url,
      downloadUrl: blob.downloadUrl,
      hasToken: !!process.env.BLOB_READ_WRITE_TOKEN
    });
    
  } catch (error) {
    console.error('[Blob Debug] Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error),
      hasToken: !!process.env.BLOB_READ_WRITE_TOKEN
    }, { status: 500 });
  }
}
