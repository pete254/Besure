// src/app/(dashboard)/claims/[id]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Car, User, AlertTriangle, MessageSquare,
  Check, X, ChevronRight,
} from "lucide-react";

interface Claim {
  id: string; claimNumber: string; dateOfLoss: string; dateReported: string;
  natureOfLoss: string; stage: string; location?: string | null;
  policeAbstractNumber?: string | null; thirdPartyInvolved: boolean;
  thirdPartyDetails?: Record<string, string> | null;
  repairEstimate?: string | null; approvedAmount?: string | null;
  settlementDate?: string | null; settlementMethod?: string | null;
}
interface Policy { id: string; policyNumber?: string | null; insuranceType: string; }
interface Customer { id: string; firstName: string; lastName: string; companyName?: string | null; customerType: string; phone: string; }
interface Vehicle { make: string; model: string; regNo: string; year: number; }
interface Note { id: string; notes: string; channel?: string | null; noteDate: string; nextFollowupDate?: string | null; }

// ── Stage definitions – Executed removed; Approved + Declined added ──
const PROGRESS_STAGES = [
  "Reported",
  "Documents Pending",
  "Fully Documented",
  "Assessed",
];

const DECISION_STAGES = [
  { stage: "Approved",           color: "#10b981", icon: <Check size={11} /> },
  { stage: "Declined",           color: "#f87171", icon: <X    size={11} /> },
  { stage: "Released / Settled", color: "#34d399", icon: <Check size={11} /> },
];

const STAGE_COLORS: Record<string, { bg: string; color: string }> = {
  "Reported":            { bg: "rgba(107,114,128,0.15)", color: "#9ca3af" },
  "Documents Pending":   { bg: "rgba(245,158,11,0.15)",  color: "#fbbf24" },
  "Fully Documented":    { bg: "rgba(59,130,246,0.15)",  color: "#60a5fa" },
  "Assessed":            { bg: "rgba(139,92,246,0.15)",  color: "#a78bfa" },
  "Approved":            { bg: "rgba(16,185,129,0.15)",  color: "#10b981" },
  "Declined":            { bg: "rgba(239,68,68,0.15)",   color: "#f87171" },
  "Released / Settled":  { bg: "rgba(16,185,129,0.2)",   color: "#34d399" },
};

