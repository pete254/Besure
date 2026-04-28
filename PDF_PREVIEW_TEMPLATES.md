# Adding PDF Preview to Claims & Policy Documents

## Quick Copy-Paste Templates

### Template 1: Claims Page Document Preview

**File:** `src/app/(dashboard)/claims/[id]/page.tsx`

```typescript
// ADD TO IMPORTS
import PDFPreviewModal from "@/components/PDFPreviewModal";

// ADD TO COMPONENT STATE (near other useState)
const [showDocPreview, setShowDocPreview] = useState(false);
const [docBlobUrl, setDocBlobUrl] = useState<string | null>(null);
const [previewDocName, setPreviewDocName] = useState("");

// ADD PREVIEW HANDLER FUNCTION
async function previewDocument(url: string, docName: string) {
  try {
    const response = await fetch(url, { mode: "cors" });
    if (response.ok) {
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setDocBlobUrl(blobUrl);
      setPreviewDocName(docName);
      setShowDocPreview(true);
    } else {
      setDocBlobUrl(url);
      setPreviewDocName(docName);
      setShowDocPreview(true);
    }
  } catch {
    setDocBlobUrl(url);
    setPreviewDocName(docName);
    setShowDocPreview(true);
  }
}

// ADD TO JSX (in document section)
<PDFPreviewModal
  isOpen={showDocPreview}
  onClose={() => {
    setShowDocPreview(false);
    if (docBlobUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(docBlobUrl);
    }
    setDocBlobUrl(null);
  }}
  pdfUrl={docBlobUrl}
  fileName={previewDocName}
/>

// USAGE - Convert this:
// <a href={docUrl} target="_blank">View Document</a>
// TO THIS:
// <button onClick={() => previewDocument(docUrl, "Claim Document")}>
//   <Eye size={14} /> Preview
// </button>
```

---

### Template 2: Policy Page Document Preview

**File:** `src/app/(dashboard)/policies/[id]/page.tsx`

```typescript
// ADD TO IMPORTS
import PDFPreviewModal from "@/components/PDFPreviewModal";

// ADD TO COMPONENT STATE
const [showDocPreview, setShowDocPreview] = useState(false);
const [docBlobUrl, setDocBlobUrl] = useState<string | null>(null);
const [previewDocName, setPreviewDocName] = useState("");

// ADD PREVIEW HANDLER
async function previewPolicyDoc(url: string, docName: string) {
  try {
    const response = await fetch(url, { mode: "cors" });
    if (response.ok) {
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setDocBlobUrl(blobUrl);
      setPreviewDocName(docName);
      setShowDocPreview(true);
    } else {
      setDocBlobUrl(url);
      setPreviewDocName(docName);
      setShowDocPreview(true);
    }
  } catch {
    setDocBlobUrl(url);
    setPreviewDocName(docName);
    setShowDocPreview(true);
  }
}

// ADD MODAL COMPONENT
<PDFPreviewModal
  isOpen={showDocPreview}
  onClose={() => {
    setShowDocPreview(false);
    if (docBlobUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(docBlobUrl);
    }
    setDocBlobUrl(null);
  }}
  pdfUrl={docBlobUrl}
  fileName={previewDocName}
/>
```

---

### Template 3: Generic Document List with Preview

Perfect for displaying multiple documents with preview:

