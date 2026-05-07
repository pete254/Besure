// src/app/drafts/[id]/page.tsx
// Display and allow editing of a specific draft

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileText, ArrowLeft, Save, Trash2, Edit3 } from "lucide-react";

interface Draft {
  id: string;
  draftType: string;
  draftKey: string;
  label: string;
  step?: string | null;
  data: any;
  createdAt: string;
  updatedAt: string;
}

export default function DraftPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params.id as string;

  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDraft();
  }, [draftId]);

  const fetchDraft = async () => {
    try {
      const res = await fetch(`/api/drafts/${draftId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Draft not found");
        } else {
          setError("Failed to load draft");
        }
        setLoading(false);
        return;
      }
      const result = await res.json();
      setDraft(result.draft);
      setEditedData(result.draft.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load draft");
      setLoading(false);
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/drafts/${draftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: editedData,
          step: draft.step,
          label: draft.label,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setDraft(result.draft);
        setIsEditing(false);
      } else {
        setError("Failed to save draft");
      }
    } catch (err) {
      setError("Failed to save draft");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!draft) return;
    
    if (!confirm("Are you sure you want to delete this draft?")) return;

    try {
      const res = await fetch(`/api/drafts/${draftId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/application-history");
      } else {
        setError("Failed to delete draft");
      }
    } catch (err) {
      setError("Failed to delete draft");
      console.error(err);
    }
  };

  const handleResumeDraft = () => {
    if (!draft) return;
    
    // Redirect to appropriate wizard based on draft type
    if (draft.draftType === "policy") {
      router.push(`/policies/new?draft=${draftId}`);
    } else if (draft.draftType === "claim") {
      router.push(`/claims/new?draft=${draftId}`);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading draft...</p>
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
        <div style={{ marginBottom: "16px" }}>
          <button
            onClick={() => router.push("/application-history")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              backgroundColor: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              color: "var(--text-secondary)",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            }}
          >
            <ArrowLeft size={14} />
            Back to Application History
          </button>
        </div>
        <div
          style={{
            padding: "32px 24px",
            textAlign: "center",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
          }}
        >
          <FileText size={48} style={{ opacity: 0.3, marginBottom: "16px" }} />
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: "0 0 8px",
            }}
          >
            {error || "Draft not found"}
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
            The draft you're looking for doesn't exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  const date = new Date(draft.updatedAt).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = new Date(draft.updatedAt).toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ marginBottom: "16px" }}>
          <button
            onClick={() => router.push("/application-history")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              backgroundColor: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              color: "var(--text-secondary)",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            }}
          >
            <ArrowLeft size={14} />
            Back to Application History
          </button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
          }}
        >
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: "0 0 8px",
              }}
            >
              {draft.label || "Untitled Draft"}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  backgroundColor: "#fbbf2415",
                  color: "#f59e0b",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                {draft.draftType} Draft
              </span>
              {draft.step && (
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--text-muted)",
                  }}
                >
                  Step: {draft.step}
                </span>
              )}
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                }}
              >
                Last updated: {date} at {time}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleResumeDraft}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                backgroundColor: "var(--brand)",
                border: "none",
                borderRadius: "6px",
                color: "white",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--brand-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--brand)";
              }}
            >
              <Edit3 size={14} />
              Resume Draft
            </button>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                }}
              >
                <Edit3 size={14} />
                Edit Data
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    backgroundColor: saving ? "var(--border)" : "var(--brand)",
                    border: "none",
                    borderRadius: "6px",
                    color: saving ? "var(--text-muted)" : "white",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <Save size={14} />
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedData(draft.data);
                  }}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "transparent",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    color: "var(--text-secondary)",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  }}
                >
                  Cancel
                </button>
              </>
            )}

            <button
              onClick={handleDelete}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                backgroundColor: "transparent",
                border: "1px solid #ef4444",
                borderRadius: "6px",
                color: "#ef4444",
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#ef444415";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              }}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "6px",
            color: "#dc2626",
            fontSize: "13px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      {/* Draft Data */}
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            backgroundColor: "var(--bg-app)",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Draft Data
          </h3>
        </div>

        <div style={{ padding: "20px" }}>
          {isEditing ? (
            <textarea
              value={JSON.stringify(editedData, null, 2)}
              onChange={(e) => {
                try {
                  setEditedData(JSON.parse(e.target.value));
                } catch {
                  // Invalid JSON, keep the raw string for now
                  setEditedData(e.target.value);
                }
              }}
              style={{
                width: "100%",
                height: "400px",
                padding: "12px",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                fontFamily: "monospace",
                fontSize: "12px",
                backgroundColor: "var(--bg-app)",
                color: "var(--text-primary)",
                resize: "vertical",
              }}
              placeholder="Draft data in JSON format..."
            />
          ) : (
            <pre
              style={{
                padding: "12px",
                backgroundColor: "var(--bg-app)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                fontFamily: "monospace",
                fontSize: "12px",
                color: "var(--text-primary)",
                overflow: "auto",
                maxHeight: "400px",
                margin: 0,
              }}
            >
              {JSON.stringify(draft.data, null, 2)}
            </pre>
          )}
        </div>
      </div>

      {/* Draft Metadata */}
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          overflow: "hidden",
          marginTop: "16px",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            backgroundColor: "var(--bg-app)",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Metadata
          </h3>
        </div>

        <div style={{ padding: "20px" }}>
          <div style={{ display: "grid", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>ID:</span>
              <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>{draft.id}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Type:</span>
              <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>{draft.draftType}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Key:</span>
              <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>{draft.draftKey}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Created:</span>
              <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                {new Date(draft.createdAt).toLocaleString("en-KE")}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Updated:</span>
              <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                {new Date(draft.updatedAt).toLocaleString("en-KE")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
