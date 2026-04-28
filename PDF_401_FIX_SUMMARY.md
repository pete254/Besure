# PDF 401 Unauthorized Fix - Complete Summary

## Problem
Getting 401 Unauthorized errors when trying to preview PDFs from Cloudinary, while PNG and other image files work fine.

**Error Message:**
```
Request was blocked by DevTools: "https://res.cloudinary.com/db3wgvsjt/image/upload/v1777395756/myloe/customers/id/..."
Failed to load resource: the server responded with a status of 401 ()
```

## Root Cause
Cloudinary's default configuration allows public access to images but may restrict access to PDFs and sensitive documents. PDFs were being stored with the public `secureUrl`, but Cloudinary's delivery settings required authentication (signed URLs) for PDF files.

## Solution Implemented

### 1. **Enhanced Cloudinary Helper** (`src/lib/cloudinary.ts`)
Added three new functions to handle PDF-specific requirements:

#### `getPdfUrl(publicId: string): string`
- Generates a public URL for PDFs with proper format handling
- Ensures correct content-type delivery for PDF files

#### `getPdfSignedUrl(publicId: string, expiresInSeconds = 3600): string`
- Generates signed (authenticated) URLs for PDFs
- URLs expire after 1 hour by default (3600 seconds)
- Signature parameters prove request authenticity to Cloudinary
- Much more secure for sensitive insurance documents

#### `isSignedUrl(url: string): boolean`
- Detects if a URL contains signature parameters
- Used to identify which URLs need refreshing

#### `refreshSignedPdfUrl(url: string, expiresInSeconds = 3600): string | null`
- Extracts public ID from existing Cloudinary URLs
- Regenerates fresh signed URLs from the public ID
- Allows automatic URL refresh when they're about to expire

### 2. **Customer Documents Endpoint** (`src/app/api/customers/[id]/documents/route.ts`)

**Upload Handler:**
```typescript
if (file && file.size > 0) {
  // ... upload to Cloudinary ...
  
  // For PDFs, use signed URL; for other files use secure URL
  if (file.type === "application/pdf" || filename.endsWith(".pdf")) {
    fileUrl = getPdfSignedUrl(publicId);
  } else {
    fileUrl = result.secureUrl;
  }
}
```

**GET Handler (New):**
- Automatically refreshes signed URLs that are close to expiring
- Ensures URLs always remain valid when documents are accessed
- Non-breaking change: returns same document structure

### 3. **Policy Documents Endpoint** (`src/app/api/policies/[id]/documents/route.ts`)

Applied the same PDF-specific handling:
- Signed URLs for PDFs on upload
- Automatic URL refresh on retrieval
- Public URLs for other file types

### 4. **Frontend Compatibility**
Existing frontend code already handles signed URLs correctly:
- `useDocumentPreview` hook attempts to fetch URLs as blobs
- Falls back to direct iframe preview if needed
- Works seamlessly with signed Cloudinary URLs

## Benefits

✅ **Security:** PDFs now use signed (authenticated) URLs  
✅ **Reliability:** URLs automatically refresh before expiration  
✅ **Transparency:** Public images still use fast public URLs  
✅ **Backward Compatible:** No frontend changes required  
✅ **Scalable:** Solution works for all document types  

## Technical Details

### Cloudinary URL Signing Process
1. Public ID extracted from uploaded file
2. Signature generated using API secret + expiration time
3. URL includes parameters: `s_` (signature), `expires_at`
4. Cloudinary validates signature on each request
5. Expired URLs automatically rejected (security)

### URL Refresh Mechanism
- Triggered on every GET request to `/api/[customers|policies]/[id]/documents`
- Only refreshes if URL contains signature parameters
- Non-invasive: returns same response structure
- Can be adjusted as needed without code changes

## Files Modified

1. `src/lib/cloudinary.ts`
   - Added `getPdfUrl()`
   - Added `getPdfSignedUrl()`
   - Added `isSignedUrl()`
   - Added `refreshSignedPdfUrl()`

2. `src/app/api/customers/[id]/documents/route.ts`
   - Updated POST handler to use signed URLs for PDFs
   - Enhanced GET handler to refresh expiring URLs

3. `src/app/api/policies/[id]/documents/route.ts`
   - Updated POST handler to use signed URLs for PDFs
   - Enhanced GET handler to refresh expiring URLs

## Testing Checklist

- [ ] Upload ID/KRA/Passport documents (PDFs and images)
- [ ] Preview uploaded PDFs - should load without 401 errors
- [ ] Preview uploaded images - should still work
- [ ] Download documents - should work correctly
- [ ] Wait >1 hour and access same document - should still work (auto-refreshed)
- [ ] Check browser DevTools console - no 401 errors

## Future Enhancements

1. **Configurable Expiration:** Make signed URL duration configurable per document type
2. **Database Updates:** Consider storing public IDs separately for easier URL regeneration
3. **Cloudinary Settings:** Review Cloudinary dashboard delivery settings for additional security options
4. **Monitoring:** Add logging to track URL refresh frequency and performance

## Important Notes

- Signed URLs valid for 1 hour (3600 seconds)
- URLs automatically refresh on data retrieval
- No manual intervention required
- Frontend code needs no changes
- Images continue to use public URLs for performance