```typescript
interface DocumentItem {
  id: string;
  name: string;
  url: string;
  type?: string;
}

const [documents] = useState<DocumentItem[]>([
  { id: "1", name: "Policy Document", url: "https://..." },
  { id: "2", name: "Certificate", url: "https://..." },
]);

const [showDocPreview, setShowDocPreview] = useState(false);
const [docBlobUrl, setDocBlobUrl] = useState<string | null>(null);
const [previewDocName, setPreviewDocName] = useState("");

async function handleDocPreview(doc: DocumentItem) {
  try {
    const response = await fetch(doc.url, { mode: "cors" });
    if (response.ok) {
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setDocBlobUrl(blobUrl);
    } else {
      setDocBlobUrl(doc.url);
    }
  } catch {
    setDocBlobUrl(doc.url);
  }
  setPreviewDocName(doc.name);
  setShowDocPreview(true);
}

// IN JSX
<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
  {documents.map((doc) => (
    <div key={doc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", backgroundColor: "var(--bg-app)", borderRadius: "6px" }}>
      <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>{doc.name}</span>
      <button
        onClick={() => handleDocPreview(doc)}
        style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 10px", backgroundColor: "var(--brand)", color: "#000", border: "none", borderRadius: "4px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
      >
        <Eye size={12} /> Preview
      </button>
    </div>
  ))}
</div>

<PDFPreviewModal
  isOpen={showDocPreview}
  onClose={() => {
    setShowDocPreview(false);
    if (docBlobUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(docBlobUrl);
    }
    setDocBlobUrl(null);
  }}
  pdfUrl={docBlobUrl}
  fileName={previewDocName}
/>
```

---

## Step-by-Step Integration

### Step 1: Add Imports
```typescript
import PDFPreviewModal from "@/components/PDFPreviewModal";
import { Eye, Loader2 } from "lucide-react"; // Add Eye if not already imported
```

### Step 2: Add State Variables
Copy the state hooks from template above

### Step 3: Add Handler Function
Copy the preview handler from template above

### Step 4: Update UI Button/Link
Replace `<a href>` with `<button onClick>`

### Step 5: Add Modal Component
Add the `<PDFPreviewModal ... />` component to return JSX

### Step 6: Test
- Click preview button
- Modal should open with PDF
- Scroll should work
- Download button should work
- Close button should work

---

## Common Patterns

### Pattern A: External URL (Cloudinary)
```typescript
// Works with CORS handling
const docUrl = "https://res.cloudinary.com/.../pdf.pdf";
await previewDocument(docUrl, "Document.pdf");
```

### Pattern B: Local API Endpoint
```typescript
// Works directly
const docUrl = "/api/documents/123";
await previewDocument(docUrl, "Document.pdf");
```

### Pattern C: Blob from API
```typescript
// API returns binary PDF
const response = await fetch("/api/pdf/generate");
const blob = await response.blob();
const blobUrl = URL.createObjectURL(blob);
setDocBlobUrl(blobUrl);
```

---

## Files Ready to Update

### Claims - [src/app/(dashboard)/claims/[id]/page.tsx](src/app/(dashboard)/claims/[id]/page.tsx)
- [ ] Add imports
- [ ] Add state
- [ ] Add handler
- [ ] Update document display buttons
- [ ] Add modal component

### Policies - [src/app/(dashboard)/policies/[id]/page.tsx](src/app/(dashboard)/policies/[id]/page.tsx)
- [ ] Add imports
- [ ] Add state
- [ ] Add handler
- [ ] Update document display buttons
- [ ] Add modal component

### Customer Edit - [src/app/(dashboard)/customers/[id]/edit/page.tsx](src/app/(dashboard)/customers/[id]/edit/page.tsx)
- [ ] Add imports (may already be done)
- [ ] Update DocUploadWidget if exists
- [ ] Add modal component

---

## Minimal Working Example

If you want to test quickly, here's the absolute minimum:

```typescript
import { useState } from "react";
import { Eye } from "lucide-react";
import PDFPreviewModal from "@/components/PDFPreviewModal";

export function DocumentPreview() {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  return (
    <>
      <button onClick={() => {
        setUrl("https://your-pdf-url.pdf");
        setIsOpen(true);
      }}>
        <Eye size={14} /> Preview
      </button>
      
      <PDFPreviewModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        pdfUrl={url}
        fileName="Document.pdf"
      />
    </>
  );
}
```

---

## Testing Checklist

- [ ] Preview modal opens
- [ ] PDF loads in iframe
- [ ] Can scroll through PDF
- [ ] Download button works
- [ ] Close button works
- [ ] Background click closes
- [ ] Blob URLs are cleaned up (check memory)
- [ ] No console errors
- [ ] Works on mobile
- [ ] CORS handled gracefully

Done! Your PDF preview system is ready to expand! 🚀
