// src/app/(dashboard)/customers/[id]/page.tsx
// Enhanced customer profile: shows linked policies, vehicles, documents, and renewal option

"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Phone, Mail, MapPin,
  Building2, User, FileText, Calendar, CheckCircle2,
  Car, Shield, RefreshCw, X, AlertTriangle, Upload,
  ExternalLink, Clock, ChevronRight, Plus, Eye, Loader2,
} from "lucide-react";
import PDFPreviewModal from "@/components/PDFPreviewModal";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  phone: string;
  email?: string | null;
  idNumber?: string | null;
  kraPin?: string | null;
  idNumberValue?: string | null;
  kraPinValue?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  county?: string | null;
  physicalAddress?: string | null;
  customerType: "Individual" | "Company";
  companyName?: string | null;
  town?: string | null;
  postalAddress?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  certOfIncorporationValue?: string | null;
  cr12Value?: string | null;
  companyKraPinValue?: string | null;
  directors?: any;
  createdAt: string;
}

interface PolicyRow {
  policy: {
    id: string;
    insuranceType: string;
    coverType?: string | null;
    policyNumber?: string | null;
    startDate: string;
    endDate: string;
    grandTotal?: string | null;
    status: string;
    basicRate?: string | null;
    sumInsured?: string | null;
    paymentMode?: string | null;
  };
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    regNo: string;
    chassisNo: string;
    engineNo: string;
    bodyType?: string | null;
    colour?: string | null;
    seats?: number | null;
  } | null;
  insurer: { id: string; name: string } | null;
  paymentSummary: {
    totalDue: number;
    totalPaid: number;
    outstanding: number;
    allPaid: boolean;
    installmentCount: number;
  };
}

interface CustomerDocument {
  id: string;
  docType: string;
  docLabel?: string | null;
  docValue?: string | null;
  fileUrl?: string | null;
  status: string;
  uploadedAt?: string | null;
}

// ── Renewal Modal ──────────────────────────────────────────────

interface RenewModalProps {
  policy: PolicyRow["policy"];
  vehicle: PolicyRow["vehicle"] | null;
  insurer: PolicyRow["insurer"] | null;
  onClose: () => void;
  onSuccess: (newId: string) => void;
}

