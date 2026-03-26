// src/app/(dashboard)/settings/benefits/page.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, AlertTriangle, GripVertical } from "lucide-react";

interface Benefit {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

const inputStyle = {
  width: "100%", padding: "8px 10px",
  backgroundColor: "var(--bg-app)", border: "1px solid var(--border)",
  borderRadius: "6px", color: "#ffffff", fontSize: "13px", outline: "none",
};

export default function BenefitsPage() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Benefit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Benefit | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function fetchBenefits() {
    setLoading(true);
    try {
      const res = await fetch("/api/benefits");
      const data = await res.json();
      setBenefits(data.benefits || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchBenefits(); }, []);

  function openAdd() {
    setEditTarget(null);
    setName("");
    setError("");
    setShowForm(true);
  }

  function openEdit(b: Benefit) {
    setEditTarget(b);
    setName(b.name);
    setError("");
    setShowForm(true);
  }

  async function handleSave() {
    if (!name.trim()) { setError("Benefit name is required"); return; }
    setSaving(true);
    setError("");
    try {
      const url = editTarget ? `/api/benefits/${editTarget.id}` : "/api/benefits";
      const method = editTarget ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), sortOrder: editTarget?.sortOrder ?? benefits.length + 1 }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); return; }
      await fetchBenefits();
      setShowForm(false);
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(b: Benefit) {
    await fetch(`/api/benefits/${b.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !b.isActive }),
    });
    fetchBenefits();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/benefits/${deleteTarget.id}`, { method: "DELETE" });
      setBenefits((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ maxWidth: "700px" }}>
      <Link href="/settings" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "13px", textDecoration: "none", marginBottom: "16px" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}>
        <ArrowLeft size={14} /> Back to Settings
      </Link>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", margin: 0 }}>Benefits Manager</h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "2px 0 0" }}>
            {benefits.length} benefit{benefits.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <button onClick={openAdd}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", backgroundColor: "var(--brand)", color: "#000", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
          <Plus size={15} /> Add Benefit
        </button>
      </div>

      <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 100px 80px", padding: "10px 16px", borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-sidebar)" }}>
          {["", "Benefit Name", "Status", ""].map((h, i) => (
            <span key={i} style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
        ) : benefits.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>No benefits yet.</div>
        ) : (
          benefits.map((b, i) => (
            <div key={b.id}
              style={{ display: "grid", gridTemplateColumns: "32px 1fr 100px 80px", padding: "11px 16px", borderBottom: i < benefits.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
            >
              <GripVertical size={14} color="var(--text-muted)" style={{ cursor: "grab" }} />
              <span style={{ fontSize: "13px", fontWeight: 500, color: b.isActive ? "#ffffff" : "var(--text-muted)" }}>
                {b.name}
              </span>
              <button onClick={() => toggleActive(b)}
                style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: 600, width: "fit-content",
                  backgroundColor: b.isActive ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.15)",
                  color: b.isActive ? "var(--brand)" : "var(--text-muted)" }}>
                {b.isActive ? <><Check size={10} /> Active</> : "Inactive"}
              </button>
              <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                <button onClick={() => openEdit(b)}
                  style={{ padding: "5px", borderRadius: "6px", border: "none", backgroundColor: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ffffff"; (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}>
                  <Pencil size={13} />
                </button>
                <button onClick={() => setDeleteTarget(b)}
                  style={{ padding: "5px", borderRadius: "6px", border: "none", backgroundColor: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f87171"; (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(239,68,68,0.1)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
          onClick={() => setShowForm(false)}>
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "400px" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                {editTarget ? "Edit Benefit" : "Add Benefit"}
              </h3>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><X size={16} /></button>
            </div>
            {error && <div style={{ padding: "10px 12px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#fca5a5", fontSize: "12px", marginBottom: "14px" }}>{error}</div>}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Benefit Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Windscreen Cover" style={inputStyle}
                onFocus={(e) => ((e.target as HTMLElement).style.borderColor = "var(--brand)")}
                onBlur={(e) => ((e.target as HTMLElement).style.borderColor = "var(--border)")}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }} />
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: "8px 18px", borderRadius: "8px", border: "none", backgroundColor: "var(--brand)", color: "#000", fontSize: "13px", fontWeight: 700, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving..." : editTarget ? "Save Changes" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
          onClick={() => setDeleteTarget(null)}>
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "380px" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={18} color="#f87171" />
              </div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", margin: 0 }}>Delete Benefit</h3>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
              Delete <strong style={{ color: "#ffffff" }}>{deleteTarget.name}</strong>? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                <Trash2 size={13} /> {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}