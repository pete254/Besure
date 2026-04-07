// src/app/(dashboard)/policies/new/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

interface Insurer {
  id: string; name: string; isActive: boolean;
  rateMotorPrivate?: string | null; rateMotorCommercial?: string | null; ratePsv?: string | null;
  minPremiumPrivate?: string | null; minPremiumCommercial?: string | null; minPremiumPsv?: string | null;
}
interface Benefit { id: string; name: string; isActive: boolean; }
interface Customer {
  id: string; firstName: string; lastName: string;
  companyName?: string | null; customerType: string; phone: string;
}

interface BenefitEntry {
  benefitOptionId: string;
  benefitName: string;
  amountKes: string;
  windscreenValue?: string;
  lossOfUseDays?: string;
}

interface PolicyData {
  insuranceType: string;
  customerId: string; customerName: string;
  insurerId: string; insurerNameManual: string;
  vehicle: {
    make: string; model: string; year: string; cc: string; tonnage: string;
    seats: string; chassisNo: string; engineNo: string; regNo: string;
    bodyType: string; colour: string;
  };
  coverType: string; sumInsured: string; startDate: string; endDate: string; policyNumber: string;
  basicRate: string; basicPremium: string;
  iraLevy: string;           // 0.45% of basic premium (training levy IS included here)
  stampDuty: string; phcf: string;
  benefits: BenefitEntry[]; totalBenefits: string;
  grandTotal: string; paymentMode: string; ipfProvider: string; ipfLoanReference: string; notes: string;
}

const INSURANCE_TYPES = [
  { value: "Motor - Private", label: "Motor — Private", motor: true },
  { value: "Motor - Commercial", label: "Motor — Commercial", motor: true },
  { value: "Motor - PSV / Matatu", label: "Motor — PSV / Matatu", motor: true },
  { value: "Fire & Perils", label: "Fire & Perils", motor: false },
  { value: "Domestic Package", label: "Domestic Package", motor: false },
  { value: "Medical / Health", label: "Medical / Health", motor: false },
  { value: "Life Insurance", label: "Life Insurance", motor: false },
  { value: "Travel Insurance", label: "Travel Insurance", motor: false },
];

const BODY_TYPES = ["S Wagon", "Saloon", "Pickup/Van", "Bus", "Truck", "Prime Mover", "Trailer"];
const COVER_TYPES = ["Comprehensive", "TPO", "TPFT"];
const PAYMENT_MODES = ["Full Payment", "2 Installments", "3 Installments", "IPF"];
const STEPS = [
  "Insurance Type", "Customer & Insurer", "Vehicle",
  "Cover & Valuation", "Rate & Premium", "Benefits", "Summary & Payment",
];

const BENEFIT_TYPES: Record<string, string> = {
  "Excess Protector": "excess",
  "Windscreen Cover": "windscreen",
  "Loss of Use / Car Hire": "loss_of_use",
  "Entertainment Unit": "entertainment",
};