function RenewModal({ policy, vehicle, insurer, onClose, onSuccess }: RenewModalProps) {
  const newStart = (() => {
    const d = new Date(policy.endDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();
  const newEnd = (() => {
    const d = new Date(newStart);
    d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  })();

  const [form, setForm] = useState({
    startDate: newStart,
    endDate: newEnd,
    sumInsured: policy.sumInsured || "",
    basicRate: policy.basicRate || "",
    policyNumber: "",
    paymentMode: (policy.paymentMode as any) || "Full Payment",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const basicPremium = form.sumInsured && form.basicRate
    ? ((parseFloat(form.sumInsured) * parseFloat(form.basicRate)) / 100).toFixed(2)
    : "0.00";
  const iraLevy = (parseFloat(basicPremium) * 0.0045).toFixed(2);
  const grandTotal = (parseFloat(basicPremium) + parseFloat(iraLevy) + 40 + 100).toFixed(2);

  const inStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px",
    backgroundColor: "var(--bg-app)", border: "1px solid var(--border)",
    borderRadius: "6px", color: "#ffffff", fontSize: "13px", outline: "none",
  };
  function foc(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    (e.target as HTMLElement).style.borderColor = "var(--brand)";
  }
  function blr(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    (e.target as HTMLElement).style.borderColor = "var(--border)";
  }

  async function handleRenew() {
    if (!form.startDate || !form.endDate) {
      setError("Start and end dates are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/policies/${policy.id}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          basicPremium,
          iraLevy,
          trainingLevy: "0",
          stampDuty: "40",
          phcf: "100",
          grandTotal,
          totalBenefits: "0",
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to renew"); return; }
      onSuccess(data.policy.id);
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "var(--brand-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RefreshCw size={16} color="var(--brand)" />
            </div>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", margin: 0 }}>Renew Policy</h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                {vehicle ? `${vehicle.make} ${vehicle.model} · ${vehicle.regNo}` : policy.insuranceType}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
            <X size={16} />
          </button>
        </div>

        {error && (
          <div style={{ padding: "10px 12px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#fca5a5", fontSize: "12px", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        {/* Previous period info */}
        <div style={{ padding: "10px 12px", backgroundColor: "var(--bg-app)", borderRadius: "8px", border: "1px solid var(--border)", marginBottom: "16px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
            Previous Period
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
            {new Date(policy.startDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })} →{" "}
            {new Date(policy.endDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
            {insurer && <span style={{ color: "var(--text-muted)" }}> · {insurer.name}</span>}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Dates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>
                New Start Date *
              </label>
              <input type="date" value={form.startDate} onChange={(e) => setForm(p => ({ ...p, startDate: e.target.value }))} style={inStyle} onFocus={foc} onBlur={blr} />
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>
                New End Date *
              </label>
              <input type="date" value={form.endDate} onChange={(e) => setForm(p => ({ ...p, endDate: e.target.value }))} style={inStyle} onFocus={foc} onBlur={blr} />
            </div>
          </div>

          {/* Sum insured + rate */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>
                Sum Insured (KES)
              </label>
              <input type="number" value={form.sumInsured} onChange={(e) => setForm(p => ({ ...p, sumInsured: e.target.value }))} placeholder="e.g. 1500000" style={inStyle} onFocus={foc} onBlur={blr} />
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>
                Rate (%)
              </label>
              <input type="number" step="0.01" value={form.basicRate} onChange={(e) => setForm(p => ({ ...p, basicRate: e.target.value }))} placeholder="e.g. 4.00" style={inStyle} onFocus={foc} onBlur={blr} />
            </div>
          </div>

          {/* Premium preview */}
          {parseFloat(basicPremium) > 0 && (
            <div style={{ padding: "10px 12px", backgroundColor: "var(--brand-dim)", borderRadius: "8px", border: "1px solid var(--brand)" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--brand)", textTransform: "uppercase", marginBottom: "6px" }}>Estimated Premium</p>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Basic Premium</span>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>KES {parseFloat(basicPremium).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>IRA Levy + Stamp + PHCF</span>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>KES {(parseFloat(iraLevy) + 140).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(16,185,129,0.3)", paddingTop: "4px", marginTop: "4px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--brand)" }}>Grand Total</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--brand)" }}>KES {parseFloat(grandTotal).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          {/* Payment mode + policy number */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>
                Payment Mode
              </label>
              <select value={form.paymentMode} onChange={(e) => setForm(p => ({ ...p, paymentMode: e.target.value }))} style={inStyle} onFocus={foc} onBlur={blr}>
                {["Full Payment", "2 Installments", "3 Installments", "IPF"].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>
                New Policy Number
              </label>
              <input value={form.policyNumber} onChange={(e) => setForm(p => ({ ...p, policyNumber: e.target.value }))} placeholder="Add later if pending" style={inStyle} onFocus={foc} onBlur={blr} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>
              Notes (optional)
            </label>
            <input value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any renewal notes..." style={inStyle} onFocus={foc} onBlur={blr} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={handleRenew}
            disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 18px", borderRadius: "8px", border: "none", backgroundColor: saving ? "var(--brand-dim)" : "var(--brand)", color: "#000", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}
          >
            <RefreshCw size={13} />
            {saving ? "Renewing..." : "Create Renewal"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Document Upload Widget ─────────────────────────────────────

function DocUploadWidget({ customerId, docType, label, currentUrl, currentValue, onUploaded }: {
  customerId: string;
  docType: string;
  label: string;
  currentUrl?: string | null;
  currentValue?: string | null;
  onUploaded: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("docType", docType);
      fd.append("file", file);
      const res = await fetch(`/api/customers/${customerId}/documents`, { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      onUploaded();
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handlePreview() {
    if (!currentUrl) return;
    setPreviewLoading(true);
    try {
      const response = await fetch(currentUrl, { mode: "cors" });
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setPreviewUrl(blobUrl);
        setShowPreview(true);
      } else {
        setPreviewUrl(currentUrl);
        setShowPreview(true);
      }
    } catch {
      setPreviewUrl(currentUrl);
      setShowPreview(true);
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div style={{ padding: "10px 12px", backgroundColor: "var(--bg-app)", borderRadius: "8px", border: `1px solid ${currentUrl ? "rgba(16,185,129,0.3)" : "var(--border)"}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: currentValue ? "4px" : "0" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", margin: 0 }}>{label}</p>
        <div style={{ display: "flex", gap: "6px" }}>
          {currentUrl && (
            <button
              onClick={handlePreview}
              disabled={previewLoading}
              style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", color: "var(--brand)", background: "none", border: "none", cursor: previewLoading ? "wait" : "pointer", fontWeight: 600 }}
            >
              {previewLoading ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Eye size={11} />} Preview
            </button>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
          >
            <Upload size={11} /> {uploading ? "..." : currentUrl ? "Replace" : "Upload"}
          </button>
        </div>
      </div>

      <PDFPreviewModal
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          if (previewUrl && previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(previewUrl);
          }
          setPreviewUrl(null);
        }}
        pdfUrl={previewUrl}
        fileName={label}
        onDownload={() => {
          if (currentUrl) {
            const a = document.createElement("a");
            a.href = currentUrl;
            a.download = label;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        }}
        isLoading={false}
      />
      {currentValue && (
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <CheckCircle2 size={12} color="var(--brand)" />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff" }}>{currentValue}</span>
        </div>
      )}
      {!currentValue && !currentUrl && (
        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>Not provided</span>
      )}
      {error && <p style={{ fontSize: "11px", color: "#f87171", marginTop: "3px" }}>{error}</p>}
      <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────

function formatKES(val?: string | number | null) {
  if (!val) return "—";
  const n = typeof val === "string" ? parseFloat(val) : val;
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

function daysUntilExpiry(endDate: string) {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "20px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
  letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "3px",
};

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p style={labelStyle}>{label}</p>
      <p style={{ fontSize: "14px", fontWeight: 500, color: value ? "#ffffff" : "var(--text-muted)" }}>
        {value || "—"}
      </p>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export default function CustomerProfilePage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerPolicies, setCustomerPolicies] = useState<PolicyRow[]>([]);
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [renewTarget, setRenewTarget] = useState<PolicyRow | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  async function fetchAll() {
    try {
      const [custRes, policiesRes, docsRes] = await Promise.all([
        fetch(`/api/customers/${id}`),
        fetch(`/api/customers/${id}/policies`),
        fetch(`/api/customers/${id}/documents`),
      ]);
      if (!custRes.ok) throw new Error("Not found");
      const [custData, policiesData, docsData] = await Promise.all([
        custRes.json(),
        policiesRes.ok ? policiesRes.json() : { policies: [] },
        docsRes.ok ? docsRes.json() : { documents: [] },
      ]);
      setCustomer(custData.customer);
      setCustomerPolicies(policiesData.policies || []);
      setDocuments(docsData.documents || []);
    } catch {
      setError("Could not load customer.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (id) fetchAll(); }, [id]);

  if (loading) return <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>Loading customer...</div>;
  if (error || !customer) return (
    <div style={{ padding: "48px", textAlign: "center" }}>
      <p style={{ color: "#fca5a5", marginBottom: "12px" }}>{error || "Customer not found."}</p>
      <Link href="/customers" style={{ color: "var(--brand)", fontSize: "13px" }}>← Back to Customers</Link>
    </div>
  );

  const displayName = customer.customerType === "Company"
    ? customer.companyName
    : `${customer.firstName}${customer.middleName ? " " + customer.middleName : ""} ${customer.lastName}`;

  const initials = customer.customerType === "Company"
    ? (customer.companyName?.slice(0, 2) || "CO").toUpperCase()
    : `${customer.firstName[0]}${customer.lastName[0]}`.toUpperCase();

  const idDisplay = customer.idNumberValue || customer.idNumber;
  const kraPinDisplay = customer.kraPinValue || customer.kraPin;
  const directors = customer.directors && Array.isArray(customer.directors) ? customer.directors : [];

  const activeCount = customerPolicies.filter(r => r.policy.status === "Active").length;
  const expiredCount = customerPolicies.filter(r => r.policy.status === "Expired").length;

  const getDoc = (type: string) => documents.find(d => d.docType === type);

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Back */}
      <Link href="/customers" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "13px", textDecoration: "none" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}
      >
        <ArrowLeft size={14} /> Back to Customers
      </Link>

      {successMsg && (
        <div style={{ padding: "12px 16px", backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", color: "var(--brand)", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--brand)" }}><X size={14} /></button>
        </div>
      )}

      {/* Profile header */}
      <div style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "var(--brand-dim)", border: "2px solid var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 700, color: "var(--brand)", flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", margin: 0 }}>{displayName}</h2>
              <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: customer.customerType === "Company" ? "rgba(139,92,246,0.15)" : "rgba(16,185,129,0.15)", color: customer.customerType === "Company" ? "#a78bfa" : "var(--brand)" }}>
                {customer.customerType}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              {customer.phone && <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "var(--text-secondary)" }}><Phone size={12} /> {customer.phone}</span>}
              {customer.email && <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "var(--text-secondary)" }}><Mail size={12} /> {customer.email}</span>}
              {customer.county && <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "var(--text-secondary)" }}><MapPin size={12} /> {customer.county}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link href={`/policies/new?customerId=${customer.id}`} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", backgroundColor: "var(--brand)", color: "#000", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
            <Plus size={14} /> New Policy
          </Link>
          <Link href={`/customers/${customer.id}/edit`} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", backgroundColor: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: "8px", color: "#ffffff", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
            <Pencil size={13} /> Edit
          </Link>
        </div>
      </div>

      {/* ── POLICIES & VEHICLES ─────────────────────────────── */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Shield size={15} color="var(--brand)" />
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
              Policies & Vehicles
            </p>
            <div style={{ display: "flex", gap: "6px" }}>
              {activeCount > 0 && (
                <span style={{ padding: "1px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: "rgba(16,185,129,0.15)", color: "var(--brand)" }}>
                  {activeCount} active
                </span>
              )}
              {expiredCount > 0 && (
                <span style={{ padding: "1px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: "rgba(107,114,128,0.15)", color: "#9ca3af" }}>
                  {expiredCount} expired
                </span>
              )}
            </div>
          </div>
          <Link href={`/policies/new?customerId=${customer.id}`} style={{ fontSize: "12px", color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>
            + New Policy
          </Link>
        </div>

        {customerPolicies.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "12px" }}>No policies yet.</p>
            <Link href={`/policies/new?customerId=${customer.id}`} style={{ color: "var(--brand)", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
              Create first policy →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {customerPolicies.map((row) => {
              const days = daysUntilExpiry(row.policy.endDate);
              const isExpired = row.policy.status === "Expired" || days < 0;
              const isExpiringSoon = !isExpired && days <= 30;
              const expiryColor = isExpired ? "#f87171" : isExpiringSoon ? "#fbbf24" : "var(--text-muted)";

              return (
                <div
                  key={row.policy.id}
                  style={{
                    padding: "14px 16px",
                    backgroundColor: "var(--bg-app)",
                    borderRadius: "10px",
                    border: `1px solid ${isExpired ? "rgba(239,68,68,0.15)" : isExpiringSoon ? "rgba(245,158,11,0.15)" : "var(--border)"}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                    {/* Left: vehicle + policy info */}
                    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <div style={{ width: "38px", height: "38px", borderRadius: "8px", backgroundColor: "var(--brand-dim)", border: "1px solid var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {row.vehicle ? <Car size={16} color="var(--brand)" /> : <Shield size={16} color="var(--brand)" />}
                      </div>
                      <div>
                        {row.vehicle ? (
                          <p style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", margin: "0 0 2px" }}>
                            {row.vehicle.make} {row.vehicle.model}
                            <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--text-muted)", marginLeft: "8px" }}>
                              {row.vehicle.regNo} · {row.vehicle.year}
                            </span>
                          </p>
                        ) : (
                          <p style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", margin: "0 0 2px" }}>
                            {row.policy.insuranceType}
                          </p>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                            {row.insurer?.name || "—"}
                          </span>
                          {row.policy.coverType && (
                            <span style={{ padding: "1px 7px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: row.policy.coverType === "Comprehensive" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: row.policy.coverType === "Comprehensive" ? "var(--brand)" : "#fbbf24" }}>
                              {row.policy.coverType}
                            </span>
                          )}
                          <span style={{ padding: "1px 7px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: isExpired ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)", color: isExpired ? "#f87171" : "var(--brand)" }}>
                            {row.policy.status}
                          </span>
                          {row.policy.policyNumber && (
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{row.policy.policyNumber}</span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "16px", marginTop: "6px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "12px", color: expiryColor }}>
                            <Calendar size={10} style={{ display: "inline", marginRight: "3px" }} />
                            {new Date(row.policy.startDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })} →{" "}
                            {new Date(row.policy.endDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                            <span style={{ marginLeft: "5px" }}>({isExpired ? "Expired" : `${days}d left`})</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: premium + actions */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--brand)", margin: "0 0 2px" }}>
                        {formatKES(row.policy.grandTotal)}
                      </p>
                      {row.paymentSummary.outstanding > 0 && (
                        <p style={{ fontSize: "11px", color: "#fbbf24", margin: "0 0 8px" }}>
                          {formatKES(row.paymentSummary.outstanding.toFixed(2))} outstanding
                        </p>
                      )}
                      {row.paymentSummary.allPaid && (
                        <p style={{ fontSize: "11px", color: "var(--brand)", margin: "0 0 8px", display: "flex", alignItems: "center", gap: "3px", justifyContent: "flex-end" }}>
                          <CheckCircle2 size={11} /> Fully paid
                        </p>
                      )}
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        {/* Renew button — show for expired or expiring soon */}
                        {(isExpired || isExpiringSoon) && (
                          <button
                            onClick={() => setRenewTarget(row)}
                            style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "6px", border: "1px solid var(--brand)", backgroundColor: "var(--brand-dim)", color: "var(--brand)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                          >
                            <RefreshCw size={11} /> Renew
                          </button>
                        )}
                        <Link
                          href={`/policies/${row.policy.id}`}
                          style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "6px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}
                        >
                          <Eye size={11} /> View
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle details strip */}
                  {row.vehicle && (
                    <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--border)", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
                      {[
                        { label: "Chassis No.", value: row.vehicle.chassisNo },
                        { label: "Engine No.", value: row.vehicle.engineNo },
                        { label: "Body Type", value: row.vehicle.bodyType },
                        { label: "Colour", value: row.vehicle.colour },
                        { label: "Seats", value: row.vehicle.seats ? String(row.vehicle.seats) : null },
                      ].map(({ label, value }) => value ? (
                        <div key={label}>
                          <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "1px" }}>{label}</p>
                          <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>{value}</p>
                        </div>
                      ) : null)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── PERSONAL / COMPANY DETAILS ─────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {customer.customerType === "Company" ? (
          <div style={cardStyle}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>Company Details</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <Field label="Company Name" value={customer.companyName} />
              <Field label="Town" value={customer.town} />
              <Field label="Postal Address" value={customer.postalAddress} />
              <Field label="Company Email" value={customer.companyEmail} />
              <Field label="Company Phone" value={customer.companyPhone} />
            </div>
          </div>
        ) : (
          <div style={cardStyle}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>Personal Details</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <Field label="First Name" value={customer.firstName} />
              <Field label="Last Name" value={customer.lastName} />
              {customer.middleName && <Field label="Middle Name" value={customer.middleName} />}
              <Field label="Gender" value={customer.gender} />
              {customer.dateOfBirth && (
                <Field label="Date of Birth" value={new Date(customer.dateOfBirth).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })} />
              )}
              <Field label="County" value={customer.county} />
              {customer.physicalAddress && (
                <div style={{ gridColumn: "span 2" }}>
                  <Field label="Physical Address" value={customer.physicalAddress} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents */}
        <div style={cardStyle}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
            Identity & Documents
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {customer.customerType === "Individual" ? (
              <>
                <DocUploadWidget
                  customerId={customer.id}
                  docType="ID"
                  label="National ID"
                  currentUrl={getDoc("ID")?.fileUrl}
                  currentValue={idDisplay}
                  onUploaded={fetchAll}
                />
                <DocUploadWidget
                  customerId={customer.id}
                  docType="KRA"
                  label="KRA PIN"
                  currentUrl={getDoc("KRA")?.fileUrl}
                  currentValue={kraPinDisplay}
                  onUploaded={fetchAll}
                />
                <DocUploadWidget
                  customerId={customer.id}
                  docType="PASSPORT"
                  label="Passport"
                  currentUrl={getDoc("PASSPORT")?.fileUrl}
                  currentValue={null}
                  onUploaded={fetchAll}
                />
              </>
            ) : (
              <>
                <DocUploadWidget
                  customerId={customer.id}
                  docType="OTHER"
                  label="Certificate of Incorporation"
                  currentUrl={getDoc("OTHER")?.fileUrl}
                  currentValue={customer.certOfIncorporationValue}
                  onUploaded={fetchAll}
                />
                <div style={{ padding: "10px 12px", backgroundColor: "var(--bg-app)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "4px" }}>CR12</p>
                  {customer.cr12Value
                    ? <div style={{ display: "flex", alignItems: "center", gap: "5px" }}><CheckCircle2 size={12} color="var(--brand)" /><span style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff" }}>{customer.cr12Value}</span></div>
                    : <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>Not provided</span>}
                </div>
                <div style={{ padding: "10px 12px", backgroundColor: "var(--bg-app)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "4px" }}>Company KRA PIN</p>
                  {customer.companyKraPinValue
                    ? <div style={{ display: "flex", alignItems: "center", gap: "5px" }}><CheckCircle2 size={12} color="var(--brand)" /><span style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff" }}>{customer.companyKraPinValue}</span></div>
                    : <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>Not provided</span>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Directors */}
      {customer.customerType === "Company" && directors.length > 0 && (
        <div style={cardStyle}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
            Directors / Signatories
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {directors.map((d: any, i: number) => (
              <div key={i} style={{ padding: "12px", backgroundColor: "var(--bg-app)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", margin: "0 0 8px" }}>{d.name || `Director ${i + 1}`}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "2px" }}>ID No.</p>
                    <p style={{ fontSize: "12px", color: d.idNumberValue ? "#ffffff" : "var(--text-muted)" }}>{d.idNumberValue || "—"}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "2px" }}>KRA PIN</p>
                    <p style={{ fontSize: "12px", color: d.kraPinValue ? "#ffffff" : "var(--text-muted)" }}>{d.kraPinValue || "—"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Renewal modal */}
      {renewTarget && (
        <RenewModal
          policy={renewTarget.policy}
          vehicle={renewTarget.vehicle}
          insurer={renewTarget.insurer}
          onClose={() => setRenewTarget(null)}
          onSuccess={(newId) => {
            setRenewTarget(null);
            setSuccessMsg(`Policy renewed successfully! `);
            fetchAll();
          }}
        />
      )}
    </div>
  );
}