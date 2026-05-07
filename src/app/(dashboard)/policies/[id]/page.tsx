// src/app/(dashboard)/policies/[id]/page.tsx
// Updated: added Documents section with upload/view/replace for Valuation, Proposal, Logbook, Quotation

"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Car, CreditCard, FileText, Calendar, User, Building2,
  CheckCircle2, Clock, RefreshCw, X, Upload, Eye, Loader2, AlertCircle,
} from "lucide-react";
import RiskNoteButton from "@/components/RiskNoteButton";

interface Policy {
  id: string;
  insuranceType: string;
  coverType?: string | null;
  policyNumber?: string | null;
  startDate: string;
  endDate: string;
  sumInsured?: string | null;
  basicRate?: string | null;
  basicPremium?: string | null;
  iraLevy?: string | null;
  trainingLevy?: string | null;
  stampDuty?: string | null;
  phcf?: string | null;
  totalBenefits?: string | null;
  grandTotal?: string | null;
  paymentMode?: string | null;
  ipfProvider?: string | null;
  certificateExpiryDate?: string | null;
  certificateExpiryReason?: string | null;
  notes?: string | null;
  status: string;
  insurerId?: string | null;
  insurerNameManual?: string | null;
  // NEW renewal fields
  renewedByPolicyId?: string | null;
  renewsPolicyId?: string | null;
}

interface Vehicle {
  make: string; model: string; year: number; regNo: string;
  chassisNo: string; engineNo: string; bodyType?: string | null;
  colour?: string | null; cc?: number | null; tonnage?: string | null; seats?: number | null;
}

interface Customer {
  id: string; firstName: string; lastName: string;
  companyName?: string | null; customerType: string; phone: string;
}

interface Benefit {
  id: string; benefitName: string; amountKes: string;
}

interface Payment {
  id: string; installmentNumber: number; totalInstallments: number;
  amountDue: string; amountPaid?: string | null; dueDate: string;
  paidDate?: string | null; paymentMethod?: string | null; status: string;
}

interface PolicyDocument {
  id: string;
  docType: string;
  docLabel?: string | null;
  status: string;
  fileUrl?: string | null;
  receivedDate?: string | null;
}

// ── Document config ──────────────────────────────────────────
const POLICY_DOC_CONFIG: Record<string, { label: string; description: string; icon: string }> = {
  VALUATION: {
    label: "Valuation Report",
    description: "Vehicle valuation from certified assessor",
    icon: "📋",
  },
  PROPOSAL: {
    label: "Proposal Form",
    description: "Signed insurance proposal / application form",
    icon: "📝",
  },
  LOGBOOK: {
    label: "Logbook",
    description: "Original or certified copy of vehicle logbook",
    icon: "📖",
  },
  OTHER: {
    label: "Quotation",
    description: "Insurance quotation document",
    icon: "💰",
  },
};

