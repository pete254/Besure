// src/app/(dashboard)/dashboard/page.tsx
// Full Dashboard — Phase 5
// Charts use inline SVG (no external deps beyond what's already installed)

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText, AlertTriangle, Users, TrendingUp, Clock,
  CheckCircle2, AlertCircle, ChevronRight, RefreshCw,
  Calendar, DollarSign, Shield, Activity,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
interface DashboardData {
  expiringIn30: number;
  expiringIn7: number;
  expiredToday: number;
  totalActive: number;
  totalPolicies: number;
  claimsByStage: Record<string, number>;
  totalActiveClaims: number;
  claimsNearing30: number;
  revenueThisMonth: number;
  revenueYTD: number;
  commissionThisMonth: number;
  overdueTotal: number;
  dueIn7Total: number;
  revenueByInsurer: Record<string, number>;
  monthlyVolume: { month: string; count: number }[];
  genderCounts: Record<string, number>;
  topCounties: { county: string; count: number }[];
  typeCount: Record<string, number>;
  coverCount: Record<string, number>;
  byInsurer: Record<string, number>;
  totalCustomers: number;
  recentPolicies: {
    id: string;
    insuranceType: string;
    grandTotal?: string | null;
    createdAt: string;
    customerName?: string | null;
  }[];
}

