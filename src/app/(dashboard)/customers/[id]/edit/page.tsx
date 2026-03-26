// src/app/(dashboard)/customers/[id]/edit/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

const KENYA_COUNTIES = [
  "Baringo","Bomet","Bungoma","Busia","Elgeyo-Marakwet","Embu","Garissa",
  "Homa Bay","Isiolo","Kajiado","Kakamega","Kericho","Kiambu","Kilifi",
  "Kirinyaga","Kisii","Kisumu","Kitui","Kwale","Laikipia","Lamu","Machakos",
  "Makueni","Mandera","Marsabit","Meru","Migori","Mombasa","Murang'a",
  "Nairobi","Nakuru","Nandi","Narok","Nyamira","Nyandarua","Nyeri",
  "Samburu","Siaya","Taita-Taveta","Tana River","Tharaka-Nithi","Trans Nzoia",
  "Turkana","Uasin Gishu","Vihiga","Wajir","West Pokot",
];

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  backgroundColor: "var(--bg-app)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "13px",
  outline: "none",
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600 as const,
  color: "var(--text-secondary)",
  marginBottom: "5px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const sectionStyle = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "20px",
};

const sectionTitleStyle = {
  fontSize: "13px",
  fontWeight: 700 as const,
  color: "#ffffff",
  marginBottom: "16px",
  paddingBottom: "10px",
  borderBottom: "1px solid var(--border)",
};

export default function EditCustomerPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    phone: "",
    email: "",
    idNumber: "",
    kraPin: "",
    dateOfBirth: "",
    gender: "",
    county: "",
    physicalAddress: "",
    customerType: "Individual",
    companyName: "",
  });

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await fetch(`/api/customers/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        const c = data.customer;
        setForm({
          firstName: c.firstName || "",
          lastName: c.lastName || "",
          middleName: c.middleName || "",
          phone: c.phone || "",
          email: c.email || "",
          idNumber: c.idNumber || "",
          kraPin: c.kraPin || "",
          dateOfBirth: c.dateOfBirth ? c.dateOfBirth.split("T")[0] : "",
          gender: c.gender || "",
          county: c.county || "",
          physicalAddress: c.physicalAddress || "",
          customerType: c.customerType || "Individual",
          companyName: c.companyName || "",
        });
      } catch {
        setError("Could not load customer.");
      } finally {
        setFetching(false);
      }
    }
    if (id) fetchCustomer();
  }, [id]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function focusStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    (e.target as HTMLElement).style.borderColor = "var(--brand)";
    (e.target as HTMLElement).style.boxShadow = "0 0 0 2px rgba(16,185,129,0.15)";
  }

  function blurStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    (e.target as HTMLElement).style.borderColor = "var(--border)";
    (e.target as HTMLElement).style.boxShadow = "none";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update customer");
        return;
      }

      router.push(`/customers/${id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
        Loading customer...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Back */}
      <Link
        href={`/customers/${id}`}
        style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "13px", textDecoration: "none", marginBottom: "16px" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}
      >
        <ArrowLeft size={14} /> Back to Profile
      </Link>

      <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", marginBottom: "20px" }}>
        Edit Customer
      </h2>

      {error && (
        <div style={{ padding: "12px 16px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#fca5a5", fontSize: "13px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Customer Type */}
        <div style={sectionStyle}>
          <p style={sectionTitleStyle}>Customer Type</p>
          <div style={{ display: "flex", gap: "12px" }}>
            {["Individual", "Company"].map((type) => (
              <label
                key={type}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: `1px solid ${form.customerType === type ? "var(--brand)" : "var(--border)"}`,
                  backgroundColor: form.customerType === type ? "rgba(16,185,129,0.08)" : "var(--bg-app)",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: form.customerType === type ? "var(--brand)" : "var(--text-secondary)",
                }}
              >
                <input type="radio" name="customerType" value={type} checked={form.customerType === type} onChange={handleChange} style={{ display: "none" }} />
                {type === "Individual" ? "👤 Individual" : "🏢 Company"}
              </label>
            ))}
          </div>
          {form.customerType === "Company" && (
            <div style={{ marginTop: "16px" }}>
              <label style={labelStyle}>Company Name *</label>
              <input name="companyName" value={form.companyName} onChange={handleChange} placeholder="e.g. Acme Ltd" required style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          )}
        </div>

        {/* Personal Information */}
        <div style={sectionStyle}>
          <p style={sectionTitleStyle}>Personal Information</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
            <div>
              <label style={labelStyle}>First Name *</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="John" required style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <label style={labelStyle}>Last Name *</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Doe" required style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <label style={labelStyle}>Middle Name</label>
              <input name="middleName" value={form.middleName} onChange={handleChange} placeholder="Optional" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone Number *</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="0712 345 678" required style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="john@email.com" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <label style={labelStyle}>Date of Birth</label>
              <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <label style={labelStyle}>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>National ID Number</label>
              <input name="idNumber" value={form.idNumber} onChange={handleChange} placeholder="12345678" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <label style={labelStyle}>KRA PIN</label>
              <input name="kraPin" value={form.kraPin} onChange={handleChange} placeholder="A123456789B" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          </div>
        </div>

        {/* Location */}
        <div style={sectionStyle}>
          <p style={sectionTitleStyle}>Location</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "14px" }}>
            <div>
              <label style={labelStyle}>County / Area</label>
              <select name="county" value={form.county} onChange={handleChange} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="">Select county</option>
                {KENYA_COUNTIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Physical Address</label>
              <textarea name="physicalAddress" value={form.physicalAddress} onChange={handleChange} placeholder="Street, building, area..." rows={2} style={{ ...inputStyle, resize: "vertical" }} onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <Link
            href={`/customers/${id}`}
            style={{ padding: "9px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", textDecoration: "none", border: "1px solid var(--border)" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", backgroundColor: loading ? "var(--brand-dim)" : "var(--brand)", color: "#000000", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}
          >
            <Save size={14} strokeWidth={2.5} />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}