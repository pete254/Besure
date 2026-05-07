// src/app/(dashboard)/customers/[id]/page.tsx
// Key changes: 3-tab policy section (Active/Pending/Expired), renewal tracking, smart renew button

"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Phone, Mail, MapPin,
  Building2, User, FileText, Calendar, CheckCircle2,
  Car, Shield, RefreshCw, X, AlertTriangle, Upload,
  Eye, Loader2, Clock, ChevronRight, Plus,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────
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
    // NEW renewal fields
    renewedByPolicyId?: string | null;
    renewsPolicyId?: string | null;
    // Medical metadata
    medicalMeta?: Record<string, any> | null;
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

// ── Doc Upload Widget (unchanged) ──────────────────────────────
function DocUploadWidget({ customerId, docType, label, currentUrl, currentValue, documentId, onUploaded }: {
  customerId: string;
  docType: string;
  label: string;
  currentUrl?: string | null;
  currentValue?: string | null;
  documentId?: string | null;
  onUploaded: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div style={{ padding: "10px 12px", backgroundColor: "var(--bg-app)", borderRadius: "8px", border: `1px solid ${currentUrl ? "rgba(16,185,129,0.3)" : "var(--border)"}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: currentValue ? "4px" : "0" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", margin: 0 }}>{label}</p>
        <div style={{ display: "flex", gap: "6px" }}>
          {currentUrl && (
            <button onClick={() => window.open(currentUrl, '_blank', 'noopener,noreferrer')}
              style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", color: "var(--brand)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
              <Eye size={11} /> View
            </button>
          )}
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
            <Upload size={11} /> {uploading ? "..." : currentUrl ? "Replace" : "Upload"}
          </button>
        </div>
      </div>
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

function daysUntilStart(startDate: string) {
  return Math.ceil((new Date(startDate).getTime() - Date.now()) / 86400000);
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "20px",
};

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "3px" }}>{label}</p>
      <p style={{ fontSize: "14px", fontWeight: 500, color: value ? "#ffffff" : "var(--text-muted)" }}>
        {value || "—"}
      </p>
    </div>
  );
}

// ── Policy Card Component ──────────────────────────────────────
function PolicyCard({ row, tab }: { row: PolicyRow; tab: "active" | "pending" | "expired" }) {
  const today = new Date().toISOString().split("T")[0];
  const days = daysUntilExpiry(row.policy.endDate);
  const startDays = daysUntilStart(row.policy.startDate);
  
  const isExpired = row.policy.endDate < today;
  const isPending = row.policy.startDate > today; // starts in future
  const isExpiringSoon = !isExpired && !isPending && days <= 90;
  
  const isRenewed = !!row.policy.renewedByPolicyId; // has been renewed
  const isARenewal = !!row.policy.renewsPolicyId; // this IS a renewal

  // Renew button logic:
  // Show if: (expired AND not renewed) OR (active, expiring ≤90 days, not yet renewed)
  const showRenewButton = !isRenewed && (isExpired || (isExpiringSoon && !isPending));

  const expiryColor = isExpired ? "#f87171" : days <= 7 ? "#fbbf24" : days <= 30 ? "#fb923c" : days <= 90 ? "#fde68a" : "var(--text-muted)";

  return (
    <div style={{
      padding: "14px 16px",
      backgroundColor: "var(--bg-app)",
      borderRadius: "10px",
      border: `1px solid ${
        tab === "pending" ? "rgba(96,165,250,0.3)" :
        isExpired ? "rgba(239,68,68,0.15)" : 
        isExpiringSoon ? "rgba(245,158,11,0.2)" : "var(--border)"
      }`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        {/* Left */}
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
            
            {/* Medical policy summary */}
            {row.policy.insuranceType === "Medical / Health" && (row.policy as any).medicalMeta && (
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                IP Limit: KES {parseFloat((row.policy as any).medicalMeta?.inpatientLimit || "0").toLocaleString("en-KE")}
                {" · "}{((row.policy as any).medicalMeta?.principalCount || 1) + ((row.policy as any).medicalMeta?.dependantCount || 0)} lives
              </p>
            )}
            
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{row.insurer?.name || "—"}</span>
              
              {row.policy.coverType && (
                <span style={{ padding: "1px 7px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: "rgba(245,158,11,0.15)", color: "#fbbf24" }}>
                  {row.policy.coverType}
                </span>
              )}

              {/* Status badge */}
              {tab === "pending" && (
                <span style={{ padding: "1px 7px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: "rgba(96,165,250,0.15)", color: "#60a5fa" }}>
                  Pending ({startDays}d until active)
                </span>
              )}
              {tab === "expired" && isRenewed && (
                <span style={{ padding: "1px 7px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: "rgba(16,185,129,0.15)", color: "var(--brand)" }}>
                  ✓ Renewed
                </span>
              )}
              {tab === "expired" && !isRenewed && (
                <span style={{ padding: "1px 7px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: "rgba(239,68,68,0.15)", color: "#f87171" }}>
                  Not Renewed
                </span>
              )}
              {isARenewal && (
                <span style={{ padding: "1px 7px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: "rgba(139,92,246,0.15)", color: "#a78bfa" }}>
                  Renewal
                </span>
              )}

              {row.policy.policyNumber && (
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{row.policy.policyNumber}</span>
              )}
            </div>

            {/* Date range */}
            <div style={{ marginTop: "6px" }}>
              <span style={{ fontSize: "12px", color: expiryColor }}>
                <Calendar size={10} style={{ display: "inline", marginRight: "3px" }} />
                {new Date(row.policy.startDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                {" → "}
                {new Date(row.policy.endDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                {tab === "active" && (
                  <span style={{ marginLeft: "6px" }}>
                    ({days <= 0 ? "Expired" : `${days}d left`})
                  </span>
                )}
                {tab === "expired" && (
                  <span style={{ marginLeft: "6px", color: "#f87171" }}>
                    (Expired {Math.abs(days)}d ago)
                  </span>
                )}
                {tab === "pending" && (
                  <span style={{ marginLeft: "6px", color: "#60a5fa" }}>
                    (Starts in {startDays}d)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right */}
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
            {showRenewButton && (
              <Link
                href={`/policies/new?renewFrom=${row.policy.id}`}
                style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "6px", border: "1px solid var(--brand)", backgroundColor: "var(--brand-dim)", color: "var(--brand)", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}
              >
                <RefreshCw size={11} /> Renew
              </Link>
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

      {/* Vehicle detail strip */}
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
}

// ── Main Page ──────────────────────────────────────────────────
export default function CustomerProfilePage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerPolicies, setCustomerPolicies] = useState<PolicyRow[]>([]);
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [policyTab, setPolicyTab] = useState<"active" | "pending" | "expired">("active");

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

  // ── Tab classification logic ───────────────────────────────
  const today = new Date().toISOString().split("T")[0];

  const activePolicies = customerPolicies.filter(r => {
    const startDate = r.policy.startDate;
    const endDate = r.policy.endDate;
    // Active = started on or before today AND not yet expired
    return startDate <= today && endDate >= today;
  });

  const pendingPolicies = customerPolicies.filter(r => {
    // Pending = start date is in the future (early renewal, not yet active)
    return r.policy.startDate > today;
  });

  const expiredPolicies = customerPolicies.filter(r => {
    // Expired = end date is in the past
    return r.policy.endDate < today;
  });

  // Sort active: expiring soonest first
  activePolicies.sort((a, b) => a.policy.endDate.localeCompare(b.policy.endDate));
  // Sort expired: most recently expired first
  expiredPolicies.sort((a, b) => b.policy.endDate.localeCompare(a.policy.endDate));
  // Sort pending: starting soonest first
  pendingPolicies.sort((a, b) => a.policy.startDate.localeCompare(b.policy.startDate));

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
  const getDoc = (type: string) => documents.find(d => d.docType === type);

  const TAB_CONFIG = [
    { key: "active" as const, label: "Active", count: activePolicies.length, color: "var(--brand)" },
    { key: "pending" as const, label: "Pending", count: pendingPolicies.length, color: "#60a5fa" },
    { key: "expired" as const, label: "Expired", count: expiredPolicies.length, color: "#9ca3af" },
  ];

  const currentRows = policyTab === "active" ? activePolicies : policyTab === "pending" ? pendingPolicies : expiredPolicies;

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

      {/* ── POLICIES & VEHICLES with 3 tabs ─────────────────── */}
      <div style={cardStyle}>
        {/* Card header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Shield size={15} color="var(--brand)" />
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", margin: 0 }}>Policies & Vehicles</p>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {customerPolicies.length} total
            </span>
          </div>
          <Link href={`/policies/new?customerId=${customer.id}`} style={{ fontSize: "12px", color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>
            + New Policy
          </Link>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0", borderBottom: "1px solid var(--border)", marginBottom: "16px" }}>
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPolicyTab(tab.key)}
              style={{
                padding: "9px 16px",
                backgroundColor: "transparent",
                border: "none",
                borderBottom: policyTab === tab.key ? `2px solid ${tab.color}` : "2px solid transparent",
                color: policyTab === tab.key ? tab.color : "var(--text-muted)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  padding: "1px 6px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: 700,
                  backgroundColor: policyTab === tab.key ? `${tab.color}22` : "var(--bg-app)",
                  color: policyTab === tab.key ? tab.color : "var(--text-muted)",
                  border: `1px solid ${policyTab === tab.key ? tab.color : "var(--border)"}`,
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab-specific helper text */}
        {policyTab === "pending" && pendingPolicies.length > 0 && (
          <div style={{ marginBottom: "12px", padding: "10px 12px", backgroundColor: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: "8px" }}>
            <p style={{ fontSize: "12px", color: "#60a5fa", margin: 0 }}>
              <Clock size={12} style={{ display: "inline", marginRight: "4px" }} />
              These policies have been renewed early and will become active when their start date arrives. The customer has continuous cover.
            </p>
          </div>
        )}

        {/* Policy list */}
        {currentRows.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "12px" }}>
              {policyTab === "active" && "No active policies."}
              {policyTab === "pending" && "No pending renewals."}
              {policyTab === "expired" && "No expired policies."}
            </p>
            {policyTab === "active" && (
              <Link href={`/policies/new?customerId=${customer.id}`} style={{ color: "var(--brand)", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
                Create first policy →
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {currentRows.map((row) => (
              <PolicyCard key={row.policy.id} row={row} tab={policyTab} />
            ))}
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
                  documentId={getDoc("ID")?.id}
                  onUploaded={fetchAll}
                />
                <DocUploadWidget
                  customerId={customer.id}
                  docType="KRA"
                  label="KRA PIN"
                  currentUrl={getDoc("KRA")?.fileUrl}
                  currentValue={kraPinDisplay}
                  documentId={getDoc("KRA")?.id}
                  onUploaded={fetchAll}
                />
                <DocUploadWidget
                  customerId={customer.id}
                  docType="PASSPORT"
                  label="Passport"
                  currentUrl={getDoc("PASSPORT")?.fileUrl}
                  currentValue={null}
                  documentId={getDoc("PASSPORT")?.id}
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
                  documentId={getDoc("OTHER")?.id}
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

          </div>
  );
}