# Quick Start: PDF Preview Feature

## ✅ What's Implemented

You now have a complete PDF preview system with:

### Two Buttons in Calculator
1. **Preview PDF** - Opens full-screen modal with scrollable PDF
2. **Download** - Downloads PDF directly to user's device

### Zero Configuration Needed
- Uses your existing PDF API endpoint
- Matches your current theme colors
- Works with all modern browsers
- No additional packages required

## 🚀 How to Use It

### For Users
1. Fill in calculator details
2. Click **"Preview PDF"** to see the full proposal
3. Scroll through the entire PDF in the modal
4. Click **"Download"** to save it
5. Or click **"Download"** button directly from the calculator

### For Developers
The implementation is in two files:

**File 1:** [src/components/PDFPreviewModal.tsx](src/components/PDFPreviewModal.tsx)
- Reusable modal component
- Can be used anywhere in your app for PDF previews

**File 2:** [src/app/(dashboard)/calculator/page.tsx](src/app/(dashboard)/calculator/page.tsx)
- Updated with preview functionality
- New `generateProposal()` and `previewProposal()` functions
- Two button states for preview and download

## 🔧 Technical Details

### Why This Works (No 401 Errors!)

**The Problem You Had:**
- Iframe pointing to external URL → 401 errors
- Can't pass auth headers through iframe

**The Solution:**
- Fetch PDF from your internal API
- Create a Blob URL (like `blob:http://localhost:3000/uuid`)
- Pass blob URL to iframe (no auth needed!)
- Revoke URL when done (memory cleanup)

### Code Flow

```javascript
// User clicks Preview
await generateProposal(true);

// Inside generateProposal:
const blob = await fetch('/api/calculator/proposal-pdf');  // Your API
const blobUrl = URL.createObjectURL(blob);                  // Create blob URL
setPdfBlobUrl(blobUrl);                                     // Store in state
setShowPdfPreview(true);                                    // Show modal

// Modal renders iframe
<iframe src={pdfBlobUrl} />                                 // Displays PDF!

// When modal closes
URL.revokeObjectURL(pdfBlobUrl);                           // Cleanup
```

## 📋 Files Changed

| File | Changes |
|------|---------|
| [src/components/PDFPreviewModal.tsx](src/components/PDFPreviewModal.tsx) | **NEW** - Modal component |
| [src/app/(dashboard)/calculator/page.tsx](src/app/(dashboard)/calculator/page.tsx) | Added import, state, functions, modal integration |

## 🎨 Visual Changes

### Before
- Single "Download Proposal PDF" button

### After
- Two buttons: "Preview PDF" (eye icon) + "Download" (download icon)
- Full-screen modal for PDF viewing
- Can download from modal or calculator
- Professional UI with loading states

## ✨ Features

- ✅ Full PDF scrolling (no preview limits)
- ✅ No authentication errors
- ✅ Memory efficient (URLs revoked on close)
- ✅ Responsive design
- ✅ Loading indicators
- ✅ Error messages
- ✅ Mobile friendly

## 🔄 Next Steps

To use this pattern in other parts of your app:

1. **For Risk Notes** - Update [src/components/RiskNoteButton.tsx](src/components/RiskNoteButton.tsx)
2. **For Claims** - Add preview to any PDF generation endpoint
3. **For Documents** - Reuse PDFPreviewModal with any PDF

Example:
```typescript
// Import modal
import PDFPreviewModal from "@/components/PDFPreviewModal";

// Add to your component
<PDFPreviewModal
  isOpen={showPreview}
  onClose={() => setShowPreview(false)}
  pdfUrl={blobUrl}
  fileName="Document.pdf"
  onDownload={handleDownload}
/>
```

## 📞 Questions?

- Modal styling: See `PDFPreviewModal.tsx` (uses CSS variables)
- PDF generation: See `/api/calculator/proposal-pdf` endpoint
- State management: See calculator page state declarations
- Blob URLs: [MDN Web Docs - Blob URLs](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL)

## 🧪 Testing

Try it out:
1. Go to calculator page
2. Enter values (sum insured, rate, etc.)
3. Click "Preview PDF"
4. Modal should open with full PDF
5. Scroll through entire document
6. Click "Download" in modal or from calculator
7. File should download

That's it! Enjoy your PDF preview feature 🎉
