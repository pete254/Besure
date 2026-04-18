// src/components/ui/FieldError.tsx
"use client";

interface FieldErrorProps {
  message?: string | null;
}

export default function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "12px",
        color: "#f87171",
        marginTop: "4px",
        fontWeight: 500,
      }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {message}
    </div>
  );
}