function formatKES(val?: string | null) {
  if (!val) return "—";
  return `KES ${parseFloat(val).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "3px" }}>{label}</p>
      <p style={{ fontSize: "13px", color: value ? "var(--text-primary)" : "var(--text-muted)", margin: 0 }}>{value || "—"}</p>
    </div>
  );
}

// ── Document Upload Card Component ───────────────────────────
function DocCard({
  policyId,
  docType,
  existingDoc,
  onUpdated,
}: {
  policyId: string;
  docType: string;
  existingDoc?: PolicyDocument;
  onUpdated: () => void;
}) {
  const config = POLICY_DOC_CONFIG[docType];
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const hasFile = !!(existingDoc?.fileUrl);

  async function handleUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("docType", docType);
      fd.append("docLabel", config.label);
      fd.append("status", "Received");
      fd.append("file", file);
      const res = await fetch(`/api/policies/${policyId}/documents`, { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      onUpdated();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{
      padding: "14px 16px",
      borderRadius: "10px",
      border: `1px solid ${hasFile ? "rgba(16,185,129,0.35)" : "var(--border)"}`,
      backgroundColor: hasFile ? "rgba(16,185,129,0.04)" : "var(--bg-app)",
      transition: "all 0.15s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Icon */}
        <div style={{
          width: "40px", height: "40px", borderRadius: "8px", flexShrink: 0,
          backgroundColor: hasFile ? "rgba(16,185,129,0.12)" : "var(--bg-card)",
          border: `1px solid ${hasFile ? "var(--brand)" : "var(--border)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px",
        }}>
          {config.icon}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: hasFile ? "#ffffff" : "var(--text-secondary)", margin: 0 }}>
              {config.label}
            </p>
            {hasFile && (
              <span style={{ padding: "1px 7px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, backgroundColor: "rgba(16,185,129,0.15)", color: "var(--brand)" }}>
                Uploaded
              </span>
            )}
          </div>
          <p style={{ fontSize: "11px", color: hasFile ? "var(--brand)" : "var(--text-muted)", margin: 0 }}>
            {hasFile
              ? existingDoc?.receivedDate
                ? `Received ${new Date(existingDoc.receivedDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}`
                : "Document on file"
              : config.description}
          </p>
          {error && <p style={{ fontSize: "11px", color: "#f87171", margin: "3px 0 0" }}>{error}</p>}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          {hasFile && (
            <button
              onClick={() => window.open(existingDoc!.fileUrl!, "_blank", "noopener,noreferrer")}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "6px 10px", borderRadius: "6px", cursor: "pointer",
                border: "1px solid var(--brand)", backgroundColor: "var(--brand-dim)",
                color: "var(--brand)", fontSize: "12px", fontWeight: 600,
              }}
            >
              <Eye size={12} /> View
            </button>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              display: "flex", alignItems: "center", gap: "4px",
              padding: "6px 10px", borderRadius: "6px", cursor: uploading ? "not-allowed" : "pointer",
              border: "1px solid var(--border)", backgroundColor: "transparent",
              color: uploading ? "var(--text-muted)" : "var(--text-secondary)",
              fontSize: "12px", fontWeight: 600,
            }}
            onMouseEnter={(e) => { if (!uploading) { (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)"; (e.currentTarget as HTMLElement).style.color = "var(--brand)"; }}}
            onMouseLeave={(e) => { if (!uploading) { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}}
          >
            {uploading ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={12} />}
            {uploading ? "Uploading..." : hasFile ? "Replace" : "Upload"}
          </button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default function PolicyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [paymentList, setPaymentList] = useState<Payment[]>([]);
  const [insurer, setInsurer] = useState<{ name: string } | null>(null);
  const [policyDocuments, setPolicyDocuments] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState(true);

  
  const [showCertExpiry, setShowCertExpiry] = useState(false);
  const [certExpiryForm, setCertExpiryForm] = useState({ certificateExpiryDate: "", certificateExpiryReason: "" });
  const [certExpirySaving, setCertExpirySaving] = useState(false);
  const [certExpiryError, setCertExpiryError] = useState("");

  async function fetchPolicy() {
    try {
      const res = await fetch(`/api/policies/${id}`);
      const d = await res.json();
      setPolicy(d.policy);
      setVehicle(d.vehicle || null);
      setCustomer(d.customer || null);
      setBenefits(d.benefits || []);
      setPaymentList(d.payments || []);
      setInsurer(d.insurer || null);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDocuments() {
    try {
      const res = await fetch(`/api/policies/${id}/documents`);
      const d = await res.json();
      setPolicyDocuments(d.documents || []);
    } catch {
      // Non-fatal
    }
  }

  useEffect(() => {
    if (id) {
      fetchPolicy();
      fetchDocuments();
    }
  }, [id]);

  
  
  async function handleUpdateCertExpiry() {
    setCertExpiryError("");
    if (!certExpiryForm.certificateExpiryDate) { setCertExpiryError("Expiry date is required"); return; }
    setCertExpirySaving(true);
    try {
      const res = await fetch(`/api/policies/${id}/certificate-expiry`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificateExpiryDate: certExpiryForm.certificateExpiryDate, certificateExpiryReason: certExpiryForm.certificateExpiryReason || null }),
      });
      if (!res.ok) { const d = await res.json(); setCertExpiryError(d.error || "Failed to update"); return; }
      const data = await res.json();
      setPolicy(data.policy);
      setShowCertExpiry(false);
    } catch { setCertExpiryError("Something went wrong"); }
    finally { setCertExpirySaving(false); }
  }

  if (loading) return <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>Loading policy...</div>;
  if (!policy) return <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>Policy not found.</div>;

  const customerName = customer
    ? customer.customerType === "Company" ? customer.companyName : `${customer.firstName} ${customer.lastName}`
    : "Unknown";
  const insurerName = insurer?.name || policy.insurerNameManual || "—";
  const daysLeft = Math.ceil((new Date(policy.endDate).getTime() - Date.now()) / 86400000);
  const expiryColor = daysLeft < 0 ? "#f87171" : daysLeft <= 7 ? "#fbbf24" : daysLeft <= 30 ? "#fb923c" : "var(--brand)";

  // Build doc map for easy lookup
  const docMap: Record<string, PolicyDocument> = {};
  policyDocuments.forEach(d => { docMap[d.docType] = d; });

  const uploadedDocCount = Object.keys(POLICY_DOC_CONFIG).filter(k => docMap[k]?.fileUrl).length;

  const inStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px",
    backgroundColor: "var(--bg-app)", border: "1px solid var(--border)",
    borderRadius: "6px", color: "#ffffff", fontSize: "13px", outline: "none",
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
      <Link href="/policies" style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", fontSize: "13px", color: "var(--text-muted)" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}>
        <ArrowLeft size={14} /> Back to Policies
      </Link>

      {/* Header */}
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "var(--brand-dim)", border: "1px solid var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={22} color="var(--brand)" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                {policy.policyNumber || "Policy — No Number Yet"}
              </h2>
              {policy.renewsPolicyId && (
                <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: "rgba(139,92,246,0.15)", color: "#a78bfa" }}>
                  Renewal
                </span>
              )}
              <span className={`badge ${policy.status === "Active" ? "badge-green" : policy.status === "Expired" ? "badge-red" : "badge-grey"}`}>
                {policy.status}
              </span>
              {policy.coverType && <span className="badge badge-yellow">{policy.coverType}</span>}
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "3px 0 0" }}>
              {policy.insuranceType} · {insurerName}
            </p>
          </div>
        </div>
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
          <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--brand)", margin: 0 }}>{formatKES(policy.grandTotal)}</p>
          <p style={{ fontSize: "12px", color: expiryColor, margin: 0, fontWeight: 600 }}>
            {daysLeft < 0 ? "Expired" : daysLeft === 0 ? "Expires today" : `${daysLeft} days left`}
          </p>
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <RiskNoteButton policyId={policy.id} policyNumber={policy.policyNumber} />
            {!policy.renewedByPolicyId && (
              <Link
                href={`/policies/new?renewFrom=${policy.id}`}
                style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--brand)", backgroundColor: "var(--brand-dim)", color: "var(--brand)", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}
              >
                <RefreshCw size={12} /> Renew
              </Link>
            )}
            {policy.renewedByPolicyId && (
              <span style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(16,185,129,0.3)", backgroundColor: "rgba(16,185,129,0.08)", color: "var(--brand)", fontSize: "12px", fontWeight: 600 }}>
                <CheckCircle2 size={12} /> Renewed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Top grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Policy details */}
        <div className="card">
          <p className="card-title">
            <Calendar size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
            Policy Details
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <Field label="Start Date" value={new Date(policy.startDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })} />
            <Field label="End Date" value={new Date(policy.endDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })} />
            <Field label="Cover Type" value={policy.coverType} />
            <Field label="Payment Mode" value={policy.paymentMode} />
            <Field label="Sum Insured" value={formatKES(policy.sumInsured)} />
            <Field label="Basic Rate" value={policy.basicRate ? `${policy.basicRate}%` : null} />
          </div>
          {policy.notes && (
            <div style={{ marginTop: "14px", padding: "10px", backgroundColor: "var(--bg-app)", borderRadius: "6px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Notes</p>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>{policy.notes}</p>
            </div>
          )}
        </div>

        {/* Certificate Expiry */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
            <p className="card-title" style={{ margin: 0 }}>
              <FileText size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
              Certificate Expiry
            </p>
            <button
              onClick={() => setShowCertExpiry(!showCertExpiry)}
              style={{ padding: "4px 10px", borderRadius: "4px", border: "1px solid var(--border)", backgroundColor: "var(--bg-app)", color: "var(--text-muted)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
            >
              {showCertExpiry ? "Cancel" : "Edit"}
            </button>
          </div>
          {!showCertExpiry ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <Field label="Expiry Date" value={policy.certificateExpiryDate ? new Date(policy.certificateExpiryDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : null} />
              <Field label="Reason" value={policy.certificateExpiryReason} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {certExpiryError && <div style={{ padding: "10px 12px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", color: "#fca5a5", fontSize: "12px" }}>{certExpiryError}</div>}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Expiry Date *</label>
                <input type="date" value={certExpiryForm.certificateExpiryDate}
                  onChange={(e) => setCertExpiryForm(p => ({ ...p, certificateExpiryDate: e.target.value }))}
                  style={inStyle} />
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Reason (optional)</label>
                <input type="text" value={certExpiryForm.certificateExpiryReason}
                  onChange={(e) => setCertExpiryForm(p => ({ ...p, certificateExpiryReason: e.target.value }))}
                  placeholder="e.g. End of policy period"
                  style={inStyle} />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button onClick={() => setShowCertExpiry(false)} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button onClick={handleUpdateCertExpiry} disabled={certExpirySaving}
                  style={{ padding: "6px 12px", borderRadius: "6px", border: "none", backgroundColor: certExpirySaving ? "var(--brand-dim)" : "var(--brand)", color: "#000", fontSize: "12px", fontWeight: 600, cursor: certExpirySaving ? "not-allowed" : "pointer" }}>
                  {certExpirySaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Customer */}
        <div className="card">
          <p className="card-title">
            <User size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
            Customer
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "var(--brand-dim)", border: "1px solid var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {customer?.customerType === "Company" ? <Building2 size={16} color="var(--brand)" /> : <User size={16} color="var(--brand)" />}
            </div>
            <div>
              <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{customerName}</p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>{customer?.phone}</p>
            </div>
          </div>
          {customer && (
            <Link href={`/customers/${customer.id}`} className="btn-secondary" style={{ fontSize: "12px", padding: "6px 12px", display: "inline-flex" }}>
              View Customer Profile
            </Link>
          )}
        </div>
      </div>

      {/* ── DOCUMENTS SECTION ─────────────────────────────────── */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FileText size={15} color="var(--brand)" />
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Policy Documents</p>
            {uploadedDocCount > 0 && (
              <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: "rgba(16,185,129,0.15)", color: "var(--brand)" }}>
                {uploadedDocCount} of {Object.keys(POLICY_DOC_CONFIG).length} uploaded
              </span>
            )}
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>All documents are optional</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {(Object.keys(POLICY_DOC_CONFIG) as string[]).map((docType) => (
            <DocCard
              key={docType}
              policyId={policy.id}
              docType={docType}
              existingDoc={docMap[docType]}
              onUpdated={fetchDocuments}
            />
          ))}
        </div>
      </div>

      {/* Vehicle */}
      {vehicle && (
        <div className="card">
          <p className="card-title">
            <Car size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
            Vehicle Details
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
            <Field label="Make" value={vehicle.make} />
            <Field label="Model" value={vehicle.model} />
            <Field label="Year" value={String(vehicle.year)} />
            <Field label="Registration" value={vehicle.regNo} />
            <Field label="Chassis No." value={vehicle.chassisNo} />
            <Field label="Engine No." value={vehicle.engineNo} />
            <Field label="Body Type" value={vehicle.bodyType} />
            <Field label="Colour" value={vehicle.colour} />
            {vehicle.cc && <Field label="CC" value={String(vehicle.cc)} />}
            {vehicle.tonnage && <Field label="Tonnage" value={String(vehicle.tonnage)} />}
            {vehicle.seats && <Field label="Seats" value={String(vehicle.seats)} />}
          </div>
        </div>
      )}

      {/* Premium breakdown */}
      <div className="card">
        <p className="card-title">
          <CreditCard size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
          Premium Breakdown
        </p>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {[
            { label: "Basic Premium", value: policy.basicPremium },
            ...benefits.map(b => ({ label: b.benefitName, value: b.amountKes })),
            { label: "IRA Levy (0.45%)", value: policy.iraLevy },
            { label: "Training Levy (0.2%)", value: policy.trainingLevy },
            { label: "Stamp Duty", value: policy.stampDuty },
            { label: "PHCF", value: policy.phcf },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{label}</span>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{formatKES(value)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>Grand Total</span>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--brand)" }}>{formatKES(policy.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Payments */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            <Clock size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
            Payment Schedule
          </p>
          <Link href={`/policies/${id}/payment`} className="btn-primary" style={{ padding: "6px 12px", fontSize: "12px" }}>
            Record Payment
          </Link>
        </div>
        {paymentList.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No payment schedule.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {paymentList.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "8px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {p.status === "paid" ? <CheckCircle2 size={16} color="var(--brand)" /> : <Clock size={16} color="var(--text-muted)" />}
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Installment {p.installmentNumber} of {p.totalInstallments}</p>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                      Due: {new Date(p.dueDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{formatKES(p.amountDue)}</p>
                  <span className={`badge ${p.status === "paid" ? "badge-green" : p.status === "partial" ? "badge-yellow" : "badge-grey"}`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}