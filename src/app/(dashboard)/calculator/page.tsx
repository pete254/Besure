// src/app/(dashboard)/calculator/page.tsx
// Standalone premium calculator — corrected levy formula + PDF proposal download
// Formula: IRA Levy = 0.45% of (Basic Premium + Benefits). Training levy removed.

"use client";

import { useState, useEffect } from "react";
import {
  Calculator, RefreshCw, Copy, Check, ChevronDown, ChevronUp,
  FileDown, User, Phone, Mail, Car, Loader2,
} from "lucide-react";

interface Insurer {
  id: string; name: string; isActive: boolean;
  rateMotorPrivate?: string | null; rateMotorCommercial?: string | null;
  ratePsv?: string | null; minPremiumPrivate?: string | null;
  minPremiumCommercial?: string | null; minPremiumPsv?: string | null;
  commissionRate?: string | null;
}

interface BenefitOption {
  id: string; name: string; isActive: boolean; sortOrder: number;
}

interface SelectedBenefit {
  benefitOptionId: string; benefitName: string; amountKes: string;
}

interface CalcResult {
  sumInsured: number; basicRate: number;
  calculatedBasicPremium: number; basicPremium: number;
  minimumApplied: boolean; minPremium: number | null;
  totalBenefits: number;
  iraLevy: number;
  trainingLevy: number;  // kept for schema compat — always 0 now
  stampDuty: number; phcf: number; grandTotal: number;
  agencyCommission: number; commissionRate: number;
  benefits: { benefitName: string; amountKes: number }[];
  insurer: { id: string; name: string } | null;
}

// Client info for proposal
interface ClientInfo {
  name: string; phone: string; email: string;
  vehicleReg: string; vehicleMake: string; vehicleYear: string;
}

const INSURANCE_TYPES = [
  { value: "Motor - Private", label: "Motor — Private" },
  { value: "Motor - Commercial", label: "Motor — Commercial" },
  { value: "Motor - PSV / Matatu", label: "Motor — PSV / Matatu" },
];

function fmt(n: number, currency = true) {
  if (isNaN(n) || n === 0) return currency ? "KES 0.00" : "0.00";
  const formatted = n.toLocaleString("en-KE", { minimumFractionDigits: 2 });
  return currency ? `KES ${formatted}` : formatted;
}

function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });
}

