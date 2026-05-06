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

// ── Document Upload Widget ─────────────────────────────────────

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
            <button
              onClick={() => window.open(currentUrl, '_blank', 'noopener,noreferrer')}
              style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "11px", color: "var(--brand)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
            >
              <Eye size={11} /> View
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
              const isExpiringSoon = !isExpired && days <= 90;
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
                        {/* Renew button - show for expired or expiring soon (90 days or less) */}
                        {(isExpired || isExpiringSoon) && (
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