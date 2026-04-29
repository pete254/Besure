import { NextRequest, NextResponse } from "next/server";
import { head } from "@vercel/blob";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const blobPath = path.join("/");
    
    console.log(`[Blob Proxy] Serving blob: ${blobPath}`);
    
    // Get the blob metadata to verify it exists and get info
    const blob = await head(blobPath);
    
    if (!blob) {
      console.error(`[Blob Proxy] Blob not found: ${blobPath}`);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    console.log(`[Blob Proxy] Blob found: ${blob.url}, size: ${blob.size}, type: ${blob.contentType}`);

    // For private blobs, we need to serve them through a different approach
    // Since direct fetch fails with 403, we'll use the downloadUrl with proper headers
    const filename = blobPath.split('/').pop() || "document.pdf";
    
    // Set proper headers for PDF inline display
    const headers = new Headers();
    headers.set("Content-Type", blob.contentType || "application/octet-stream");
    headers.set("Cache-Control", "public, max-age=3600"); // 1 hour cache for private blobs
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Range");
    
    if (blob.contentType === "application/pdf") {
      headers.set("Content-Disposition", `inline; filename="${filename}"`);
    } else {
      headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    }

    // Handle OPTIONS request for CORS
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 200, headers });
    }

    // Try to fetch the blob using the downloadUrl which should work for private blobs
    // The downloadUrl includes authentication tokens for private access
    const downloadUrl = blob.downloadUrl;
    
    if (!downloadUrl) {
      console.error(`[Blob Proxy] No downloadUrl available for private blob: ${blobPath}`);
      return NextResponse.json({ error: "No access to private file" }, { status: 403 });
    }

    // For private blobs, we need to fetch and serve the content directly
    // since redirects don't work properly with private blobs
    console.log(`[Blob Proxy] Fetching and serving private blob: ${downloadUrl}`);
    
    try {
      const response = await fetch(downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Vercel-Blob-Proxy)',
          'Accept': blob.contentType || '*/*',
        },
      });
      
      if (!response.ok) {
        console.error(`[Blob Proxy] Failed to fetch private blob: ${response.status} ${response.statusText}`);
        return NextResponse.json({ 
          error: "Failed to access private file", 
          status: response.status,
          details: response.statusText 
        }, { status: response.status });
      }

      // Get the content as buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      console.log(`[Blob Proxy] Successfully served ${buffer.length} bytes of ${blob.contentType}`);

      // Return the blob content with proper headers
      const responseHeaders = new Headers();
      responseHeaders.set("Content-Type", blob.contentType || "application/octet-stream");
      responseHeaders.set("Content-Length", buffer.length.toString());
      responseHeaders.set("Cache-Control", "public, max-age=3600"); // 1 hour cache for private blobs
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.set("Access-Control-Allow-Methods", "GET, OPTIONS");
      responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Range");
      
      const filename = blobPath.split('/').pop() || "document.pdf";
      if (blob.contentType === "application/pdf") {
        responseHeaders.set("Content-Disposition", `inline; filename="${filename}"`);
      } else {
        responseHeaders.set("Content-Disposition", `attachment; filename="${filename}"`);
      }

      return new NextResponse(buffer, {
        status: 200,
        headers: responseHeaders,
      });
      
    } catch (fetchError) {
      console.error(`[Blob Proxy] Fetch error:`, fetchError);
      return NextResponse.json({ 
        error: "Failed to fetch file", 
        details: fetchError instanceof Error ? fetchError.message : String(fetchError)
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error("[Blob Proxy] Error serving blob:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
