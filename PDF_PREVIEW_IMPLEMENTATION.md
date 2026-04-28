# PDF Preview Implementation Guide

## Overview
You now have full PDF preview functionality using iframes with blob URLs. This solves the 401 authentication error you were experiencing with external URLs.

## What Changed

### 1. **New PDF Preview Modal Component** (`src/components/PDFPreviewModal.tsx`)
- Beautiful fullscreen modal for PDF viewing
- Features:
  - Fullscreen display with 90vh height
  - Built-in scroll support for complete PDF browsing
  - Download button integrated in the header
  - Close button with hover effects
  - Loading state with spinner
  - Responsive design

### 2. **Updated Calculator Page** (`src/app/(dashboard)/calculator/page.tsx`)
- Added two new functions:
  - `generateProposal(preview = false)` - Handles both preview and download
  - `previewProposal()` - Shows PDF in modal
  - `downloadProposal()` - Downloads PDF directly

- Added new state management:
  - `showPdfPreview` - Controls modal visibility
  - `pdfBlobUrl` - Stores blob URL for iframe
  - `pdfFileName` - Stores generated filename

- UI Changes:
  - Split download button into two buttons: "Preview PDF" and "Download"
  - Both buttons share the same generation logic
  - Loading state shows on both buttons simultaneously

## How It Works

### The Solution: Blob URLs Instead of External URLs

**Problem:** External URLs require authentication/CORS headers
- Getting 401 errors when trying to access PDFs from external services
- iframe can't pass authentication credentials easily

**Solution:** Use blob URLs (data URLs in memory)
1. Fetch PDF from your Next.js API route → returns binary blob
2. Create blob URL with `URL.createObjectURL(blob)`
3. Pass blob URL to iframe: `<iframe src="blob:http://..." />`
4. Clean up with `URL.revokeObjectURL(url)` when modal closes

### The Flow

```
User clicks "Preview PDF"
    ↓
generateProposal(true) is called
    ↓
Fetch PDF from /api/calculator/proposal-pdf (your internal API)
    ↓
Response returns PDF as binary blob
    ↓
Create blob URL: blob:http://localhost:3000/uuid
    ↓
Pass blob URL to iframe in PDFPreviewModal
    ↓
User sees full PDF with scrolling enabled
    ↓
User can download from modal button or close modal
    ↓
Cleanup: URL.revokeObjectURL() releases memory
```

## Features

✅ **Full PDF Scrolling** - Users can scroll through entire document
✅ **No Authentication Issues** - Uses internal blob URLs
✅ **Preview & Download** - Two separate buttons for different actions
✅ **Memory Management** - Properly cleans up blob URLs
✅ **Responsive Design** - Works on all screen sizes
✅ **Loading States** - Shows spinner while generating
✅ **Error Handling** - Displays errors if PDF generation fails
✅ **Modal can be Closed** - Escape click or close button

## Usage

### Preview PDF
```typescript
// In your component
const handlePreview = async () => {
  await generateProposal(true); // Generates PDF and shows modal
};
```

### Download PDF
```typescript
// In your component
const handleDownload = async () => {
  await generateProposal(false); // Generates PDF and downloads
};
```

## Styling Notes

The modal uses CSS variables from your existing theme:
- `--bg-card` - Modal background
- `--border` - Border color
- `--brand` - Primary color (green)
- `--text-primary` - Text color
- `--bg-app` - Secondary background

All styling is inline and responsive, matching your current design system.

## Browser Support

- ✅ Chrome/Edge (full support)
- ✅ Firefox (full support)
- ✅ Safari (full support)
- ✅ Mobile browsers (responsive)

## Security Considerations

- Blob URLs are **automatically scoped** to your domain
- They **cannot be accessed from other domains**
- Blob URLs are **revoked automatically** when modal closes
- No sensitive data exposed in URLs

## Customization

To adjust the modal size, edit in `PDFPreviewModal.tsx`:
```typescript
maxWidth: "900px",      // Change modal width
height: "90vh",         // Change modal height
maxHeight: "85vh",      // Change max height
```

To add more buttons (print, zoom, etc.), extend the header button group:
```typescript
<button onClick={handlePrint}>
  <Printer size={14} /> Print
</button>
```

## Troubleshooting

### PDF not showing
- Check browser console for errors
- Ensure `/api/calculator/proposal-pdf` endpoint returns valid PDF
- Check if blob URL is being created correctly

### Modal not opening
- Verify `showPdfPreview` state is true
- Check if `pdfBlobUrl` is set
- Look for errors in network tab

### Memory leaks
- Modal automatically revokes URL on close
- If modifying, ensure `URL.revokeObjectURL()` is called in cleanup

## Performance Tips

1. **Lazy load the modal** - Only import when needed
2. **Cache PDFs** - Consider adding a cache layer for repeated previews
3. **Optimize PDF size** - Ensure your PDF generation is efficient
4. **Limit file size** - Large PDFs may cause UI lag

## Next Steps

You can now:
1. Test the preview feature in the calculator
2. Apply the same pattern to other PDF previews in your app
3. Extend the modal component for other document types
4. Add print functionality if needed
