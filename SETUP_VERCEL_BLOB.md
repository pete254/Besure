# Vercel Blob Setup Instructions

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# Existing Cloudinary variables (keep for images)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

## Getting Vercel Blob Token

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add `BLOB_READ_WRITE_TOKEN`
5. Generate a new token from Vercel Blob storage settings

## Migration Benefits

- **PDFs**: Stored in Vercel Blob (better PDF support)
- **Images**: Still use Cloudinary (better image optimization)
- **Automatic**: New uploads will use the correct service
- **Backward Compatible**: Existing files continue to work

## Testing

After setting up the environment variables:

1. Upload a new PDF document
2. Test the preview functionality
3. Verify the URL format: `/api/blob/customers/[id]/[type]/[filename]` (proxy URL)

## Private vs Public Store

- **Private Store** (default): Uses proxy URLs like `/api/blob/...`
- **Public Store**: Direct URLs like `https://blob.vercel-storage.com/...`

The code now automatically handles private stores with secure proxy access.

## Troubleshooting

If PDF preview still fails:

1. Check the browser console for CORS errors
2. Verify the BLOB_READ_WRITE_TOKEN is correct
3. Ensure the PDF file uploaded successfully
4. Check that the proxy route `/api/blob/[...path]` is working
5. Verify the blob store access level matches your configuration
