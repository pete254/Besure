// src/app/(dashboard)/dashboard/page.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText, AlertTriangle, Users, TrendingUp, Clock,
  AlertCircle, ChevronRight, RefreshCw, Calendar,
  DollarSign, Shield, Activity, Building2, User,
} from "lucide-react";

interface DashboardData {
  expiringIn30: number;
  expiringIn7: number;
  expiredToday: number;
  totalActive: number;
  totalPolicies: number;
  certificatesExpiringIn7: Array<{
    id: string;
    policyNumber?: string | null;
    customerName?: string | null;
    certificateExpiryDate?: string | null;
    certificateExpiryReason?: string | null;
    daysUntilExpiry: number;
  }>;
  certificatesExpiredCount: number;
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
  totalIndividuals: number;
  totalCompanies: number;
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
  applicationHistoryLimited: Array<{
    number: number;
    type: "policy" | "claim";
    id: string;
    createdAt: string;
    policyNumber?: string | null;
    claimNumber?: string | null;
    customerName?: string | null;
    description: string;
    amount?: string | null;
  }>;
  applicationHistoryAll: Array<{
    number: number;
    type: "policy" | "claim";
    id: string;
    createdAt: string;
    policyNumber?: string | null;
    claimNumber?: string | null;
    customerName?: string | null;
    description: string;
    amount?: string | null;
  }>;
  applicationHistoryTotal: number;
  drafts: Array<{
    number: number;
    id: string;
    draftType: string;
    draftKey: string;
    label: string;
    step?: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  draftsTotal: number;
}

function fmtShort(n: number | undefined) {
  if (!n || n <= 0) return "KES 0";
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${n.toFixed(0)}`;
}

function BarChart({
  data,
  color = "var(--brand)",
  height = 80,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height }}>
      {data.map((d, i) => (
        <div
          key={i}
          title={`${d.label}: ${d.value}`}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            height: "100%",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              width: "100%",
              backgroundColor: color,
              borderRadius: "3px 3px 0 0",
              opacity: d.value === 0 ? 0.15 : 0.85,
              height: `${(d.value / max) * (height - 18)}px`,
              minHeight: d.value > 0 ? "3px" : "0",
            }}
          />
          <span
            style={{
              fontSize: "9px",
              color: "var(--text-muted)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
              textAlign: "center",
            }}
          >
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({
  segments,
  size = 80,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0)
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: "var(--bg-app)",
          border: "2px solid var(--border)",
          flexShrink: 0,
        }}
      />
    );
  const r = size / 2 - 6;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const arcs = segments.map((seg) => {
    const dash = (seg.value / total) * circumference;
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
        >
          <title>
            {arc.label}: {arc.value}
          </title>
        </circle>
      ))}
      <circle cx={cx} cy={cy} r={r - 8} fill="var(--bg-card)" />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="13"
        fontWeight="700"
        fill="white"
      >
        {total}
      </text>
    </svg>
  );
}

// Updated: Executed removed, Approved + Declined added
const CLAIM_STAGES = [
  { stage: "Reported", color: "#9ca3af" },
  { stage: "Documents Pending", color: "#fbbf24" },
  { stage: "Fully Documented", color: "#60a5fa" },
  { stage: "Assessed", color: "#a78bfa" },
  { stage: "Approved", color: "#10b981" },
  { stage: "Declined", color: "#f87171" },
  { stage: "Released / Settled", color: "#34d399" },
];

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  href?: string;
  alert?: "red" | "amber" | "green" | "pink";
}

function KPICard({ icon, label, value, sub, accent, href, alert }: KPICardProps) {
  const alertColors = {
    red: {
      bg: "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.3)",
      pulse: "#ef4444",
    },
    amber: {
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.3)",
      pulse: "#fbbf24",
    },
    green: {
      bg: "rgba(16,185,129,0.08)",
      border: "rgba(16,185,129,0.3)",
      pulse: "var(--brand)",
    },
    pink: {
      bg: "rgba(236,72,153,0.08)",
      border: "rgba(236,72,153,0.3)",
      pulse: "#ec4899",
    },
  };
  const a = alert ? alertColors[alert] : null;

  const style: React.CSSProperties = {
    backgroundColor: a ? a.bg : "var(--bg-card)",
    border: `1px solid ${a ? a.border : "var(--border)"}`,
    borderRadius: "10px",
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    textDecoration: "none",
    transition: "border-color 0.15s, transform 0.1s",
  };

  const content = (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: a ? `${a.pulse}22` : "var(--brand-dim)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-muted)",
              margin: 0,
            }}
          >
            {label}
          </p>
        </div>
        {href && <ChevronRight size={13} color="var(--text-muted)" />}
      </div>
      <div>
        <p
          style={{
            fontSize: "26px",
            fontWeight: 800,
            color: a ? a.pulse : accent || "var(--text-primary)",
            margin: 0,
            lineHeight: 1,
          }}
        >
          {value}
        </p>
        {sub && (
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>
            {sub}
          </p>
        )}
      </div>
    </>
  );

  const hoverEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (href) {
      (e.currentTarget as HTMLElement).style.borderColor =
        accent || (a ? a.pulse : "var(--brand)");
      (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
    }
  };
  const hoverLeave = (e: React.MouseEvent<HTMLElement>) => {
    if (href) {
      (e.currentTarget as HTMLElement).style.borderColor = a
        ? a.border
        : "var(--border)";
      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
    }
  };

  if (href)
    return (
      <Link href={href} style={style} onMouseEnter={hoverEnter} onMouseLeave={hoverLeave}>
        {content}
      </Link>
    );
  return (
    <div style={{ ...style, cursor: "default" }}>
      {content}
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <h3
        style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}
      >
        {title}
      </h3>
      {sub && (
        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>
          {sub}
        </p>
      )}
    </div>
  );
}


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

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {[1, 2].map((row) => (
          <div
            key={row}
            style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  height: "100px",
                  borderRadius: "10px",
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        ))}
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      </div>
    );
  }

  if (!data)
    return (
      <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
        Failed to load dashboard data.
      </div>
    );

  // TypeScript type guard - data is guaranteed to be non-null here
  const safeData: DashboardData = data;

  const coverCount = safeData.coverCount || {};
  const typeCount = safeData.typeCount || {};
  const genderCounts = safeData.genderCounts || {};
  const revenueByInsurer = safeData.revenueByInsurer || {};

  const donutCoverData = [
    { label: "Comprehensive", value: coverCount["Comprehensive"] || 0, color: "#10b981" },
    { label: "TPO", value: coverCount["TPO"] || 0, color: "#fbbf24" },
    { label: "TPFT", value: coverCount["TPFT"] || 0, color: "#60a5fa" },
  ];

  const donutTypeData = [
    { label: "Private", value: typeCount["Motor - Private"] || 0, color: "#10b981" },
    { label: "Commercial", value: typeCount["Motor - Commercial"] || 0, color: "#a78bfa" },
    { label: "PSV", value: typeCount["Motor - PSV / Matatu"] || 0, color: "#fbbf24" },
    {
      label: "Other",
      value: Object.entries(typeCount)
        .filter(([k]) => !k.startsWith("Motor"))
        .reduce((s, [, v]) => s + v, 0),
      color: "#9ca3af",
    },
  ];

  // Gender chart is INDIVIDUALS ONLY; companies displayed as separate KPI cards
  const donutGenderData = [
    { label: "Male", value: genderCounts["Male"] || 0, color: "#60a5fa" },
    { label: "Female", value: genderCounts["Female"] || 0, color: "#f472b6" },
    {
      label: "Unknown",
      value: (genderCounts["Other"] || 0) + (genderCounts["Unknown"] || 0),
      color: "#9ca3af",
    },
  ];

  const revenueByInsurerArr = Object.entries(revenueByInsurer)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxRevenue = Math.max(...revenueByInsurerArr.map(([, v]) => v), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      {/* ── Top bar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
          {new Date().toLocaleDateString("en-KE", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--text-muted)",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "var(--text-primary)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")
          }
        >
          <RefreshCw
            size={12}
            style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }}
          />
          {refreshing
            ? "Refreshing..."
            : lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString("en-KE", {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : "Refresh"}
        </button>
      </div>

      {/* ── ROW 1: Policy Alerts ── */}
      <div>
        <SectionHeader title="Policy Alerts" sub="Click any card to view filtered policies" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          <KPICard
            icon={<FileText size={16} color="var(--brand)" />}
            label="Active Policies"
            value={safeData.totalActive}
            sub={`${safeData.totalPolicies} total`}
            href="/policies?filter=active"
            accent="var(--brand)"
          />
          <KPICard
            icon={<Calendar size={16} color="#fb923c" />}
            label="Expiring in 30 days"
            value={safeData.expiringIn30}
            sub={safeData.expiringIn30 > 0 ? "Click to view" : "All clear"}
            href="/policies?filter=expiring30"
            alert={safeData.expiringIn30 > 0 ? "amber" : undefined}
            accent="#fb923c"
          />
          <KPICard
            icon={<AlertCircle size={16} color="#fbbf24" />}
            label="Expiring in 7 days"
            value={safeData.expiringIn7}
            sub={safeData.expiringIn7 > 0 ? "Urgent — click to view" : "All clear"}
            href="/policies?filter=expiring7"
            alert={safeData.expiringIn7 > 0 ? "amber" : undefined}
            accent="#fbbf24"
          />
          <KPICard
            icon={<AlertTriangle size={16} color="#f87171" />}
            label="Expired Today"
            value={safeData.expiredToday}
            sub={safeData.expiredToday > 0 ? "Action required" : "All clear"}
            href="/policies?filter=expired"
            alert={safeData.expiredToday > 0 ? "red" : undefined}
            accent="#f87171"
          />
          <KPICard
            icon={<FileText size={16} color="#ec4899" />}
            label="Certificates Expiring in 7d"
            value={safeData.certificatesExpiringIn7?.length || 0}
            sub={safeData.certificatesExpiredCount > 0 ? `${safeData.certificatesExpiredCount} already expired` : "All current"}
            href="/policies?filter=cert-expiring"
            alert={safeData.certificatesExpiringIn7?.length > 0 ? "pink" : undefined}
            accent="#ec4899"
          />
        </div>
      </div>

      {/* ── Certificate Expiry Alert Card ── */}
      {safeData.certificatesExpiringIn7 && safeData.certificatesExpiringIn7.length > 0 && (
        <div>
          <SectionHeader title="Insurance Certificates" sub="Expiring within 7 days" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
            <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "rgba(236, 72, 153, 0.1)", border: "1px solid rgba(236, 72, 153, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileText size={18} color="#ec4899" />
                </div>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", margin: 0 }}>Expiring Certificates</p>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0" }}>{safeData.certificatesExpiringIn7.length} certificate{safeData.certificatesExpiringIn7.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <div style={{ padding: "0" }}>
                {safeData.certificatesExpiringIn7.map((cert, idx) => {
                  const expiryDate = cert.certificateExpiryDate
                    ? new Date(cert.certificateExpiryDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })
                    : "—";
                  const daysColor = cert.daysUntilExpiry <= 1 ? "#f87171" : cert.daysUntilExpiry <= 3 ? "#fbbf24" : "#ec4899";
                  return (
                    <div
                      key={cert.id}
                      style={{
                        padding: "12px 16px",
                        borderTop: idx > 0 ? "1px solid var(--border)" : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                          {cert.policyNumber || "Policy"} — {cert.customerName || "Unknown"}
                        </p>
                        {cert.certificateExpiryReason && (
                          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0" }}>{cert.certificateExpiryReason}</p>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: "12px", fontWeight: 700, color: daysColor, margin: 0 }}>
                          {cert.daysUntilExpiry < 0 ? `Expired ${Math.abs(cert.daysUntilExpiry)}d ago` : cert.daysUntilExpiry === 0 ? "Today" : `${cert.daysUntilExpiry}d left`}
                        </p>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0" }}>{expiryDate}</p>
                      </div>
                      <a
                        href={`/policies/${cert.id}`}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "1px solid #ec4899",
                          backgroundColor: "rgba(236, 72, 153, 0.08)",
                          color: "#ec4899",
                          fontSize: "11px",
                          fontWeight: 600,
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                          cursor: "pointer",
                        }}
                      >
                        Update
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ROW 2: Finance Summary ── */}
      <div>
        <SectionHeader title="Finance Summary" sub="Revenue and payment overview" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          <KPICard
            icon={<TrendingUp size={16} color="var(--brand)" />}
            label="Revenue This Month"
            value={fmtShort(safeData.revenueThisMonth)}
            sub="Collected"
            href="/policies?filter=active"
            accent="var(--brand)"
          />
          <KPICard
            icon={<DollarSign size={16} color="#a78bfa" />}
            label="Revenue YTD"
            value={fmtShort(safeData.revenueYTD)}
            sub={`${new Date().getFullYear()} total`}
            href="/policies?filter=active"
            accent="#a78bfa"
          />
          <KPICard
            icon={<Shield size={16} color="#60a5fa" />}
            label="Commission (Month)"
            value={fmtShort(safeData.commissionThisMonth)}
            sub="Agency earnings"
            href="/policies?filter=active"
            accent="#60a5fa"
          />
          <KPICard
            icon={<Clock size={16} color="#f87171" />}
            label="Overdue Payments"
            value={fmtShort(safeData.overdueTotal)}
            sub={`KES ${(safeData.dueIn7Total || 0).toLocaleString("en-KE", {
              maximumFractionDigits: 0,
            })} due in 7d`}
            href="/policies?filter=overdue"
            alert={safeData.overdueTotal > 0 ? "red" : undefined}
            accent="#f87171"
          />
        </div>
      </div>

      {/* ── ROW 3: Claims + Quick Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Claims pipeline */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Claims Pipeline
              </p>
              <p
                style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}
              >
                {safeData.totalActiveClaims} active · click a stage to filter
              </p>
            </div>
            <Link
              href="/claims"
              style={{
                fontSize: "12px",
                color: "var(--brand)",
                textDecoration: "none",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              View all <ChevronRight size={12} />
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {CLAIM_STAGES.map(({ stage, color }) => {
              const count = data?.claimsByStage?.[stage] || 0;
              const total = data?.totalActiveClaims || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <Link
                  key={stage}
                  href={`/claims?filter=stage&value=${encodeURIComponent(stage)}`}
                  style={{
                    textDecoration: "none",
                    display: "block",
                    padding: "4px 6px",
                    borderRadius: "6px",
                    transition: "background-color 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.backgroundColor =
                      "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.backgroundColor =
                      "transparent")
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      {stage}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: count > 0 ? color : "var(--text-muted)",
                      }}
                    >
                      {count}
                    </span>
                  </div>
                  <div
                    style={{
                      height: "5px",
                      backgroundColor: "var(--bg-app)",
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        backgroundColor: color,
                        borderRadius: "3px",
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>

          {safeData.claimsNearing30 > 0 && (
            <Link
              href="/claims?filter=nearing30"
              style={{
                marginTop: "14px",
                padding: "10px 12px",
                backgroundColor: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
                transition: "background-color 0.1s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor =
                  "rgba(245,158,11,0.15)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor =
                  "rgba(245,158,11,0.08)")
              }
            >
              <AlertTriangle size={13} color="#fbbf24" />
              <p
                style={{
                  fontSize: "12px",
                  color: "#fbbf24",
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                {safeData.claimsNearing30} claim
                {safeData.claimsNearing30 > 1 ? "s" : ""} approaching 30-day mark —
                click to review
              </p>
            </Link>
          )}
        </div>

        {/* Quick stats column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Customer breakdown – individuals + companies as distinct cards */}
          <div
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "14px 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--text-muted)",
                  margin: 0,
                }}
              >
                Customers
              </p>
              <Link
                href="/customers"
                style={{
                  fontSize: "11px",
                  color: "var(--brand)",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                View all →
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              {/* Total */}
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  {safeData.totalCustomers}
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    margin: "2px 0 0",
                  }}
                >
                  Total
                </p>
              </div>
              {/* Individuals */}
              <div
                style={{
                  textAlign: "center",
                  padding: "8px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(96,165,250,0.08)",
                  border: "1px solid rgba(96,165,250,0.2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    marginBottom: "2px",
                  }}
                >
                  <User size={12} color="#60a5fa" />
                  <p
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      color: "#60a5fa",
                      margin: 0,
                    }}
                  >
                    {safeData.totalIndividuals ?? 0}
                  </p>
                </div>
                <p
                  style={{
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    margin: 0,
                  }}
                >
                  Individuals
                </p>
              </div>
              {/* Companies */}
              <div
                style={{
                  textAlign: "center",
                  padding: "8px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(167,139,250,0.08)",
                  border: "1px solid rgba(167,139,250,0.2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    marginBottom: "2px",
                  }}
                >
                  <Building2 size={12} color="#a78bfa" />
                  <p
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      color: "#a78bfa",
                      margin: 0,
                    }}
                  >
                    {safeData.totalCompanies ?? 0}
                  </p>
                </div>
                <p
                  style={{
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    margin: 0,
                  }}
                >
                  Companies
                </p>
              </div>
            </div>
          </div>

          <KPICard
            icon={<Activity size={16} color="#a78bfa" />}
            label="Active Claims"
            value={safeData.totalActiveClaims}
            sub="Click to view all active claims"
            href="/claims?filter=active"
            accent="#a78bfa"
          />

          {/* Cover type donut */}
          <div
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "14px 16px",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-muted)",
                marginBottom: "10px",
              }}
            >
              Cover Type Split — click to filter
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <DonutChart segments={donutCoverData} size={72} />
              <div
                style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}
              >
                {donutCoverData.map((d) => (
                  <Link
                    key={d.label}
                    href={`/policies?filter=coverType&value=${encodeURIComponent(d.label)}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      textDecoration: "none",
                      padding: "3px 6px",
                      borderRadius: "4px",
                      transition: "background-color 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor =
                        "var(--bg-hover)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor =
                        "transparent")
                    }
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "2px",
                        backgroundColor: d.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        flex: 1,
                      }}
                    >
                      {d.label}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      {d.value}
                    </span>
                    <ChevronRight size={10} color="var(--text-muted)" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 4: Monthly volume chart ── */}
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "18px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Monthly Policy Volume
            </p>
            <p
              style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}
            >
              New policies written — last 12 months
            </p>
          </div>
          <Link
            href="/policies?filter=active"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              color: "var(--brand)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            <span style={{ fontSize: "18px", fontWeight: 800 }}>
              {safeData.monthlyVolume?.slice(-1)[0]?.count ?? 0}
            </span>
            <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>this month</span>
            <ChevronRight size={12} />
          </Link>
        </div>
        <BarChart
          data={(safeData.monthlyVolume || []).map((m) => ({ label: m.month, value: m.count }))}
          color="var(--brand)"
          height={100}
        />
      </div>

      {/* ── ROW 5: Demographics + Insurer Revenue ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
        {/* Gender – individuals only */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "14px",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Individuals by Gender
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  margin: "2px 0 0",
                }}
              >
                {safeData.totalIndividuals ?? 0} individuals ·{" "}
                {safeData.totalCompanies ?? 0} companies
              </p>
            </div>
            <Link
              href="/customers"
              style={{
                fontSize: "11px",
                color: "var(--brand)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              View all →
            </Link>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <DonutChart segments={donutGenderData} size={96} />
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "5px",
              }}
            >
              {donutGenderData.map((d) => (
                <div
                  key={d.label}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "2px",
                      backgroundColor: d.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      flex: 1,
                    }}
                  >
                    {d.label}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {d.value}
                  </span>
                </div>
              ))}
              {/* Company row – shown separately, not in the gender donut */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginTop: "4px",
                  paddingTop: "6px",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <Building2 size={10} color="#a78bfa" style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    flex: 1,
                  }}
                >
                  Companies
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#a78bfa",
                  }}
                >
                  {safeData.totalCompanies ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Policy type donut */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "18px",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "14px",
            }}
          >
            Policies by Type —{" "}
            <span
              style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400 }}
            >
              click to filter
            </span>
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <DonutChart segments={donutTypeData} size={96} />
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "5px",
              }}
            >
              {[
                { label: "Private", type: "Motor - Private", color: "#10b981" },
                { label: "Commercial", type: "Motor - Commercial", color: "#a78bfa" },
                { label: "PSV", type: "Motor - PSV / Matatu", color: "#fbbf24" },
              ].map((d) => (
                <Link
                  key={d.label}
                  href={`/policies?filter=type&value=${encodeURIComponent(d.type)}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    textDecoration: "none",
                    padding: "3px 6px",
                    borderRadius: "4px",
                    transition: "background-color 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.backgroundColor =
                      "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.backgroundColor =
                      "transparent")
                  }
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "2px",
                      backgroundColor: d.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      flex: 1,
                    }}
                  >
                    {d.label}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {typeCount[d.type] || 0}
                  </span>
                  <ChevronRight size={10} color="var(--text-muted)" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Top Counties */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "14px",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Top Counties
            </p>
            <Link
              href="/customers"
              style={{
                fontSize: "11px",
                color: "var(--brand)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              All customers →
            </Link>
          </div>
          {(safeData.topCounties || []).length === 0 ? (
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              No county data yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {(safeData.topCounties || []).map((c, i) => {
                const maxCount = (safeData.topCounties || [])[0]?.count || 1;
                const pct = (c.count / maxCount) * 100;
                return (
                  <Link
                    key={c.county}
                    href={`/customers?search=${encodeURIComponent(c.county)}`}
                    style={{
                      textDecoration: "none",
                      display: "block",
                      padding: "2px 4px",
                      borderRadius: "4px",
                      transition: "background-color 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor =
                        "var(--bg-hover)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor =
                        "transparent")
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "3px",
                      }}
                    >
                      <span
                        style={{ fontSize: "12px", color: "var(--text-secondary)" }}
                      >
                        {c.county}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                        }}
                      >
                        {c.count}
                      </span>
                    </div>
                    <div
                      style={{
                        height: "4px",
                        backgroundColor: "var(--bg-app)",
                        borderRadius: "2px",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          backgroundColor:
                            i === 0 ? "var(--brand)" : "rgba(16,185,129,0.4)",
                          borderRadius: "2px",
                        }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 6: Revenue by Insurer + Recent Activity ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Revenue by insurer */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "18px",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}
          >
            Revenue by Insurer
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              marginBottom: "16px",
            }}
          >
            Click an insurer to view its policies
          </p>
          {revenueByInsurerArr.length === 0 ? (
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              No revenue data yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {revenueByInsurerArr.map(([name, rev], i) => (
                <Link
                  key={name}
                  href={`/policies?filter=insurer&value=${encodeURIComponent(name)}`}
                  style={{
                    textDecoration: "none",
                    display: "block",
                    padding: "4px 6px",
                    borderRadius: "6px",
                    transition: "background-color 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.backgroundColor =
                      "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.backgroundColor =
                      "transparent")
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{ fontSize: "12px", color: "var(--text-secondary)" }}
                    >
                      {name}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                        }}
                      >
                        {fmtShort(rev)}
                      </span>
                      <ChevronRight size={10} color="var(--text-muted)" />
                    </div>
                  </div>
                  <div
                    style={{
                      height: "5px",
                      backgroundColor: "var(--bg-app)",
                      borderRadius: "3px",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(rev / maxRevenue) * 100}%`,
                        backgroundColor: [
                          "#10b981",
                          "#a78bfa",
                          "#60a5fa",
                          "#fbbf24",
                          "#fb923c",
                          "#f87171",
                        ][i] || "var(--brand)",
                        borderRadius: "3px",
                      }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent policies */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Recent Policies
            </p>
            <Link
              href="/policies"
              style={{
                fontSize: "12px",
                color: "var(--brand)",
                textDecoration: "none",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              All <ChevronRight size={12} />
            </Link>
          </div>
          {(safeData.recentPolicies || []).length === 0 ? (
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              No policies yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {(safeData.recentPolicies || []).map((p, i) => (
                <Link
                  key={p.id}
                  href={`/policies/${p.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 6px",
                    borderBottom:
                      i < safeData.recentPolicies.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                    textDecoration: "none",
                    borderRadius: "6px",
                    transition: "background-color 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.backgroundColor =
                      "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.backgroundColor =
                      "transparent")
                  }
                >
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "8px",
                      backgroundColor: "var(--brand-dim)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={13} color="var(--brand)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.customerName || "Unknown"}
                    </p>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        margin: 0,
                      }}
                    >
                      {p.insuranceType.replace("Motor - ", "")}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--brand)",
                        margin: 0,
                      }}
                    >
                      {p.grandTotal
                        ? fmtShort(parseFloat(p.grandTotal))
                        : "—"}
                    </p>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        margin: 0,
                      }}
                    >
                      {new Date(p.createdAt).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                      })}
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