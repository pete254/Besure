// src/components/DraftBanner.tsx
// Reusable banner shown at top of wizard forms to indicate draft status
// Shows: restore prompt (if draft found), auto-save indicator, last saved time

"use client";

import { useState, useEffect } from "react";
import { Save, RotateCcw, X, Clock, CheckCircle2, Loader2 } from "lucide-react";

interface DraftBannerProps {
  /** Whether a saved draft was found on load */
  hasDraft: boolean;
  /** Whether the user has already acted on the draft prompt */
  draftResolved: boolean;
  /** Last auto-save timestamp */
  lastSaved: Date | null;
  /** Whether a save is currently happening */
  saving: boolean;
  /** Whether the last save succeeded (briefly shown) */
  draftSaved: boolean;
  /** Step info e.g. "Step 3 of 7" */
  savedStep?: string | null;
  /** Friendly label e.g. "Toyota Harrier — KDA 123A" */
  label?: string | null;
  /** Called when user clicks "Restore draft" */
  onRestore: () => void;
  /** Called when user dismisses the restore prompt */
  onDismiss: () => void;
  /** Called when user clicks "Discard draft" */
  onDiscard: () => void;
}

export default function DraftBanner({
  hasDraft,
  draftResolved,
  lastSaved,
  saving,
  draftSaved,
  savedStep,
  label,
  onRestore,
  onDismiss,
  onDiscard,
}: DraftBannerProps) {
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);

  useEffect(() => {
    if (hasDraft && !draftResolved) {
      setShowRestorePrompt(true);
    } else {
      setShowRestorePrompt(false);
    }
  }, [hasDraft, draftResolved]);

  function fmt(d: Date) {
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 5) return "just now";
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

      {/* ── Restore draft prompt ── */}
      {showRestorePrompt && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          backgroundColor: "rgba(16,185,129,0.08)",
          border: "1px solid rgba(16,185,129,0.3)",
          borderRadius: "10px",
          flexWrap: "wrap",
        }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "8px",
            backgroundColor: "rgba(16,185,129,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <RotateCcw size={16} color="var(--brand)" />
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", margin: "0 0 2px" }}>
              You have an unsaved draft
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
              {label && <span style={{ color: "var(--text-secondary)" }}>{label}</span>}
              {label && savedStep && " · "}
              {savedStep && <span>Saved at {savedStep}</span>}
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button
              onClick={() => {
                onDiscard();
                setShowRestorePrompt(false);
              }}
              style={{
                padding: "6px 12px", borderRadius: "6px",
                border: "1px solid var(--border)", backgroundColor: "transparent",
                color: "var(--text-muted)", fontSize: "12px", fontWeight: 600,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              Discard
            </button>
            <button
              onClick={() => {
                onRestore();
                setShowRestorePrompt(false);
              }}
              style={{
                padding: "6px 14px", borderRadius: "6px",
                border: "none", backgroundColor: "var(--brand)",
                color: "#000", fontSize: "12px", fontWeight: 700,
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: "5px",
              }}
            >
              <RotateCcw size={11} /> Restore Draft
            </button>
            <button
              onClick={() => { onDismiss(); setShowRestorePrompt(false); }}
              style={{
                padding: "4px", borderRadius: "4px", border: "none",
                backgroundColor: "transparent", cursor: "pointer",
                color: "var(--text-muted)", display: "flex", alignItems: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Auto-save status indicator (subtle, bottom of banner area) ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        justifyContent: "flex-end",
        minHeight: "18px",
      }}>
        {saving && (
          <>
            <Loader2 size={11} color="var(--text-muted)" style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Saving draft...</span>
          </>
        )}
        {!saving && draftSaved && (
          <>
            <CheckCircle2 size={11} color="var(--brand)" />
            <span style={{ fontSize: "11px", color: "var(--brand)" }}>Draft saved</span>
          </>
        )}
        {!saving && !draftSaved && lastSaved && (
          <>
            <Clock size={11} color="var(--text-muted)" />
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Draft saved {fmt(lastSaved)}
            </span>
          </>
        )}
        {!saving && !draftSaved && !lastSaved && (
          <span style={{ fontSize: "11px", color: "var(--text-muted)", opacity: 0.6 }}>
            Auto-saving draft as you type
          </span>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}