// src/app/(dashboard)/customers/new/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import FieldError from "@/components/ui/FieldError";
import {
  validatePhone,
  validateEmail,
  validateRequired,
  validateKRAPin,
  validateCompanyName,
  runValidators,
} from "@/lib/validation";

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
  idNumber: string;
  idNumberValue: string;
  kraPin: string;
  kraPinValue: string;
}

const emptyDirector: Director = { name: "", idNumber: "", idNumberValue: "", kraPin: "", kraPinValue: "" };

// Component for inline error messages - kept for backwards compatibility
function FieldErrorLegacy({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div style={{ fontSize: "12px", color: "#f87171", marginTop: "4px", fontWeight: 500 }}>
      Warning: {message}
    </div>
  );
}

// Reusable doc field: both file upload AND text value, side-by-side
function DocField({ 
  label, 
  valueKey, 
  fileKey,
  value, 
  fileName,
  onChange 
}: {
  label: string;
  valueKey: string;
  fileKey: string;
  value: string;
  fileName: string;
  onChange: (key: string, val: string) => void;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(fileKey, file.name);
    }
  };

  return (
    <div>
      <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "8px" }}>{label}</label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {/* Text Value Input */}
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 500 }}>Enter Value</div>
          <input 
            type="text"
            value={value || ""}
            onChange={(e) => onChange(valueKey, e.target.value)}
            placeholder={`Enter ${label} number/value`}
            style={{ width: "100%", padding: "9px 12px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand)"; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }} 
          />
        </div>

        {/* File Upload Input */}
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 500 }}>Upload Document</div>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input 
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              style={{ width: "100%", padding: "9px 12px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-secondary)", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
              onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand)"; }}
              onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }} 
            />
          </div>
          {fileName && <div style={{ fontSize: "11px", color: "var(--brand)", marginTop: "4px" }}>✓ {fileName}</div>}
        </div>
      </div>
    </div>
  );
}

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [directors, setDirectors] = useState<Director[]>([]);

  const [form, setForm] = useState({
    firstName: "", lastName: "", middleName: "",
    phone: "", email: "", idNumber: "", idNumberValue: "",
    kraPin: "", kraPinValue: "", dateOfBirth: "", gender: "",
    county: "", physicalAddress: "",
    customerType: "Individual",
    // Company fields
    companyName: "", town: "", postalAddress: "",
    companyEmail: "", companyPhone: "",
    certOfIncorporationValue: "", cr12Value: "", companyKraPinValue: "",
    // File names
    idNumberFile: "", kraPinFile: "",
    certOfIncorporationFile: "", cr12File: "", companyKraPinFile: "",
  });

  React.useEffect(() => {
    console.log("✅ [Customer Form] Component mounted - New customer form initialized");
    return () => {
      console.log("🔚 [Customer Form] Component unmounted");
    };
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    console.log("📝 [Customer Form] Field changed:", { name, value, customerType: form.customerType });
    
    // If changing customer type, clear irrelevant fields
    if (name === "customerType") {
      if (value === "Individual") {
        // Switching to Individual: clear all company-specific fields and reset personal fields
        setForm(prev => ({
          ...prev,
          [name]: value,
          // Reset personal/contact fields
          firstName: "",
          lastName: "",
          middleName: "",
          phone: "",
          email: "",
          county: "",
          physicalAddress: "",
          dateOfBirth: "",
          gender: "",
          idNumberValue: "",
          kraPinValue: "",
          idNumberFile: "",
          kraPinFile: "",
          // Clear company fields
          companyName: "",
          town: "",
          postalAddress: "",
          companyEmail: "",
          companyPhone: "",
          certOfIncorporationValue: "",
          cr12Value: "",
          companyKraPinValue: "",
          certOfIncorporationFile: "",
          cr12File: "",
          companyKraPinFile: "",
        }));
        setDirectors([]);
      } else if (value === "Company") {
        // Switching to Company: clear all fields and reset personal info
        setForm(prev => ({
          ...prev,
          [name]: value,
          // Reset personal/contact fields
          firstName: "",
          lastName: "",
          middleName: "",
          phone: "",
          email: "",
          county: "",
          physicalAddress: "",
          dateOfBirth: "",
          gender: "",
          idNumberValue: "",
          kraPinValue: "",
          idNumberFile: "",
          kraPinFile: "",
          // Clear company fields
          companyName: "",
          town: "",
          postalAddress: "",
          companyEmail: "",
          companyPhone: "",
          certOfIncorporationValue: "",
          cr12Value: "",
          companyKraPinValue: "",
          certOfIncorporationFile: "",
          cr12File: "",
          companyKraPinFile: "",
        }));
        setDirectors([]);
      }
      setFieldErrors({});
      return;
    }
    
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      console.log("📝 [Customer Form] Form state updated for field:", { name, newValue: value });
      return updated;
    });
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: "" }));
    }
  }

  function handleDocValue(key: string, val: string) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function addDirector() {
    setDirectors(prev => [...prev, { ...emptyDirector }]);
  }

  function updateDirector(index: number, field: keyof Director, value: string) {
    setDirectors(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
  }

  function removeDirector(index: number) {
    setDirectors(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    console.log("🔍 [Customer Form] Submitting customer form:", {
      customerType: form.customerType,
      firstName: form.firstName,
      lastName: form.lastName,
      companyName: isCompany ? form.companyName : "N/A",
      directorsCount: directors.length
    });

    // Validate required fields
    const errors = runValidators([
      { field: "firstName", fn: () => validateRequired(form.firstName, "First name") },
      { field: "lastName", fn: () => validateRequired(form.lastName, "Last name") },
      { field: "phone", fn: () => {
        const error = validatePhone(form.phone);
        return error ? `⚠️ ${error}` : null;
      }},
      { field: "email", fn: () => {
        const error = validateEmail(form.email);
        return error ? `⚠️ ${error}` : null;
      }},
      { field: "kraPinValue", fn: () => {
        const error = validateKRAPin(form.kraPinValue);
        return error ? `⚠️ ${error}` : null;
      }},
      ...(isCompany
        ? [{ field: "companyName", fn: () => {
          const error = validateCompanyName(form.companyName);
          return error ? `⚠️ ${error}` : null;
        }}]
        : []),
    ]);

    // Validate company-specific fields if company type
    if (isCompany) {
      if (!form.companyPhone?.trim()) {
        errors.companyPhone = "⚠️ Company phone is required for company customers";
      } else if (validatePhone(form.companyPhone)) {
        errors.companyPhone = `⚠️ ${validatePhone(form.companyPhone)}`;
      }
      
      if (!form.companyEmail?.trim()) {
        errors.companyEmail = "⚠️ Company email is required for company customers";
      } else if (validateEmail(form.companyEmail)) {
        errors.companyEmail = `⚠️ ${validateEmail(form.companyEmail)}`;
      }
    }

    // Validate directors if company type
    if (isCompany && directors.length === 0) {
      errors.directors = "⚠️ At least one director is required for company customers. Click 'Add Director' above.";
    }
    
    if (isCompany) {
      directors.forEach((director, idx) => {
        if (!director.name?.trim()) {
          errors[`director_${idx}_name`] = `⚠️ Director ${idx + 1} name is required`;
        }
        if (!director.idNumberValue?.trim()) {
          errors[`director_${idx}_id`] = `⚠️ Director ${idx + 1} ID number is required`;
        }
      });
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("❌ Please fix all errors below before saving the customer.");
      console.error("❌ [Customer Form] Validation errors:", errors);
      // Scroll to first error
      setTimeout(() => {
        const firstError = document.querySelector("[data-error='true']");
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
      return;
    }

    setLoading(true);
    try {
      // Extract only the fields needed for the API (exclude file names)
      const { idNumberFile, kraPinFile, certOfIncorporationFile, cr12File, companyKraPinFile, ...formData } = form;
      
      const payload = { ...formData, directors: directors.length > 0 ? directors : null };
      
      console.log("📤 [Customer Form] Sending request to /api/customers:", {
        method: "POST",
        payloadKeys: Object.keys(payload),
        customerType: payload.customerType,
        directorsCount: payload.directors?.length || 0
      });

      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("📥 [Customer Form] API response status:", res.status);

      const data = await res.json();
      
      console.log("📋 [Customer Form] Response data:", {
        ok: res.ok,
        hasError: !!data.error,
        hasIssues: !!data.issues,
        customerId: data.customer?.id,
        errorMessage: data.error
      });

      if (!res.ok) {
        // Handle Zod validation errors with field paths
        if (data.issues && Array.isArray(data.issues)) {
          console.error("❌ [Customer Form] Zod validation issues:", data.issues);
          const apiErrors: Record<string, string> = {};
          data.issues.forEach((issue: any) => {
            const fieldPath = issue.path?.join(".") || "form";
            apiErrors[fieldPath] = `⚠️ ${issue.message || "Invalid value"}`;
          });
          setFieldErrors(apiErrors);
          setError("❌ The server found validation errors. Please check and try again.");
        } else {
          console.error("❌ [Customer Form] Server error:", data.error);
          setError(`❌ ${data.error || "Failed to create customer. Please try again."}`);
        }
        return;
      }
      
      console.log("✅ [Customer Form] Customer created successfully:", data.customer?.id);
      router.push(`/customers/${data.customer.id}`);
    } catch (err) {
      console.error("❌ [Customer Form] Unexpected error:", err);
      setError("❌ An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isCompany = form.customerType === "Company";

  const S = {
    section: { backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px", marginBottom: "0" } as React.CSSProperties,
    title: { fontSize: "13px", fontWeight: 700 as const, color: "var(--text-primary)", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" },
    label: { display: "block", fontSize: "12px", fontWeight: 600 as const, color: "var(--text-secondary)", marginBottom: "5px", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
    input: { width: "100%", padding: "9px 12px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", outline: "none" } as React.CSSProperties,
  };

  function inp(name: string, placeholder?: string, type = "text") {
    return (
      <div data-error={!!fieldErrors[name] || undefined}>
        <input
          name={name}
          type={type}
          value={(form as any)[name]}
          onChange={handleChange}
          placeholder={placeholder}
          style={{
            ...S.input,
            borderColor: fieldErrors[name] ? "#f87171" : "var(--border)",
          }}
          onFocus={(e) => {
            (e.target as HTMLInputElement).style.borderColor = fieldErrors[name]
              ? "#f87171"
              : "var(--brand)";
          }}
          onBlur={(e) => {
            (e.target as HTMLInputElement).style.borderColor = fieldErrors[name]
              ? "#f87171"
              : "var(--border)";
          }}
        />
        <FieldError message={fieldErrors[name]} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <Link href="/customers" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "13px", textDecoration: "none", marginBottom: "16px" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}>
        <ArrowLeft size={14} /> Back to Customers
      </Link>

      {error && <div style={{ padding: "12px 16px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#fca5a5", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Customer Type */}
        <div style={S.section}>
          <p style={S.title}>Customer Type</p>
          <div style={{ display: "flex", gap: "12px" }}>
            {["Individual", "Company"].map((type) => (
              <label key={type} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "8px", border: `1px solid ${form.customerType === type ? "var(--brand)" : "var(--border)"}`, backgroundColor: form.customerType === type ? "rgba(16,185,129,0.08)" : "var(--bg-app)", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: form.customerType === type ? "var(--brand)" : "var(--text-secondary)" }}>
                <input type="radio" name="customerType" value={type} checked={form.customerType === type} onChange={handleChange} style={{ display: "none" }} />
                {type === "Individual" ? "👤 Individual" : "🏢 Company"}
              </label>
            ))}
          </div>
        </div>

        {/* Company Details */}
        {isCompany && (
          <div style={S.section}>
            <p style={S.title}>Company Details</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={S.label}>Company Name *</label>
                {inp("companyName", "e.g. Acme Ltd")}
              </div>
              <div><label style={S.label}>Town</label>{inp("town", "e.g. Nairobi")}</div>
              <div><label style={S.label}>Postal Address</label>{inp("postalAddress", "e.g. P.O Box 1234-00100")}</div>
              <div><label style={S.label}>Company Email</label>{inp("companyEmail", "info@company.co.ke", "email")}</div>
              <div><label style={S.label}>Company Phone</label>{inp("companyPhone", "0700 000 000")}</div>
            </div>
          </div>
        )}

        {/* Personal Information */}
        <div style={S.section}>
          <p style={S.title}>{isCompany ? "Primary Contact Person" : "Personal Information"}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
            <div><label style={S.label}>First Name *</label>{inp("firstName", "John")}</div>
            <div><label style={S.label}>Last Name *</label>{inp("lastName", "Doe")}</div>
            <div><label style={S.label}>Middle Name</label>{inp("middleName", "Optional")}</div>
            <div><label style={S.label}>Phone Number *</label>{inp("phone", "0712 345 678")}</div>
            <div><label style={S.label}>Email Address</label>{inp("email", "john@email.com", "email")}</div>
            {!isCompany && <div><label style={S.label}>Date of Birth</label>{inp("dateOfBirth", "", "date")}</div>}
            {!isCompany && (
              <div>
                <label style={S.label}>Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange} style={S.input}
                  onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--brand)"; }}
                  onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--border)"; }}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        <div style={S.section}>
          <p style={S.title}>Location</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "14px" }}>
            <div>
              <label style={S.label}>County / Area</label>
              <select name="county" value={form.county} onChange={handleChange} style={S.input}
                onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--brand)"; }}
                onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--border)"; }}>
                <option value="">Select county</option>
                {KENYA_COUNTIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Physical Address</label>
              <textarea name="physicalAddress" value={form.physicalAddress} onChange={handleChange}
                placeholder="Street, building, area..." rows={2}
                style={{ ...S.input, resize: "vertical" }}
                onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--brand)"; }}
                onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--border)"; }} />
            </div>
          </div>
        </div>

        {/* Individual Documents */}
        {!isCompany && (
          <div style={S.section}>
            <p style={S.title}>Identity Documents</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
              <DocField label="National ID" valueKey="idNumberValue" fileKey="idNumberFile" value={form.idNumberValue} fileName={form.idNumberFile} onChange={handleDocValue} />
              <DocField label="KRA PIN" valueKey="kraPinValue" fileKey="kraPinFile" value={form.kraPinValue} fileName={form.kraPinFile} onChange={handleDocValue} />
            </div>
          </div>
        )}

        {/* Company Documents */}
        {isCompany && (
          <div style={S.section}>
            <p style={S.title}>Company Documents</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
              <DocField label="Certificate of Incorporation" valueKey="certOfIncorporationValue" fileKey="certOfIncorporationFile" value={form.certOfIncorporationValue} fileName={form.certOfIncorporationFile} onChange={handleDocValue} />
              <DocField label="CR12" valueKey="cr12Value" fileKey="cr12File" value={form.cr12Value} fileName={form.cr12File} onChange={handleDocValue} />
              <DocField label="KRA PIN (Company)" valueKey="companyKraPinValue" fileKey="companyKraPinFile" value={form.companyKraPinValue} fileName={form.companyKraPinFile} onChange={handleDocValue} />
            </div>
          </div>
        )}

        {/* Directors */}
        {isCompany && (
          <div style={S.section}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Directors / Signatories</p>
              <button type="button" onClick={addDirector}
                style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", backgroundColor: "var(--brand-dim)", border: "1px solid var(--brand)", borderRadius: "6px", color: "var(--brand)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                <Plus size={13} /> Add Director
              </button>
            </div>

            {fieldErrors.directors && (
              <div style={{ padding: "12px 16px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#fca5a5", fontSize: "13px", marginBottom: "16px", fontWeight: 500 }}>
                {fieldErrors.directors}
              </div>
            )}

            {directors.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No directors added yet. Click "Add Director" to add one.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {directors.map((d, i) => (
                  <div key={i} style={{ padding: "16px", backgroundColor: "var(--bg-app)", borderRadius: "8px", border: "1px solid var(--border)", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                      <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--brand)", margin: 0 }}>Director {i + 1}</p>
                      <button type="button" onClick={() => removeDirector(i)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: "2px" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#f87171")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div style={{ gridColumn: "span 2" }} data-error={!!fieldErrors[`director_${i}_name`] || undefined}>
                        <label style={S.label}>Full Name</label>
                        <input
                          value={d.name}
                          onChange={(e) => {
                            updateDirector(i, "name", e.target.value);
                            if (fieldErrors[`director_${i}_name`]) {
                              setFieldErrors(prev => ({ ...prev, [`director_${i}_name`]: "" }));
                            }
                          }}
                          placeholder="Director full name"
                          style={{
                            ...S.input,
                            borderColor: fieldErrors[`director_${i}_name`]
                              ? "#f87171"
                              : "var(--border)",
                          }}
                          onFocus={(e) => {
                            (e.target as HTMLInputElement).style.borderColor =
                              fieldErrors[`director_${i}_name`] ? "#f87171" : "var(--brand)";
                          }}
                          onBlur={(e) => {
                            (e.target as HTMLInputElement).style.borderColor =
                              fieldErrors[`director_${i}_name`] ? "#f87171" : "var(--border)";
                          }}
                        />
                        <FieldError message={fieldErrors[`director_${i}_name`]} />
                      </div>
                      <div>
                        <label style={S.label}>National ID Number</label>
                        <input value={d.idNumberValue} onChange={(e) => updateDirector(i, "idNumberValue", e.target.value)}
                          placeholder="Enter ID number" style={S.input}
                          onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand)"; }}
                          onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }} />
                      </div>
                      <div>
                        <label style={S.label}>KRA PIN</label>
                        <input value={d.kraPinValue} onChange={(e) => updateDirector(i, "kraPinValue", e.target.value)}
                          placeholder="Enter KRA PIN" style={S.input}
                          onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand)"; }}
                          onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }} />
                      </div>
                      <div>
                        <label style={S.label}>ID Copy</label>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                          style={{ ...S.input, color: "var(--text-secondary)" }} />
                      </div>
                      <div>
                        <label style={S.label}>PIN Certificate Copy</label>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                          style={{ ...S.input, color: "var(--text-secondary)" }} />
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
          <Link href="/customers" style={{ padding: "9px 16px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            Cancel
          </Link>
          <button type="submit" disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", backgroundColor: loading ? "var(--brand-dim)" : "var(--brand)", color: "#000000", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
            <Save size={14} strokeWidth={2.5} />
            {loading ? "Saving..." : "Save Customer"}
          </button>
        </div>
      </form>
    </div>
  );
}