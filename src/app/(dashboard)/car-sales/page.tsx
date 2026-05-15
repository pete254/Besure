// src/app/(dashboard)/car-sales/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Car, Phone, Mail, DollarSign, Calendar, Building2,
  AlertCircle, ChevronRight, X, Check, MessageSquare,
  Bell, TrendingUp, Loader2, Search, MoreHorizontal,
  RefreshCw, Edit3, Trash2, AlarmClock, Ban, Users,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  sourceOfLead?: string | null;
}

interface Lead {
  id: string;
  stage: string;
  carType: string;
  registrationNumber: string;
  commissionAmount?: number | string | null;
  purchaseType?: "Cash" | "Bank" | null;
  selectedBank?: string | null;
  depositAmount?: number | string | null;
  paymentDate?: string | null;
  balanceRemaining?: number | string | null;
  reminderDate?: string | null;
  releaseDate?: string | null;
  commissionDueDate?: string | null;
  commissionStatus?: "Pending" | "Paid" | null;
  finalNotes?: string | null;
  lostReason?: string | null;
  cancelledReason?: string | null;
  followUpNotes?: string | null;
  nextAction?: string | null;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
}

interface Note {
  id: string;
  notes: string;
  createdAt: string;
}

interface Reminder {
  id: string;
  reminderDate: string;
  reminderType: string;
  notes?: string | null;
  isCompleted: boolean;
  createdAt: string;
}

type PipelineData = { [stage: string]: Lead[] };

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES = [
  "New Lead",
  "Follow Up",
  "Hot Prospect",
  "Deposit Paid",
  "Released",
  "Lost",
  "Cancelled",
] as const;

const STAGE_META: Record<string, { color: string; bg: string; dim: string; icon: React.ReactNode }> = {
  "New Lead":      { color: "#60a5fa", bg: "rgba(96,165,250,0.15)",  dim: "rgba(96,165,250,0.08)",  icon: <Plus size={12} /> },
  "Follow Up":     { color: "#fbbf24", bg: "rgba(251,191,36,0.15)",  dim: "rgba(251,191,36,0.08)",  icon: <Phone size={12} /> },
  "Hot Prospect":  { color: "#fb923c", bg: "rgba(251,146,60,0.15)",  dim: "rgba(251,146,60,0.08)",  icon: <TrendingUp size={12} /> },
  "Deposit Paid":  { color: "#a78bfa", bg: "rgba(167,139,250,0.15)", dim: "rgba(167,139,250,0.08)", icon: <DollarSign size={12} /> },
  "Released":      { color: "#10b981", bg: "rgba(16,185,129,0.15)",  dim: "rgba(16,185,129,0.08)",  icon: <Check size={12} /> },
  "Lost":          { color: "#f87171", bg: "rgba(248,113,113,0.15)", dim: "rgba(248,113,113,0.08)", icon: <X size={12} /> },
  "Cancelled":     { color: "#9ca3af", bg: "rgba(156,163,175,0.15)", dim: "rgba(156,163,175,0.08)", icon: <Ban size={12} /> },
};

const KENYA_BANKS = [
  "KCB", "Equity Bank", "Cooperative Bank", "NCBA", "Absa",
  "Standard Chartered", "Stanbic", "I&M", "Family Bank", "DTB",
  "SBM", "Kingdom Bank", "Prime Bank", "Credit Bank", "Gulf African Bank",
];

const SOURCE_OPTIONS = [
  "Referral", "Website", "Facebook", "Instagram", "Walk-in",
  "WhatsApp", "Phone Call", "Agent", "Other",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtKES(n?: number | string | null) {
  if (!n) return "—";
  const v = parseFloat(String(n));
  if (isNaN(v)) return "—";
  return `KES ${v.toLocaleString("en-KE", { minimumFractionDigits: 0 })}`;
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(d?: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function isOverdue(date?: string | null) {
  if (!date) return false;
  return new Date(date) < new Date();
}

// ─── Shared input style (matches project theme) ───────────────────────────────

const inStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px",
  backgroundColor: "var(--bg-app)", border: "1px solid var(--border)",
  borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", outline: "none",
};
const lbStyle: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600,
  color: "var(--text-secondary)", marginBottom: "5px",
  textTransform: "uppercase", letterSpacing: "0.05em",
};

function focusBrand(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  (e.target as HTMLElement).style.borderColor = "var(--brand)";
}
function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  (e.target as HTMLElement).style.borderColor = "var(--border)";
}

// ─── Stage Badge ──────────────────────────────────────────────────────────────

function StageBadge({ stage }: { stage: string }) {
  const meta = STAGE_META[stage] || STAGE_META["New Lead"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
      backgroundColor: meta.bg, color: meta.color,
    }}>
      {meta.icon} {stage}
    </span>
  );
}

// ─── New Lead Modal ───────────────────────────────────────────────────────────

function NewLeadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<"customer" | "car">("customer");
  const [saving, setSaving] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [error, setError] = useState("");

  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "", sourceOfLead: "" });
  const [carForm, setCarForm] = useState({ carType: "", registrationNumber: "", commissionAmount: "" });

  useEffect(() => {
    if (!customerSearch || customerSearch.length < 2) { setCustomerResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/car-sales/customers?search=${encodeURIComponent(customerSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerResults(Array.isArray(data) ? data : []);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [customerSearch]);

  async function createCustomer() {
    if (!newCustomer.name || !newCustomer.phone) { setError("Name and phone are required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/car-sales/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      });
      if (!res.ok) { setError("Failed to create customer"); return; }
      const cust = await res.json();
      setSelectedCustomer(cust);
      setShowNewCustomer(false);
      setStep("car");
      setError("");
    } finally { setSaving(false); }
  }

  async function createLead() {
    if (!selectedCustomer || !carForm.carType || !carForm.registrationNumber) {
      setError("All car fields are required"); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/car-sales/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          carType: carForm.carType,
          registrationNumber: carForm.registrationNumber.toUpperCase(),
          commissionAmount: carForm.commissionAmount ? parseFloat(carForm.commissionAmount) : null,
        }),
      });
      if (!res.ok) { setError("Failed to create lead"); return; }
      onSuccess();
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "480px", boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", margin: 0 }}>New Lead</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><X size={16} /></button>
        </div>

        {/* Step indicators */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {(["customer", "car"] as const).map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, backgroundColor: step === s ? "var(--brand)" : selectedCustomer && s === "customer" ? "rgba(16,185,129,0.2)" : "var(--bg-app)", color: step === s ? "#000" : selectedCustomer && s === "customer" ? "var(--brand)" : "var(--text-muted)", border: `1px solid ${step === s ? "var(--brand)" : "var(--border)"}` }}>
                {selectedCustomer && s === "customer" ? <Check size={10} /> : i + 1}
              </div>
              <span style={{ fontSize: "12px", fontWeight: 600, color: step === s ? "var(--brand)" : "var(--text-muted)", textTransform: "capitalize" }}>{s === "customer" ? "Customer" : "Car Details"}</span>
              {i === 0 && <ChevronRight size={12} color="var(--text-muted)" />}
            </div>
          ))}
        </div>

        {error && <div style={{ padding: "10px 12px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#fca5a5", fontSize: "12px", marginBottom: "14px" }}>{error}</div>}

        {/* Step 1: Customer */}
        {step === "customer" && !showNewCustomer && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {selectedCustomer ? (
              <div style={{ padding: "12px", backgroundColor: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", margin: 0 }}>{selectedCustomer.name}</p>
                  <p style={{ fontSize: "12px", color: "var(--brand)", margin: "2px 0 0" }}>{selectedCustomer.phone}</p>
                </div>
                <button onClick={() => setSelectedCustomer(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={14} /></button>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                <input
                  placeholder="Search by name or phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  style={{ ...inStyle, paddingLeft: "36px" }}
                  onFocus={focusBrand} onBlur={blurBorder}
                  autoFocus
                />
                {customerResults.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", marginTop: "4px", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
                    {customerResults.map(c => (
                      <div key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); setCustomerResults([]); }}
                        style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", margin: 0 }}>{c.name}</p>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>{c.phone}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button onClick={() => setShowNewCustomer(true)}
              style={{ padding: "9px 14px", border: "1px dashed var(--border)", backgroundColor: "transparent", borderRadius: "8px", color: "var(--text-muted)", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)"; (e.currentTarget as HTMLElement).style.color = "var(--brand)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}>
              <Plus size={13} /> Create New Customer
            </button>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => { if (!selectedCustomer) { setError("Please select a customer first"); return; } setError(""); setStep("car"); }}
                style={{ padding: "8px 18px", borderRadius: "8px", border: "none", backgroundColor: "var(--brand)", color: "#000", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* New customer form */}
        {step === "customer" && showNewCustomer && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={lbStyle}>Full Name *</label>
                <input value={newCustomer.name} onChange={(e) => setNewCustomer(p => ({ ...p, name: e.target.value }))} placeholder="John Kamau" style={inStyle} onFocus={focusBrand} onBlur={blurBorder} />
              </div>
              <div>
                <label style={lbStyle}>Phone *</label>
                <input value={newCustomer.phone} onChange={(e) => setNewCustomer(p => ({ ...p, phone: e.target.value }))} placeholder="0712 345 678" style={inStyle} onFocus={focusBrand} onBlur={blurBorder} />
              </div>
              <div>
                <label style={lbStyle}>Email</label>
                <input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer(p => ({ ...p, email: e.target.value }))} placeholder="john@email.com" style={inStyle} onFocus={focusBrand} onBlur={blurBorder} />
              </div>
              <div>
                <label style={lbStyle}>Source of Lead</label>
                <select value={newCustomer.sourceOfLead} onChange={(e) => setNewCustomer(p => ({ ...p, sourceOfLead: e.target.value }))} style={inStyle} onFocus={focusBrand} onBlur={blurBorder}>
                  <option value="">Select...</option>
                  {SOURCE_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowNewCustomer(false)} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: "13px", cursor: "pointer" }}>Back</button>
              <button onClick={createCustomer} disabled={saving} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", backgroundColor: "var(--brand)", color: "#000", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                {saving ? "Creating..." : "Create Customer"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Car details */}
        {step === "car" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ padding: "10px 12px", backgroundColor: "var(--bg-app)", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 2px" }}>Customer</p>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", margin: 0 }}>{selectedCustomer?.name} · {selectedCustomer?.phone}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={lbStyle}>Car Type *</label>
                <input value={carForm.carType} onChange={(e) => setCarForm(p => ({ ...p, carType: e.target.value }))} placeholder="Toyota Prado" style={inStyle} onFocus={focusBrand} onBlur={blurBorder} autoFocus />
              </div>
              <div>
                <label style={lbStyle}>Registration No. *</label>
                <input value={carForm.registrationNumber} onChange={(e) => setCarForm(p => ({ ...p, registrationNumber: e.target.value.toUpperCase() }))} placeholder="KDG 234X" style={inStyle} onFocus={focusBrand} onBlur={blurBorder} />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={lbStyle}>Commission Amount (KES)</label>
                <input type="number" value={carForm.commissionAmount} onChange={(e) => setCarForm(p => ({ ...p, commissionAmount: e.target.value }))} placeholder="e.g. 50000" style={inStyle} onFocus={focusBrand} onBlur={blurBorder} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button onClick={() => setStep("customer")} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: "13px", cursor: "pointer" }}>← Back</button>
              <button onClick={createLead} disabled={saving} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", backgroundColor: "var(--brand)", color: "#000", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                {saving ? "Creating..." : "Create Lead"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Lead Detail Drawer ───────────────────────────────────────────────────────

function LeadDrawer({ lead, onClose, onUpdate }: { lead: Lead; onClose: () => void; onUpdate: () => void }) {
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const today = new Date().toISOString().split("T")[0]; // "MM-DD-YYYY";
  const [reminderForm, setReminderForm] = useState({ reminderDate: today, reminderType: "", notes: "" });
  const [activeTab, setActiveTab] = useState<"details" | "notes" | "reminders">("details");
  const [showLostReason, setShowLostReason] = useState(false);
  const [lostReason, setLostReason] = useState("");
  const [form, setForm] = useState({
    stage: lead.stage,
    purchaseType: lead.purchaseType || "",
    selectedBank: lead.selectedBank || "",
    depositAmount: lead.depositAmount ? String(lead.depositAmount) : "",
    paymentDate: lead.paymentDate || "",
    balanceRemaining: lead.balanceRemaining ? String(lead.balanceRemaining) : "",
    reminderDate: lead.reminderDate || today,
    releaseDate: lead.releaseDate || "",
    commissionStatus: lead.commissionStatus || "Pending",
    finalNotes: lead.finalNotes || "",
    followUpNotes: lead.followUpNotes || "",
    nextAction: lead.nextAction || "",
    commissionAmount: lead.commissionAmount ? String(lead.commissionAmount) : "",
  });

  useEffect(() => {
    fetch(`/api/car-sales/leads/${lead.id}/notes`).then(r => r.json()).then(d => setNotes(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`/api/car-sales/leads/${lead.id}/reminders`).then(r => r.json()).then(d => setReminders(Array.isArray(d) ? d : [])).catch(() => {});
  }, [lead.id]);

  async function save(overrides?: Partial<typeof form & { lostReason?: string; cancelledReason?: string }>) {
    setSaving(true);
    try {
      const payload = { ...form, ...overrides };
      await fetch(`/api/car-sales/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      onUpdate();
    } finally { setSaving(false); }
  }

  async function moveStage(newStage: string) {
    if (newStage === "Lost" || newStage === "Cancelled") {
      setShowLostReason(true);
      setForm(p => ({ ...p, stage: newStage }));
      return;
    }
    setForm(p => ({ ...p, stage: newStage }));
    setSaving(true);
    try {
      await fetch(`/api/car-sales/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, stage: newStage }),
      });
      onUpdate();
    } finally { setSaving(false); }
  }

  async function confirmLostCancelled() {
    await save({ lostReason: form.stage === "Lost" ? lostReason : undefined, cancelledReason: form.stage === "Cancelled" ? lostReason : undefined });
    setShowLostReason(false);
    onUpdate();
  }

  async function addNote() {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      await fetch(`/api/car-sales/leads/${lead.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: newNote }),
      });
      setNewNote("");
      const r = await fetch(`/api/car-sales/leads/${lead.id}/notes`);
      const d = await r.json();
      setNotes(Array.isArray(d) ? d : []);
    } finally { setAddingNote(false); }
  }

  async function addReminder() {
    if (!reminderForm.reminderDate || !reminderForm.reminderType) return;
    await fetch(`/api/car-sales/leads/${lead.id}/reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reminderForm),
    });
    setReminderForm({ reminderDate: "", reminderType: "", notes: "" });
    setShowReminderForm(false);
    const r = await fetch(`/api/car-sales/leads/${lead.id}/reminders`);
    const d = await r.json();
    setReminders(Array.isArray(d) ? d : []);
  }

  const meta = STAGE_META[form.stage] || STAGE_META["New Lead"];
  const nextStages: string[] = {
    "New Lead": ["Follow Up", "Hot Prospect"],
    "Follow Up": ["Hot Prospect", "Deposit Paid"],
    "Hot Prospect": ["Deposit Paid"],
    "Deposit Paid": ["Released"],
    "Released": [],
    "Lost": ["New Lead", "Follow Up"],
    "Cancelled": ["New Lead", "Follow Up"],
  }[form.stage] || [];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      {/* Backdrop */}
      <div style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }} onClick={onClose} />

      {/* Drawer */}
      <div style={{ width: "480px", backgroundColor: "var(--bg-sidebar)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ padding: "20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.customer.name}</h3>
              <StageBadge stage={form.stage} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}><Car size={11} />{lead.carType}</span>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>{lead.registrationNumber}</span>
              {form.commissionAmount && <span style={{ fontSize: "12px", color: "var(--brand)", fontWeight: 700 }}>{fmtKES(form.commissionAmount)}</span>}
            </div>
            <div style={{ marginTop: "4px", display: "flex", gap: "10px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}><Phone size={11} />{lead.customer.phone}</span>
              {lead.customer.email && <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}><Mail size={11} />{lead.customer.email}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", flexShrink: 0, marginLeft: "8px" }}><X size={18} /></button>
        </div>

        {/* Move stage buttons */}
        {(nextStages.length > 0 || !["Lost", "Cancelled", "Released"].includes(form.stage)) && (
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", gap: "8px", flexWrap: "wrap", flexShrink: 0 }}>
            {nextStages.map(s => {
              const sm = STAGE_META[s];
              return (
                <button key={s} onClick={() => moveStage(s)} disabled={saving}
                  style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "8px", border: `1px solid ${sm.color}`, backgroundColor: sm.dim, color: sm.color, fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                  {sm.icon} Move to {s}
                </button>
              );
            })}
            {!["Lost", "Cancelled", "Released"].includes(form.stage) && (
              <>
                <button onClick={() => moveStage("Lost")} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(248,113,113,0.4)", backgroundColor: "rgba(248,113,113,0.08)", color: "#f87171", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                  <X size={11} /> Lost
                </button>
                <button onClick={() => moveStage("Cancelled")} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(156,163,175,0.4)", backgroundColor: "rgba(156,163,175,0.08)", color: "#9ca3af", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                  <Ban size={11} /> Cancel
                </button>
              </>
            )}
          </div>
        )}

        {/* Lost/Cancelled reason modal */}
        {showLostReason && (
          <div style={{ padding: "14px 20px", backgroundColor: "rgba(239,68,68,0.06)", borderBottom: "1px solid rgba(239,68,68,0.2)", flexShrink: 0 }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#f87171", marginBottom: "10px" }}>
              Reason for marking as {form.stage}?
            </p>
            <textarea value={lostReason} onChange={(e) => setLostReason(e.target.value)} placeholder="e.g. Bought elsewhere, financing declined..." rows={2}
              style={{ ...inStyle, resize: "none" }} onFocus={focusBrand} onBlur={blurBorder} />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "8px" }}>
              <button onClick={() => { setShowLostReason(false); setForm(p => ({ ...p, stage: lead.stage })); }}
                style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: "12px", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={confirmLostCancelled}
                style={{ padding: "6px 14px", borderRadius: "6px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                Confirm
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          {([
            { id: "details", label: "Details" },
            { id: "notes", label: `Notes${notes.length > 0 ? ` (${notes.length})` : ""}` },
            { id: "reminders", label: `Reminders${reminders.length > 0 ? ` (${reminders.length})` : ""}` },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              style={{ flex: 1, padding: "12px 8px", backgroundColor: "transparent", border: "none", borderBottom: activeTab === tab.id ? "2px solid var(--brand)" : "2px solid transparent", color: activeTab === tab.id ? "var(--brand)" : "var(--text-muted)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>

          {/* Details Tab */}
          {activeTab === "details" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Commission */}
              <div>
                <label style={lbStyle}>Commission Amount (KES)</label>
                <input type="number" value={form.commissionAmount} onChange={(e) => setForm(p => ({ ...p, commissionAmount: e.target.value }))} placeholder="Commission amount" style={inStyle} onFocus={focusBrand} onBlur={blurBorder} />
              </div>

              {/* Hot Prospect fields */}
              {["Hot Prospect", "Deposit Paid", "Released"].includes(form.stage) && (
                <>
                  <div>
                    <label style={lbStyle}>Purchase Type</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {["Cash", "Bank"].map(pt => (
                        <label key={pt} style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", padding: "9px 12px", borderRadius: "8px", cursor: "pointer", border: `1px solid ${form.purchaseType === pt ? "var(--brand)" : "var(--border)"}`, backgroundColor: form.purchaseType === pt ? "rgba(16,185,129,0.08)" : "var(--bg-app)" }}>
                          <input type="radio" name="purchaseType" value={pt} checked={form.purchaseType === pt} onChange={(e) => setForm(p => ({ ...p, purchaseType: e.target.value as any }))} style={{ width: "auto", margin: 0 }} />
                          <span style={{ fontSize: "13px", fontWeight: 600, color: form.purchaseType === pt ? "var(--brand)" : "var(--text-secondary)" }}>{pt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {form.purchaseType === "Bank" && (
                    <div>
                      <label style={lbStyle}>Bank</label>
                      <select value={form.selectedBank} onChange={(e) => setForm(p => ({ ...p, selectedBank: e.target.value }))} style={inStyle} onFocus={focusBrand} onBlur={blurBorder}>
                        <option value="">Select bank...</option>
                        {KENYA_BANKS.map(b => <option key={b}>{b}</option>)}
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Deposit Paid fields */}
              {["Deposit Paid", "Released"].includes(form.stage) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={lbStyle}>Deposit Amount (KES)</label>
                    <input type="number" value={form.depositAmount} onChange={(e) => setForm(p => ({ ...p, depositAmount: e.target.value }))} placeholder="KES" style={inStyle} onFocus={focusBrand} onBlur={blurBorder} />
                  </div>
                  <div>
                    <label style={lbStyle}>Payment Date</label>
                    <input type="date" value={form.paymentDate} onChange={(e) => setForm(p => ({ ...p, paymentDate: e.target.value }))} style={inStyle} onFocus={focusBrand} onBlur={blurBorder} />
                  </div>
                  <div>
                    <label style={lbStyle}>Balance Remaining (KES)</label>
                    <input type="number" value={form.balanceRemaining} onChange={(e) => setForm(p => ({ ...p, balanceRemaining: e.target.value }))} placeholder="KES" style={inStyle} onFocus={focusBrand} onBlur={blurBorder} />
                  </div>
                  <div>
                    <label style={lbStyle}>Reminder Date</label>
                    <input type="date" value={form.reminderDate} onChange={(e) => setForm(p => ({ ...p, reminderDate: e.target.value }))} style={inStyle} onFocus={focusBrand} onBlur={blurBorder} />
                  </div>
                </div>
              )}

              {/* Released fields */}
              {form.stage === "Released" && (
                <div style={{ padding: "14px", backgroundColor: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Release Details</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={lbStyle}>Release Date</label>
                      <input type="date" value={form.releaseDate} onChange={(e) => setForm(p => ({ ...p, releaseDate: e.target.value }))} style={inStyle} onFocus={focusBrand} onBlur={blurBorder} />
                    </div>
                    <div>
                      <label style={lbStyle}>Commission Due Date</label>
                      <input type="date" value={lead.commissionDueDate || ""} readOnly style={{ ...inStyle, color: "var(--text-muted)", cursor: "not-allowed" }} />
                      <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "3px" }}>Auto: Release date + 14 days</p>
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={lbStyle}>Commission Status</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {["Pending", "Paid"].map(s => (
                          <label key={s} style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", padding: "9px 12px", borderRadius: "8px", cursor: "pointer", border: `1px solid ${form.commissionStatus === s ? (s === "Paid" ? "var(--brand)" : "#fbbf24") : "var(--border)"}`, backgroundColor: form.commissionStatus === s ? (s === "Paid" ? "rgba(16,185,129,0.08)" : "rgba(251,191,36,0.08)") : "var(--bg-app)" }}>
                            <input type="radio" name="commissionStatus" value={s} checked={form.commissionStatus === s} onChange={(e) => setForm(p => ({ ...p, commissionStatus: e.target.value as any }))} style={{ width: "auto", margin: 0 }} />
                            <span style={{ fontSize: "13px", fontWeight: 600, color: form.commissionStatus === s ? (s === "Paid" ? "var(--brand)" : "#fbbf24") : "var(--text-secondary)" }}>{s}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  {lead.commissionDueDate && isOverdue(lead.commissionDueDate) && form.commissionStatus !== "Paid" && (
                    <div style={{ marginTop: "10px", padding: "8px 12px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <AlertCircle size={12} color="#f87171" />
                      <span style={{ fontSize: "12px", color: "#f87171", fontWeight: 600 }}>Commission overdue since {fmtDate(lead.commissionDueDate)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Lost / Cancelled reason display */}
              {(form.stage === "Lost" || form.stage === "Cancelled") && (lead.lostReason || lead.cancelledReason) && (
                <div style={{ padding: "12px", backgroundColor: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "8px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "#f87171", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Reason</p>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>{lead.lostReason || lead.cancelledReason}</p>
                </div>
              )}

              {/* Follow-up notes for Follow Up stage */}
              {form.stage === "Follow Up" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={lbStyle}>Follow-up Notes</label>
                    <textarea value={form.followUpNotes} onChange={(e) => setForm(p => ({ ...p, followUpNotes: e.target.value }))} rows={2} placeholder="Notes on follow-up..." style={{ ...inStyle, resize: "vertical" }} onFocus={focusBrand} onBlur={blurBorder} />
                  </div>
                  <div>
                    <label style={lbStyle}>Next Action</label>
                    <input value={form.nextAction} onChange={(e) => setForm(p => ({ ...p, nextAction: e.target.value }))} placeholder="e.g. Call on Monday" style={inStyle} onFocus={focusBrand} onBlur={blurBorder} />
                  </div>
                  <div>
                    <label style={lbStyle}>Reminder Date</label>
                    <input type="date" value={form.reminderDate} onChange={(e) => setForm(p => ({ ...p, reminderDate: e.target.value }))} style={inStyle} onFocus={focusBrand} onBlur={blurBorder} />
                  </div>
                </div>
              )}

              {/* Final notes */}
              <div>
                <label style={lbStyle}>Final Notes</label>
                <textarea value={form.finalNotes} onChange={(e) => setForm(p => ({ ...p, finalNotes: e.target.value }))} rows={2} placeholder="Any final notes..." style={{ ...inStyle, resize: "vertical" }} onFocus={focusBrand} onBlur={blurBorder} />
              </div>

              <button onClick={() => save()} disabled={saving}
                style={{ padding: "10px", backgroundColor: saving ? "var(--brand-dim)" : "var(--brand)", color: "#000", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                {saving ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Saving...</> : <><Check size={13} /> Save Changes</>}
              </button>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === "notes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note..." onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addNote(); } }}
                  style={{ ...inStyle, flex: 1 }} onFocus={focusBrand} onBlur={blurBorder} />
                <button onClick={addNote} disabled={addingNote || !newNote.trim()}
                  style={{ padding: "9px 14px", borderRadius: "8px", border: "none", backgroundColor: "var(--brand)", color: "#000", fontSize: "13px", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                  {addingNote ? "..." : "Add"}
                </button>
              </div>
              {notes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  <MessageSquare size={28} style={{ opacity: 0.4, marginBottom: "8px" }} />
                  <p style={{ fontSize: "13px", margin: 0 }}>No notes yet. Type above to add one.</p>
                </div>
              ) : (
                [...notes].reverse().map(n => (
                  <div key={n.id} style={{ padding: "12px", backgroundColor: "var(--bg-app)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "13px", color: "var(--text-primary)", margin: "0 0 6px" }}>{n.notes}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>{fmtTime(n.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Reminders Tab */}
          {activeTab === "reminders" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button onClick={() => setShowReminderForm(!showReminderForm)}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 14px", border: "1px dashed var(--border)", backgroundColor: "transparent", borderRadius: "8px", color: "var(--text-muted)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)"; (e.currentTarget as HTMLElement).style.color = "var(--brand)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}>
                <Bell size={13} /> {showReminderForm ? "Cancel" : "Add Reminder"}
              </button>
              {showReminderForm && (
                <div style={{ padding: "14px", backgroundColor: "var(--bg-app)", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={lbStyle}>Date</label>
                      <input type="date" value={reminderForm.reminderDate} onChange={(e) => setReminderForm(p => ({ ...p, reminderDate: e.target.value }))} style={inStyle} onFocus={focusBrand} onBlur={blurBorder} />
                    </div>
                    <div>
                      <label style={lbStyle}>Type</label>
                      <input value={reminderForm.reminderType} onChange={(e) => setReminderForm(p => ({ ...p, reminderType: e.target.value }))} placeholder="e.g. Follow-up call" style={inStyle} onFocus={focusBrand} onBlur={blurBorder} />
                    </div>
                  </div>
                  <div>
                    <label style={lbStyle}>Notes (optional)</label>
                    <input value={reminderForm.notes} onChange={(e) => setReminderForm(p => ({ ...p, notes: e.target.value }))} placeholder="Additional notes..." style={inStyle} onFocus={focusBrand} onBlur={blurBorder} />
                  </div>
                  <button onClick={addReminder}
                    style={{ padding: "8px", borderRadius: "8px", border: "none", backgroundColor: "var(--brand)", color: "#000", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                    Save Reminder
                  </button>
                </div>
              )}
              {reminders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  <Bell size={28} style={{ opacity: 0.4, marginBottom: "8px" }} />
                  <p style={{ fontSize: "13px", margin: 0 }}>No reminders set.</p>
                </div>
              ) : (
                reminders.map(r => (
                  <div key={r.id} style={{ padding: "12px", backgroundColor: "var(--bg-app)", borderRadius: "8px", border: `1px solid ${isOverdue(r.reminderDate) && !r.isCompleted ? "rgba(251,191,36,0.4)" : "var(--border)"}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", margin: 0 }}>{r.reminderType}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {isOverdue(r.reminderDate) && !r.isCompleted && (
                          <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 6px", borderRadius: "10px", backgroundColor: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>Overdue</span>
                        )}
                        {r.isCompleted && <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 6px", borderRadius: "10px", backgroundColor: "rgba(16,185,129,0.15)", color: "var(--brand)" }}>Done</span>}
                      </div>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>{fmtDate(r.reminderDate)}</p>
                    {r.notes && <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "4px 0 0" }}>{r.notes}</p>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const hasOverdueReminder = lead.reminderDate && isOverdue(lead.reminderDate);
  const hasOverdueCommission = lead.commissionDueDate && isOverdue(lead.commissionDueDate) && lead.commissionStatus !== "Paid";

  return (
    <div onClick={onClick} style={{ padding: "12px", backgroundColor: "var(--bg-card)", borderRadius: "8px", border: "1px solid var(--border)", cursor: "pointer", transition: "border-color 0.1s, background-color 0.1s" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)"; (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-card)"; }}>

      {/* Customer name */}
      <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.customer.name}</p>

      {/* Phone */}
      <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "0 0 8px", display: "flex", alignItems: "center", gap: "4px" }}>
        <Phone size={10} /> {lead.customer.phone}
      </p>

      {/* Car */}
      <div style={{ padding: "6px 8px", backgroundColor: "var(--bg-app)", borderRadius: "6px", marginBottom: "8px" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.carType}</p>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "1px 0 0", fontWeight: 600 }}>{lead.registrationNumber}</p>
      </div>

      {/* Commission */}
      {lead.commissionAmount && (
        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "6px" }}>
          <DollarSign size={11} color="var(--brand)" />
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--brand)" }}>{fmtKES(lead.commissionAmount)}</span>
          {lead.stage === "Released" && (
            <span style={{ fontSize: "10px", padding: "1px 5px", borderRadius: "8px", backgroundColor: lead.commissionStatus === "Paid" ? "rgba(16,185,129,0.15)" : "rgba(251,191,36,0.15)", color: lead.commissionStatus === "Paid" ? "var(--brand)" : "#fbbf24", marginLeft: "4px", fontWeight: 600 }}>
              {lead.commissionStatus || "Pending"}
            </span>
          )}
        </div>
      )}

      {/* Bank tag */}
      {lead.purchaseType === "Bank" && lead.selectedBank && (
        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "6px" }}>
          <Building2 size={10} color="#60a5fa" />
          <span style={{ fontSize: "11px", color: "#60a5fa", fontWeight: 600 }}>{lead.selectedBank}</span>
        </div>
      )}

      {/* Deposit info */}
      {lead.depositAmount && (
        <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "0 0 6px" }}>
          Deposit: <span style={{ color: "#a78bfa", fontWeight: 600 }}>{fmtKES(lead.depositAmount)}</span>
          {lead.balanceRemaining && <span> · Bal: <span style={{ color: "#fbbf24", fontWeight: 600 }}>{fmtKES(lead.balanceRemaining)}</span></span>}
        </p>
      )}

      {/* Alerts */}
      {(hasOverdueReminder || hasOverdueCommission) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          {hasOverdueReminder && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <AlarmClock size={10} color="#fbbf24" />
              <span style={{ fontSize: "10px", color: "#fbbf24", fontWeight: 600 }}>Reminder due {fmtDate(lead.reminderDate)}</span>
            </div>
          )}
          {hasOverdueCommission && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <AlertCircle size={10} color="#f87171" />
              <span style={{ fontSize: "10px", color: "#f87171", fontWeight: 600 }}>Commission overdue</span>
            </div>
          )}
        </div>
      )}

      {/* Lost/Cancelled reason */}
      {(lead.stage === "Lost" || lead.stage === "Cancelled") && (lead.lostReason || lead.cancelledReason) && (
        <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "6px 0 0", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {lead.lostReason || lead.cancelledReason}
        </p>
      )}

      {/* Footer: time */}
      <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: "8px 0 0" }}>
        {fmtDate(lead.updatedAt)}
      </p>
    </div>
  );
}

// ─── Filtered Details View ────────────────────────────────────────────────────

function FilteredDetailsView({ type, pipeline, onClose, onLeadClick }: { type: string; pipeline: PipelineData; onClose: () => void; onLeadClick: (lead: Lead) => void }) {
  let leads: Lead[] = [];
  let title = "";
  
  if (type === "active") {
    title = "Active Pipeline";
    leads = [
      ...(pipeline["New Lead"] || []),
      ...(pipeline["Follow Up"] || []),
      ...(pipeline["Hot Prospect"] || []),
      ...(pipeline["Deposit Paid"] || []),
    ];
  } else if (type === "released") {
    title = "Released This Month";
    const now = new Date();
    leads = (pipeline["Released"] || []).filter(l => {
      if (!l.releaseDate) return false;
      const releaseDate = new Date(l.releaseDate);
      const year = releaseDate.getFullYear();
      const month = releaseDate.getMonth();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      return month === currentMonth && year === currentYear;
    });
  } else if (type === "commission") {
    title = "Commission Pending";
    leads = (pipeline["Released"] || []).filter(l => l.commissionStatus !== "Paid");
  } else if (type === "lost") {
    title = "Lost / Cancelled";
    leads = [...(pipeline["Lost"] || []), ...(pipeline["Cancelled"] || [])];
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
          >
            <ChevronRight size={18} color="var(--text-muted)" style={{ transform: "rotate(180deg)" }} />
          </button>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", margin: 0 }}>{title}</h2>
          <span style={{ fontSize: "12px", fontWeight: 600, padding: "2px 8px", backgroundColor: "rgba(16,185,129,0.1)", borderRadius: "20px", color: "var(--brand)" }}>{leads.length}</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {leads.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)" }}>
            <p style={{ fontSize: "14px", margin: 0 }}>No leads found</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {leads.map(lead => (
              <div
                key={lead.id}
                onClick={() => onLeadClick(lead)}
                style={{
                  padding: "12px 14px",
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)";
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(16,185,129,0.05)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-card)";
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", margin: 0 }}>{lead.customer.name}</p>
                    <StageBadge stage={lead.stage} />
                  </div>
                  <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--text-muted)" }}>
                    <span>{lead.carType}</span>
                    <span>{lead.registrationNumber}</span>
                    {lead.commissionAmount && <span>{fmtKES(lead.commissionAmount)}</span>}
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stage Column ─────────────────────────────────────────────────────────────

function StageColumn({ stage, leads, onLeadClick }: { stage: string; leads: Lead[]; onLeadClick: (lead: Lead) => void }) {
  const meta = STAGE_META[stage];
  return (
    <div style={{ width: "240px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Column header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", backgroundColor: meta.dim, border: `1px solid ${meta.color}33`, borderRadius: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: meta.color }}>{meta.icon}</span>
          <span style={{ fontSize: "12px", fontWeight: 700, color: meta.color }}>{stage}</span>
        </div>
        <span style={{ fontSize: "11px", fontWeight: 700, padding: "1px 7px", borderRadius: "20px", backgroundColor: meta.bg, color: meta.color }}>
          {leads.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {leads.length === 0 ? (
          <div style={{ padding: "24px 12px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px", border: "1px dashed var(--border)", borderRadius: "8px" }}>
            No leads
          </div>
        ) : (
          leads.map(lead => (
            <LeadCard key={lead.id} lead={lead} onClick={() => onLeadClick(lead)} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CarSalesPipelinePage() {
  const router = useRouter();
  const [pipeline, setPipeline] = useState<PipelineData>({});
  const [loading, setLoading] = useState(true);
  const [showNewLead, setShowNewLead] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [activeStages, setActiveStages] = useState<string[]>(STAGES.filter(s => !["Lost", "Cancelled"].includes(s)));
  const [showAllStages, setShowAllStages] = useState(false);
  const [viewFilteredDetails, setViewFilteredDetails] = useState<string | null>(null);

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await fetch("/api/car-sales/pipeline");
      if (res.ok) {
        const data = await res.json();
        setPipeline(data);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPipeline(); }, [fetchPipeline]);

  // Filter leads by search
  const filteredPipeline: PipelineData = {};
  const displayStages = showAllStages ? STAGES : STAGES.filter(s => !["Lost", "Cancelled"].includes(s));

  for (const stage of displayStages) {
    let leads = pipeline[stage] || [];
    
    // Filter: Released cars show for max 3 days, then hidden from main view
    if (stage === "Released") {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      leads = leads.filter(l => {
        if (!l.releaseDate) return true; // If no date, show it
        const releaseDate = new Date(l.releaseDate);
        return releaseDate >= threeDaysAgo;
      });
    }
    
    if (search) {
      const q = search.toLowerCase();
      leads = leads.filter(l =>
        l.customer.name.toLowerCase().includes(q) ||
        l.customer.phone.includes(q) ||
        l.registrationNumber.toLowerCase().includes(q) ||
        l.carType.toLowerCase().includes(q)
      );
    }
    filteredPipeline[stage] = leads;
  }

  const totalLeads = Object.values(filteredPipeline).reduce((s, a) => s + a.length, 0);
  const allLeads = Object.values(pipeline).flat();
  const activeLeadsCount = (pipeline["New Lead"] || []).length + (pipeline["Follow Up"] || []).length + (pipeline["Hot Prospect"] || []).length + (pipeline["Deposit Paid"] || []).length;
  
  const releasedThisMonth = (pipeline["Released"] || []).filter(l => {
    if (!l.releaseDate) return false;
    const releaseDate = new Date(l.releaseDate);
    const now = new Date();
    // Parse the date properly to avoid timezone issues
    const year = releaseDate.getFullYear();
    const month = releaseDate.getMonth();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    return month === currentMonth && year === currentYear;
  }).length;
  
  const pendingCommission = (pipeline["Released"] || []).filter(l => l.commissionStatus !== "Paid");
  const pendingCommissionTotal = pendingCommission.reduce((s, l) => s + parseFloat(String(l.commissionAmount || 0)), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
            {loading ? "Loading..." : `${totalLeads} lead${totalLeads !== 1 ? "s" : ""} visible · ${allLeads.length} total`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={fetchPipeline} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-primary)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}>
            <RefreshCw size={12} /> Refresh
          </button>
          <button onClick={() => setShowNewLead(true)}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", backgroundColor: "var(--brand)", color: "#000", borderRadius: "8px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}>
            <Plus size={15} strokeWidth={2.5} /> New Lead
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "10px", flexShrink: 0 }}>
        {[
          { id: "active", label: "Active Pipeline", value: activeLeadsCount, color: "var(--brand)", icon: <TrendingUp size={14} color="var(--brand)" /> },
          { id: "released", label: "Released This Month", value: releasedThisMonth, color: "#a78bfa", icon: <Check size={14} color="#a78bfa" /> },
          { id: "commission", label: "Commission Pending", value: fmtKES(pendingCommissionTotal), color: "#fbbf24", icon: <DollarSign size={14} color="#fbbf24" /> },
          { id: "lost", label: "Lost / Cancelled", value: ((pipeline["Lost"] || []).length + (pipeline["Cancelled"] || []).length), color: "#9ca3af", icon: <X size={14} color="#9ca3af" /> },
          { id: "customers", label: "Customers", value: "Manage", color: "#06b6d4", icon: <Users size={14} color="#06b6d4" /> },
          { id: "calendar", label: "Reminders & Calendar", value: "View", color: "#ec4899", icon: <Calendar size={14} color="#ec4899" /> },
        ].map(kpi => (
          <button
            key={kpi.id}
            onClick={() => {
              if (kpi.id === "customers") {
                router.push("/car-sales/customers");
              } else if (kpi.id === "calendar") {
                router.push("/car-sales/calendar");
              } else {
                setViewFilteredDetails(kpi.id);
              }
            }}
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "14px 16px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = kpi.id === "calendar" ? "#ec4899" : (kpi.id === "customers" ? "#06b6d4" : (kpi.id === "active" ? "var(--brand)" : kpi.id === "released" ? "#a78bfa" : kpi.id === "commission" ? "#fbbf24" : "#9ca3af"));
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              {kpi.icon}
              <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", margin: 0 }}>{kpi.label}</p>
            </div>
            <p style={{ fontSize: "20px", fontWeight: 800, color: kpi.color, margin: 0 }}>{kpi.value}</p>
          </button>
        ))}
      </div>

      {/* Search + toggle */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexShrink: 0 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
          <Search size={14} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input
            placeholder="Search by name, phone, car, reg..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inStyle, paddingLeft: "34px" }}
            onFocus={focusBrand} onBlur={blurBorder}
          />
        </div>
        <button onClick={() => setShowAllStages(!showAllStages)}
          style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", backgroundColor: showAllStages ? "var(--brand-dim)" : "var(--bg-card)", border: `1px solid ${showAllStages ? "var(--brand)" : "var(--border)"}`, borderRadius: "8px", color: showAllStages ? "var(--brand)" : "var(--text-muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
          {showAllStages ? <><X size={11} /> Hide Lost/Cancelled</> : <><MoreHorizontal size={11} /> Show Lost/Cancelled</>}
        </button>
      </div>

      {/* Pipeline Kanban or Filtered Details */}
      {viewFilteredDetails ? (
        <FilteredDetailsView
          type={viewFilteredDetails}
          pipeline={pipeline}
          onClose={() => setViewFilteredDetails(null)}
          onLeadClick={setSelectedLead}
        />
      ) : loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
          <Loader2 size={20} style={{ animation: "spin 1s linear infinite", marginRight: "8px" }} /> Loading pipeline...
        </div>
      ) : (
        <div style={{ overflowX: "auto", paddingBottom: "16px" }}>
          <div style={{ display: "flex", gap: "12px", minWidth: "fit-content", alignItems: "flex-start" }}>
            {displayStages.map(stage => (
              <StageColumn
                key={stage}
                stage={stage}
                leads={filteredPipeline[stage] || []}
                onLeadClick={setSelectedLead}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showNewLead && (
        <NewLeadModal
          onClose={() => setShowNewLead(false)}
          onSuccess={() => { setShowNewLead(false); fetchPipeline(); }}
        />
      )}

      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={() => { fetchPipeline(); setSelectedLead(null); }}
        />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}