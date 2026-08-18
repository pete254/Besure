// src/app/(dashboard)/settings/benefits/page.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, AlertTriangle, GripVertical } from "lucide-react";
import FieldError from "@/components/ui/FieldError";
import FormErrorBanner from "@/components/ui/FormErrorBanner";
import { BENEFIT_GROUPS, benefitGroupLabel } from "@/lib/benefit-groups";

interface Benefit {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  applicableTo: string;
  calcConfig?: Record<string, any> | null;
}

// How the KES amount for a benefit is arrived at when a policy is created
type AmountType = "manual" | "percentage" | "custom";

function amountTypeOf(cfg?: Record<string, any> | null): AmountType {
  if (!cfg || cfg.type === "fixed_editable") return "manual";
  if (cfg.type === "percentage") return "percentage";
  return "custom"; // windscreen / entertainment / loss_of_use / fixed — preserved as is
}

function amountRuleLabel(cfg?: Record<string, any> | null): string {
  const t = amountTypeOf(cfg);
  if (t === "manual") return "Manual amount";
  if (t === "percentage") return cfg?.label || `${((cfg?.rate ?? 0) * 100).toFixed(2)}% of sum insured`;
  return `Custom (${cfg?.type})`;
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
  const [applicableTo, setApplicableTo] = useState<string>("private");
  const [amountType, setAmountType] = useState<AmountType>("manual");
  const [percentRate, setPercentRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

  // Group the list so benefits that share a name across insurance types stay readable
  const groupOrder = BENEFIT_GROUPS.map(g => g.value) as string[];
  const sortedBenefits = [...benefits].sort((a, b) => {
    const ga = groupOrder.indexOf(a.applicableTo);
    const gb = groupOrder.indexOf(b.applicableTo);
    if (ga !== gb) return ga - gb;
    return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
  });

  function openAdd() {
    setEditTarget(null);
    setName("");
    setApplicableTo("private");
    setAmountType("manual");
    setPercentRate("");
    setError("");
    setFieldErrors({});
    setShowForm(true);
  }

  function openEdit(b: Benefit) {
    setEditTarget(b);
    setName(b.name);
    setApplicableTo(b.applicableTo || "both");
    const t = amountTypeOf(b.calcConfig);
    setAmountType(t);
    setPercentRate(t === "percentage" ? String(((b.calcConfig?.rate ?? 0) * 100).toFixed(2)) : "");
    setError("");
    setFieldErrors({});
    setShowForm(true);
  }

  async function handleSave() {
    setError("");
    setFieldErrors({});
    const errors: Record<string, string> = {};

    const trimmedName = name.trim();

    if (!trimmedName) {
      errors.name = "Benefit name is required";
    } else if (trimmedName.length < 3) {
      errors.name = "Benefit name must be at least 3 characters";
    } else if (trimmedName.length > 100) {
      errors.name = "Benefit name must be under 100 characters";
    }

    const rate = parseFloat(percentRate);
    if (amountType === "percentage" && (!percentRate || isNaN(rate) || rate <= 0)) {
      errors.percentRate = "Enter the rate as a percentage of the sum insured (e.g. 0.25)";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the errors below and try again.");
      return;
    }

    // "custom" keeps whatever rule the benefit already has (windscreen, loss of use, …)
    const calcConfig =
      amountType === "manual" ? { type: "fixed_editable", defaultAmount: 0 }
      : amountType === "percentage" ? { type: "percentage", rate: rate / 100, label: `${rate}% of sum insured` }
      : undefined;

    setSaving(true);
    setError("");
    try {
      const url = editTarget ? `/api/benefits/${editTarget.id}` : "/api/benefits";
      const method = editTarget ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          sortOrder: editTarget?.sortOrder ?? benefits.length + 1,
          applicableTo,
          ...(calcConfig ? { calcConfig } : {}),
        }),
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
    <div style={{ maxWidth: "860px" }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 190px 96px 76px", padding: "10px 16px", borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-sidebar)" }}>
          {["", "Benefit Name", "Applies To", "Status", ""].map((h, i) => (
            <span key={i} style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
        ) : benefits.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>No benefits yet.</div>
        ) : (
          sortedBenefits.map((b, i) => (
            <div key={b.id}
              style={{ display: "grid", gridTemplateColumns: "32px 1fr 190px 96px 76px", padding: "11px 16px", borderBottom: i < sortedBenefits.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
            >
              <GripVertical size={14} color="var(--text-muted)" style={{ cursor: "grab" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", paddingRight: "10px" }}>
                <span style={{ fontSize: "13px", fontWeight: 500, color: b.isActive ? "#ffffff" : "var(--text-muted)" }}>
                  {b.name}
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {amountRuleLabel(b.calcConfig)}
                </span>
              </div>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                {benefitGroupLabel(b.applicableTo)}
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
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "440px" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                {editTarget ? "Edit Benefit" : "Add Benefit"}
              </h3>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><X size={16} /></button>
            </div>
            <FormErrorBanner message={error} fieldErrors={fieldErrors} compact />
            <div data-error={!!fieldErrors.name || undefined}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Benefit Name *</label>
              <input value={name} onChange={(e) => { setName(e.target.value); if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: "" })); }} placeholder="e.g. Windscreen Cover" style={{ ...inputStyle, borderColor: fieldErrors.name ? "#f87171" : "1px solid var(--border)" }}
                onFocus={(e) => ((e.target as HTMLElement).style.borderColor = fieldErrors.name ? "#f87171" : "var(--brand)")}
                onBlur={(e) => ((e.target as HTMLElement).style.borderColor = fieldErrors.name ? "#f87171" : "var(--border)")}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }} />
              <FieldError message={fieldErrors.name} />
            </div>

            <div style={{ marginTop: "12px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Applies To *</label>
              <select value={applicableTo} onChange={(e) => setApplicableTo(e.target.value)} style={inputStyle}
                onFocus={(e) => ((e.target as HTMLElement).style.borderColor = "var(--brand)")}
                onBlur={(e) => ((e.target as HTMLElement).style.borderColor = "var(--border)")}>
                {BENEFIT_GROUPS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                The benefit only appears on policies and quotes of this insurance type.
              </p>
            </div>

            <div style={{ marginTop: "12px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Amount *</label>
              {amountType === "custom" ? (
                <div style={{ padding: "9px 10px", borderRadius: "6px", border: "1px solid var(--border)", backgroundColor: "var(--bg-app)" }}>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                    {amountRuleLabel(editTarget?.calcConfig)} — built-in rule, kept as is
                  </p>
                </div>
              ) : (
                <select value={amountType} onChange={(e) => setAmountType(e.target.value as AmountType)} style={inputStyle}
                  onFocus={(e) => ((e.target as HTMLElement).style.borderColor = "var(--brand)")}
                  onBlur={(e) => ((e.target as HTMLElement).style.borderColor = "var(--border)")}>
                  <option value="manual">Manual amount — typed in on each policy</option>
                  <option value="percentage">Percentage of sum insured</option>
                </select>
              )}
            </div>

            {amountType === "percentage" && (
              <div style={{ marginTop: "12px" }} data-error={!!fieldErrors.percentRate || undefined}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Rate (% of sum insured) *</label>
                <input type="number" step="0.01" value={percentRate} placeholder="e.g. 0.25"
                  onChange={(e) => { setPercentRate(e.target.value); if (fieldErrors.percentRate) setFieldErrors(prev => ({ ...prev, percentRate: "" })); }}
                  style={{ ...inputStyle, borderColor: fieldErrors.percentRate ? "#f87171" : undefined }}
                  onFocus={(e) => ((e.target as HTMLElement).style.borderColor = fieldErrors.percentRate ? "#f87171" : "var(--brand)")}
                  onBlur={(e) => ((e.target as HTMLElement).style.borderColor = fieldErrors.percentRate ? "#f87171" : "var(--border)")} />
                <FieldError message={fieldErrors.percentRate} />
              </div>
            )}

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