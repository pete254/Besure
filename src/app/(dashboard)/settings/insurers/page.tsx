// src/app/(dashboard)/settings/insurers/page.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, AlertTriangle } from "lucide-react";
import FieldError from "@/components/ui/FieldError";

interface Insurer {
  id: string;
  name: string;
  isActive: boolean;
  commissionRate?: string | null;
  rateMotorPrivate?: string | null;
  rateMotorCommercial?: string | null;
  ratePsv?: string | null;
  minPremiumPrivate?: string | null;
  minPremiumCommercial?: string | null;
  minPremiumPsv?: string | null;
}

const emptyForm = {
  name: "",
  isActive: true,
  commissionRate: "",
  rateMotorPrivate: "",
  rateMotorCommercial: "",
  ratePsv: "",
  minPremiumPrivate: "",
  minPremiumCommercial: "",
  minPremiumPsv: "",
};

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  backgroundColor: "var(--bg-app)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "13px",
  outline: "none",
};

const labelStyle = {
  display: "block",
  fontSize: "11px",
  fontWeight: 600 as const,
  color: "var(--text-muted)",
  marginBottom: "4px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

export default function InsurersPage() {
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Insurer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Insurer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function fetchInsurers() {
    setLoading(true);
    try {
      const res = await fetch("/api/insurers");
      const data = await res.json();
      setInsurers(data.insurers || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchInsurers(); }, []);

  function openAdd() {
    setEditTarget(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEdit(insurer: Insurer) {
    setEditTarget(insurer);
    setForm({
      name: insurer.name,
      isActive: insurer.isActive,
      commissionRate: insurer.commissionRate || "",
      rateMotorPrivate: insurer.rateMotorPrivate || "",
      rateMotorCommercial: insurer.rateMotorCommercial || "",
      ratePsv: insurer.ratePsv || "",
      minPremiumPrivate: insurer.minPremiumPrivate || "",
      minPremiumCommercial: insurer.minPremiumCommercial || "",
      minPremiumPsv: insurer.minPremiumPsv || "",
    });
    setError("");
    setShowForm(true);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: "" }));
    }
  }

  function focusStyle(e: React.FocusEvent<HTMLInputElement>) {
    (e.target as HTMLElement).style.borderColor = "var(--brand)";
  }
  function blurStyle(e: React.FocusEvent<HTMLInputElement>) {
    (e.target as HTMLElement).style.borderColor = "var(--border)";
  }

  async function handleSave() {
    setError("");
    setFieldErrors({});
    const errors: Record<string, string> = {};

    // Validate name
    if (!form.name.trim()) {
      errors.name = "Insurer name is required";
    }

    // Validate commission rate
    if (form.commissionRate) {
      const rate = parseFloat(form.commissionRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        errors.commissionRate = "Commission rate must be between 0% and 100%";
      }
    }

    // Validate rate fields
    ["rateMotorPrivate", "rateMotorCommercial", "ratePsv"].forEach(key => {
      const val = (form as any)[key];
      if (val) {
        const rate = parseFloat(val);
        if (isNaN(rate) || rate <= 0 || rate > 50) {
          errors[key] = "Rate must be between 0.01% and 50%";
        }
      }
    });

    // Validate minimum premium fields
    ["minPremiumPrivate", "minPremiumCommercial", "minPremiumPsv"].forEach(key => {
      const val = (form as any)[key];
      if (val) {
        const premium = parseFloat(val);
        if (isNaN(premium) || premium < 0) {
          errors[key] = "Minimum premium must be 0 or greater";
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the errors below and try again.");
      return;
    }

    setSaving(true);
    try {
      const url = editTarget ? `/api/insurers/${editTarget.id}` : "/api/insurers";
      const method = editTarget ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); return; }
      await fetchInsurers();
      setShowForm(false);
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/insurers/${deleteTarget.id}`, { method: "DELETE" });
      setInsurers((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  async function toggleActive(insurer: Insurer) {
    await fetch(`/api/insurers/${insurer.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !insurer.isActive }),
    });
    fetchInsurers();
  }

  return (
    <div style={{ maxWidth: "900px" }}>
      <Link href="/settings" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "13px", textDecoration: "none", marginBottom: "16px" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}>
        <ArrowLeft size={14} /> Back to Settings
      </Link>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", margin: 0 }}>Insurer Management</h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "2px 0 0" }}>
            {insurers.length} insurer{insurers.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <button
          onClick={openAdd}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", backgroundColor: "var(--brand)", color: "#000", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
        >
          <Plus size={15} /> Add Insurer
        </button>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 80px", padding: "10px 16px", borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-sidebar)" }}>
          {["Insurer", "Commission %", "Rate Private", "Rate Comm.", "Rate PSV", "Status", ""].map((h) => (
            <span key={h} style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
        ) : insurers.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>No insurers yet. Add one to get started.</div>
        ) : (
          insurers.map((ins, i) => (
            <div
              key={ins.id}
              style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 80px", padding: "12px 16px", borderBottom: i < insurers.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
            >
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>{ins.name}</span>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{ins.commissionRate ? `${ins.commissionRate}%` : "—"}</span>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{ins.rateMotorPrivate ? `${ins.rateMotorPrivate}%` : "—"}</span>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{ins.rateMotorCommercial ? `${ins.rateMotorCommercial}%` : "—"}</span>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{ins.ratePsv ? `${ins.ratePsv}%` : "—"}</span>

              {/* Active toggle */}
              <button
                onClick={() => toggleActive(ins)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "4px",
                  padding: "3px 8px", borderRadius: "20px", border: "none",
                  cursor: "pointer", fontSize: "11px", fontWeight: 600,
                  backgroundColor: ins.isActive ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.15)",
                  color: ins.isActive ? "var(--brand)" : "var(--text-muted)",
                }}
              >
                {ins.isActive ? <><Check size={10} /> Active</> : "Inactive"}
              </button>

              {/* Actions */}
              <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                <button onClick={() => openEdit(ins)}
                  style={{ padding: "5px", borderRadius: "6px", border: "none", backgroundColor: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ffffff"; (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}>
                  <Pencil size={14} />
                </button>
                <button onClick={() => setDeleteTarget(ins)}
                  style={{ padding: "5px", borderRadius: "6px", border: "none", backgroundColor: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f87171"; (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(239,68,68,0.1)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}>
                  <Trash2 size={14} />
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
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "560px", boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}
            onClick={(e) => e.stopPropagation()}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                {editTarget ? "Edit Insurer" : "Add Insurer"}
              </h3>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                <X size={16} />
              </button>
            </div>

            {error && (
              <div style={{ padding: "10px 12px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#fca5a5", fontSize: "12px", marginBottom: "16px" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div data-error={!!fieldErrors.name || undefined}>
                <label style={labelStyle}>Insurer Name *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Jubilee Insurance" style={{ ...inputStyle, borderColor: fieldErrors.name ? "#f87171" : "1px solid var(--border)" }} onFocus={(e) => { (e.target as HTMLElement).style.borderColor = fieldErrors.name ? "#f87171" : "var(--brand)"; }} onBlur={(e) => { (e.target as HTMLElement).style.borderColor = fieldErrors.name ? "#f87171" : "var(--border)"; }} />
                <FieldError message={fieldErrors.name} />
              </div>

              <div data-error={!!fieldErrors.commissionRate || undefined}>
                <label style={labelStyle}>Commission Rate (%)</label>
                <input name="commissionRate" value={form.commissionRate} onChange={handleChange} placeholder="e.g. 12.50" type="number" step="0.01" style={{ ...inputStyle, borderColor: fieldErrors.commissionRate ? "#f87171" : "1px solid var(--border)" }} onFocus={(e) => { (e.target as HTMLElement).style.borderColor = fieldErrors.commissionRate ? "#f87171" : "var(--brand)"; }} onBlur={(e) => { (e.target as HTMLElement).style.borderColor = fieldErrors.commissionRate ? "#f87171" : "var(--border)"; }} />
                <FieldError message={fieldErrors.commissionRate} />
              </div>

              <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "4px 0 0" }}>Default Rates (%)</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div data-error={!!fieldErrors.rateMotorPrivate || undefined}>
                  <label style={labelStyle}>Motor Private</label>
                  <input name="rateMotorPrivate" value={form.rateMotorPrivate} onChange={handleChange} placeholder="4.00" type="number" step="0.01" style={{ ...inputStyle, borderColor: fieldErrors.rateMotorPrivate ? "#f87171" : "1px solid var(--border)" }} onFocus={(e) => { (e.target as HTMLElement).style.borderColor = fieldErrors.rateMotorPrivate ? "#f87171" : "var(--brand)"; }} onBlur={(e) => { (e.target as HTMLElement).style.borderColor = fieldErrors.rateMotorPrivate ? "#f87171" : "var(--border)"; }} />
                  <FieldError message={fieldErrors.rateMotorPrivate} />
                </div>
                <div data-error={!!fieldErrors.rateMotorCommercial || undefined}>
                  <label style={labelStyle}>Commercial</label>
                  <input name="rateMotorCommercial" value={form.rateMotorCommercial} onChange={handleChange} placeholder="4.50" type="number" step="0.01" style={{ ...inputStyle, borderColor: fieldErrors.rateMotorCommercial ? "#f87171" : "1px solid var(--border)" }} onFocus={(e) => { (e.target as HTMLElement).style.borderColor = fieldErrors.rateMotorCommercial ? "#f87171" : "var(--brand)"; }} onBlur={(e) => { (e.target as HTMLElement).style.borderColor = fieldErrors.rateMotorCommercial ? "#f87171" : "var(--border)"; }} />
                  <FieldError message={fieldErrors.rateMotorCommercial} />
                </div>
                <div data-error={!!fieldErrors.ratePsv || undefined}>
                  <label style={labelStyle}>PSV / Matatu</label>
                  <input name="ratePsv" value={form.ratePsv} onChange={handleChange} placeholder="5.00" type="number" step="0.01" style={{ ...inputStyle, borderColor: fieldErrors.ratePsv ? "#f87171" : "1px solid var(--border)" }} onFocus={(e) => { (e.target as HTMLElement).style.borderColor = fieldErrors.ratePsv ? "#f87171" : "var(--brand)"; }} onBlur={(e) => { (e.target as HTMLElement).style.borderColor = fieldErrors.ratePsv ? "#f87171" : "var(--border)"; }} />
                  <FieldError message={fieldErrors.ratePsv} />
                </div>
              </div>

              <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "4px 0 0" }}>Minimum Premiums (KES)</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div data-error={!!fieldErrors.minPremiumPrivate || undefined}>
                  <label style={labelStyle}>Motor Private</label>
                  <input name="minPremiumPrivate" value={form.minPremiumPrivate} onChange={handleChange} placeholder="7500" type="number" style={{ ...inputStyle, borderColor: fieldErrors.minPremiumPrivate ? "#f87171" : "1px solid var(--border)" }} onFocus={(e) => { (e.target as HTMLElement).style.borderColor = fieldErrors.minPremiumPrivate ? "#f87171" : "var(--brand)"; }} onBlur={(e) => { (e.target as HTMLElement).style.borderColor = fieldErrors.minPremiumPrivate ? "#f87171" : "var(--border)"; }} />
                  <FieldError message={fieldErrors.minPremiumPrivate} />
                </div>
                <div data-error={!!fieldErrors.minPremiumCommercial || undefined}>
                  <label style={labelStyle}>Commercial</label>
                  <input name="minPremiumCommercial" value={form.minPremiumCommercial} onChange={handleChange} placeholder="10000" type="number" style={{ ...inputStyle, borderColor: fieldErrors.minPremiumCommercial ? "#f87171" : "1px solid var(--border)" }} onFocus={(e) => { (e.target as HTMLElement).style.borderColor = fieldErrors.minPremiumCommercial ? "#f87171" : "var(--brand)"; }} onBlur={(e) => { (e.target as HTMLElement).style.borderColor = fieldErrors.minPremiumCommercial ? "#f87171" : "var(--border)"; }} />
                  <FieldError message={fieldErrors.minPremiumCommercial} />
                </div>
                <div data-error={!!fieldErrors.minPremiumPsv || undefined}>
                  <label style={labelStyle}>PSV / Matatu</label>
                  <input name="minPremiumPsv" value={form.minPremiumPsv} onChange={handleChange} placeholder="12000" type="number" style={{ ...inputStyle, borderColor: fieldErrors.minPremiumPsv ? "#f87171" : "1px solid var(--border)" }} onFocus={(e) => { (e.target as HTMLElement).style.borderColor = fieldErrors.minPremiumPsv ? "#f87171" : "var(--brand)"; }} onBlur={(e) => { (e.target as HTMLElement).style.borderColor = fieldErrors.minPremiumPsv ? "#f87171" : "var(--border)"; }} />
                  <FieldError message={fieldErrors.minPremiumPsv} />
                </div>
              </div>

              {/* Active toggle */}
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} style={{ accentColor: "var(--brand)", width: "16px", height: "16px" }} />
                <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>Active — appears in policy dropdowns</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: "8px 18px", borderRadius: "8px", border: "none", backgroundColor: "var(--brand)", color: "#000", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving..." : editTarget ? "Save Changes" : "Add Insurer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
          onClick={() => setDeleteTarget(null)}>
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "400px" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={18} color="#f87171" />
              </div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", margin: 0 }}>Delete Insurer</h3>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
              Are you sure you want to delete <strong style={{ color: "#ffffff" }}>{deleteTarget.name}</strong>? This cannot be undone.
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