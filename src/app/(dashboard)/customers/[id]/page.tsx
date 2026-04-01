// src/app/(dashboard)/customers/[id]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Phone, Mail, MapPin, CreditCard,
  Building2, User, FileText, Calendar, Hash, CheckCircle2
} from "lucide-react";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  phone: string;
  email?: string | null;
  // legacy plain fields
  idNumber?: string | null;
  kraPin?: string | null;
  // value fields (preferred)
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

const cardStyle = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "20px",
};

const labelStyle = {
  fontSize: "11px",
  fontWeight: 600 as const,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  color: "var(--text-muted)",
  marginBottom: "3px",
};

const valueStyle = {
  fontSize: "14px",
  fontWeight: 500 as const,
  color: "#ffffff",
};

function Field({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  return (
    <div>
      <p style={labelStyle}>{label}</p>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {icon && <span style={{ color: "var(--text-muted)" }}>{icon}</span>}
        <p style={valueStyle}>
          {value || <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>—</span>}
        </p>
      </div>
    </div>
  );
}

function DocValueBadge({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ padding: "10px 12px", backgroundColor: "var(--bg-app)", borderRadius: "8px", border: `1px solid ${value ? "rgba(16,185,129,0.3)" : "var(--border)"}` }}>
      <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "4px" }}>{label}</p>
      {value ? (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <CheckCircle2 size={13} color="var(--brand)" />
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>{value}</span>
        </div>
      ) : (
        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>Not provided</span>
      )}
    </div>
  );
}

export default function CustomerProfilePage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await fetch(`/api/customers/${id}`);
        if (!res.ok) throw new Error("Customer not found");
        const data = await res.json();
        setCustomer(data.customer);
      } catch {
        setError("Could not load customer.");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchCustomer();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
        Loading customer...
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div style={{ padding: "48px", textAlign: "center" }}>
        <p style={{ color: "#fca5a5", marginBottom: "12px" }}>{error || "Customer not found."}</p>
        <Link href="/customers" style={{ color: "var(--brand)", fontSize: "13px" }}>
          ← Back to Customers
        </Link>
      </div>
    );
  }

  const displayName = customer.customerType === "Company"
    ? customer.companyName
    : `${customer.firstName}${customer.middleName ? " " + customer.middleName : ""} ${customer.lastName}`;

  const initials = customer.customerType === "Company"
    ? (customer.companyName?.slice(0, 2) || "CO").toUpperCase()
    : `${customer.firstName[0]}${customer.lastName[0]}`.toUpperCase();

  // Use value fields preferring idNumberValue over legacy idNumber
  const idDisplay = customer.idNumberValue || customer.idNumber;
  const kraPinDisplay = customer.kraPinValue || customer.kraPin;

  const directors = customer.directors && Array.isArray(customer.directors) ? customer.directors : [];

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Back */}
      <Link
        href="/customers"
        style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "13px", textDecoration: "none" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}
      >
        <ArrowLeft size={14} /> Back to Customers
      </Link>

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
                {customer.customerType === "Company"
                  ? <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Building2 size={10} /> Company</span>
                  : <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><User size={10} /> Individual</span>
                }
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              {customer.phone && <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "var(--text-secondary)" }}><Phone size={12} /> {customer.phone}</span>}
              {customer.email && <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "var(--text-secondary)" }}><Mail size={12} /> {customer.email}</span>}
              {customer.county && <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "var(--text-secondary)" }}><MapPin size={12} /> {customer.county}</span>}
            </div>
          </div>
        </div>

        <Link
          href={`/customers/${customer.id}/edit`}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", backgroundColor: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: "8px", color: "#ffffff", fontSize: "13px", fontWeight: 600, textDecoration: "none", flexShrink: 0 }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--brand)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")}
        >
          <Pencil size={13} /> Edit
        </Link>
      </div>

      {/* Company details */}
      {customer.customerType === "Company" && (
        <div style={cardStyle}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>Company Details</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
            <Field label="Company Name" value={customer.companyName} />
            <Field label="Town" value={customer.town} />
            <Field label="Postal Address" value={customer.postalAddress} />
            <Field label="Company Email" value={customer.companyEmail} icon={<Mail size={12} />} />
            <Field label="Company Phone" value={customer.companyPhone} icon={<Phone size={12} />} />
          </div>
        </div>
      )}

      {/* Personal details + Identity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={cardStyle}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
            {customer.customerType === "Company" ? "Primary Contact" : "Personal Details"}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field label="First Name" value={customer.firstName} />
            <Field label="Last Name" value={customer.lastName} />
            {customer.middleName && <Field label="Middle Name" value={customer.middleName} />}
            {customer.customerType === "Individual" && <Field label="Gender" value={customer.gender} />}
            {customer.dateOfBirth && (
              <Field
                label="Date of Birth"
                value={new Date(customer.dateOfBirth).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}
                icon={<Calendar size={12} />}
              />
            )}
            <Field label="County" value={customer.county} icon={<MapPin size={12} />} />
          </div>
          {customer.physicalAddress && (
            <div style={{ marginTop: "16px" }}>
              <Field label="Physical Address" value={customer.physicalAddress} />
            </div>
          )}
        </div>

        {/* Identity & Tax */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={cardStyle}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
              Identity & Tax
            </p>
            {customer.customerType === "Individual" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <DocValueBadge label="National ID" value={idDisplay} />
                <DocValueBadge label="KRA PIN" value={kraPinDisplay} />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <DocValueBadge label="Certificate of Incorporation" value={customer.certOfIncorporationValue} />
                <DocValueBadge label="CR12" value={customer.cr12Value} />
                <DocValueBadge label="Company KRA PIN" value={customer.companyKraPinValue} />
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
              Account Info
            </p>
            <Field
              label="Customer Since"
              value={new Date(customer.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}
              icon={<Calendar size={12} />}
            />
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

      {/* Policies */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
            <FileText size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
            Policies
          </p>
          <Link href={`/policies/new?customerId=${customer.id}`} style={{ fontSize: "12px", color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>
            + New Policy
          </Link>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
          No policies yet. Policies will appear here once created.
        </p>
      </div>

    </div>
  );
}