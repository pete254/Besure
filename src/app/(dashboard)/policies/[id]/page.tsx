// src/app/(dashboard)/policies/[id]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Car, CreditCard, FileText, Calendar, User, Building2, CheckCircle2, Clock } from "lucide-react";
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
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [paymentList, setPaymentList] = useState<Payment[]>([]);
  const [insurer, setInsurer] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

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
          <RiskNoteButton policyId={policy.id} policyNumber={policy.policyNumber} />
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
    </div>
  );
}