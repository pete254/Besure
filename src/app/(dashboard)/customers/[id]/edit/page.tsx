// src/app/(dashboard)/customers/[id]/edit/page.tsx

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, Upload, X, FileText } from "lucide-react";

const KENYA_COUNTIES = [
  "Baringo","Bomet","Bungoma","Busia","Elgeyo-Marakwet","Embu","Garissa",
  "Homa Bay","Isiolo","Kajiado","Kakamega","Kericho","Kiambu","Kilifi",
  "Kirinyaga","Kisii","Kisumu","Kitui","Kwale","Laikipia","Lamu","Machakos",
  "Makueni","Mandera","Marsabit","Meru","Migori","Mombasa","Murang'a",
  "Nairobi","Nakuru","Nandi","Narok","Nyamira","Nyandarua","Nyeri",
  "Samburu","Siaya","Taita-Taveta","Tana River","Tharaka-Nithi","Trans Nzoia",
  "Turkana","Uasin Gishu","Vihiga","Wajir","West Pokot",
];

interface Director {
  name: string;
  idNumberValue: string;
  kraPinValue: string;
}

const emptyDirector: Director = { name: "", idNumberValue: "", kraPinValue: "" };

// Reusable doc field: text value + optional file upload side by side
function DocField({
  label,
  valueKey,
  fileKey,
  value,
  fileName,
  onChange,
}: {
  label: string;
  valueKey: string;
  fileKey: string;
  value: string;
  fileName: string;
  onChange: (key: string, val: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "8px" }}>
        {label}
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {/* Text Value */}
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 500 }}>Number / Value</div>
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(valueKey, e.target.value)}
            placeholder={`Enter ${label} value`}
            style={{ width: "100%", padding: "9px 12px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand)"; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }}
          />
        </div>

        {/* File Upload */}
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 500 }}>Upload Document</div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onChange(fileKey, file.name);
            }}
            style={{ width: "100%", padding: "9px 12px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-secondary)", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand)"; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }}
          />
          {fileName && <div style={{ fontSize: "11px", color: "var(--brand)", marginTop: "4px" }}>✓ {fileName}</div>}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  backgroundColor: "var(--bg-app)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "13px",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: "5px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

// Component for inline error messages
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div style={{ fontSize: "12px", color: "#f87171", marginTop: "4px", fontWeight: 500 }}>
      ⚠ {message}
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "20px",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [directors, setDirectors] = useState<Director[]>([]);

  const [form, setForm] = useState({
    // Individual
    firstName: "",
    lastName: "",
    middleName: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    county: "",
    physicalAddress: "",
    customerType: "Individual",
    // ID docs — value + file name
    idNumberValue: "",
    idNumberFile: "",
    kraPinValue: "",
    kraPinFile: "",
    // Company
    companyName: "",
    town: "",
    postalAddress: "",
    companyEmail: "",
    companyPhone: "",
    certOfIncorporationValue: "",
    certOfIncorporationFile: "",
    cr12Value: "",
    cr12File: "",
    companyKraPinValue: "",
    companyKraPinFile: "",
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
          dateOfBirth: c.dateOfBirth ? c.dateOfBirth.split("T")[0] : "",
          gender: c.gender || "",
          county: c.county || "",
          physicalAddress: c.physicalAddress || "",
          customerType: c.customerType || "Individual",
          // Populate ID doc values from DB
          idNumberValue: c.idNumberValue || c.idNumber || "",
          idNumberFile: "",
          kraPinValue: c.kraPinValue || c.kraPin || "",
          kraPinFile: "",
          companyName: c.companyName || "",
          town: c.town || "",
          postalAddress: c.postalAddress || "",
          companyEmail: c.companyEmail || "",
          companyPhone: c.companyPhone || "",
          certOfIncorporationValue: c.certOfIncorporationValue || "",
          certOfIncorporationFile: "",
          cr12Value: c.cr12Value || "",
          cr12File: "",
          companyKraPinValue: c.companyKraPinValue || "",
          companyKraPinFile: "",
        });
        // Restore directors
        if (c.directors && Array.isArray(c.directors)) {
          setDirectors(c.directors.map((d: any) => ({
            name: d.name || "",
            idNumberValue: d.idNumberValue || d.idNumber || "",
            kraPinValue: d.kraPinValue || d.kraPin || "",
          })));
        }
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

  function handleDocValue(key: string, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function focusStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    (e.target as HTMLElement).style.borderColor = "var(--brand)";
    (e.target as HTMLElement).style.boxShadow = "0 0 0 2px rgba(16,185,129,0.15)";
  }

  function blurStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    (e.target as HTMLElement).style.borderColor = "var(--border)";
    (e.target as HTMLElement).style.boxShadow = "none";
  }

  function addDirector() {
    setDirectors((prev) => [...prev, { ...emptyDirector }]);
  }

  function updateDirector(index: number, field: keyof Director, value: string) {
    setDirectors((prev) => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
  }

  function removeDirector(index: number) {
    setDirectors((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      // Strip file-name-only keys before sending to API
      const { idNumberFile, kraPinFile, certOfIncorporationFile, cr12File, companyKraPinFile, ...formData } = form;

      const payload = {
        ...formData,
        // Keep idNumber/kraPin in sync with values for backward compat
        idNumber: form.idNumberValue || null,
        idNumberValue: form.idNumberValue || null,
        kraPin: form.kraPinValue || null,
        kraPinValue: form.kraPinValue || null,
        directors: directors.length > 0 ? directors : null,
      };

      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle Zod validation errors with field paths
        if (data.issues && Array.isArray(data.issues)) {
          const errors: Record<string, string> = {};
          data.issues.forEach((issue: any) => {
            const fieldPath = issue.path?.join(".") || "form";
            errors[fieldPath] = issue.message || "Invalid value";
          });
          setFieldErrors(errors);
          setError("Please fix the errors below and try again.");
        } else {
          setError(data.error || "Failed to update customer");
        }
        return;
      }

      router.push(`/customers/${id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isCompany = form.customerType === "Company";

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
                  display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px",
                  borderRadius: "8px",
                  border: `1px solid ${form.customerType === type ? "var(--brand)" : "var(--border)"}`,
                  backgroundColor: form.customerType === type ? "rgba(16,185,129,0.08)" : "var(--bg-app)",
                  cursor: "pointer", fontSize: "13px", fontWeight: 600,
                  color: form.customerType === type ? "var(--brand)" : "var(--text-secondary)",
                }}
              >
                <input type="radio" name="customerType" value={type} checked={form.customerType === type} onChange={handleChange} style={{ display: "none" }} />
                {type === "Individual" ? "👤 Individual" : "🏢 Company"}
              </label>
            ))}
          </div>
        </div>

        {/* Company Details */}
        {isCompany && (
          <div style={sectionStyle}>
            <p style={sectionTitleStyle}>Company Details</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>Company Name *</label>
                <input name="companyName" value={form.companyName} onChange={handleChange} placeholder="e.g. Acme Ltd" required style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                <FieldError message={fieldErrors.companyName} />
              </div>
              <div>
                <label style={labelStyle}>Town</label>
                <input name="town" value={form.town} onChange={handleChange} placeholder="e.g. Nairobi" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                <FieldError message={fieldErrors.town} />
              </div>
              <div>
                <label style={labelStyle}>Postal Address</label>
                <input name="postalAddress" value={form.postalAddress} onChange={handleChange} placeholder="e.g. P.O Box 1234-00100" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                <FieldError message={fieldErrors.postalAddress} />
              </div>
              <div>
                <label style={labelStyle}>Company Email</label>
                <input name="companyEmail" type="email" value={form.companyEmail} onChange={handleChange} placeholder="info@company.co.ke" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                <FieldError message={fieldErrors.companyEmail} />
              </div>
              <div>
                <label style={labelStyle}>Company Phone</label>
                <input name="companyPhone" value={form.companyPhone} onChange={handleChange} placeholder="0700 000 000" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                <FieldError message={fieldErrors.companyPhone} />
              </div>
            </div>
          </div>
        )}

        {/* Personal Information */}
        <div style={sectionStyle}>
          <p style={sectionTitleStyle}>{isCompany ? "Primary Contact Person" : "Personal Information"}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
            <div>
              <label style={labelStyle}>First Name *</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="John" required style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              <FieldError message={fieldErrors.firstName} />
            </div>
            <div>
              <label style={labelStyle}>Last Name *</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Doe" required style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              <FieldError message={fieldErrors.lastName} />
            </div>
            <div>
              <label style={labelStyle}>Middle Name</label>
              <input name="middleName" value={form.middleName} onChange={handleChange} placeholder="Optional" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              <FieldError message={fieldErrors.middleName} />
            </div>
            <div>
              <label style={labelStyle}>Phone Number *</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="0712 345 678" required style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              <FieldError message={fieldErrors.phone} />
            </div>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="john@email.com" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              <FieldError message={fieldErrors.email} />
            </div>
            {!isCompany && (
              <div>
                <label style={labelStyle}>Date of Birth</label>
                <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                <FieldError message={fieldErrors.dateOfBirth} />
              </div>
            )}
            {!isCompany && (
              <div>
                <label style={labelStyle}>Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <FieldError message={fieldErrors.gender} />
              </div>
            )}
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
              <FieldError message={fieldErrors.county} />
            </div>
            <div>
              <label style={labelStyle}>Physical Address</label>
              <textarea name="physicalAddress" value={form.physicalAddress} onChange={handleChange} placeholder="Street, building, area..." rows={2} style={{ ...inputStyle, resize: "vertical" }} onFocus={focusStyle} onBlur={blurStyle} />
              <FieldError message={fieldErrors.physicalAddress} />
            </div>
          </div>
        </div>

        {/* Individual Documents */}
        {!isCompany && (
          <div style={sectionStyle}>
            <p style={sectionTitleStyle}>Identity Documents</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
              <DocField
                label="National ID"
                valueKey="idNumberValue"
                fileKey="idNumberFile"
                value={form.idNumberValue}
                fileName={form.idNumberFile}
                onChange={handleDocValue}
              />
              <DocField
                label="KRA PIN"
                valueKey="kraPinValue"
                fileKey="kraPinFile"
                value={form.kraPinValue}
                fileName={form.kraPinFile}
                onChange={handleDocValue}
              />
            </div>
          </div>
        )}

        {/* Company Documents */}
        {isCompany && (
          <div style={sectionStyle}>
            <p style={sectionTitleStyle}>Company Documents</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
              <DocField
                label="Certificate of Incorporation"
                valueKey="certOfIncorporationValue"
                fileKey="certOfIncorporationFile"
                value={form.certOfIncorporationValue}
                fileName={form.certOfIncorporationFile}
                onChange={handleDocValue}
              />
              <DocField
                label="CR12"
                valueKey="cr12Value"
                fileKey="cr12File"
                value={form.cr12Value}
                fileName={form.cr12File}
                onChange={handleDocValue}
              />
              <DocField
                label="KRA PIN (Company)"
                valueKey="companyKraPinValue"
                fileKey="companyKraPinFile"
                value={form.companyKraPinValue}
                fileName={form.companyKraPinFile}
                onChange={handleDocValue}
              />
            </div>
          </div>
        )}

        {/* Directors — Company only */}
        {isCompany && (
          <div style={sectionStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", margin: 0 }}>Directors / Signatories</p>
              <button
                type="button"
                onClick={addDirector}
                style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", backgroundColor: "var(--brand-dim)", border: "1px solid var(--brand)", borderRadius: "6px", color: "var(--brand)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
              >
                <Plus size={13} /> Add Director
              </button>
            </div>

            {directors.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No directors added. Click "Add Director" to add one.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {directors.map((d, i) => (
                  <div key={i} style={{ padding: "16px", backgroundColor: "var(--bg-app)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                      <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--brand)", margin: 0 }}>Director {i + 1}</p>
                      <button
                        type="button"
                        onClick={() => removeDirector(i)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: "2px" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#f87171")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                      <div style={{ gridColumn: "span 3" }}>
                        <label style={labelStyle}>Full Name</label>
                        <input
                          value={d.name}
                          onChange={(e) => updateDirector(i, "name", e.target.value)}
                          placeholder="Director full name"
                          style={inputStyle}
                          onFocus={focusStyle}
                          onBlur={blurStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>National ID Number</label>
                        <input
                          value={d.idNumberValue}
                          onChange={(e) => updateDirector(i, "idNumberValue", e.target.value)}
                          placeholder="ID number"
                          style={inputStyle}
                          onFocus={focusStyle}
                          onBlur={blurStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>KRA PIN</label>
                        <input
                          value={d.kraPinValue}
                          onChange={(e) => updateDirector(i, "kraPinValue", e.target.value)}
                          placeholder="KRA PIN"
                          style={inputStyle}
                          onFocus={focusStyle}
                          onBlur={blurStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>ID Copy</label>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ ...inputStyle, color: "var(--text-secondary)" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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