function formatKES(val: string) {
  const n = parseFloat(val || "0");
  if (isNaN(n)) return "KES 0.00";
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

const emptyPolicy: PolicyData = {
  insuranceType: "", customerId: "", customerName: "", insurerId: "", insurerNameManual: "",
  vehicle: { make: "", model: "", year: "", cc: "", tonnage: "", seats: "", chassisNo: "", engineNo: "", regNo: "", bodyType: "", colour: "" },
  coverType: "", sumInsured: "", startDate: "", endDate: "", policyNumber: "",
  basicRate: "", basicPremium: "", iraLevy: "", stampDuty: "40", phcf: "100",
  benefits: [], totalBenefits: "0",
  grandTotal: "", paymentMode: "Full Payment", ipfProvider: "", ipfLoanReference: "", notes: "",
};

export default function NewPolicyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<PolicyData>({
    ...emptyPolicy,
    customerId: searchParams.get("customerId") || "",
  });
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isMotor = data.insuranceType.startsWith("Motor");

  useEffect(() => {
    fetch("/api/insurers").then(r => r.json()).then(d =>
      setInsurers(d.insurers?.filter((i: Insurer) => i.isActive) || []));
    fetch("/api/benefits").then(r => r.json()).then(d =>
      setBenefits(d.benefits?.filter((b: Benefit) => b.isActive) || []));
  }, []);

  useEffect(() => {
    if (!customerSearch || customerSearch.length < 2) { setCustomerResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(customerSearch)}&limit=5`);
      const d = await res.json();
      setCustomerResults(d.customers || []);
    }, 300);
    return () => clearTimeout(t);
  }, [customerSearch]);

  // ── Auto-calculate basic premium & IRA levy (0.45% — training levy IS included) ──
  useEffect(() => {
    const sum = parseFloat(data.sumInsured || "0");
    const rate = parseFloat(data.basicRate || "0");
    if (sum > 0 && rate > 0) {
      const basic = (sum * rate / 100).toFixed(2);
      // IRA Levy = 0.45% of basic premium. Per IRA regulations this single figure
      // already includes what was previously called the "training levy" – no separate line.
      const ira = (parseFloat(basic) * 0.0045).toFixed(2);
      setData(prev => ({ ...prev, basicPremium: basic, iraLevy: ira }));
    }
  }, [data.sumInsured, data.basicRate]);

  // Recalculate excess protector when sum insured changes
  useEffect(() => {
    setData(prev => {
      const updated = prev.benefits.map(b => {
        if (b.benefitName === "Excess Protector") {
          return { ...b, amountKes: (parseFloat(prev.sumInsured || "0") * 0.005).toFixed(2) };
        }
        return b;
      });
      return {
        ...prev,
        benefits: updated,
        totalBenefits: updated.reduce((s, b) => s + parseFloat(b.amountKes || "0"), 0).toFixed(2),
      };
    });
  }, [data.sumInsured]);

  // ── Grand total: basic + benefits + IRA levy + stamp + PHCF (NO separate training levy) ──
  useEffect(() => {
    const basic  = parseFloat(data.basicPremium  || "0");
    const bens   = parseFloat(data.totalBenefits  || "0");
    const ira    = parseFloat(data.iraLevy        || "0");
    const stamp  = parseFloat(data.stampDuty      || "40");
    const phcf   = parseFloat(data.phcf           || "100");
    setData(prev => ({ ...prev, grandTotal: (basic + bens + ira + stamp + phcf).toFixed(2) }));
  }, [data.basicPremium, data.totalBenefits, data.iraLevy, data.stampDuty, data.phcf]);

  // ── Auto end date: start + 1 year − 1 day ──
  useEffect(() => {
    if (data.startDate) {
      const end = new Date(data.startDate);
      end.setFullYear(end.getFullYear() + 1);
      end.setDate(end.getDate() - 1); // ← minus 1 day
      setData(prev => ({ ...prev, endDate: end.toISOString().split("T")[0] }));
    }
  }, [data.startDate]);

  function handleInsurerSelect(insurerId: string) {
    const ins = insurers.find(i => i.id === insurerId);
    if (!ins) return;
    let rate = "";
    if (data.insuranceType === "Motor - Private") rate = ins.rateMotorPrivate || "";
    else if (data.insuranceType === "Motor - Commercial") rate = ins.rateMotorCommercial || "";
    else if (data.insuranceType === "Motor - PSV / Matatu") rate = ins.ratePsv || "";
    setData(prev => ({ ...prev, insurerId, basicRate: rate }));
  }

  function recalcTotal(updated: BenefitEntry[]) {
    return updated.reduce((s, b) => s + parseFloat(b.amountKes || "0"), 0).toFixed(2);
  }

  function toggleBenefit(b: Benefit) {
    setData(prev => {
      const exists = prev.benefits.find(x => x.benefitOptionId === b.id);
      let updated: BenefitEntry[];
      if (exists) {
        updated = prev.benefits.filter(x => x.benefitOptionId !== b.id);
      } else {
        let autoAmount = "";
        const bType = BENEFIT_TYPES[b.name];
        if (bType === "excess") autoAmount = (parseFloat(prev.sumInsured || "0") * 0.005).toFixed(2);
        else if (bType === "loss_of_use") autoAmount = "30000";
        updated = [...prev.benefits, { benefitOptionId: b.id, benefitName: b.name, amountKes: autoAmount }];
      }
      return { ...prev, benefits: updated, totalBenefits: recalcTotal(updated) };
    });
  }

  function updateBenefitField(id: string, field: keyof BenefitEntry, value: string) {
    setData(prev => {
      const updated = prev.benefits.map(b => {
        if (b.benefitOptionId !== id) return b;
        const entry = { ...b, [field]: value };
        if (field === "windscreenValue" && b.benefitName === "Windscreen Cover") {
          const wVal = parseFloat(value || "0");
          entry.amountKes = wVal <= 50000 ? "0" : (wVal * 0.1).toFixed(2);
        }
        if (field === "lossOfUseDays" && b.benefitName === "Loss of Use / Car Hire") {
          entry.amountKes = (parseInt(value || "0") * 3000).toFixed(2);
        }
        return entry;
      });
      return { ...prev, benefits: updated, totalBenefits: recalcTotal(updated) };
    });
  }

  function canProceed() {
    if (step === 1) return !!data.insuranceType;
    if (step === 2) return !!data.customerId && (!!data.insurerId || !!data.insurerNameManual);
    if (step === 3) {
      if (!isMotor) return true;
      return !!(data.vehicle.make && data.vehicle.model && data.vehicle.year && data.vehicle.chassisNo && data.vehicle.engineNo && data.vehicle.regNo);
    }
    if (step === 4) return !!(data.startDate && data.endDate);
    return true;
  }

  async function handleSubmit() {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...data,
        trainingLevy: "0", // kept for schema compat but always 0 – IRA levy covers it
        vehicle: isMotor ? {
          ...data.vehicle,
          year: parseInt(data.vehicle.year),
          cc: data.vehicle.cc ? parseInt(data.vehicle.cc) : null,
          seats: data.vehicle.seats ? parseInt(data.vehicle.seats) : null,
        } : null,
        insurerId: data.insurerId || null,
        insurerNameManual: !data.insurerId ? data.insurerNameManual : null,
      };
      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) { setError(result.error || "Failed to create policy"); return; }
      router.push(`/policies/${result.policy.id}`);
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
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
    <div style={{ maxWidth: "760px", margin: "0 auto" }}>
      <Link
        href="/policies"
        style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", marginBottom: "20px", fontSize: "13px", color: "var(--text-muted)" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}
      >
        <ArrowLeft size={14} /> Back to Policies
      </Link>

      {/* Stepper */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "28px", overflowX: "auto", paddingBottom: "4px" }}>
        {STEPS.map((label, i) => {
          const num = i + 1;
          const done = step > num;
          const active = step === num;
          return (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
              <div
                onClick={() => done && setStep(num)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px", padding: "5px 10px",
                  borderRadius: "20px",
                  backgroundColor: active ? "var(--brand-dim)" : "transparent",
                  border: `1px solid ${active ? "var(--brand)" : done ? "var(--border)" : "transparent"}`,
                  cursor: done ? "pointer" : "default",
                }}
              >
                <div style={{
                  width: "18px", height: "18px", borderRadius: "50%",
                  backgroundColor: active ? "var(--brand)" : done ? "var(--bg-card)" : "var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {done
                    ? <Check size={10} color="var(--brand)" />
                    : <span style={{ fontSize: "10px", fontWeight: 700, color: active ? "#000" : "var(--text-muted)" }}>{num}</span>
                  }
                </div>
                <span style={{
                  fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap",
                  color: active ? "var(--brand)" : done ? "var(--text-secondary)" : "var(--text-muted)",
                }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && <div style={{ width: "16px", height: "1px", backgroundColor: "var(--border)" }} />}
            </div>
          );
        })}
      </div>

      {error && (
        <div style={{ padding: "12px 16px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#fca5a5", fontSize: "13px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {/* ── STEP 1: Insurance Type ── */}
      {step === 1 && (
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>Select Insurance Type</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {INSURANCE_TYPES.map((t) => (
              <label
                key={t.value}
                style={{
                  display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px",
                  borderRadius: "8px", cursor: "pointer",
                  border: `1px solid ${data.insuranceType === t.value ? "var(--brand)" : "var(--border)"}`,
                  backgroundColor: data.insuranceType === t.value ? "rgba(16,185,129,0.08)" : "var(--bg-app)",
                }}
              >
                <input
                  type="radio" name="insuranceType" value={t.value}
                  checked={data.insuranceType === t.value}
                  onChange={(e) => setData(prev => ({ ...prev, insuranceType: e.target.value }))}
                  style={{ width: "auto", margin: 0 }}
                />
                <span style={{ fontSize: "13px", fontWeight: 600, color: data.insuranceType === t.value ? "var(--brand)" : "var(--text-secondary)" }}>
                  {t.label}
                </span>
                {!t.motor && (
                  <span style={{ marginLeft: "auto", padding: "1px 6px", borderRadius: "10px", fontSize: "10px", fontWeight: 600, backgroundColor: "rgba(107,114,128,0.15)", color: "#9ca3af" }}>Phase 2</span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 2: Customer & Insurer ── */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>Customer</p>
            {data.customerId && data.customerName ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", backgroundColor: "var(--bg-app)", borderRadius: "8px", border: "1px solid var(--brand)" }}>
                <div>
                  <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{data.customerName}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Selected</p>
                </div>
                <button className="btn-secondary" style={{ padding: "5px 10px", fontSize: "12px" }} onClick={() => setData(prev => ({ ...prev, customerId: "", customerName: "" }))}>Change</button>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <input
                  placeholder="Search customer by name or phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  style={inStyle} onFocus={foc} onBlur={blr}
                />
                {customerResults.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", marginTop: "4px", overflow: "hidden" }}>
                    {customerResults.map((c) => {
                      const name = c.customerType === "Company" ? c.companyName || "" : `${c.firstName} ${c.lastName}`;
                      return (
                        <div
                          key={c.id}
                          onClick={() => { setData(prev => ({ ...prev, customerId: c.id, customerName: name })); setCustomerSearch(""); setCustomerResults([]); }}
                          style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
                        >
                          <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{name}</p>
                          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>{c.phone}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>Insurer</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={lbStyle}>Select Insurer</label>
                <select
                  value={data.insurerId}
                  onChange={(e) => {
                    if (e.target.value === "manual") setData(prev => ({ ...prev, insurerId: "" }));
                    else handleInsurerSelect(e.target.value);
                  }}
                  style={inStyle} onFocus={foc} onBlur={blr}
                >
                  <option value="">Select insurer...</option>
                  {insurers.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  <option value="manual">Not in list — Enter manually</option>
                </select>
              </div>
              {!data.insurerId && (
                <div>
                  <label style={lbStyle}>Insurer Name (Manual)</label>
                  <input placeholder="Type insurer name..." value={data.insurerNameManual} onChange={(e) => setData(prev => ({ ...prev, insurerNameManual: e.target.value }))} style={inStyle} onFocus={foc} onBlur={blr} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Vehicle ── */}
      {step === 3 && (
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>Vehicle Details</p>
          {!isMotor ? (
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Vehicle details not required for this type.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
              {[
                { key: "make", label: "Make *", placeholder: "Toyota" },
                { key: "model", label: "Model *", placeholder: "Harrier" },
                { key: "regNo", label: "Registration No. *", placeholder: "KDA 123A" },
                { key: "chassisNo", label: "Chassis No. *", placeholder: "VIN number" },
                { key: "engineNo", label: "Engine No. *", placeholder: "Engine number" },
                { key: "colour", label: "Colour", placeholder: "Silver" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={lbStyle}>{label}</label>
                  <input
                    placeholder={placeholder}
                    value={(data.vehicle as Record<string, string>)[key]}
                    onChange={(e) => setData(prev => ({ ...prev, vehicle: { ...prev.vehicle, [key]: e.target.value } }))}
                    style={inStyle} onFocus={foc} onBlur={blr}
                  />
                </div>
              ))}
              <div>
                <label style={lbStyle}>Year of Manufacture *</label>
                <input type="number" placeholder="2020" value={data.vehicle.year}
                  onChange={(e) => setData(prev => ({ ...prev, vehicle: { ...prev.vehicle, year: e.target.value } }))}
                  style={inStyle} onFocus={foc} onBlur={blr} />
              </div>
              <div>
                <label style={lbStyle}>Body Type</label>
                <select value={data.vehicle.bodyType}
                  onChange={(e) => setData(prev => ({ ...prev, vehicle: { ...prev.vehicle, bodyType: e.target.value } }))}
                  style={inStyle} onFocus={foc} onBlur={blr}>
                  <option value="">Select...</option>
                  {BODY_TYPES.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={lbStyle}>CC (Engine Capacity)</label>
                <input type="number" placeholder="1500" value={data.vehicle.cc}
                  onChange={(e) => setData(prev => ({ ...prev, vehicle: { ...prev.vehicle, cc: e.target.value } }))}
                  style={inStyle} onFocus={foc} onBlur={blr} />
              </div>
              <div>
                <label style={lbStyle}>No. of Passengers</label>
                <input type="number" placeholder="5" value={data.vehicle.seats}
                  onChange={(e) => setData(prev => ({ ...prev, vehicle: { ...prev.vehicle, seats: e.target.value } }))}
                  style={inStyle} onFocus={foc} onBlur={blr} />
              </div>
              {(data.insuranceType === "Motor - Commercial" || data.insuranceType === "Motor - PSV / Matatu") && (
                <div>
                  <label style={lbStyle}>Tonnage</label>
                  <input type="number" placeholder="3.5" value={data.vehicle.tonnage}
                    onChange={(e) => setData(prev => ({ ...prev, vehicle: { ...prev.vehicle, tonnage: e.target.value } }))}
                    style={inStyle} onFocus={foc} onBlur={blr} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 4: Cover & Valuation ── */}
      {step === 4 && (
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>Cover Details & Valuation</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {isMotor && (
              <div>
                <label style={lbStyle}>Cover Type *</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  {COVER_TYPES.map((ct) => (
                    <label
                      key={ct}
                      style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                        padding: "10px", borderRadius: "8px", cursor: "pointer",
                        border: `1px solid ${data.coverType === ct ? "var(--brand)" : "var(--border)"}`,
                        backgroundColor: data.coverType === ct ? "rgba(16,185,129,0.08)" : "var(--bg-app)",
                      }}
                    >
                      <input type="radio" name="coverType" value={ct} checked={data.coverType === ct}
                        onChange={(e) => setData(prev => ({ ...prev, coverType: e.target.value }))}
                        style={{ width: "auto", margin: 0 }} />
                      <span style={{ fontSize: "13px", fontWeight: 600, color: data.coverType === ct ? "var(--brand)" : "var(--text-secondary)" }}>{ct}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={lbStyle}>Vehicle Value / Sum Insured (KES) *</label>
                <input type="number" placeholder="1500000" value={data.sumInsured}
                  onChange={(e) => setData(prev => ({ ...prev, sumInsured: e.target.value }))}
                  style={inStyle} onFocus={foc} onBlur={blr} />
              </div>
              <div>
                <label style={lbStyle}>Policy Number</label>
                <input placeholder="Issued by insurer — can add later" value={data.policyNumber}
                  onChange={(e) => setData(prev => ({ ...prev, policyNumber: e.target.value }))}
                  style={inStyle} onFocus={foc} onBlur={blr} />
              </div>
              <div>
                <label style={lbStyle}>Policy Start Date *</label>
                <input type="date" value={data.startDate}
                  onChange={(e) => setData(prev => ({ ...prev, startDate: e.target.value }))}
                  style={inStyle} onFocus={foc} onBlur={blr} />
              </div>
              <div>
                <label style={lbStyle}>Policy End Date *</label>
                <input type="date" value={data.endDate}
                  onChange={(e) => setData(prev => ({ ...prev, endDate: e.target.value }))}
                  style={inStyle} onFocus={foc} onBlur={blr} />
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
                  Auto-set to 1 year − 1 day from start date
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 5: Rate & Premium ── */}
      {step === 5 && (
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>Rate Entry & Premium Calculation</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={lbStyle}>Basic Premium Rate (%) *</label>
                <input type="number" step="0.01" placeholder="4.00" value={data.basicRate}
                  onChange={(e) => setData(prev => ({ ...prev, basicRate: e.target.value }))}
                  style={inStyle} onFocus={foc} onBlur={blr} />
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Auto-filled from insurer — editable</p>
              </div>
              <div>
                <label style={lbStyle}>Sum Insured</label>
                <input
                  value={data.sumInsured ? `KES ${parseFloat(data.sumInsured).toLocaleString()}` : "—"}
                  readOnly
                  style={{ ...inStyle, backgroundColor: "var(--bg-sidebar)", cursor: "not-allowed", color: "var(--text-secondary)" }}
                />
              </div>
            </div>
            <div style={{ backgroundColor: "var(--bg-app)", borderRadius: "8px", border: "1px solid var(--border)", padding: "16px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
                Premium Breakdown (benefits added in next step)
              </p>
              {[
                { label: "Basic Premium", value: data.basicPremium },
                { label: "IRA Levy (0.45%)", value: data.iraLevy },
                { label: "Stamp Duty", value: data.stampDuty },
                { label: "PHCF", value: data.phcf },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{label}</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{formatKES(value || "0")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 6: Benefits ── */}
      {step === 6 && (
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
            Additional Benefits <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "12px" }}>(optional)</span>
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>
            Sum Insured: <strong style={{ color: "var(--brand)" }}>{formatKES(data.sumInsured)}</strong>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {benefits.map((b) => {
              const selected = data.benefits.find(x => x.benefitOptionId === b.id);
              const bType = BENEFIT_TYPES[b.name] || "custom";
              return (
                <div
                  key={b.id}
                  style={{
                    padding: "14px", borderRadius: "8px",
                    border: `1px solid ${selected ? "var(--brand)" : "var(--border)"}`,
                    backgroundColor: selected ? "rgba(16,185,129,0.04)" : "var(--bg-app)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <input
                      type="checkbox" checked={!!selected} onChange={() => toggleBenefit(b)}
                      style={{ width: "16px", height: "16px", margin: 0, accentColor: "var(--brand)" }}
                    />
                    <span style={{ fontSize: "13px", fontWeight: 600, flex: 1, color: selected ? "var(--text-primary)" : "var(--text-secondary)" }}>
                      {b.name}
                    </span>
                    {selected && bType === "custom" && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>KES</span>
                        <input
                          type="number" placeholder="0.00" value={selected.amountKes}
                          onChange={(e) => updateBenefitField(b.id, "amountKes", e.target.value)}
                          style={{ width: "120px", padding: "6px 10px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-primary)", fontSize: "13px", outline: "none" }}
                          onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand)"; }}
                          onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }}
                        />
                      </div>
                    )}
                  </div>
                  {selected && bType === "excess" && (
                    <div style={{ marginTop: "10px" }}>
                      <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                        Auto-calculated (0.5% of sum insured) — editable
                      </label>
                      <input
                        type="number" value={selected.amountKes}
                        onChange={(e) => updateBenefitField(b.id, "amountKes", e.target.value)}
                        style={{ width: "200px", padding: "7px 10px", backgroundColor: "var(--bg-card)", border: "1px solid var(--brand)", borderRadius: "6px", color: "var(--brand)", fontSize: "13px", outline: "none", fontWeight: 600 }}
                      />
                    </div>
                  )}
                  {selected && bType === "windscreen" && (
                    <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Windscreen Value (KES)</label>
                        <input type="number" placeholder="Enter windscreen value" value={selected.windscreenValue || ""}
                          onChange={(e) => updateBenefitField(b.id, "windscreenValue", e.target.value)}
                          style={{ width: "100%", padding: "7px 10px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-primary)", fontSize: "13px", outline: "none" }} />
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>≤ KES 50,000 = free · Above: 10%</p>
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Premium (KES)</label>
                        <input type="number" value={selected.amountKes}
                          onChange={(e) => updateBenefitField(b.id, "amountKes", e.target.value)}
                          style={{ width: "100%", padding: "7px 10px", backgroundColor: "var(--bg-card)", border: "1px solid var(--brand)", borderRadius: "6px", color: "var(--brand)", fontSize: "13px", outline: "none", fontWeight: 600 }} />
                      </div>
                    </div>
                  )}
                  {selected && bType === "loss_of_use" && (
                    <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Number of Days</label>
                        <select value={selected.lossOfUseDays || "10"} onChange={(e) => updateBenefitField(b.id, "lossOfUseDays", e.target.value)}
                          style={{ width: "100%", padding: "7px 10px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-primary)", fontSize: "13px", outline: "none" }}>
                          <option value="10">10 days — KES 30,000</option>
                          <option value="20">20 days — KES 60,000</option>
                          <option value="30">30 days — KES 90,000</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Premium (KES)</label>
                        <input type="number" value={selected.amountKes}
                          onChange={(e) => updateBenefitField(b.id, "amountKes", e.target.value)}
                          style={{ width: "100%", padding: "7px 10px", backgroundColor: "var(--bg-card)", border: "1px solid var(--brand)", borderRadius: "6px", color: "var(--brand)", fontSize: "13px", outline: "none", fontWeight: 600 }} />
                      </div>
                    </div>
                  )}
                  {selected && bType === "entertainment" && (
                    <div style={{ marginTop: "10px" }}>
                      <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Entertainment Unit Premium (KES)</label>
                      <input type="number" placeholder="Enter premium amount" value={selected.amountKes}
                        onChange={(e) => updateBenefitField(b.id, "amountKes", e.target.value)}
                        style={{ width: "200px", padding: "7px 10px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-primary)", fontSize: "13px", outline: "none" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {data.benefits.length > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 0", borderTop: "1px solid var(--border)", marginTop: "12px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Total Benefits: </span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--brand)", marginLeft: "8px" }}>{formatKES(data.totalBenefits)}</span>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 7: Summary & Payment ── */}
      {step === 7 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
              Premium Summary
            </p>

            {/* 1. Basic Premium */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Sum Insured</span>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{formatKES(data.sumInsured || "0")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Basic Premium ({data.basicRate || "—"}%)</span>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{formatKES(data.basicPremium || "0")}</span>
            </div>

            {/* 2. Benefits – each listed individually BEFORE levies */}
            {data.benefits.length > 0 && (
              <>
                <div style={{ padding: "8px 0 2px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
                    Additional Benefits
                  </span>
                </div>
                {data.benefits.map((b) => (
                  <div key={b.benefitOptionId} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 6px 12px", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>• {b.benefitName}</span>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{formatKES(b.amountKes || "0")}</span>
                  </div>
                ))}
              </>
            )}

            {/* 3. Statutory Levies – come AFTER benefits */}
            <div style={{ padding: "8px 0 2px", marginTop: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
                Statutory Levies
              </span>
            </div>
            {[
              { label: "IRA Levy (0.45%)", value: data.iraLevy },
              { label: "Stamp Duty", value: data.stampDuty },
              { label: "PHCF", value: data.phcf },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{label}</span>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{formatKES(value || "0")}</span>
              </div>
            ))}

            {/* Grand total */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>GRAND TOTAL</span>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--brand)" }}>{formatKES(data.grandTotal)}</span>
            </div>
          </div>

          {/* Payment mode */}
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>Payment Mode</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {PAYMENT_MODES.map((mode) => (
                <label
                  key={mode}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px",
                    borderRadius: "8px", cursor: "pointer",
                    border: `1px solid ${data.paymentMode === mode ? "var(--brand)" : "var(--border)"}`,
                    backgroundColor: data.paymentMode === mode ? "rgba(16,185,129,0.08)" : "var(--bg-app)",
                  }}
                >
                  <input type="radio" name="paymentMode" value={mode} checked={data.paymentMode === mode}
                    onChange={(e) => setData(prev => ({ ...prev, paymentMode: e.target.value }))}
                    style={{ width: "auto", margin: 0 }} />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: data.paymentMode === mode ? "var(--brand)" : "var(--text-secondary)" }}>{mode}</span>
                </label>
              ))}
            </div>
            {data.paymentMode === "IPF" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "14px" }}>
                <div>
                  <label style={lbStyle}>IPF Provider</label>
                  <input placeholder="e.g. Mogo Finance" value={data.ipfProvider}
                    onChange={(e) => setData(prev => ({ ...prev, ipfProvider: e.target.value }))}
                    style={inStyle} onFocus={foc} onBlur={blr} />
                </div>
                <div>
                  <label style={lbStyle}>Loan Reference</label>
                  <input placeholder="Loan ref number" value={data.ipfLoanReference}
                    onChange={(e) => setData(prev => ({ ...prev, ipfLoanReference: e.target.value }))}
                    style={inStyle} onFocus={foc} onBlur={blr} />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
              Notes <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "12px" }}>(optional)</span>
            </p>
            <textarea
              placeholder="Any additional notes..."
              value={data.notes}
              onChange={(e) => setData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              style={{ width: "100%", padding: "9px 12px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", outline: "none", resize: "vertical" }}
              onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--brand)"; }}
              onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--border)"; }}
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
        <button className="btn-secondary" onClick={() => step > 1 ? setStep(s => s - 1) : router.push("/policies")}>
          <ArrowLeft size={14} /> {step === 1 ? "Cancel" : "Back"}
        </button>
        {step < 7 ? (
          <button
            className="btn-primary"
            disabled={!canProceed()}
            onClick={() => {
              // Skip vehicle step for non-motor
              if (!isMotor && step === 2) { setStep(4); return; }
              setStep(s => s + 1);
            }}
          >
            Next <ArrowRight size={14} />
          </button>
        ) : (
          <button className="btn-primary" disabled={saving} onClick={handleSubmit}>
            <Check size={14} /> {saving ? "Creating Policy..." : "Create Policy"}
          </button>
        )}
      </div>
    </div>
  );
}