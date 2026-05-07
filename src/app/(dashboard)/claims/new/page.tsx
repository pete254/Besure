// src/app/(dashboard)/claims/new/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import FieldError from "@/components/ui/FieldError";
import { validateRequired, validateDate } from "@/lib/validation";

interface PolicyOption {
  policy: { id: string; policyNumber?: string | null; insuranceType: string };
  customer: { firstName: string; lastName: string; companyName?: string | null; customerType: string };
  vehicle: { make: string; model: string; regNo: string } | null;
}

const NATURE_OPTIONS = ["Accident", "Theft", "Fire", "Flood", "Vandalism", "Other"];

// Component for inline error messages - kept for backwards compatibility
function FieldErrorLegacy({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div style={{ fontSize: "12px", color: "#f87171", marginTop: "4px", fontWeight: 500 }}>
      Warning: {message}
    </div>
  );
}

export default function NewClaimPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [policies, setPolicies] = useState<PolicyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    policyId: searchParams.get("policyId") || "",
    dateOfLoss: "",
    dateReported: new Date().toISOString().split("T")[0],
    natureOfLoss: "Accident",
    location: "",
    policeAbstractNumber: "",
    thirdPartyInvolved: false,
    thirdPartyName: "",
    thirdPartyPhone: "",
    thirdPartyRegNo: "",
    thirdPartyInsurer: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/policies").then(r => r.json()).then(d => setPolicies(d.policies || []));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: "" }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    // Validate required fields
    const errors: Record<string, string> = {};
    if (!form.policyId) {
      errors.policyId = "Please select the policy this claim is linked to";
    }
    const dolErr = validateDate(form.dateOfLoss, "Date of loss");
    if (dolErr) errors.dateOfLoss = dolErr;
    const drErr = validateDate(form.dateReported, "Date reported");
    if (drErr) errors.dateReported = drErr;
    if (form.dateOfLoss && form.dateReported && form.dateReported < form.dateOfLoss) {
      errors.dateReported = "Date reported cannot be before the date of loss";
    }
    if (!form.natureOfLoss) {
      errors.natureOfLoss = "Please select the nature of loss";
    }
    if (form.thirdPartyInvolved && !form.thirdPartyName?.trim()) {
      errors.thirdPartyName = "Please enter the third party's name";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the errors below before continuing.");
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
      const payload = {
        policyId: form.policyId,
        dateOfLoss: form.dateOfLoss,
        dateReported: form.dateReported,
        natureOfLoss: form.natureOfLoss,
        location: form.location || null,
        policeAbstractNumber: form.policeAbstractNumber || null,
        thirdPartyInvolved: form.thirdPartyInvolved,
        thirdPartyDetails: form.thirdPartyInvolved
          ? {
              name: form.thirdPartyName,
              phone: form.thirdPartyPhone,
              regNo: form.thirdPartyRegNo,
              insurer: form.thirdPartyInsurer,
            }
          : null,
        notes: form.notes || null,
      };

      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        // Handle Zod validation errors with field paths
        if (data.issues && Array.isArray(data.issues)) {
          const apiErrors: Record<string, string> = {};
          data.issues.forEach((issue: any) => {
            const fieldPath = issue.path?.join(".") || "form";
            apiErrors[fieldPath] = issue.message || "Invalid value";
          });
          setFieldErrors(apiErrors);
          setError("Please fix the errors below and try again.");
        } else {
          setError(data.error || "Failed to create claim");
        }
        return;
      }
      router.push(`/claims/${data.claim.id}`);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const selectedPolicy = policies.find(p => p.policy.id === form.policyId);

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto" }}>
      <Link href="/claims" style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", marginBottom: "20px", fontSize: "13px", color: "var(--text-muted)" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}>
        <ArrowLeft size={14} /> Back to Claims
      </Link>

      {error && <div style={{ padding: "12px 16px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#fca5a5", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Policy selection */}
        <div style={{ backgroundColor: "var(--bg-card)", border: `1px solid ${fieldErrors.policyId ? "#f87171" : "var(--border)"}`, borderRadius: "10px", padding: "20px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
            Link to Policy
          </p>
          <div data-error={!!fieldErrors.policyId || undefined}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Select Policy *
            </label>
            <select
              name="policyId"
              value={form.policyId}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "9px 12px",
                backgroundColor: "var(--bg-app)",
                border: `1px solid ${fieldErrors.policyId ? "#f87171" : "var(--border)"}`,
                borderRadius: "8px",
                color: "var(--text-primary)",
                fontSize: "13px",
                outline: "none",
              }}
              onFocus={(e) => {
                (e.target as HTMLSelectElement).style.borderColor = fieldErrors.policyId
                  ? "#f87171"
                  : "var(--brand)";
              }}
              onBlur={(e) => {
                (e.target as HTMLSelectElement).style.borderColor = fieldErrors.policyId
                  ? "#f87171"
                  : "var(--border)";
              }}
            >
              <option value="">Select a policy...</option>
              {policies.map(p => {
                const name =
                  p.customer.customerType === "Company"
                    ? p.customer.companyName
                    : `${p.customer.firstName} ${p.customer.lastName}`;
                const label = p.vehicle
                  ? `${name} — ${p.vehicle.make} ${p.vehicle.model} (${p.vehicle.regNo})`
                  : `${name} — ${p.policy.insuranceType}`;
                return (
                  <option key={p.policy.id} value={p.policy.id}>
                    {label}
                  </option>
                );
              })}
            </select>
            <FieldError message={fieldErrors.policyId} />
          </div>

          {selectedPolicy?.vehicle && (
            <div style={{ marginTop: "12px", padding: "10px 12px", backgroundColor: "var(--bg-app)", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 2px" }}>Vehicle</p>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                {selectedPolicy.vehicle.make} {selectedPolicy.vehicle.model} · {selectedPolicy.vehicle.regNo}
              </p>
            </div>
          )}
        </div>

        {/* Incident details */}
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
            Incident Details
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date of Loss *</label>
              <input type="date" name="dateOfLoss" value={form.dateOfLoss} onChange={handleChange} required
                style={{ width: "100%", padding: "9px 12px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", outline: "none" }}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand)"; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }} />
              <FieldError message={fieldErrors.dateOfLoss} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date Reported *</label>
              <input type="date" name="dateReported" value={form.dateReported} onChange={handleChange} required
                style={{ width: "100%", padding: "9px 12px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", outline: "none" }}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand)"; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }} />
              <FieldError message={fieldErrors.dateReported} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Nature of Loss *</label>
              <select name="natureOfLoss" value={form.natureOfLoss} onChange={handleChange}
                style={{ width: "100%", padding: "9px 12px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", outline: "none" }}
                onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--brand)"; }}
                onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--border)"; }}>
                {NATURE_OPTIONS.map(n => <option key={n}>{n}</option>)}
              </select>
              <FieldError message={fieldErrors.natureOfLoss} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Accident Location</label>
              <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Mombasa Road, Nairobi"
                style={{ width: "100%", padding: "9px 12px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", outline: "none" }}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand)"; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }} />
              <FieldError message={fieldErrors.location} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Police Abstract No.</label>
              <input name="policeAbstractNumber" value={form.policeAbstractNumber} onChange={handleChange} placeholder="OB number"
                style={{ width: "100%", padding: "9px 12px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", outline: "none" }}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand)"; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }} />
            </div>
          </div>
        </div>

        {/* Third party */}
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
            Third Party
          </p>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginBottom: "14px" }}>
            <input type="checkbox" name="thirdPartyInvolved" checked={form.thirdPartyInvolved} onChange={handleChange}
              style={{ width: "16px", height: "16px", accentColor: "var(--brand)" }} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Third party involved in this incident</span>
          </label>

          {form.thirdPartyInvolved && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {[
                { name: "thirdPartyName", label: "Name", placeholder: "Third party name" },
                { name: "thirdPartyPhone", label: "Phone", placeholder: "0700 000 000" },
                { name: "thirdPartyRegNo", label: "Vehicle Reg", placeholder: "KXX 000X" },
                { name: "thirdPartyInsurer", label: "Their Insurer", placeholder: "Insurer name" },
              ].map(({ name, label, placeholder }) => (
                <div key={name}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
                  <input name={name} value={(form as any)[name]} onChange={handleChange} placeholder={placeholder}
                    style={{ width: "100%", padding: "9px 12px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", outline: "none" }}
                    onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand)"; }}
                    onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
            Initial Notes <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "12px" }}>(optional)</span>
          </p>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
            placeholder="Any initial notes about the incident..."
            style={{ width: "100%", padding: "9px 12px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", outline: "none", resize: "vertical" }}
            onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--brand)"; }}
            onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--border)"; }} />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <Link href="/claims" style={{ padding: "9px 16px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            Cancel
          </Link>
          <button type="submit" disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", backgroundColor: loading ? "var(--brand-dim)" : "var(--brand)", color: "#000", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
            <Save size={14} />
            {loading ? "Saving..." : "Register Claim"}
          </button>
        </div>
      </form>
    </div>
  );
}