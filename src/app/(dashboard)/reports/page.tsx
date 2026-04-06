// src/app/(dashboard)/reports/page.tsx

"use client";

import { useState, useCallback } from "react";
import {
  FileText, Download, RefreshCw, Calendar, BarChart2,
  Users, Shield, AlertTriangle, CreditCard, TrendingUp,
  FileCheck, ChevronDown, ChevronUp, Printer,
} from "lucide-react";

// ──────────────────────────────────────────────────────────────
// Report definitions
// ──────────────────────────────────────────────────────────────

interface ReportDef {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  hasDates: boolean;
  extraParam?: { key: string; label: string; options: { value: string; label: string }[] };
  exports: ("csv" | "print")[];
}

const REPORTS: ReportDef[] = [
  {
    id: "policy-register",
    label: "Policy Register",
    description: "All policies with status, insurer, vehicle, value and premium. The master policy list.",
    icon: <FileText size={18} />,
    color: "#10b981",
    hasDates: true,
    exports: ["csv", "print"],
  },
  {
    id: "renewal-due",
    label: "Renewal Due Report",
    description: "Policies expiring within your chosen window — 30, 60, or 90 days. Perfect for renewal chasing.",
    icon: <Calendar size={18} />,
    color: "#fb923c",
    hasDates: false,
    extraParam: {
      key: "days",
      label: "Expiry Window",
      options: [
        { value: "30", label: "30 days" },
        { value: "60", label: "60 days" },
        { value: "90", label: "90 days" },
      ],
    },
    exports: ["csv", "print"],
  },
  {
    id: "payment-collection",
    label: "Payment Collection",
    description: "Installment status by period — collected vs outstanding. Track overdue premiums.",
    icon: <CreditCard size={18} />,
    color: "#60a5fa",
    hasDates: true,
    exports: ["csv"],
  },
  {
    id: "commission",
    label: "Commission Report",
    description: "Agency commission per insurer, per policy. Includes monthly and YTD summary by insurer.",
    icon: <TrendingUp size={18} />,
    color: "#a78bfa",
    hasDates: true,
    exports: ["csv", "print"],
  },
  {
    id: "claims-register",
    label: "Claims Register",
    description: "All claims with stage, dates, financial amounts and garage. The master claims list.",
    icon: <AlertTriangle size={18} />,
    color: "#fbbf24",
    hasDates: true,
    exports: ["csv", "print"],
  },
  {
    id: "documentation-compliance",
    label: "Documentation Compliance",
    description: "Active policies still missing documents or policy numbers. Identifies compliance gaps.",
    icon: <FileCheck size={18} />,
    color: "#f87171",
    hasDates: false,
    exports: ["csv"],
  },
  {
    id: "insurer-performance",
    label: "Insurer Performance",
    description: "Turnaround times, claim settlement ratios and premium volumes per insurer.",
    icon: <Shield size={18} />,
    color: "#34d399",
    hasDates: false,
    exports: ["csv", "print"],
  },
  {
    id: "customer-demographics",
    label: "Customer Demographics",
    description: "Gender, area and cover type breakdowns. Full customer list export.",
    icon: <Users size={18} />,
    color: "#f472b6",
    hasDates: false,
    exports: ["csv"],
  },
];

// ──────────────────────────────────────────────────────────────
// KES formatter
// ──────────────────────────────────────────────────────────────

