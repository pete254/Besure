// src/components/RiskNoteButton.tsx
// Drop this component anywhere in the policy detail page
// Usage: <RiskNoteButton policyId={policy.id} policyNumber={policy.policyNumber} />

"use client";

import { useState } from "react";
import { FileText, Eye } from "lucide-react";
import PDFPreviewModal from "./PDFPreviewModal";

interface RiskNoteButtonProps {
  policyId: string;
  policyNumber?: string | null;
}

export default function RiskNoteButton({ policyId, policyNumber }: RiskNoteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  async function generatePDF(preview = false) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/pdf/risk-note/${policyId}`);
      if (!res.ok) {
        setError("Failed to generate PDF. Please try again.");
        return;
      }
      const blob = await res.blob();
      const fileName = `RiskNote-${policyNumber || policyId.slice(0, 8)}.pdf`;

      if (preview) {
        const blobUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(blobUrl);
        setShowPreview(true);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <button
          onClick={() => generatePDF(true)}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "8px 14px",
            backgroundColor: loading ? "var(--brand-dim)" : "var(--bg-app)",
            color: "var(--brand)",
            border: "1px solid var(--brand)",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background-color 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--brand-dim)";
          }}
          onMouseLeave={(e) => {
            if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-app)";
          }}
        >
          <Eye size={14} />
          {loading ? "Generating..." : "Preview"}
        </button>
        <button
          onClick={() => generatePDF(false)}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "8px 14px",
            backgroundColor: loading ? "var(--brand-dim)" : "var(--bg-app)",
            color: "var(--brand)",
            border: "1px solid var(--brand)",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background-color 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--brand-dim)";
          }}
          onMouseLeave={(e) => {
            if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-app)";
          }}
        >
          <FileText size={14} />
          {loading ? "Generating..." : "Download"}
        </button>
      </div>
      {error && (
        <p style={{ fontSize: "12px", color: "#f87171", marginTop: "6px" }}>{error}</p>
      )}
      <PDFPreviewModal
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          if (pdfBlobUrl) {
            URL.revokeObjectURL(pdfBlobUrl);
            setPdfBlobUrl(null);
          }
        }}
        pdfUrl={pdfBlobUrl}
        fileName={`RiskNote-${policyNumber || policyId.slice(0, 8)}.pdf`}
        onDownload={() => generatePDF(false)}
        isLoading={loading}
      />
    </div>
  );
}