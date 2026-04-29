# PDF 401 Error Fix - Quick Start Guide

## What Was Fixed

**Problem:** PDFs were throwing 401 errors when trying to preview them in the app
```
Failed to load resource: the server responded with a status of 401 ()
```

**Root Cause:** Old documents in the database had authenticated Cloudinary URLs that require bearer tokens

## What Changed

Three new/updated files have been deployed:

### 1. PDF Proxy Route ✅
**File:** `src/app/api/pdf/proxy/route.ts`

```
GET /api/pdf/proxy?type=customer&id={documentId}
GET /api/pdf/proxy?type=policy&id={documentId}
```

- Fetches PDFs server-side from Cloudinary
- Streams them to browser (bypasses auth/CORS entirely)
- Works with both old and new documents

### 2. Updated Document Preview ✅
**File:** `src/app/(dashboard)/customers/[id]/page.tsx`

- `DocUploadWidget` now uses the proxy route
- Passes `documentId` to preview function
- Automatically sends request through `/api/pdf/proxy`

### 3. Database Migration ✅
**File:** `src/app/api/migrate/fix-document-urls/route.ts`

- One-time migration to regenerate all old document URLs
- Converts authenticated URLs to public URLs

## Deployment Steps

### Step 1: Deploy Code ✅
Code is already deployed. The files are ready.

### Step 2: Run Migration

Execute the migration to fix all existing documents:

```bash
# Check status first
curl https://your-domain.com/api/migrate/fix-document-urls

# Then run migration
curl -X POST https://your-domain.com/api/migrate/fix-document-urls
```

### Step 3: Test

1. Go to any customer profile
2. Click "Preview" on any document (ID, KRA, Passport)
3. PDF should display without 401 errors ✅

## How It Works

```
User clicks Preview
         ↓
App sends: /api/pdf/proxy?type=customer&id={docId}
         ↓
Server fetches PDF from Cloudinary (using API credentials)
         ↓
Server returns PDF to browser
         ↓
Browser displays in iframe ✅
```

## Features

✅ **Works with existing documents** - No need to re-upload anything
✅ **Works with new uploads** - Already using public URLs
✅ **Instant fix** - No caching or cache clearing needed
✅ **Backward compatible** - Old code continues to work
✅ **Secure** - Still protected by NextAuth

## Troubleshooting

### PDFs still not showing

1. Make sure migration has been run:
   ```bash
   curl -X POST https://your-domain.com/api/migrate/fix-document-urls
   ```

2. Check browser console for errors
3. Verify document has `blobKey` in database:
   ```sql
   SELECT id, doc_type, blob_key FROM customer_documents LIMIT 5;
   ```

### Migration failed

Check server logs for:
```
GET /api/migrate/fix-document-urls error:
```

### PDFs load but viewer is blank

- Verify PDF file is not corrupted in Cloudinary
- Try downloading the PDF instead of previewing
- Check network tab in browser dev tools

## What Doesn't Need to Change

- ✅ Existing upload code
- ✅ Download functionality  
- ✅ Document storage
- ✅ User authentication
- ✅ Database schema

## Performance Impact

Minimal. PDFs are:
- ✅ Cached in browser (max-age=3600)
- ✅ Streamed efficiently
- ✅ No additional database queries

## Next Steps

1. Run the migration: `POST /api/migrate/fix-document-urls`
2. Test PDF preview on customer profiles
3. Monitor server logs for any errors
4. Done! 🎉

---

**Questions?** See [PDF_401_FIX_COMPLETE.md](PDF_401_FIX_COMPLETE.md) for full technical details.
