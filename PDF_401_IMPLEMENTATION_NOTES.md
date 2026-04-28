# PDF 401 Fix - Implementation Notes

## What Was Changed

### Problem
PDFs uploaded to Cloudinary were returning 401 Unauthorized errors, but images worked fine.

### Solution
Implemented signed URLs for PDF documents while keeping images on public URLs for performance.

## Quick Summary of Changes

### 1. `src/lib/cloudinary.ts`
Added 4 new functions:
- `getPdfUrl()` - Public PDF URLs with proper formatting
- `getPdfSignedUrl()` - Authenticated PDF URLs (1 hour expiry)
- `isSignedUrl()` - Detect if URL needs refreshing
- `refreshSignedPdfUrl()` - Regenerate expired URLs

### 2. `src/app/api/customers/[id]/documents/route.ts`
- POST: PDFs now use `getPdfSignedUrl()` instead of `secureUrl`
- GET: Added automatic URL refresh for expiring signatures

### 3. `src/app/api/policies/[id]/documents/route.ts`
- POST: PDFs now use `getPdfSignedUrl()` instead of `secureUrl`
- GET: Added automatic URL refresh for expiring signatures

## How It Works

**When uploading a PDF:**
```
User uploads PDF → Cloudinary stores it → Generate signed URL → Store in database
```

**When accessing a document:**
```
Request comes in → Check if URL is signed → If signed, refresh it → Return fresh URL
```

## No Frontend Changes Needed
The existing frontend code (`useDocumentPreview` hook) already works with signed URLs because it:
1. Fetches PDFs as blobs
2. Creates object URLs for display
3. Falls back gracefully if fetch fails

## Testing
1. Upload a PDF document (customer ID, policy logbook, etc.)
2. Click preview - should display without 401 error
3. Download the document - should work
4. Wait and try again next day - still works (auto-refreshed)

## Troubleshooting

**Still getting 401 after deploying?**
- Clear browser cache
- Check `.env.local` Cloudinary credentials are correct
- Verify `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` match Cloudinary dashboard

**PDFs not displaying at all?**
- Check browser console for errors
- Verify file is actually PDF (not corrupted)
- Try downloading instead of previewing
- Check Cloudinary account settings

**Performance concerns?**
- URL refresh only happens on GET requests
- Refresh is very fast (local operation)
- Minimal impact on performance
- Images still use public URLs (no performance hit)

## Security Notes
- Signed URLs expire after 1 hour
- Only valid for their specific public ID
- Cloudinary validates signature on each request
- Much more secure than public URLs for sensitive documents
- Auto-refresh ensures legitimate users never hit expiration

## Future Considerations
- URL expiration time configurable per document type
- Could add document-specific permissions
- Could implement audit logging for PDF access
- Consider adding download count limits if needed