function formatKES(val?: string | null) {
  if (!val) return "—";
  return `KES ${parseFloat(val).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "2px" }}>{label}</p>
      <p style={{ fontSize: "13px", color: value ? "var(--text-primary)" : "var(--text-muted)", margin: 0 }}>{value || "—"}</p>
    </div>
  );
}

export default function ClaimDetailPage() {
  const { id } = useParams();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStage, setUpdatingStage] = useState(false);

  const [noteText, setNoteText] = useState("");
  const [noteChannel, setNoteChannel] = useState("Phone");
  const [savingNote, setSavingNote] = useState(false);

  const [showFinancials, setShowFinancials] = useState(false);
  const [financials, setFinancials] = useState({
    repairEstimate: "", approvedAmount: "", settlementDate: "", settlementMethod: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/claims/${id}`);
        const d = await res.json();
        setClaim(d.claim);
        setPolicy(d.policy);
        setCustomer(d.customer);
        setVehicle(d.vehicle);
        setNotes(d.notes || []);
        setFinancials({
          repairEstimate:  d.claim.repairEstimate  || "",
          approvedAmount:  d.claim.approvedAmount  || "",
          settlementDate:  d.claim.settlementDate  || "",
          settlementMethod: d.claim.settlementMethod || "",
        });
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  async function updateStage(stage: string) {
    setUpdatingStage(true);
    try {
      const res = await fetch(`/api/claims/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      const d = await res.json();
      setClaim(d.claim);
    } finally {
      setUpdatingStage(false);
    }
  }

  async function saveFinancials() {
    const res = await fetch(`/api/claims/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(financials),
    });
    const d = await res.json();
    setClaim(d.claim);
    setShowFinancials(false);
  }

  async function addNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/claims/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteText, channel: noteChannel }),
      });
      const d = await res.json();
      setNotes(prev => [d.note, ...prev]);
      setNoteText("");
    } finally {
      setSavingNote(false);
    }
  }

  if (loading) return <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>Loading claim...</div>;
  if (!claim)  return <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>Claim not found.</div>;

  const stageStyle = STAGE_COLORS[claim.stage] || { bg: "rgba(107,114,128,0.15)", color: "#9ca3af" };
  const progressIdx = PROGRESS_STAGES.indexOf(claim.stage);
  const customerName = customer
    ? customer.customerType === "Company" ? customer.companyName : `${customer.firstName} ${customer.lastName}`
    : "Unknown";

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
      <Link
        href="/claims"
        style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", fontSize: "13px", color: "var(--text-muted)" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}
      >
        <ArrowLeft size={14} /> Back to Claims
      </Link>

      {/* ── Header ── */}
      <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertTriangle size={22} color="#fbbf24" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{claim.claimNumber}</h2>
              <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: stageStyle.bg, color: stageStyle.color }}>
                {claim.stage}
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
              {claim.natureOfLoss} · Reported {new Date(claim.dateReported).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
        {customer && (
          <Link
            href={`/customers/${customer.id}`}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 12px", borderRadius: "8px", border: "1px solid var(--border)", textDecoration: "none", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--brand)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")}
          >
            <User size={13} /> {customerName}
          </Link>
        )}
      </div>

      {/* ── Stage pipeline ── */}
      <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px" }}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "14px" }}>Claim Stage</p>

        {/* Progress steps */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", overflowX: "auto", paddingBottom: "4px", marginBottom: "16px" }}>
          {PROGRESS_STAGES.map((stage, i) => {
            const done = progressIdx > i || !PROGRESS_STAGES.includes(claim.stage);
            const active = claim.stage === stage;
            const colors = STAGE_COLORS[stage];
            return (
              <div key={stage} style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                <button
                  onClick={() => !updatingStage && updateStage(stage)}
                  disabled={updatingStage}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "6px 12px", borderRadius: "20px",
                    border: `1px solid ${active ? colors.color : done ? "var(--border)" : "transparent"}`,
                    backgroundColor: active ? colors.bg : "transparent",
                    cursor: "pointer", transition: "all 0.15s",
                    color: active ? colors.color : done ? "var(--text-secondary)" : "var(--text-muted)",
                    fontSize: "12px", fontWeight: 600,
                  }}
                >
                  {done && !active && <Check size={10} color="var(--brand)" />}
                  {stage}
                </button>
                {i < PROGRESS_STAGES.length - 1 && (
                  <ChevronRight size={12} color="var(--text-muted)" />
                )}
              </div>
            );
          })}
        </div>

        {/* Decision buttons */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "8px" }}>
            Decision
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {DECISION_STAGES.map(({ stage, color, icon }) => {
              const active = claim.stage === stage;
              return (
                <button
                  key={stage}
                  onClick={() => !updatingStage && updateStage(stage)}
                  disabled={updatingStage}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "8px 16px", borderRadius: "20px",
                    border: `1px solid ${active ? color : "var(--border)"}`,
                    backgroundColor: active ? `${color}22` : "transparent",
                    cursor: updatingStage ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                    color: active ? color : "var(--text-muted)",
                    fontSize: "13px", fontWeight: 600,
                  }}
                  onMouseEnter={(e) => {
                    if (!active && !updatingStage) {
                      (e.currentTarget as HTMLElement).style.borderColor = color;
                      (e.currentTarget as HTMLElement).style.color = color;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                      (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                    }
                  }}
                >
                  {icon}
                  {stage}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Details grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Incident details */}
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>Incident Details</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <Field label="Date of Loss" value={new Date(claim.dateOfLoss).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })} />
            <Field label="Date Reported" value={new Date(claim.dateReported).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })} />
            <Field label="Nature of Loss" value={claim.natureOfLoss} />
            <Field label="Police Abstract" value={claim.policeAbstractNumber} />
            <div style={{ gridColumn: "span 2" }}>
              <Field label="Location" value={claim.location} />
            </div>
          </div>
        </div>

        {/* Vehicle + financials */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {vehicle && (
            <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
                <Car size={13} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />Vehicle
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <Field label="Vehicle" value={`${vehicle.make} ${vehicle.model}`} />
                <Field label="Reg No." value={vehicle.regNo} />
              </div>
            </div>
          )}

          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Financials</p>
              <button
                onClick={() => setShowFinancials(!showFinancials)}
                style={{ fontSize: "12px", color: "var(--brand)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
              >
                {showFinancials ? "Cancel" : "Update"}
              </button>
            </div>
            {showFinancials ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { key: "repairEstimate",  label: "Repair Estimate (KES)",  type: "number" },
                  { key: "approvedAmount",  label: "Approved Amount (KES)",  type: "number" },
                  { key: "settlementDate",  label: "Settlement Date",         type: "date"   },
                  { key: "settlementMethod", label: "Settlement Method",      type: "text"   },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                      {label}
                    </label>
                    <input
                      type={type}
                      value={(financials as Record<string, string>)[key]}
                      onChange={(e) => setFinancials(prev => ({ ...prev, [key]: e.target.value }))}
                      style={{ width: "100%", padding: "8px 10px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-primary)", fontSize: "13px", outline: "none" }}
                      onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand)"; }}
                      onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }}
                    />
                  </div>
                ))}
                <button
                  onClick={saveFinancials}
                  style={{ padding: "8px", backgroundColor: "var(--brand)", color: "#000", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                >
                  Save
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <Field label="Repair Estimate"  value={formatKES(claim.repairEstimate)} />
                <Field label="Approved Amount"  value={formatKES(claim.approvedAmount)} />
                <Field label="Settlement Date"  value={claim.settlementDate ? new Date(claim.settlementDate).toLocaleDateString("en-KE") : null} />
                <Field label="Settlement Method" value={claim.settlementMethod} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Third party */}
      {claim.thirdPartyInvolved && claim.thirdPartyDetails && (
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
            Third Party Details
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
            <Field label="Name"        value={claim.thirdPartyDetails.name} />
            <Field label="Phone"       value={claim.thirdPartyDetails.phone} />
            <Field label="Vehicle Reg" value={claim.thirdPartyDetails.regNo} />
            <Field label="Insurer"     value={claim.thirdPartyDetails.insurer} />
          </div>
        </div>
      )}

      {/* Follow-up notes */}
      <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px" }}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
          <MessageSquare size={13} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
          Follow-up Notes
        </p>

        <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
          <select
            value={noteChannel}
            onChange={(e) => setNoteChannel(e.target.value)}
            style={{ padding: "9px 12px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", outline: "none", width: "130px", flexShrink: 0 }}
            onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = "var(--brand)"; }}
            onBlur={(e)  => { (e.target as HTMLSelectElement).style.borderColor = "var(--border)"; }}
          >
            {["Phone", "Email", "WhatsApp", "In-Person"].map(c => <option key={c}>{c}</option>)}
          </select>
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a follow-up note..."
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addNote(); } }}
            style={{ flex: 1, padding: "9px 12px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", outline: "none" }}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand)"; }}
            onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }}
          />
          <button
            onClick={addNote}
            disabled={savingNote || !noteText.trim()}
            style={{ padding: "9px 16px", backgroundColor: "var(--brand)", color: "#000", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
          >
            {savingNote ? "..." : "Add"}
          </button>
        </div>

        {notes.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No notes yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {notes.map((n) => (
              <div key={n.id} style={{ padding: "12px", backgroundColor: "var(--bg-app)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  {n.channel && (
                    <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 6px", borderRadius: "10px", backgroundColor: "rgba(16,185,129,0.15)", color: "var(--brand)" }}>
                      {n.channel}
                    </span>
                  )}
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {new Date(n.noteDate).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>{n.notes}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}