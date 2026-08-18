// src/components/ui/FormErrorBanner.tsx
"use client";

interface FormErrorBannerProps {
  /** The top-level summary message (e.g. "Please fix the errors below"). */
  message?: string | null;
  /** Field-keyed error map — each distinct message is listed under the summary. */
  fieldErrors?: Record<string, string>;
  /** Slightly smaller padding/font for use inside modals and settings panels. */
  compact?: boolean;
}

/**
 * Error banner shown at the top of a form. Renders the summary message plus a
 * bulleted list of the specific field errors, so a validation failure on an
 * off-screen field is never invisible to the user.
 */
export default function FormErrorBanner({ message, fieldErrors = {}, compact }: FormErrorBannerProps) {
  if (!message) return null;

  const messages = Array.from(
    new Set(
      Object.values(fieldErrors)
        .filter(Boolean)
        // Strip any leading warning glyphs the caller may have prepended —
        // this banner supplies its own styling.
        .map((m) => m.replace(/^[⚠️❌\s]+/, "").trim())
        .filter(Boolean)
    )
  );

  return (
    <div
      role="alert"
      style={{
        padding: compact ? "10px 12px" : "12px 16px",
        backgroundColor: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: "8px",
        color: "#fca5a5",
        fontSize: compact ? "12px" : "13px",
        marginBottom: compact ? "14px" : "16px",
      }}
    >
      <div style={{ fontWeight: 600 }}>{message}</div>
      {messages.length > 0 && (
        <ul style={{ margin: "8px 0 0", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "3px" }}>
          {messages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
