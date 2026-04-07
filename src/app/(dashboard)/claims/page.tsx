// src/app/(dashboard)/claims/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, ChevronRight, AlertTriangle, X } from "lucide-react";

interface ClaimRow {
  claim: {
    id: string; claimNumber: string; dateOfLoss: string;
    dateReported: string; natureOfLoss: string; stage: string;
    repairEstimate?: string | null; approvedAmount?: string | null;
  };
  policy: { id: string; policyNumber?: string | null; insuranceType: string; } | null;
  customer: { id: string; firstName: string; lastName: string; companyName?: string | null; customerType: string; } | null;
  vehicle: { make: string; model: string; regNo: string; } | null;
}

// ── Executed removed; Approved + Declined added ──
const STAGE_COLORS: Record<string, { bg: string; color: string }> = {
  "Reported":            { bg: "rgba(107,114,128,0.15)", color: "#9ca3af" },
  "Documents Pending":   { bg: "rgba(245,158,11,0.15)",  color: "#fbbf24" },
  "Fully Documented":    { bg: "rgba(59,130,246,0.15)",  color: "#60a5fa" },
  "Assessed":            { bg: "rgba(139,92,246,0.15)",  color: "#a78bfa" },
  "Approved":            { bg: "rgba(16,185,129,0.15)",  color: "#10b981" },
  "Declined":            { bg: "rgba(239,68,68,0.15)",   color: "#f87171" },
  "Released / Settled":  { bg: "rgba(16,185,129,0.2)",   color: "#34d399" },
};

export default function ClaimsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [rows, setRows] = useState<ClaimRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState("All");

  const filterParam = searchParams.get("filter");
  const filterValue = searchParams.get("value");

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/claims");
      const data = await res.json();
      setRows(data.claims || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  useEffect(() => {
    if (filterParam === "stage" && filterValue) setStageFilter(filterValue);
    else if (filterParam === "nearing30") setStageFilter("All");
  }, [filterParam, filterValue]);

  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  let filtered = rows.filter((r) => {
    const name = r.customer
      ? r.customer.customerType === "Company"
        ? r.customer.companyName || ""
        : `${r.customer.firstName} ${r.customer.lastName}`
      : "";
    const matchesSearch =
      !search ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      r.claim.claimNumber.toLowerCase().includes(search.toLowerCase()) ||
      (r.vehicle?.regNo || "").toLowerCase().includes(search.toLowerCase());
    const matchesStage = stageFilter === "All" || r.claim.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  if (filterParam === "nearing30") {
    filtered = filtered.filter(
      (r) => r.claim.dateReported <= thirtyDaysAgoStr && r.claim.stage !== "Released / Settled"
    );
  } else if (filterParam === "active") {
    filtered = filtered.filter(
      (r) => r.claim.stage !== "Released / Settled" && r.claim.stage !== "Declined"
    );
  }

  const stages = ["All", ...Object.keys(STAGE_COLORS)];

  const activeFilter =
    filterParam === "nearing30" ? "Approaching 30 days" :
    filterParam === "active"    ? "Active claims" :
    filterParam === "stage" && filterValue ? `Stage: ${filterValue}` :
    null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          {loading ? "Loading..." : `${filtered.length} of ${rows.length} claim${rows.length !== 1 ? "s" : ""}`}
        </p>
        <Link
          href="/claims/new"
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", backgroundColor: "var(--brand)", color: "#000", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}
        >
          <Plus size={15} strokeWidth={2.5} /> New Claim
        </Link>
      </div>

      {/* Active filter badge */}
      {activeFilter && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Filtered by:</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "20px", backgroundColor: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", fontSize: "12px", fontWeight: 600, color: "#fbbf24" }}>
            {activeFilter}
            <button onClick={() => router.push("/claims")} style={{ background: "none", border: "none", cursor: "pointer", color: "#fbbf24", display: "flex", padding: 0 }}>
              <X size={12} />
            </button>
          </span>
        </div>
      )}

      {/* Search + stage dropdown */}
      <div style={{ display: "flex", gap: "10px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input
            placeholder="Search by customer, claim number, vehicle reg..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "9px 12px 9px 36px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", outline: "none" }}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand)"; }}
            onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }}
          />
        </div>
        <select
          value={stageFilter}
          onChange={(e) => { setStageFilter(e.target.value); router.push("/claims"); }}
          style={{ padding: "9px 12px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", outline: "none", minWidth: "160px" }}
        >
          {stages.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Stage pipeline summary cards */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
        {Object.entries(STAGE_COLORS).map(([stage, colors]) => {
          const count = rows.filter(r => r.claim.stage === stage).length;
          const isActive = stageFilter === stage;
          return (
            <div
              key={stage}
              onClick={() => {
                if (isActive) { setStageFilter("All"); router.push("/claims"); }
                else { setStageFilter(stage); router.push(`/claims?filter=stage&value=${encodeURIComponent(stage)}`); }
              }}
              style={{
                flexShrink: 0, padding: "8px 12px", borderRadius: "8px", cursor: "pointer",
                backgroundColor: isActive ? colors.bg : "var(--bg-card)",
                border: `1px solid ${isActive ? colors.color : "var(--border)"}`,
                transition: "all 0.1s",
              }}
            >
              <p style={{ fontSize: "18px", fontWeight: 700, color: colors.color, margin: 0, lineHeight: 1 }}>{count}</p>
              <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: "2px 0 0", whiteSpace: "nowrap" }}>{stage}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 1fr 1fr 1fr 1fr 32px", padding: "10px 16px", borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-sidebar)" }}>
          {["Claim No.", "Customer / Vehicle", "Nature", "Date", "Estimate", "Stage", ""].map((h) => (
            <span key={h} style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>Loading claims...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)", marginBottom: "12px", fontSize: "14px" }}>
              {search || stageFilter !== "All" || filterParam ? "No claims match your filters." : "No claims yet."}
            </p>
            {!search && stageFilter === "All" && !filterParam && (
              <Link href="/claims/new" style={{ color: "var(--brand)", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>Register first claim →</Link>
            )}
          </div>
        ) : (
          filtered.map((r) => {
            const customerName = r.customer
              ? r.customer.customerType === "Company" ? r.customer.companyName : `${r.customer.firstName} ${r.customer.lastName}`
              : "Unknown";
            const stageStyle = STAGE_COLORS[r.claim.stage] || { bg: "rgba(107,114,128,0.15)", color: "#9ca3af" };
            return (
              <Link
                key={r.claim.id}
                href={`/claims/${r.claim.id}`}
                style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 1fr 1fr 1fr 1fr 32px", padding: "12px 16px", alignItems: "center", textDecoration: "none", borderBottom: "1px solid var(--border)", transition: "background-color 0.1s" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "6px", backgroundColor: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <AlertTriangle size={13} color="#fbbf24" />
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>{r.claim.claimNumber}</span>
                </div>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{customerName}</p>
                  {r.vehicle && <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>{r.vehicle.make} {r.vehicle.model} · {r.vehicle.regNo}</p>}
                </div>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{r.claim.natureOfLoss}</span>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  {new Date(r.claim.dateReported).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                </span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {r.claim.repairEstimate
                    ? `KES ${parseFloat(r.claim.repairEstimate).toLocaleString("en-KE", { minimumFractionDigits: 0 })}`
                    : <span style={{ color: "var(--text-muted)" }}>—</span>}
                </span>
                <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: stageStyle.bg, color: stageStyle.color, whiteSpace: "nowrap" }}>
                  {r.claim.stage}
                </span>
                <ChevronRight size={14} color="var(--text-muted)" />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}