export default function CalculatorPage() {
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [benefitOptions, setBenefitOptions] = useState<BenefitOption[]>([]);
  const [selectedInsurerId, setSelectedInsurerId] = useState("");
  const [manualInsurer, setManualInsurer] = useState("");
  const [insuranceType, setInsuranceType] = useState("Motor - Private");
  const [sumInsured, setSumInsured] = useState("");
  const [basicRate, setBasicRate] = useState("");
  const [selectedBenefits, setSelectedBenefits] = useState<SelectedBenefit[]>([]);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showBenefits, setShowBenefits] = useState(false);
  const [showClientInfo, setShowClientInfo] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    name: "", phone: "", email: "", vehicleReg: "", vehicleMake: "", vehicleYear: "",
  });

  useEffect(() => {
    fetch("/api/insurers").then(r => r.json()).then(d =>
      setInsurers(d.insurers?.filter((i: Insurer) => i.isActive) || [])
    );
    fetch("/api/benefits").then(r => r.json()).then(d =>
      setBenefitOptions(d.benefits?.filter((b: BenefitOption) => b.isActive) || [])
    );
  }, []);

  // Auto-fill rate when insurer or type changes
  useEffect(() => {
    if (!selectedInsurerId) return;
    const ins = insurers.find(i => i.id === selectedInsurerId);
    if (!ins) return;
    let rate = "";
    if (insuranceType === "Motor - Private") rate = ins.rateMotorPrivate || "";
    else if (insuranceType === "Motor - Commercial") rate = ins.rateMotorCommercial || "";
    else if (insuranceType === "Motor - PSV / Matatu") rate = ins.ratePsv || "";
    if (rate) setBasicRate(rate);
  }, [selectedInsurerId, insuranceType, insurers]);

  const canCalculate = parseFloat(sumInsured) > 0 && parseFloat(basicRate) > 0;

  // Live recalculate
  useEffect(() => {
    if (!canCalculate) { setResult(null); return; }
    const timer = setTimeout(() => calculate(false), 400);
    return () => clearTimeout(timer);
  }, [sumInsured, basicRate, selectedInsurerId, insuranceType, selectedBenefits]);

  async function calculate(showLoader = true) {
    if (!canCalculate) return;
    if (showLoader) setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/calculator/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          insuranceType,
          insurerId: selectedInsurerId || null,
          sumInsured: parseFloat(sumInsured),
          basicRate: parseFloat(basicRate),
          benefits: selectedBenefits.map(b => ({
            benefitName: b.benefitName,
            amountKes: parseFloat(b.amountKes || "0"),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Calculation failed"); return; }
      setResult(data);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function downloadProposal() {
    if (!result) return;
    setDownloadingPdf(true);
    setPdfError("");
    try {
      const res = await fetch("/api/calculator/proposal-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          insuranceType,
          insurerName: result.insurer?.name || manualInsurer || "—",
          clientName: clientInfo.name || undefined,
          clientPhone: clientInfo.phone || undefined,
          clientEmail: clientInfo.email || undefined,
          vehicleReg: clientInfo.vehicleReg || undefined,
          vehicleMake: clientInfo.vehicleMake || undefined,
          vehicleYear: clientInfo.vehicleYear || undefined,
          sumInsured: result.sumInsured,
          basicRate: result.basicRate,
          basicPremium: result.basicPremium,
          minimumApplied: result.minimumApplied,
          minPremium: result.minPremium,
          benefits: result.benefits,
          totalBenefits: result.totalBenefits,
          iraLevy: result.iraLevy,
          stampDuty: result.stampDuty,
          phcf: result.phcf,
          grandTotal: result.grandTotal,
          agencyCommission: result.agencyCommission,
          commissionRate: result.commissionRate,
          validDays: 30,
        }),
      });

      if (!res.ok) {
        setPdfError("Failed to generate proposal. Please try again.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const clientRef = clientInfo.name
        ? clientInfo.name.replace(/\s+/g, "-")
        : "Quote";
      a.download = `BeSure-Proposal-${clientRef}-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setPdfError("Something went wrong. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  function toggleBenefit(b: BenefitOption) {
    setSelectedBenefits(prev => {
      const exists = prev.find(x => x.benefitOptionId === b.id);
      if (exists) return prev.filter(x => x.benefitOptionId !== b.id);
      return [...prev, { benefitOptionId: b.id, benefitName: b.name, amountKes: "" }];
    });
  }

  function updateBenefitAmount(id: string, amount: string) {
    setSelectedBenefits(prev =>
      prev.map(b => b.benefitOptionId === id ? { ...b, amountKes: amount } : b)
    );
  }

  function resetAll() {
    setSumInsured(""); setBasicRate(""); setSelectedInsurerId("");
    setManualInsurer(""); setSelectedBenefits([]); setResult(null);
    setError(""); setShowBenefits(false);
    setClientInfo({ name: "", phone: "", email: "", vehicleReg: "", vehicleMake: "", vehicleYear: "" });
  }

  function buildQuoteSummary() {
    if (!result) return "";
    const insName = result.insurer?.name || manualInsurer || "—";
    const lines = [
      `INSURANCE QUOTE SUMMARY`,
      `═══════════════════════════════`,
      `Insurance Type: ${insuranceType}`,
      `Insurer: ${insName}`,
      ``,
      `Sum Insured:     ${fmt(result.sumInsured)}`,
      `Basic Rate:      ${result.basicRate}%`,
      `Basic Premium:   ${fmt(result.basicPremium)}`,
      ...(result.minimumApplied ? [`  (minimum premium applied: ${fmt(result.minPremium || 0)})`] : []),
      ...(result.benefits.length > 0 ? [
        ``,
        `Additional Benefits:`,
        ...result.benefits.map(b => `  ${b.benefitName}: ${fmt(b.amountKes)}`),
        `Benefits Total:  ${fmt(result.totalBenefits)}`,
      ] : []),
      ``,
      `Statutory Levies:`,
      `  IRA Levy (0.45% of Basic+Benefits): ${fmt(result.iraLevy)}`,
      `  Stamp Duty:          KES 40.00`,
      ``,
      `═══════════════════════════════`,
      `GRAND TOTAL:     ${fmt(result.grandTotal)}`,
      `═══════════════════════════════`,
      `BeSure Insurance Solutions | IRA Regulated`,
    ];
    return lines.join("\n");
  }

  const inStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px",
    backgroundColor: "var(--bg-app)", border: "1px solid var(--border)",
    borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", outline: "none",
  };
  const lbStyle: React.CSSProperties = {
    display: "block", fontSize: "12px", fontWeight: 600,
    color: "var(--text-secondary)", marginBottom: "5px",
    textTransform: "uppercase", letterSpacing: "0.05em",
  };
  function foc(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    (e.target as HTMLElement).style.borderColor = "var(--brand)";
  }
  function blr(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    (e.target as HTMLElement).style.borderColor = "var(--border)";
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
          Quick premium quotes — no policy created
        </p>
        <button
          onClick={resetAll}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 12px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ffffff"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
        >
          <RefreshCw size={12} /> Reset
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "start" }}>
        {/* ── INPUT PANEL ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Insurance type */}
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "18px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid var(--border)" }}>Insurance Type</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {INSURANCE_TYPES.map((t) => (
                <label key={t.value} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "8px", cursor: "pointer", border: `1px solid ${insuranceType === t.value ? "var(--brand)" : "var(--border)"}`, backgroundColor: insuranceType === t.value ? "rgba(16,185,129,0.08)" : "var(--bg-app)" }}>
                  <input type="radio" name="insuranceType" value={t.value} checked={insuranceType === t.value} onChange={(e) => setInsuranceType(e.target.value)} style={{ width: "auto", margin: 0, accentColor: "var(--brand)" }} />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: insuranceType === t.value ? "var(--brand)" : "var(--text-secondary)" }}>{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Insurer + rate */}
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "18px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid var(--border)" }}>Insurer & Rate</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={lbStyle}>Insurer</label>
                <select value={selectedInsurerId} onChange={(e) => { if (e.target.value === "manual") setSelectedInsurerId(""); else setSelectedInsurerId(e.target.value); }} style={inStyle} onFocus={foc} onBlur={blr}>
                  <option value="">Select insurer...</option>
                  {insurers.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  <option value="manual">Not in list — enter manually</option>
                </select>
              </div>
              {!selectedInsurerId && (
                <div>
                  <label style={lbStyle}>Insurer Name (Manual)</label>
                  <input value={manualInsurer} onChange={(e) => setManualInsurer(e.target.value)} placeholder="Type insurer name..." style={inStyle} onFocus={foc} onBlur={blr} />
                </div>
              )}
              <div>
                <label style={lbStyle}>Basic Premium Rate (%)</label>
                <input type="number" step="0.01" value={basicRate} onChange={(e) => setBasicRate(e.target.value)} placeholder="e.g. 4.00" style={inStyle} onFocus={foc} onBlur={blr} />
                {selectedInsurerId && <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>Auto-filled from insurer — editable</p>}
              </div>
            </div>
          </div>

          {/* Vehicle value */}
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "18px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid var(--border)" }}>Vehicle Value</p>
            <div>
              <label style={lbStyle}>Sum Insured / Vehicle Value (KES)</label>
              <input type="number" value={sumInsured} onChange={(e) => setSumInsured(e.target.value)} placeholder="e.g. 1500000" style={{ ...inStyle, fontSize: "15px", fontWeight: 600, color: "var(--brand)" }} onFocus={foc} onBlur={blr} />
            </div>
            {sumInsured && parseFloat(sumInsured) > 0 && (
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                {parseFloat(sumInsured).toLocaleString("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 })}
              </p>
            )}
          </div>

          {/* Additional benefits */}
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
            <button onClick={() => setShowBenefits(!showBenefits)} style={{ width: "100%", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", borderBottom: showBenefits ? "1px solid var(--border)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>Additional Benefits</span>
                {selectedBenefits.length > 0 && (
                  <span style={{ padding: "1px 7px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: "rgba(16,185,129,0.15)", color: "var(--brand)" }}>
                    {selectedBenefits.length} selected
                  </span>
                )}
              </div>
              {showBenefits ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
            </button>
            {showBenefits && (
              <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {benefitOptions.map((b) => {
                  const selected = selectedBenefits.find(x => x.benefitOptionId === b.id);
                  const isLossOfUse = b.name === "Loss of Use / Car Hire";
                  return (
                    <div key={b.id} style={{ padding: "10px 12px", borderRadius: "8px", border: `1px solid ${selected ? "var(--brand)" : "var(--border)"}`, backgroundColor: selected ? "rgba(16,185,129,0.04)" : "var(--bg-app)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <input type="checkbox" checked={!!selected} onChange={() => toggleBenefit(b)} style={{ width: "15px", height: "15px", margin: 0, accentColor: "var(--brand)" }} />
                        <span style={{ fontSize: "13px", fontWeight: 600, flex: 1, color: selected ? "var(--text-primary)" : "var(--text-secondary)" }}>{b.name}</span>
                        {selected && (
                          isLossOfUse ? (
                            <div style={{ display: "flex", gap: "6px" }}>
                              {["10", "20", "30"].map((days) => {
                                const dayNum = parseInt(days);
                                const premium = dayNum === 10 ? "3000" : dayNum === 20 ? "6000" : "9000";
                                const isSelected = selected.amountKes === premium;
                                return (
                                  <button
                                    key={days}
                                    type="button"
                                    onClick={() => updateBenefitAmount(b.id, premium)}
                                    style={{
                                      padding: "5px 8px", borderRadius: "6px", cursor: "pointer",
                                      border: `1px solid ${isSelected ? "var(--brand)" : "var(--border)"}`,
                                      backgroundColor: isSelected ? "rgba(16,185,129,0.15)" : "var(--bg-card)",
                                      color: isSelected ? "var(--brand)" : "var(--text-secondary)",
                                      fontSize: "11px", fontWeight: 600,
                                    }}
                                  >
                                    {days}d
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>KES</span>
                              <input type="number" value={selected.amountKes} onChange={(e) => updateBenefitAmount(b.id, e.target.value)} placeholder="0.00"
                                style={{ width: "100px", padding: "5px 8px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-primary)", fontSize: "13px", outline: "none" }}
                                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand)"; }}
                                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }} />
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Client info for proposal */}
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
            <button onClick={() => setShowClientInfo(!showClientInfo)} style={{ width: "100%", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", borderBottom: showClientInfo ? "1px solid var(--border)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <User size={14} color="var(--text-muted)" />
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>Client Info</span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>— for PDF proposal</span>
              </div>
              {showClientInfo ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
            </button>
            {showClientInfo && (
              <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ ...lbStyle, display: "flex", alignItems: "center", gap: "5px" }}><User size={10} /> Client Name</label>
                    <input value={clientInfo.name} onChange={(e) => setClientInfo(p => ({ ...p, name: e.target.value }))} placeholder="John Kamau" style={inStyle} onFocus={foc} onBlur={blr} />
                  </div>
                  <div>
                    <label style={{ ...lbStyle, display: "flex", alignItems: "center", gap: "5px" }}><Phone size={10} /> Phone</label>
                    <input value={clientInfo.phone} onChange={(e) => setClientInfo(p => ({ ...p, phone: e.target.value }))} placeholder="0712 345 678" style={inStyle} onFocus={foc} onBlur={blr} />
                  </div>
                  <div>
                    <label style={{ ...lbStyle, display: "flex", alignItems: "center", gap: "5px" }}><Mail size={10} /> Email</label>
                    <input type="email" value={clientInfo.email} onChange={(e) => setClientInfo(p => ({ ...p, email: e.target.value }))} placeholder="client@email.com" style={inStyle} onFocus={foc} onBlur={blr} />
                  </div>
                  <div>
                    <label style={{ ...lbStyle, display: "flex", alignItems: "center", gap: "5px" }}><Car size={10} /> Vehicle Reg</label>
                    <input value={clientInfo.vehicleReg} onChange={(e) => setClientInfo(p => ({ ...p, vehicleReg: e.target.value }))} placeholder="KDA 123A" style={inStyle} onFocus={foc} onBlur={blr} />
                  </div>
                  <div>
                    <label style={lbStyle}>Make & Model</label>
                    <input value={clientInfo.vehicleMake} onChange={(e) => setClientInfo(p => ({ ...p, vehicleMake: e.target.value }))} placeholder="Toyota Harrier" style={inStyle} onFocus={foc} onBlur={blr} />
                  </div>
                  <div>
                    <label style={lbStyle}>Year</label>
                    <input value={clientInfo.vehicleYear} onChange={(e) => setClientInfo(p => ({ ...p, vehicleYear: e.target.value }))} placeholder="2020" style={inStyle} onFocus={foc} onBlur={blr} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RESULT PANEL ── */}
        <div style={{ position: "sticky", top: "16px" }}>
          {!result && !loading && (
            <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "48px 24px", textAlign: "center" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "var(--brand-dim)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Calculator size={24} color="var(--brand)" />
              </div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Enter details to calculate</p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Fill in sum insured and rate on the left — premium calculates automatically.</p>
            </div>
          )}

          {loading && !result && (
            <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "48px 24px", textAlign: "center" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Calculating...</p>
            </div>
          )}

          {error && (
            <div style={{ padding: "12px 16px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#fca5a5", fontSize: "13px", marginBottom: "12px" }}>
              {error}
            </div>
          )}

          {result && (
            <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
              {/* Header */}
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", margin: 0 }}>Premium Breakdown</p>
                  {result.insurer && <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>{result.insurer.name} · {insuranceType.replace("Motor - ", "")}</p>}
                </div>
                <button onClick={() => copyToClipboard(buildQuoteSummary(), setCopied)}
                  style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "6px", border: "1px solid var(--border)", backgroundColor: "transparent", color: copied ? "var(--brand)" : "var(--text-muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <div style={{ padding: "16px 18px" }}>
                {/* Sum insured */}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Sum Insured</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{fmt(result.sumInsured)}</span>
                </div>

                {/* Basic premium */}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Basic Premium ({result.basicRate}%)</span>
                    {result.minimumApplied && <span style={{ display: "block", fontSize: "10px", color: "#fbbf24", marginTop: "1px" }}>⚠ Minimum premium applied ({fmt(result.minPremium || 0)})</span>}
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{fmt(result.basicPremium)}</span>
                </div>

                {/* Benefits */}
                {result.benefits.length > 0 && (
                  <>
                    <div style={{ padding: "6px 0 2px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Additional Benefits</span>
                    </div>
                    {result.benefits.map((b) => (
                      <div key={b.benefitName} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0 5px 10px", borderBottom: "1px solid var(--border)" }}>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>• {b.benefitName}</span>
                        <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>{fmt(b.amountKes)}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)", backgroundColor: "rgba(16,185,129,0.04)", paddingLeft: "10px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Benefits Sub-total</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>{fmt(result.totalBenefits)}</span>
                    </div>
                  </>
                )}

                {/* Statutory levies */}
                <div style={{ padding: "6px 0 2px", marginTop: "2px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Statutory Levies</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>IRA Levy (0.45%)</span>
                    <span style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginTop: "1px" }}>On Basic Premium + Benefits</span>
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{fmt(result.iraLevy)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Stamp Duty</span>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{fmt(result.stampDuty)}</span>
                </div>

                {/* Grand total */}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 12px", marginTop: "8px", backgroundColor: "var(--brand-dim)", borderRadius: "8px", border: "1px solid var(--brand)" }}>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--brand)" }}>GRAND TOTAL</span>
                  <span style={{ fontSize: "18px", fontWeight: 800, color: "var(--brand)" }}>{fmt(result.grandTotal)}</span>
                </div>

                {/* Installment scenarios */}
                <div style={{ marginTop: "14px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "8px" }}>Payment Options</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                    {[
                      { label: "Full", amount: result.grandTotal, sub: "Due on start date" },
                      { label: "2 Inst.", amount: result.grandTotal / 2, sub: "Each installment" },
                      { label: "3 Inst.", amount: result.grandTotal / 3, sub: "Each installment" },
                    ].map(({ label, amount, sub }) => (
                      <div key={label} style={{ padding: "8px 10px", backgroundColor: "var(--bg-app)", borderRadius: "6px", border: "1px solid var(--border)", textAlign: "center" }}>
                        <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", margin: "0 0 3px" }}>{label}</p>
                        <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 1px" }}>{fmt(amount)}</p>
                        <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: 0 }}>{sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div style={{ padding: "12px 18px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "8px" }}>
                {/* Download proposal PDF */}
                {pdfError && (
                  <p style={{ fontSize: "12px", color: "#f87171", margin: 0 }}>{pdfError}</p>
                )}
                <button
                  onClick={downloadProposal}
                  disabled={downloadingPdf}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                    padding: "10px", backgroundColor: downloadingPdf ? "var(--brand-dim)" : "var(--bg-app)",
                    color: "var(--brand)", border: "1px solid var(--brand)", borderRadius: "8px",
                    fontSize: "13px", fontWeight: 700, cursor: downloadingPdf ? "not-allowed" : "pointer",
                    transition: "background-color 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!downloadingPdf) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--brand-dim)"; }}
                  onMouseLeave={(e) => { if (!downloadingPdf) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-app)"; }}
                >
                  {downloadingPdf
                    ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating PDF...</>
                    : <><FileDown size={14} /> Download Proposal PDF</>
                  }
                </button>
                <a
                  href={`/policies/new?${selectedInsurerId ? `insurerId=${selectedInsurerId}&` : ""}sumInsured=${sumInsured}&basicRate=${basicRate}&insuranceType=${encodeURIComponent(insuranceType)}`}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "9px", backgroundColor: "var(--brand)", color: "#000", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, textDecoration: "none", cursor: "pointer" }}
                >
                  Create Policy with this Quote
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}