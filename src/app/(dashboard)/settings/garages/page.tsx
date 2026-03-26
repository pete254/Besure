// src/app/(dashboard)/settings/garages/page.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, AlertTriangle, Search, MapPin, Phone } from "lucide-react";

interface Garage {
  id: string;
  name: string;
  location?: string | null;
  county?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  isActive: boolean;
}

const KENYA_COUNTIES = [
  "Baringo","Bomet","Bungoma","Busia","Elgeyo-Marakwet","Embu","Garissa",
  "Homa Bay","Isiolo","Kajiado","Kakamega","Kericho","Kiambu","Kilifi",
  "Kirinyaga","Kisii","Kisumu","Kitui","Kwale","Laikipia","Lamu","Machakos",
  "Makueni","Mandera","Marsabit","Meru","Migori","Mombasa","Murang'a",
  "Nairobi","Nakuru","Nandi","Narok","Nyamira","Nyandarua","Nyeri",
  "Samburu","Siaya","Taita-Taveta","Tana River","Tharaka-Nithi","Trans Nzoia",
  "Turkana","Uasin Gishu","Vihiga","Wajir","West Pokot",
];

const emptyForm = { name: "", location: "", county: "", contactPerson: "", phone: "", isActive: true };

const inputStyle = {
  width: "100%", padding: "8px 10px",
  backgroundColor: "var(--bg-app)", border: "1px solid var(--border)",
  borderRadius: "6px", color: "#ffffff", fontSize: "13px", outline: "none",
};

const labelStyle = {
  display: "block", fontSize: "11px", fontWeight: 600 as const,
  color: "var(--text-muted)", marginBottom: "4px",
  textTransform: "uppercase" as const, letterSpacing: "0.05em",
};

export default function GaragesPage() {
  const [garages, setGarages] = useState<Garage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Garage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Garage | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function fetchGarages(q = "") {
    setLoading(true);
    try {
      const params = q ? `?search=${encodeURIComponent(q)}` : "";
      const res = await fetch(`/api/garages${params}`);
      const data = await res.json();
      setGarages(data.garages || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchGarages(); }, []);
  useEffect(() => {
    const t = setTimeout(() => fetchGarages(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  function openAdd() {
    setEditTarget(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEdit(g: Garage) {
    setEditTarget(g);
    setForm({ name: g.name, location: g.location || "", county: g.county || "", contactPerson: g.contactPerson || "", phone: g.phone || "", isActive: g.isActive });
    setError("");
    setShowForm(true);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value }));
  }

  function focusStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    (e.target as HTMLElement).style.borderColor = "var(--brand)";
  }
  function blurStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    (e.target as HTMLElement).style.borderColor = "var(--border)";
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Garage name is required"); return; }
    setSaving(true);
    setError("");
    try {
      const url = editTarget ? `/api/garages/${editTarget.id}` : "/api/garages";
      const method = editTarget ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); return; }
      await fetchGarages(search);
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
      await fetch(`/api/garages/${deleteTarget.id}`, { method: "DELETE" });
      setGarages((prev) => prev.filter((g) => g.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  async function toggleActive(g: Garage) {
    await fetch(`/api/garages/${g.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !g.isActive }),
    });
    fetchGarages(search);
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
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", margin: 0 }}>Garage Register</h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "2px 0 0" }}>{garages.length} garage{garages.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={openAdd}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", backgroundColor: "var(--brand)", color: "#000", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
          <Plus size={15} /> Add Garage
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "16px" }}>
        <Search size={14} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input type="text" placeholder="Search garages..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", padding: "8px 12px 8px 34px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", color: "#ffffff", fontSize: "13px", outline: "none" }}
          onFocus={(e) => ((e.target as HTMLElement).style.borderColor = "var(--brand)")}
          onBlur={(e) => ((e.target as HTMLElement).style.borderColor = "var(--border)")} />
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1.5fr 100px 80px", padding: "10px 16px", borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-sidebar)" }}>
          {["Garage Name", "Location", "County", "Contact", "Status", ""].map((h) => (
            <span key={h} style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
        ) : garages.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>No garages found.</div>
        ) : (
          garages.map((g, i) => (
            <div key={g.id}
              style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1.5fr 100px 80px", padding: "12px 16px", borderBottom: i < garages.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
            >
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>{g.name}</span>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                {g.location ? <><MapPin size={11} />{g.location}</> : "—"}
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{g.county || "—"}</span>
              <div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>{g.contactPerson || "—"}</p>
                {g.phone && <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, display: "flex", alignItems: "center", gap: "3px" }}><Phone size={10} />{g.phone}</p>}
              </div>
              <button onClick={() => toggleActive(g)}
                style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: 600, width: "fit-content",
                  backgroundColor: g.isActive ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.15)",
                  color: g.isActive ? "var(--brand)" : "var(--text-muted)" }}>
                {g.isActive ? <><Check size={10} /> Active</> : "Inactive"}
              </button>
              <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                <button onClick={() => openEdit(g)}
                  style={{ padding: "5px", borderRadius: "6px", border: "none", backgroundColor: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ffffff"; (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}>
                  <Pencil size={14} />
                </button>
                <button onClick={() => setDeleteTarget(g)}
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

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
          onClick={() => setShowForm(false)}>
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "480px" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", margin: 0 }}>{editTarget ? "Edit Garage" : "Add Garage"}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><X size={16} /></button>
            </div>
            {error && <div style={{ padding: "10px 12px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#fca5a5", fontSize: "12px", marginBottom: "14px" }}>{error}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Garage Name *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Nairobi Auto Repairs" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Location / Area</label>
                  <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Industrial Area" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                </div>
                <div>
                  <label style={labelStyle}>County</label>
                  <select name="county" value={form.county} onChange={handleChange} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}>
                    <option value="">Select county</option>
                    {KENYA_COUNTIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Contact Person</label>
                  <input name="contactPerson" value={form.contactPerson} onChange={handleChange} placeholder="Name" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="0700 000 000" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} style={{ accentColor: "var(--brand)", width: "16px", height: "16px" }} />
                <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>Active garage</span>
              </label>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: "8px 18px", borderRadius: "8px", border: "none", backgroundColor: "var(--brand)", color: "#000", fontSize: "13px", fontWeight: 700, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving..." : editTarget ? "Save Changes" : "Add Garage"}
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
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", margin: 0 }}>Delete Garage</h3>
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