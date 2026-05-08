// src/app/(dashboard)/policies/[id]/payment/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import FieldError from "@/components/ui/FieldError";

interface Payment {
  id: string;
  installmentNumber: number;
  totalInstallments: number;
  amountDue: string;
  amountPaid?: string | null;
  dueDate: string;
  paidDate?: string | null;
  paymentMethod?: string | null;
  referenceNo?: string | null;
  status: string;
}

interface Policy {
  id: string;
  policyNumber?: string | null;
  grandTotal?: string | null;
  insuranceType: string;
}

const PAYMENT_METHODS = [
  "M-Pesa", "Bank Transfer", "Cash", "Cheque", "Card", "IPF", "Other"
];

function formatKES(val?: string | null) {
  if (!val) return "KES 0.00";
  return `KES ${parseFloat(val).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

export default function RecordPaymentPage() {
  const { id } = useParams();
  const router = useRouter();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [paymentList, setPaymentList] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    amountPaid: "",
    paidDate: new Date().toISOString().split("T")[0],
    paymentMethod: "M-Pesa",
    referenceNo: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/policies/${id}`);
        const d = await res.json();
        setPolicy(d.policy);
        setPaymentList(d.payments || []);
        // Auto-select first unpaid installment
        const unpaid = d.payments?.find((p: Payment) => p.status !== "paid");
        if (unpaid) {
          setSelectedPayment(unpaid);
          setForm(prev => ({ ...prev, amountPaid: unpaid.amountDue }));
        }
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPayment) return;
    
    setError("");
    setFieldErrors({});
    const errors: Record<string, string> = {};

    // Validate amount paid
    const amt = parseFloat(form.amountPaid);
    if (!form.amountPaid || isNaN(amt) || amt <= 0) {
      errors.amountPaid = "⚠️ Enter a valid payment amount greater than KES 0";
    } else if (amt > parseFloat(selectedPayment.amountDue) * 2) {
      errors.amountPaid = `⚠️ Amount exceeds double the installment (KES ${(parseFloat(selectedPayment.amountDue) * 2).toLocaleString("en-KE", { maximumFractionDigits: 2 })}). Please verify or contact support.`;
    }

    // Validate payment date
    if (!form.paidDate) {
      errors.paidDate = "⚠️ Payment date is required to record this payment";
    } else {
      const paidDate = new Date(form.paidDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      paidDate.setHours(0, 0, 0, 0);
      
      if (paidDate > today) {
        errors.paidDate = "⚠️ Payment date cannot be in the future";
      }
    }

    // Validate payment method
    if (!form.paymentMethod) {
      errors.paymentMethod = "⚠️ Please select a payment method (M-Pesa, Bank Transfer, Cash, etc.)";
    }
    
    // Conditional: if payment method requires reference, validate reference
    if (form.paymentMethod && ["Bank Transfer", "Cheque", "Card"].includes(form.paymentMethod) && !form.referenceNo?.trim()) {
      errors.referenceNo = `⚠️ Reference number is required for ${form.paymentMethod} payments`;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("❌ Please fix all errors below before recording the payment.");
      setTimeout(() => {
        const firstError = document.querySelector("[data-error='true']");
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/policies/${id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: selectedPayment.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) { 
        setError(`❌ ${data.error || "Failed to record payment. Please try again."}`); 
        return; 
      }

      setSuccess("✅ Payment recorded successfully!");
      // Refresh payments
      const refresh = await fetch(`/api/policies/${id}`);
      const refreshed = await refresh.json();
      setPaymentList(refreshed.payments || []);

      // Auto-select next unpaid
      const nextUnpaid = refreshed.payments?.find((p: Payment) => p.status !== "paid");
      if (nextUnpaid) {
        setSelectedPayment(nextUnpaid);
        setForm(prev => ({ ...prev, amountPaid: nextUnpaid.amountDue, referenceNo: "" }));
      } else {
        setSelectedPayment(null);
      }
    } catch (err) {
      setError("❌ An unexpected error occurred. Please try again.");
      console.error("Payment recording error:", err);
    } finally {
      setSaving(false);
    }
  }

  function handleFormChange(key: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors(prev => ({ ...prev, [key]: "" }));
    }
  }

  const totalPaid = paymentList.reduce((sum, p) => sum + parseFloat(p.amountPaid || "0"), 0);
  const totalDue = paymentList.reduce((sum, p) => sum + parseFloat(p.amountDue), 0);
  const outstanding = totalDue - totalPaid;

  if (loading) return <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>;

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto" }}>
      <Link
        href={`/policies/${id}`}
        style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", marginBottom: "20px", color: "var(--text-muted)", fontSize: "13px" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}
      >
        <ArrowLeft size={14} /> Back to Policy
      </Link>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "Total Premium", value: formatKES(policy?.grandTotal), color: "var(--text-primary)" },
          { label: "Total Paid", value: formatKES(totalPaid.toFixed(2)), color: "var(--brand)" },
          { label: "Outstanding", value: formatKES(outstanding.toFixed(2)), color: outstanding > 0 ? "#fbbf24" : "var(--brand)" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "6px" }}>{label}</p>
            <p style={{ fontSize: "18px", fontWeight: 700, color, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Installment schedule */}
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Payment Schedule</p>
          </div>
          <div style={{ padding: "8px" }}>
            {paymentList.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  if (p.status === "paid") return;
                  setSelectedPayment(p);
                  setForm(prev => ({ ...prev, amountPaid: p.amountDue, referenceNo: "" }));
                  setSuccess("");
                  setError("");
                }}
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 12px", borderRadius: "8px", marginBottom: "4px",
                  cursor: p.status === "paid" ? "default" : "pointer",
                  border: `1px solid ${selectedPayment?.id === p.id ? "var(--brand)" : "transparent"}`,
                  backgroundColor: selectedPayment?.id === p.id ? "rgba(16,185,129,0.06)" : "transparent",
                  transition: "all 0.1s",
                }}
                onMouseEnter={(e) => { if (p.status !== "paid") (e.currentTarget as HTMLElement).style.backgroundColor = selectedPayment?.id === p.id ? "rgba(16,185,129,0.06)" : "var(--bg-hover)"; }}
                onMouseLeave={(e) => { if (p.status !== "paid" && selectedPayment?.id !== p.id) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
              >
                {p.status === "paid"
                  ? <CheckCircle2 size={16} color="var(--brand)" />
                  : p.status === "partial"
                  ? <AlertCircle size={16} color="#fbbf24" />
                  : <Clock size={16} color="var(--text-muted)" />
                }
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                    Installment {p.installmentNumber}/{p.totalInstallments}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                    Due: {new Date(p.dueDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{formatKES(p.amountDue)}</p>
                  <span style={{
                    fontSize: "10px", fontWeight: 600, padding: "1px 6px", borderRadius: "10px",
                    backgroundColor: p.status === "paid" ? "rgba(16,185,129,0.15)" : p.status === "partial" ? "rgba(245,158,11,0.15)" : "rgba(107,114,128,0.15)",
                    color: p.status === "paid" ? "var(--brand)" : p.status === "partial" ? "#fbbf24" : "var(--text-muted)",
                  }}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Record payment form */}
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
            Record Payment
          </p>

          {!selectedPayment ? (
            <div style={{ padding: "24px 0", textAlign: "center" }}>
              <CheckCircle2 size={32} color="var(--brand)" style={{ margin: "0 auto 10px" }} />
              <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>All installments have been paid.</p>
            </div>
          ) : (
            <>
              {success && (
                <div style={{ padding: "10px 12px", backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px", color: "var(--brand)", fontSize: "13px", marginBottom: "14px" }}>
                  {success}
                </div>
              )}
              {error && (
                <div style={{ padding: "10px 12px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#fca5a5", fontSize: "13px", marginBottom: "14px" }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>Selected Installment</p>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--brand)" }}>
                    Installment {selectedPayment.installmentNumber}/{selectedPayment.totalInstallments} — {formatKES(selectedPayment.amountDue)}
                  </p>
                </div>

                <div data-error={!!fieldErrors.amountPaid || undefined}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Amount Paid (KES) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.amountPaid}
                    onChange={(e) => handleFormChange("amountPaid", e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", backgroundColor: "var(--bg-app)", border: `1px solid ${fieldErrors.amountPaid ? "#f87171" : "var(--border)"}`, borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", outline: "none" }}
                    onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = fieldErrors.amountPaid ? "#f87171" : "var(--brand)"; }}
                    onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = fieldErrors.amountPaid ? "#f87171" : "var(--border)"; }}
                  />
                  <FieldError message={fieldErrors.amountPaid} />
                </div>

                <div data-error={!!fieldErrors.paidDate || undefined}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.paidDate}
                    onChange={(e) => handleFormChange("paidDate", e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", backgroundColor: "var(--bg-app)", border: `1px solid ${fieldErrors.paidDate ? "#f87171" : "var(--border)"}`, borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", outline: "none" }}
                    onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = fieldErrors.paidDate ? "#f87171" : "var(--brand)"; }}
                    onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = fieldErrors.paidDate ? "#f87171" : "var(--border)"; }}
                  />
                  <FieldError message={fieldErrors.paidDate} />
                </div>

                <div data-error={!!fieldErrors.paymentMethod || undefined}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Payment Method *
                  </label>
                  <select
                    required
                    value={form.paymentMethod}
                    onChange={(e) => handleFormChange("paymentMethod", e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", backgroundColor: "var(--bg-app)", border: `1px solid ${fieldErrors.paymentMethod ? "#f87171" : "var(--border)"}`, borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", outline: "none" }}
                    onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = fieldErrors.paymentMethod ? "#f87171" : "var(--brand)"; }}
                    onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor = fieldErrors.paymentMethod ? "#f87171" : "var(--border)"; }}
                  >
                    {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                  <FieldError message={fieldErrors.paymentMethod} />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Reference No. / Transaction Code
                  </label>
                  <input
                    placeholder="e.g. QHG4X2Y1Z3"
                    value={form.referenceNo}
                    onChange={(e) => handleFormChange("referenceNo", e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", outline: "none" }}
                    onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand)"; }}
                    onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    padding: "10px", backgroundColor: saving ? "var(--brand-dim)" : "var(--brand)",
                    color: "#000000", border: "none", borderRadius: "8px",
                    fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                    marginTop: "4px",
                  }}
                >
                  {saving ? "Recording..." : "Record Payment"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}