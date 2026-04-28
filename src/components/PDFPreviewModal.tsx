// src/components/PDFPreviewModal.tsx
"use client";

import { X, Download, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  fileName: string;
  onDownload?: () => void;
  isLoading?: boolean;
}

export default function PDFPreviewModal({
  isOpen,
  onClose,
  pdfUrl,
  fileName,
  onDownload,
  isLoading = false,
}: PDFPreviewModalProps) {
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    // Reset iframe when pdfUrl changes to ensure fresh render
    if (pdfUrl) {
      setIframeKey(prev => prev + 1);
    }
  }, [pdfUrl]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "900px",
          height: "90vh",
          maxHeight: "85vh",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#ffffff" }}>
              {fileName}
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
              Scroll to view full document
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {onDownload && (
              <button
                onClick={onDownload}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  backgroundColor: "var(--brand)",
                  color: "#000",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#059669";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--brand)";
                }}
              >
                <Download size={14} /> Download
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                backgroundColor: "var(--bg-app)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                color: "var(--text-secondary)",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(239, 68, 68, 0.1)";
                (e.currentTarget as HTMLElement).style.color = "#ef4444";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-app)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--bg-app)",
          }}
        >
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <Loader2
                size={32}
                color="var(--brand)"
                style={{ animation: "spin 1s linear infinite" }}
              />
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Generating PDF...</p>
            </div>
          ) : pdfUrl ? (
            <iframe
              key={iframeKey}
              src={pdfUrl}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                borderRadius: "0",
              }}
              title="PDF Preview"
              allow="fullscreen"
            />
          ) : (
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                No PDF loaded. Please generate a PDF first.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
