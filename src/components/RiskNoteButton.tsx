// src/components/RiskNoteButton.tsx
// Drop this component anywhere in the policy detail page
// Usage: <RiskNoteButton policyId={policy.id} policyNumber={policy.policyNumber} />

"use client";

import { useState } from "react";
import { FileText } from "lucide-react";

interface RiskNoteButtonProps {
  policyId: string;
  policyNumber?: string | null;
}

export default function RiskNoteButton({ policyId, policyNumber }: RiskNoteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDownload() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/pdf/risk-note/${policyId}`);
      if (!res.ok) {
        setError("Failed to generate PDF. Please try again.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RiskNote-${policyNumber || policyId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 14px",
          backgroundColor: loading ? "var(--brand-dim)" : "var(--brand)",
          color: "#000000",
          border: "none",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!loading) (e.currentTarget as HTMLElement).style.opacity = "0.85";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.opacity = "1";
        }}
      >
        <FileText size={14} />
        {loading ? "Generating PDF..." : "Download Risk Note"}
      </button>
      {error && (
        <p style={{ fontSize: "12px", color: "#f87171", marginTop: "6px" }}>{error}</p>
      )}
    </div>
  );
}