// ─── Helpers ─────────────────────────────────────────────────
function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtShort(n: number) {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${n.toFixed(0)}`;
}

// ─── Inline mini bar chart ────────────────────────────────────
function BarChart({
  data,
  color = "var(--brand)",
  height = 80,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height }}>
      {data.map((d, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            height: "100%",
            justifyContent: "flex-end",
          }}
          title={`${d.label}: ${d.value}`}
        >
          <div
            style={{
              width: "100%",
              backgroundColor: color,
              borderRadius: "3px 3px 0 0",
              opacity: d.value === 0 ? 0.15 : 0.85,
              transition: "height 0.5s ease",
              height: `${(d.value / max) * (height - 18)}px`,
              minHeight: d.value > 0 ? "3px" : "0",
            }}
          />
          <span style={{ fontSize: "9px", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", textAlign: "center" }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Donut chart ─────────────────────────────────────────────
function DonutChart({
  segments,
  size = 80,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", backgroundColor: "var(--bg-app)", border: "2px solid var(--border)", flexShrink: 0 }} />
    );
  }
  const r = size / 2 - 6;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const arcs = segments.map(seg => {
    const pct = seg.value / total;
    const dash = pct * circumference;
    const arc = { offset, dash, ...seg };
    offset += dash;
    return arc;
  });

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth="10"
          strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
          strokeDashoffset={-arc.offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        >
          <title>{arc.label}: {arc.value}</title>
        </circle>
      ))}
      <circle cx={cx} cy={cy} r={r - 8} fill="var(--bg-card)" />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight="700" fill="white">
        {total}
      </text>
    </svg>
  );
}

// ─── Claim stage pipeline bar ─────────────────────────────────
const CLAIM_STAGES = [
  { stage: "Reported", color: "#9ca3af" },
  { stage: "Documents Pending", color: "#fbbf24" },
  { stage: "Fully Documented", color: "#60a5fa" },
  { stage: "Assessed", color: "#a78bfa" },
  { stage: "Executed", color: "#fb923c" },
  { stage: "Approved", color: "#10b981" },
  { stage: "Released / Settled", color: "#34d399" },
];

// ─── KPI Card ────────────────────────────────────────────────
function KPICard({
  icon,
  label,
  value,
  sub,
  accent,
  href,
  alert,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  href?: string;
  alert?: "red" | "amber" | "green";
}) {
  const alertColors = {
    red: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)", pulse: "#ef4444" },
    amber: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)", pulse: "#fbbf24" },
    green: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.3)", pulse: "var(--brand)" },
  };
  const a = alert ? alertColors[alert] : null;

  const card = (
    <div
      style={{
        backgroundColor: a ? a.bg : "var(--bg-card)",
        border: `1px solid ${a ? a.border : "var(--border)"}`,
        borderRadius: "10px",
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        transition: "border-color 0.15s",
        cursor: href ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (href) (e.currentTarget as HTMLElement).style.borderColor = accent || "var(--brand)";
      }}
      onMouseLeave={(e) => {
        if (href) (e.currentTarget as HTMLElement).style.borderColor = a ? a.border : "var(--border)";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            backgroundColor: a ? `${a.pulse}22` : "var(--brand-dim)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {icon}
          </div>
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", margin: 0 }}>
            {label}
          </p>
        </div>
        {href && <ChevronRight size={13} color="var(--text-muted)" />}
      </div>
      <div>
        <p style={{ fontSize: "26px", fontWeight: 800, color: a ? a.pulse : (accent || "var(--text-primary)"), margin: 0, lineHeight: 1 }}>
          {value}
        </p>
        {sub && <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>{sub}</p>}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        {card}
      </Link>
    );
  }
  return card;
}

// ─── Section header ───────────────────────────────────────────
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <h3 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{title}</h3>
      {sub && <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>{sub}</p>}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function load(quiet = false) {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch("/api/dashboard/summary");
      const d = await res.json();
      setData(d);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Skeleton loader */}
        {[1, 2].map(row => (
          <div key={row} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: "100px", borderRadius: "10px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ))}
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
        Failed to load dashboard data.
      </div>
    );
  }

  // Derived data for charts
  const donutCoverData = [
    { label: "Comprehensive", value: data.coverCount["Comprehensive"] || 0, color: "#10b981" },
    { label: "TPO", value: data.coverCount["TPO"] || 0, color: "#fbbf24" },
    { label: "TPFT", value: data.coverCount["TPFT"] || 0, color: "#60a5fa" },
  ];

  const donutTypeData = [
    { label: "Private", value: data.typeCount["Motor - Private"] || 0, color: "#10b981" },
    { label: "Commercial", value: data.typeCount["Motor - Commercial"] || 0, color: "#a78bfa" },
    { label: "PSV", value: data.typeCount["Motor - PSV / Matatu"] || 0, color: "#fbbf24" },
    { label: "Other", value: Object.entries(data.typeCount).filter(([k]) => !k.startsWith("Motor")).reduce((s, [, v]) => s + v, 0), color: "#9ca3af" },
  ];

  const donutGenderData = [
    { label: "Male", value: data.genderCounts["Male"] || 0, color: "#60a5fa" },
    { label: "Female", value: data.genderCounts["Female"] || 0, color: "#f472b6" },
    { label: "Other", value: (data.genderCounts["Other"] || 0) + (data.genderCounts["Unknown"] || 0), color: "#9ca3af" },
  ];

  const revenueByInsurerArr = Object.entries(data.revenueByInsurer)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const maxRevenue = Math.max(...revenueByInsurerArr.map(([, v]) => v), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Top bar: date + refresh */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
            {new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "color 0.1s" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-primary)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}
        >
          <RefreshCw size={12} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
          {refreshing ? "Refreshing..." : lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}` : "Refresh"}
        </button>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>

      {/* ── ROW 1: Policy Alerts ──────────────────────────────── */}
      <div>
        <SectionHeader title="Policy Alerts" sub="Renewals requiring attention" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          <KPICard
            icon={<FileText size={16} color="var(--brand)" />}
            label="Active Policies"
            value={data.totalActive}
            sub={`${data.totalPolicies} total`}
            href="/policies"
            accent="var(--brand)"
          />
          <KPICard
            icon={<Calendar size={16} color="#fb923c" />}
            label="Expiring in 30 days"
            value={data.expiringIn30}
            sub="Renewal required"
            href="/policies"
            alert={data.expiringIn30 > 0 ? "amber" : undefined}
            accent="#fb923c"
          />
          <KPICard
            icon={<AlertCircle size={16} color="#fbbf24" />}
            label="Expiring in 7 days"
            value={data.expiringIn7}
            sub="Urgent renewals"
            href="/policies"
            alert={data.expiringIn7 > 0 ? "amber" : undefined}
            accent="#fbbf24"
          />
          <KPICard
            icon={<AlertTriangle size={16} color="#f87171" />}
            label="Expired Today"
            value={data.expiredToday}
            sub="Action required"
            href="/policies"
            alert={data.expiredToday > 0 ? "red" : undefined}
            accent="#f87171"
          />
        </div>
      </div>

      {/* ── ROW 2: Finance ───────────────────────────────────── */}
      <div>
        <SectionHeader title="Finance Summary" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          <KPICard
            icon={<TrendingUp size={16} color="var(--brand)" />}
            label="Revenue This Month"
            value={fmtShort(data.revenueThisMonth)}
            sub="Collected"
            accent="var(--brand)"
          />
          <KPICard
            icon={<DollarSign size={16} color="#a78bfa" />}
            label="Revenue YTD"
            value={fmtShort(data.revenueYTD)}
            sub={`${new Date().getFullYear()} total`}
            accent="#a78bfa"
          />
          <KPICard
            icon={<Shield size={16} color="#60a5fa" />}
            label="Commission (Month)"
            value={fmtShort(data.commissionThisMonth)}
            sub="Agency earnings"
            accent="#60a5fa"
          />
          <KPICard
            icon={<Clock size={16} color="#f87171" />}
            label="Overdue Payments"
            value={fmtShort(data.overdueTotal)}
            sub={`KES ${data.dueIn7Total.toLocaleString("en-KE", { maximumFractionDigits: 0 })} due in 7d`}
            alert={data.overdueTotal > 0 ? "red" : undefined}
            accent="#f87171"
          />
        </div>
      </div>

      {/* ── ROW 3: Claims + Customer stats ───────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

        {/* Claims pipeline */}
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Claims Pipeline</p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>{data.totalActiveClaims} active claims</p>
            </div>
            <Link href="/claims" style={{ fontSize: "12px", color: "var(--brand)", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
              View all <ChevronRight size={12} />
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {CLAIM_STAGES.map(({ stage, color }) => {
              const count = data.claimsByStage[stage] || 0;
              const total = data.totalActiveClaims || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={stage}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{stage}</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: count > 0 ? color : "var(--text-muted)" }}>{count}</span>
                  </div>
                  <div style={{ height: "5px", backgroundColor: "var(--bg-app)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: "3px", transition: "width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {data.claimsNearing30 > 0 && (
            <div style={{ marginTop: "14px", padding: "10px 12px", backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={13} color="#fbbf24" />
              <p style={{ fontSize: "12px", color: "#fbbf24", margin: 0, fontWeight: 600 }}>
                {data.claimsNearing30} claim{data.claimsNearing30 > 1 ? "s" : ""} approaching 30-day mark
              </p>
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <KPICard
            icon={<Users size={16} color="var(--brand)" />}
            label="Total Customers"
            value={data.totalCustomers}
            sub="All time"
            href="/customers"
            accent="var(--brand)"
          />
          <KPICard
            icon={<Activity size={16} color="#a78bfa" />}
            label="Total Claims"
            value={data.totalActiveClaims}
            sub="Active claims"
            href="/claims"
            accent="#a78bfa"
          />
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px 16px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "10px" }}>Cover Type Split</p>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <DonutChart segments={donutCoverData} size={72} />
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {donutCoverData.map(d => (
                  <div key={d.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{d.label}</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", marginLeft: "auto" }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 4: Monthly volume chart ───────────────────────── */}
      <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Monthly Policy Volume</p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>New policies written — last 12 months</p>
          </div>
          <span style={{ fontSize: "18px", fontWeight: 800, color: "var(--brand)" }}>
            {data.monthlyVolume.slice(-1)[0]?.count ?? 0}
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 400, marginLeft: "4px" }}>this month</span>
          </span>
        </div>
        <BarChart
          data={data.monthlyVolume.map(m => ({ label: m.month, value: m.count }))}
          color="var(--brand)"
          height={100}
        />
      </div>

      {/* ── ROW 5: Demographics + Insurer Revenue ─────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>

        {/* Gender */}
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "18px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "14px" }}>Customers by Gender</p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
            <DonutChart segments={donutGenderData} size={96} />
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "5px" }}>
              {donutGenderData.map(d => (
                <div key={d.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", flex: 1 }}>{d.label}</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Policy type */}
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "18px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "14px" }}>Policies by Type</p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
            <DonutChart segments={donutTypeData} size={96} />
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "5px" }}>
              {donutTypeData.map(d => (
                <div key={d.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", flex: 1 }}>{d.label}</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Counties */}
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "18px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "14px" }}>Top Counties</p>
          {data.topCounties.length === 0 ? (
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>No county data yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {data.topCounties.map((c, i) => {
                const max = data.topCounties[0].count || 1;
                const pct = (c.count / max) * 100;
                return (
                  <div key={c.county}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{c.county}</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>{c.count}</span>
                    </div>
                    <div style={{ height: "4px", backgroundColor: "var(--bg-app)", borderRadius: "2px" }}>
                      <div style={{ height: "100%", width: `${pct}%`, backgroundColor: i === 0 ? "var(--brand)" : "rgba(16,185,129,0.4)", borderRadius: "2px", transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 6: Revenue by Insurer + Recent Activity ───────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

        {/* Revenue by insurer */}
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "18px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>Revenue by Insurer</p>
          {revenueByInsurerArr.length === 0 ? (
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>No revenue data yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {revenueByInsurerArr.map(([name, rev], i) => (
                <div key={name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{name}</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>{fmtShort(rev)}</span>
                  </div>
                  <div style={{ height: "5px", backgroundColor: "var(--bg-app)", borderRadius: "3px" }}>
                    <div style={{
                      height: "100%",
                      width: `${(rev / maxRevenue) * 100}%`,
                      backgroundColor: ["#10b981", "#a78bfa", "#60a5fa", "#fbbf24", "#fb923c", "#f87171"][i] || "var(--brand)",
                      borderRadius: "3px",
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent policies */}
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Recent Policies</p>
            <Link href="/policies" style={{ fontSize: "12px", color: "var(--brand)", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
              All <ChevronRight size={12} />
            </Link>
          </div>
          {data.recentPolicies.length === 0 ? (
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>No policies yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {data.recentPolicies.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/policies/${p.id}`}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "10px 0",
                    borderBottom: i < data.recentPolicies.length - 1 ? "1px solid var(--border)" : "none",
                    textDecoration: "none",
                    transition: "opacity 0.1s",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.75")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                >
                  <div style={{ width: "30px", height: "30px", borderRadius: "8px", backgroundColor: "var(--brand-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FileText size={13} color="var(--brand)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.customerName || "Unknown"}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                      {p.insuranceType.replace("Motor - ", "")}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--brand)", margin: 0 }}>
                      {p.grandTotal ? fmtShort(parseFloat(p.grandTotal)) : "—"}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                      {new Date(p.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}