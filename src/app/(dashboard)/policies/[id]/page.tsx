// src/app/(dashboard)/policies/[id]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Car, CreditCard, FileText, Calendar, User, Building2, CheckCircle2, Clock, RefreshCw, X, Upload, Eye } from "lucide-react";
import RiskNoteButton from "@/components/RiskNoteButton";
import { uploadToBlob } from "@/lib/vercel-blob";

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

function formatKES(val?: string | null) {
  if (!val) return "—";
  return `KES ${parseFloat(val).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "3px" }}>{label}</p>
      <p style={{ fontSize: "13px", color: value ? "var(--text-primary)" : "var(--text-muted)", margin: 0 }}>
        {value || "—"}
      </p>
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
  const [loading, setLoading] = useState(true);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showCertExpiry, setShowCertExpiry] = useState(false);
  const [certExpiryForm, setCertExpiryForm] = useState({ certificateExpiryDate: "", certificateExpiryReason: "" });
  const [certExpirySaving, setCertExpirySaving] = useState(false);
  const [certExpiryError, setCertExpiryError] = useState("");
  const [renewData, setRenewData] = useState({ startDate: "", endDate: "", sumInsured: "", basicRate: "", policyNumber: "", paymentMode: "Full Payment", notes: "", benefits: [] as Benefit[], documents: [] as any[] });
  const [renewSaving, setRenewSaving] = useState(false);
  const [renewError, setRenewError] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [newDocument, setNewDocument] = useState({ docType: "", file: null as File | null });
  const [uploadingDocument, setUploadingDocument] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/policies/${id}`);
        const d = await res.json();
        setPolicy(d.policy);
        setVehicle(d.vehicle || null);
        setCustomer(d.customer || null);
        setBenefits(d.benefits || []);
        setPaymentList(d.payments || []);
        setInsurer(d.insurer || null);
        setDocuments(d.documents || []);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  // Initialize renew dates when policy loads
  useEffect(() => {
    if (policy) {
      // Use today's date for renewal start date
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const newStart = `${year}-${month}-${day}`;
      
      // Calculate end date as one year minus one day from today
      const endDate = new Date(today);
      endDate.setFullYear(endDate.getFullYear() + 1);
      endDate.setDate(endDate.getDate() - 1);
      const endYear = endDate.getFullYear();
      const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
      const endDay = String(endDate.getDate()).padStart(2, '0');
      const newEnd = `${endYear}-${endMonth}-${endDay}`;
      
      console.log('[Policies Page Renewal] Today:', newStart, 'End Date:', newEnd);
      
      setRenewData({
        startDate: newStart,
        endDate: newEnd,
        sumInsured: policy.sumInsured || "",
        basicRate: policy.basicRate || "",
        policyNumber: "",
        paymentMode: "Full Payment",
        notes: "",
        benefits: benefits || [],
        documents: documents || [],
      });
    }
  }, [policy]);

  async function handleRenew() {
    setRenewError("");
    setRenewSaving(true);
    try {
      const basicPremium = renewData.sumInsured && renewData.basicRate
        ? ((parseFloat(renewData.sumInsured) * parseFloat(renewData.basicRate)) / 100).toFixed(2)
        : "0.00";
      const iraLevy = (parseFloat(basicPremium) * 0.0045).toFixed(2);
      const grandTotal = (parseFloat(basicPremium) + parseFloat(iraLevy) + 40 + 100).toFixed(2);

      const res = await fetch(`/api/policies/${id}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...renewData,
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
      if (!res.ok) {
        setRenewError(data.error || "Failed to renew");
        return;
      }
      // Navigate to the new renewed policy
      router.push(`/policies/${data.policy.id}`);
      setShowRenewModal(false);
    } catch {
      setRenewError("Something went wrong");
    } finally {
      setRenewSaving(false);
    }
  }

  async function handleUpdateCertExpiry() {
    setCertExpiryError("");
    setCertExpirySaving(true);
    try {
      if (!certExpiryForm.certificateExpiryDate) {
        setCertExpiryError("Certificate expiry date is required");
        setCertExpirySaving(false);
        return;
      }

      const res = await fetch(`/api/policies/${id}/certificate-expiry`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificateExpiryDate: certExpiryForm.certificateExpiryDate,
          certificateExpiryReason: certExpiryForm.certificateExpiryReason || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setCertExpiryError(data.error || "Failed to update");
        return;
      }

      const data = await res.json();
      setPolicy(data.policy);
      setShowCertExpiry(false);
    } catch {
      setCertExpiryError("Something went wrong");
    } finally {
      setCertExpirySaving(false);
    }
  }

  async function handleDocumentUpload() {
    if (!newDocument.docType || !newDocument.file) return;

    setUploadingDocument(true);
    try {
      // Upload to Vercel Blob storage
      const filename = `policies/${newDocument.docType.toLowerCase()}_${Date.now()}_${newDocument.file.name}`;
      const result = await uploadToBlob(newDocument.file, filename, newDocument.file.type);

      // Create document record
      const res = await fetch(`/api/policies/${id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType: newDocument.docType,
          fileUrl: result.url,
          blobKey: filename,
          docLabel: newDocument.file.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to upload document");
        return;
      }

      // Add to documents list
      setDocuments(prev => [...prev, data.document]);
      
      // Reset form
      setNewDocument({ docType: "", file: null });
      setShowDocumentUpload(false);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploadingDocument(false);
    }
  }

  async function handleDeleteDocument(docId: string) {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const res = await fetch(`/api/policies/${id}/documents/${docId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete document");
        return;
      }

      // Remove from documents list
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete document. Please try again.');
    }
  }

  if (loading) return <div style={{ padding: "48px", textAlign: "center" }} className="text-muted">Loading policy...</div>;
  if (!policy) return <div style={{ padding: "48px", textAlign: "center" }} className="text-muted">Policy not found.</div>;

  const customerName = customer
    ? customer.customerType === "Company" ? customer.companyName : `${customer.firstName} ${customer.lastName}`
    : "Unknown";

  const insurerName = insurer?.name || policy.insurerNameManual || "—";

  const daysLeft = Math.ceil((new Date(policy.endDate).getTime() - Date.now()) / 86400000);
  const expiryColor = daysLeft < 0 ? "#f87171" : daysLeft <= 7 ? "#fbbf24" : daysLeft <= 30 ? "#fb923c" : "var(--brand)";

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
      <Link href="/policies" style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none" }} className="text-muted">
        <ArrowLeft size={14} /> Back to Policies
      </Link>

      {/* Header card */}
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
              <span className={`badge ${policy.status === "Active" ? "badge-green" : policy.status === "Expired" ? "badge-red" : "badge-grey"}`}>
                {policy.status}
              </span>
              {policy.coverType && <span className="badge badge-yellow">{policy.coverType}</span>}
            </div>
            <p className="text-secondary" style={{ fontSize: "13px", margin: "3px 0 0" }}>
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
            <button
              onClick={() => setShowRenewModal(true)}
              style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--brand)", backgroundColor: "var(--brand-dim)", color: "var(--brand)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
            >
              <RefreshCw size={12} /> Renew
            </button>
          </div>
        </div>
      </div>

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
              <p className="text-secondary" style={{ fontSize: "13px", margin: 0 }}>{policy.notes}</p>
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
              <Field 
                label="Expiry Date" 
                value={policy.certificateExpiryDate 
                  ? new Date(policy.certificateExpiryDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })
                  : null
                }
              />
              <Field label="Reason" value={policy.certificateExpiryReason} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {certExpiryError && (
                <div style={{ padding: "10px 12px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", color: "#fca5a5", fontSize: "12px" }}>
                  {certExpiryError}
                </div>
              )}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Expiry Date *</label>
                <input 
                  type="date" 
                  value={certExpiryForm.certificateExpiryDate} 
                  onChange={(e) => setCertExpiryForm(p => ({ ...p, certificateExpiryDate: e.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "6px", color: "#ffffff", fontSize: "13px", outline: "none" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Reason (optional)</label>
                <input 
                  type="text" 
                  value={certExpiryForm.certificateExpiryReason} 
                  onChange={(e) => setCertExpiryForm(p => ({ ...p, certificateExpiryReason: e.target.value }))}
                  placeholder="e.g. End of policy period, Client request..."
                  style={{ width: "100%", padding: "8px 10px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "6px", color: "#ffffff", fontSize: "13px", outline: "none" }}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button 
                  onClick={() => setShowCertExpiry(false)} 
                  style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateCertExpiry}
                  disabled={certExpirySaving}
                  style={{ padding: "6px 12px", borderRadius: "6px", border: "none", backgroundColor: certExpirySaving ? "var(--brand-dim)" : "var(--brand)", color: "#000", fontSize: "12px", fontWeight: 600, cursor: certExpirySaving ? "not-allowed" : "pointer" }}
                >
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
              <p className="text-muted" style={{ fontSize: "12px", margin: 0 }}>{customer?.phone}</p>
            </div>
          </div>
          {customer && (
            <Link href={`/customers/${customer.id}`} className="btn-secondary" style={{ fontSize: "12px", padding: "6px 12px", display: "inline-flex" }}>
              View Customer Profile
            </Link>
          )}
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
            ...(benefits.map(b => ({ label: b.benefitName, value: b.amountKes }))),
            { label: "IRA Levy (0.45%)", value: policy.iraLevy },
            { label: "Training Levy (0.2%)", value: policy.trainingLevy },
            { label: "Stamp Duty", value: policy.stampDuty },
            { label: "PHCF", value: policy.phcf },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <span className="text-secondary" style={{ fontSize: "13px" }}>{label}</span>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{formatKES(value)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>Grand Total</span>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--brand)" }}>{formatKES(policy.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Policy Documents */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            <FileText size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
            Policy Documents
          </p>
          <button
            onClick={() => setShowDocumentUpload(!showDocumentUpload)}
            style={{ padding: "6px 12px", fontSize: "12px", border: "1px solid var(--brand)", borderRadius: "6px", backgroundColor: "var(--brand-dim)", color: "var(--brand)", cursor: "pointer" }}
          >
            <Upload size={12} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
            Add Document
          </button>
        </div>

        {/* Document Upload Form */}
        {showDocumentUpload && (
          <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "var(--bg-app)", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <select
                value={newDocument.docType}
                onChange={(e) => setNewDocument(prev => ({ ...prev, docType: e.target.value }))}
                style={{ padding: "8px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-primary)", fontSize: "13px" }}
              >
                <option value="">Select Document Type</option>
                <option value="VALUATION">Valuation</option>
                <option value="PROPOSAL">Proposal Form</option>
                <option value="LOGBOOK">Logbook</option>
                <option value="QUOTATION">Quotation</option>
                <option value="PREVIOUS_POLICY">Previous Policy</option>
                <option value="OTHER">Other</option>
              </select>
              <div>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setNewDocument(prev => ({ ...prev, file }));
                  }}
                  style={{ width: "100%", padding: "8px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-primary)", fontSize: "13px" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDocumentUpload(false)}
                style={{ padding: "6px 12px", fontSize: "12px", border: "1px solid var(--border)", borderRadius: "6px", backgroundColor: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDocumentUpload}
                disabled={!newDocument.docType || !newDocument.file || uploadingDocument}
                style={{ padding: "6px 12px", fontSize: "12px", border: "none", borderRadius: "6px", backgroundColor: uploadingDocument ? "var(--brand-dim)" : "var(--brand)", color: "#000", cursor: uploadingDocument ? "not-allowed" : "pointer" }}
              >
                {uploadingDocument ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        )}

        {/* Documents List */}
        {documents.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {documents.map((doc) => (
              <div key={doc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", backgroundColor: "var(--bg-app)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>
                    {doc.docType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {doc.docLabel}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--brand)", marginTop: "2px" }}>
                    Status: {doc.status}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    onClick={() => window.open(doc.fileUrl, '_blank')}
                    style={{ padding: "4px 8px", fontSize: "11px", border: "1px solid var(--brand)", borderRadius: "4px", backgroundColor: "var(--brand-dim)", color: "var(--brand)", cursor: "pointer" }}
                  >
                    <Eye size={10} style={{ marginRight: "4px" }} />
                    View
                  </button>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    style={{ padding: "4px 8px", fontSize: "11px", border: "1px solid #ef4444", borderRadius: "4px", backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444", cursor: "pointer" }}
                  >
                    <X size={10} style={{ marginRight: "4px" }} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
            <FileText size={32} style={{ display: "block", margin: "0 auto 8px", opacity: 0.5 }} />
            <p style={{ fontSize: "13px", margin: 0 }}>No documents uploaded yet</p>
            <p style={{ fontSize: "11px", margin: "4px 0 0", opacity: 0.8 }}>Click "Add Document" to upload policy documents</p>
          </div>
        )}
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
          <p className="text-muted" style={{ fontSize: "13px" }}>No payment schedule.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {paymentList.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "8px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {p.status === "paid"
                    ? <CheckCircle2 size={16} color="var(--brand)" />
                    : <Clock size={16} color="var(--text-muted)" />
                  }
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                      Installment {p.installmentNumber} of {p.totalInstallments}
                    </p>
                    <p className="text-muted" style={{ fontSize: "12px", margin: 0 }}>
                      Due: {new Date(p.dueDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{formatKES(p.amountDue)}</p>
                  <span className={`badge ${p.status === "paid" ? "badge-green" : p.status === "partial" ? "badge-yellow" : "badge-grey"}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Renew Modal */}
      {showRenewModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ backgroundColor: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", padding: "24px", maxWidth: "420px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", margin: 0 }}>Renew Policy</h3>
              <button onClick={() => setShowRenewModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            {renewError && (
              <div style={{ padding: "10px 12px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", color: "#fca5a5", fontSize: "12px", marginBottom: "12px" }}>
                {renewError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Start Date</label>
                <input type="date" value={renewData.startDate} onChange={(e) => setRenewData(p => ({ ...p, startDate: e.target.value }))} style={{ width: "100%", padding: "8px 10px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "6px", color: "#ffffff", fontSize: "13px", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>End Date</label>
                <input type="date" value={renewData.endDate} onChange={(e) => setRenewData(p => ({ ...p, endDate: e.target.value }))} style={{ width: "100%", padding: "8px 10px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "6px", color: "#ffffff", fontSize: "13px", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Sum Insured (KES)</label>
                <input type="number" value={renewData.sumInsured} onChange={(e) => setRenewData(p => ({ ...p, sumInsured: e.target.value }))} placeholder="e.g. 1500000" style={{ width: "100%", padding: "8px 10px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "6px", color: "#ffffff", fontSize: "13px", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Basic Rate (%)</label>
                <input type="number" step="0.01" value={renewData.basicRate} onChange={(e) => setRenewData(p => ({ ...p, basicRate: e.target.value }))} placeholder="e.g. 4.00" style={{ width: "100%", padding: "8px 10px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "6px", color: "#ffffff", fontSize: "13px", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Payment Mode</label>
                <select value={renewData.paymentMode} onChange={(e) => setRenewData(p => ({ ...p, paymentMode: e.target.value }))} style={{ width: "100%", padding: "8px 10px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "6px", color: "#ffffff", fontSize: "13px", outline: "none" }}>
                  <option>Full Payment</option>
                  <option>2 Installments</option>
                  <option>3 Installments</option>
                  <option>IPF</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Policy Number</label>
                <input value={renewData.policyNumber} onChange={(e) => setRenewData(p => ({ ...p, policyNumber: e.target.value }))} placeholder="Add later if pending" style={{ width: "100%", padding: "8px 10px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "6px", color: "#ffffff", fontSize: "13px", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Notes (optional)</label>
                <input value={renewData.notes} onChange={(e) => setRenewData(p => ({ ...p, notes: e.target.value }))} placeholder="Any renewal notes..." style={{ width: "100%", padding: "8px 10px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "6px", color: "#ffffff", fontSize: "13px", outline: "none" }} />
              </div>

              {/* Benefits Selection */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Additional Benefits
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "150px", overflowY: "auto" }}>
                  {benefits.length > 0 ? (
                    benefits.map((benefit) => (
                      <div key={benefit.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px", backgroundColor: "var(--bg-app)", borderRadius: "6px", border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <input
                            type="checkbox"
                            checked={renewData.benefits.some((b: any) => b.benefitOptionId === benefit.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setRenewData(prev => ({
                                  ...prev,
                                  benefits: [...prev.benefits, benefit as any]
                                }));
                              } else {
                                setRenewData(prev => ({
                                  ...prev,
                                  benefits: prev.benefits.filter((b: any) => b.benefitOptionId !== benefit.id)
                                }));
                              }
                            }}
                            style={{ cursor: "pointer" }}
                          />
                          <div>
                            <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>
                              {benefit.benefitName}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--brand)" }}>
                              {formatKES(benefit.amountKes)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)", fontSize: "12px" }}>
                      No additional benefits available
                    </div>
                  )}
                </div>
              </div>

              {/* Document Handling */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Policy Documents
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {documents.length > 0 ? (
                    documents.map((doc) => (
                      <div key={doc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px", backgroundColor: "var(--bg-app)", borderRadius: "6px", border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <input
                            type="checkbox"
                            checked={renewData.documents.some((d: any) => d.id === doc.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setRenewData(prev => ({
                                  ...prev,
                                  documents: [...prev.documents, doc as any]
                                }));
                              } else {
                                setRenewData(prev => ({
                                  ...prev,
                                  documents: prev.documents.filter((d: any) => d.id !== doc.id)
                                }));
                              }
                            }}
                            style={{ cursor: "pointer" }}
                          />
                          <div>
                            <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>
                              {doc.docType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </div>
                            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                              {doc.docLabel}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => window.open(doc.fileUrl, '_blank')}
                          style={{ padding: "2px 6px", fontSize: "10px", border: "1px solid var(--brand)", borderRadius: "4px", backgroundColor: "var(--brand-dim)", color: "var(--brand)", cursor: "pointer" }}
                        >
                          <Eye size={8} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)", fontSize: "12px" }}>
                      No documents available
                    </div>
                  )}
                </div>
                <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: "8px 0 0", fontStyle: "italic" }}>
                  Select documents to carry over to the renewed policy
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button onClick={() => setShowRenewModal(false)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button
                onClick={handleRenew}
                disabled={renewSaving}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 18px", borderRadius: "6px", border: "none", backgroundColor: renewSaving ? "var(--brand-dim)" : "var(--brand)", color: "#000", fontSize: "13px", fontWeight: 700, cursor: renewSaving ? "not-allowed" : "pointer" }}
              >
                <RefreshCw size={13} />
                {renewSaving ? "Renewing..." : "Create Renewal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}