function fmtKES(v: string | number | null) {
  const n = parseFloat(String(v || 0));
  if (isNaN(n)) return v ?? "—";
  if (n === 0) return "0.00";
  return n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Detect KES columns by name
const KES_COL_KEYWORDS = [
  "kes", "premium", "insured", "amount", "commission",
  "estimate", "approved", "collected", "outstanding", "due", "paid",
];

function isKESColumn(header: string) {
  const h = header.toLowerCase();
  return KES_COL_KEYWORDS.some((k) => h.includes(k));
}

// ──────────────────────────────────────────────────────────────
// Summary cards per report
// ──────────────────────────────────────────────────────────────

function SummaryCards({ reportId, summary }: { reportId: string; summary: any }) {
  if (!summary) return null;

  const cards: { label: string; value: string | number; accent?: string }[] = [];

  if (reportId === "policy-register") {
    cards.push(
      { label: "Total Policies", value: summary.total },
      { label: "Active", value: summary.active, accent: "#10b981" },
      { label: "Expired", value: summary.expired, accent: "#f87171" },
      { label: "Total Premium", value: `KES ${fmtKES(summary.totalPremium)}`, accent: "#10b981" }
    );
  } else if (reportId === "renewal-due") {
    cards.push(
      { label: "Policies Due", value: summary.total, accent: "#fb923c" },
      { label: "Window", value: `${summary.days} days` }
    );
  } else if (reportId === "payment-collection") {
    cards.push(
      { label: "Total Due", value: `KES ${fmtKES(summary.totalDue)}` },
      { label: "Collected", value: `KES ${fmtKES(summary.totalPaid)}`, accent: "#10b981" },
      { label: "Outstanding", value: `KES ${fmtKES(summary.totalOutstanding)}`, accent: "#f87171" },
      { label: "Paid", value: summary.paidCount, accent: "#10b981" },
      { label: "Pending", value: summary.pendingCount, accent: "#fbbf24" }
    );
  } else if (reportId === "commission") {
    cards.push(
      { label: "Policies", value: summary.total },
      { label: "Total Commission", value: `KES ${fmtKES(summary.totalCommission)}`, accent: "#a78bfa" }
    );
    if (summary.byInsurer) {
      Object.entries(summary.byInsurer as Record<string, any>).forEach(([name, s]) => {
        cards.push({ label: name, value: `KES ${fmtKES(s.commission)}`, accent: "#a78bfa" });
      });
    }
  } else if (reportId === "claims-register") {
    cards.push(
      { label: "Total Claims", value: summary.total },
      { label: "Active", value: summary.active, accent: "#fbbf24" },
      { label: "Settled", value: summary.settled, accent: "#10b981" },
      { label: "Total Estimates", value: `KES ${fmtKES(summary.totalEstimate)}` },
      { label: "Total Approved", value: `KES ${fmtKES(summary.totalApproved)}`, accent: "#10b981" }
    );
  } else if (reportId === "documentation-compliance") {
    cards.push(
      { label: "Incomplete", value: summary.total, accent: "#f87171" },
      { label: "No Policy Number", value: summary.noPolicyNumber, accent: "#fbbf24" },
      { label: "Docs Pending", value: summary.pendingDocs, accent: "#fb923c" }
    );
  } else if (reportId === "insurer-performance") {
    cards.push({ label: "Insurers", value: summary.insurerCount });
  } else if (reportId === "customer-demographics") {
    cards.push(
      { label: "Total Customers", value: summary.total },
      { label: "Individual", value: summary.individual, accent: "#10b981" },
      { label: "Company", value: summary.company, accent: "#a78bfa" }
    );
    if (summary.genderMap) {
      const gm = summary.genderMap as Record<string, number>;
      Object.entries(gm).forEach(([g, n]) =>
        cards.push({ label: g, value: n })
      );
    }
  }

  if (cards.length === 0) return null;

  return (
    <div style={{
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      marginBottom: "16px",
    }}>
      {cards.map((c) => (
        <div
          key={c.label}
          style={{
            backgroundColor: "var(--bg-app)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "10px 14px",
            minWidth: "120px",
          }}
        >
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", margin: "0 0 4px" }}>
            {c.label}
          </p>
          <p style={{ fontSize: "16px", fontWeight: 700, color: c.accent || "var(--text-primary)", margin: 0 }}>
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [extraValue, setExtraValue] = useState("30");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    headers: string[];
    rows: any[][];
    summary?: any;
    type: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const selected = REPORTS.find((r) => r.id === selectedId);

  function buildUrl(fmt: "json" | "csv") {
    if (!selectedId) return "";
    const params = new URLSearchParams({ format: fmt });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (selected?.extraParam) params.set(selected.extraParam.key, extraValue);
    return `/api/reports/${selectedId}?${params}`;
  }

  const runReport = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    setError("");
    setResult(null);
    setPage(1);
    setSearchFilter("");
    setSortCol(null);
    try {
      const res = await fetch(buildUrl("json"));
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to generate report"); return; }
      setResult(data);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, from, to, extraValue]);

  function downloadCSV() {
    const url = buildUrl("csv");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedId}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  function handlePrint() {
    window.print();
  }

  function handleSort(colIdx: number) {
    if (sortCol === colIdx) {
      setSortAsc((a) => !a);
    } else {
      setSortCol(colIdx);
      setSortAsc(true);
    }
    setPage(1);
  }

  // Filter + sort rows
  let displayRows = result?.rows ?? [];
  if (searchFilter) {
    const q = searchFilter.toLowerCase();
    displayRows = displayRows.filter((row) =>
      row.some((cell: any) => String(cell ?? "").toLowerCase().includes(q))
    );
  }
  if (sortCol !== null) {
    displayRows = [...displayRows].sort((a, b) => {
      const va = a[sortCol] ?? "";
      const vb = b[sortCol] ?? "";
      const na = parseFloat(String(va).replace(/,/g, ""));
      const nb = parseFloat(String(vb).replace(/,/g, ""));
      const cmp = !isNaN(na) && !isNaN(nb) ? na - nb : String(va).localeCompare(String(vb));
      return sortAsc ? cmp : -cmp;
    });
  }

  const totalPages = Math.ceil(displayRows.length / PAGE_SIZE);
  const pagedRows = displayRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const inStyle: React.CSSProperties = {
    padding: "8px 12px",
    backgroundColor: "var(--bg-app)",
    border: "1px solid var(--border)",
    borderRadius: "7px",
    color: "var(--text-primary)",
    fontSize: "13px",
    outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* ── Print-only header ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-header { display: block !important; }
          body { background: white !important; color: black !important; }
          table th, table td { border: 1px solid #ccc !important; color: black !important; font-size: 11px; }
          table th { background: #f0f0f0 !important; }
        }
        .print-header { display: none; }
      `}</style>

      <div className="print-header" style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 700 }}>
          BeSure Insurance Solutions
        </h1>
        <p style={{ fontSize: "13px" }}>
          {selected?.label} · Generated {new Date().toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ── Report selector grid ── */}
      <div className="no-print">
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "14px" }}>
          Select a report to generate:
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
          {REPORTS.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setSelectedId(r.id);
                setResult(null);
                setError("");
                setExtraValue("30");
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "8px",
                padding: "14px",
                borderRadius: "10px",
                border: `1px solid ${selectedId === r.id ? r.color : "var(--border)"}`,
                backgroundColor: selectedId === r.id ? `${r.color}12` : "var(--bg-card)",
                cursor: "pointer",
                textAlign: "left",
                transition: "border-color 0.1s, background-color 0.1s",
              }}
              onMouseEnter={(e) => {
                if (selectedId !== r.id) (e.currentTarget as HTMLElement).style.borderColor = r.color;
              }}
              onMouseLeave={(e) => {
                if (selectedId !== r.id) (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              }}
            >
              <div style={{
                width: "34px", height: "34px", borderRadius: "8px",
                backgroundColor: `${r.color}20`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: r.color,
                flexShrink: 0,
              }}>
                {r.icon}
              </div>
              <div>
                <p style={{ fontSize: "12px", fontWeight: 700, color: selectedId === r.id ? r.color : "var(--text-primary)", margin: "0 0 3px" }}>
                  {r.label}
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
                  {r.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Filters & run ── */}
      {selected && (
        <div
          className="no-print"
          style={{
            backgroundColor: "var(--bg-card)",
            border: `1px solid ${selected.color}33`,
            borderRadius: "10px",
            padding: "18px 20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: selected.color, fontSize: "13px", fontWeight: 700 }}>
              {selected.icon} {selected.label}
            </div>

            {selected.hasDates && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>From</label>
                  <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ ...inStyle, width: "140px" }}
                    onFocus={(e) => { (e.target as HTMLElement).style.borderColor = selected.color; }}
                    onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "var(--border)"; }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>To</label>
                  <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ ...inStyle, width: "140px" }}
                    onFocus={(e) => { (e.target as HTMLElement).style.borderColor = selected.color; }}
                    onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "var(--border)"; }} />
                </div>
              </>
            )}

            {selected.extraParam && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {selected.extraParam.label}
                </label>
                <select value={extraValue} onChange={(e) => setExtraValue(e.target.value)} style={{ ...inStyle, width: "120px" }}
                  onFocus={(e) => { (e.target as HTMLElement).style.borderColor = selected.color; }}
                  onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "var(--border)"; }}>
                  {selected.extraParam.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
              {result && selected.exports.includes("csv") && (
                <button
                  onClick={downloadCSV}
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--text-secondary)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
                >
                  <Download size={14} /> CSV
                </button>
              )}
              {result && selected.exports.includes("print") && (
                <button
                  onClick={handlePrint}
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--text-secondary)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
                >
                  <Printer size={14} /> Print
                </button>
              )}
              <button
                onClick={runReport}
                disabled={loading}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "8px 18px",
                  backgroundColor: loading ? `${selected.color}55` : selected.color,
                  color: "#000000",
                  border: "none", borderRadius: "8px",
                  fontSize: "13px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                  transition: "opacity 0.15s",
                }}
              >
                {loading
                  ? <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating...</>
                  : <><BarChart2 size={14} /> Run Report</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="no-print" style={{ padding: "12px 16px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#fca5a5", fontSize: "13px" }}>
          {error}
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <div>
          {/* Summary cards */}
          <SummaryCards reportId={result.type} summary={result.summary} />

          {/* Search within results */}
          <div className="no-print" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <input
              placeholder={`Search within ${displayRows.length} rows...`}
              value={searchFilter}
              onChange={(e) => { setSearchFilter(e.target.value); setPage(1); }}
              style={{ ...inStyle, width: "280px" }}
            />
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {displayRows.length !== result.rows.length && `${displayRows.length} of ${result.rows.length} rows`}
            </span>
          </div>

          {/* Table */}
          <div style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            overflow: "hidden",
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--bg-sidebar)" }}>
                    {result.headers.map((h, i) => (
                      <th
                        key={i}
                        onClick={() => handleSort(i)}
                        className="no-print"
                        style={{
                          padding: "10px 12px",
                          textAlign: isKESColumn(h) ? "right" : "left",
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: sortCol === i ? selected?.color || "var(--brand)" : "var(--text-muted)",
                          borderBottom: "1px solid var(--border)",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          userSelect: "none",
                          transition: "color 0.1s",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = selected?.color || "var(--brand)"; }}
                        onMouseLeave={(e) => {
                          if (sortCol !== i) (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          {h}
                          {sortCol === i && (sortAsc ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                        </span>
                      </th>
                    ))}
                    {/* Print uses same headers but without interactive styles */}
                    {result.headers.map((h, i) => (
                      <th
                        key={`p-${i}`}
                        className="print-header"
                        style={{
                          padding: "8px 10px",
                          textAlign: "left",
                          fontSize: "10px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          backgroundColor: "#f0f0f0",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.length === 0 ? (
                    <tr>
                      <td colSpan={result.headers.length} style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    pagedRows.map((row, ri) => (
                      <tr
                        key={ri}
                        style={{ borderBottom: ri < pagedRows.length - 1 ? "1px solid var(--border)" : "none" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                      >
                        {row.map((cell: any, ci: number) => {
                          const header = result.headers[ci] || "";
                          const isKES = isKESColumn(header);
                          const isStatus = header.toLowerCase().includes("status") || header.toLowerCase().includes("stage");
                          const val = cell ?? "—";
                          const strVal = String(val);

                          // Status badge coloring
                          let badgeStyle: React.CSSProperties | undefined;
                          if (isStatus && val !== "—") {
                            const lv = strVal.toLowerCase();
                            const badgeColor =
                              lv.includes("active") || lv.includes("paid") || lv.includes("settled") || lv.includes("approved") ? "#10b981"
                              : lv.includes("expired") || lv.includes("overdue") || lv.includes("cancelled") ? "#f87171"
                              : lv.includes("pending") || lv.includes("reported") ? "#fbbf24"
                              : "#9ca3af";
                            badgeStyle = {
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: 600,
                              backgroundColor: `${badgeColor}22`,
                              color: badgeColor,
                            };
                          }

                          return (
                            <td
                              key={ci}
                              style={{
                                padding: "10px 12px",
                                color: isKES && val !== "—" && val !== "0.00" ? "var(--text-primary)" : "var(--text-secondary)",
                                textAlign: isKES ? "right" : "left",
                                fontWeight: isKES ? 600 : 400,
                                whiteSpace: isKES || isStatus ? "nowrap" : "normal",
                                maxWidth: "220px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {badgeStyle ? (
                                <span style={badgeStyle}>{strVal}</span>
                              ) : isKES && val !== "—" ? (
                                `KES ${parseFloat(String(val).replace(/,/g, "")).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`
                              ) : (
                                strVal
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="no-print"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 4px" }}
            >
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Page {page} of {totalPages} · {displayRows.length} rows
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: "5px 12px", borderRadius: "6px", border: "1px solid var(--border)", backgroundColor: "transparent", color: page === 1 ? "var(--text-muted)" : "var(--text-secondary)", fontSize: "12px", cursor: page === 1 ? "not-allowed" : "pointer" }}
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  const pg = i + Math.max(1, page - 3);
                  if (pg > totalPages) return null;
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      style={{
                        padding: "5px 10px", borderRadius: "6px",
                        border: `1px solid ${pg === page ? "var(--brand)" : "var(--border)"}`,
                        backgroundColor: pg === page ? "rgba(16,185,129,0.15)" : "transparent",
                        color: pg === page ? "var(--brand)" : "var(--text-secondary)",
                        fontSize: "12px", fontWeight: pg === page ? 700 : 400, cursor: "pointer",
                      }}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{ padding: "5px 12px", borderRadius: "6px", border: "1px solid var(--border)", backgroundColor: "transparent", color: page === totalPages ? "var(--text-muted)" : "var(--text-secondary)", fontSize: "12px", cursor: page === totalPages ? "not-allowed" : "pointer" }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Generated timestamp */}
          <p className="no-print" style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "right", marginTop: "6px" }}>
            Generated {new Date().toLocaleString("en-KE")} · {result.rows.length} total records
          </p>
        </div>
      )}

      {/* Empty state */}
      {!selected && !result && (
        <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
          <BarChart2 size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          <p style={{ fontSize: "14px" }}>Select a report type above to get started.</p>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}