// src/app/(dashboard)/policies/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, ChevronRight, FileText, X } from "lucide-react";

interface PolicyRow {
  policy: {
    id: string;
    insuranceType: string;
    coverType?: string | null;
    policyNumber?: string | null;
    startDate: string;
    endDate: string;
    certificateExpiryDate?: string | null;
    grandTotal?: string | null;
    status: string;
    // NEW renewal fields
    renewedByPolicyId?: string | null;
    renewsPolicyId?: string | null;
  };
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    companyName?: string | null;
    customerType: string;
    phone: string;
  } | null;
  insurer: {
    id: string;
    name: string;
  } | null;
}

function formatKES(amount?: string | null) {
  if (!amount) return "—";
  return `KES ${parseFloat(amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

function daysUntilExpiry(endDate: string) {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
}

function daysUntilStart(startDate: string) {
  return Math.ceil((new Date(startDate).getTime() - Date.now()) / 86400000);
}

// ── Policy Card Component (reused from customer profile) ──
function PolicyCard({ row, tab }: { row: PolicyRow; tab: "active" | "pending" | "expired" }) {
  const today = new Date().toISOString().split("T")[0];
  const days = daysUntilExpiry(row.policy.endDate);
  const startDays = daysUntilStart(row.policy.startDate);
  
  const isExpired = row.policy.endDate < today;
  const isPending = row.policy.startDate > today;
  const isExpiringSoon = !isExpired && !isPending && days <= 90;
  
  const isRenewed = !!row.policy.renewedByPolicyId;
  const isARenewal = !!row.policy.renewsPolicyId;

  const showRenewButton = !isRenewed && (isExpired || (isExpiringSoon && !isPending));
  const expiryColor = isExpired ? "#f87171" : days <= 7 ? "#fbbf24" : days <= 30 ? "#fb923c" : days <= 90 ? "#fde68a" : "var(--text-muted)";

  return (
    <div style={{
      padding: "14px 16px",
      backgroundColor: "var(--bg-app)",
      borderRadius: "10px",
      border: `1px solid ${
        tab === "pending" ? "rgba(96,165,250,0.3)" :
        isExpired ? "rgba(239,68,68,0.15)" : 
        isExpiringSoon ? "rgba(245,158,11,0.2)" : "var(--border)"
      }`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "8px", backgroundColor: "var(--brand-dim)", border: "1px solid var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileText size={16} color="var(--brand)" />
          </div>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", margin: "0 0 2px" }}>
              {row.customer ? (
                <React.Fragment>
                  <span style={{ fontWeight: 700 }}>{row.customer.customerType === "Company" ? row.customer.companyName : `${row.customer.firstName} ${row.customer.lastName}`}</span>
                  {" - "}
                  {row.policy.insuranceType}
                </React.Fragment>
              ) : (
                row.policy.insuranceType
              )}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{row.insurer?.name || "—"}</span>
              
              {row.policy.coverType && (
                <span style={{ padding: "1px 7px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: "rgba(245,158,11,0.15)", color: "#fbbf24" }}>
                  {row.policy.coverType}
                </span>
              )}

              {tab === "pending" && (
                <span style={{ padding: "1px 7px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: "rgba(96,165,250,0.15)", color: "#60a5fa" }}>
                  Pending ({startDays}d until active)
                </span>
              )}
              {tab === "expired" && isRenewed && (
                <span style={{ padding: "1px 7px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: "rgba(16,185,129,0.15)", color: "var(--brand)" }}>
                  ✓ Renewed
                </span>
              )}
              {tab === "expired" && !isRenewed && (
                <span style={{ padding: "1px 7px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: "rgba(239,68,68,0.15)", color: "#f87171" }}>
                  Not Renewed
                </span>
              )}
              {isARenewal && (
                <span style={{ padding: "1px 7px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: "rgba(139,92,246,0.15)", color: "#a78bfa" }}>
                  Renewal
                </span>
              )}

              {row.policy.policyNumber && (
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{row.policy.policyNumber}</span>
              )}
            </div>

            <div style={{ marginTop: "6px" }}>
              <span style={{ fontSize: "12px", color: expiryColor }}>
                <span style={{ display: "inline", marginRight: "3px" }}>
                  {new Date(row.policy.startDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                  {" → "}
                  {new Date(row.policy.endDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                {tab === "active" && (
                  <span style={{ marginLeft: "6px" }}>
                    ({days <= 0 ? "Expired" : `${days}d left`})
                  </span>
                )}
                {tab === "expired" && (
                  <span style={{ marginLeft: "6px", color: "#f87171" }}>
                    (Expired {Math.abs(days)}d ago)
                  </span>
                )}
                {tab === "pending" && (
                  <span style={{ marginLeft: "6px", color: "#60a5fa" }}>
                    (Starts in {startDays}d)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--brand)", margin: "0 0 2px" }}>
            {formatKES(row.policy.grandTotal)}
          </p>
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            {showRenewButton && (
              <Link
                href={`/policies/new?renewFrom=${row.policy.id}`}
                style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "6px", border: "1px solid var(--brand)", backgroundColor: "var(--brand-dim)", color: "var(--brand)", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}
              >
                <Plus size={11} /> Renew
              </Link>
            )}
            <Link
              href={`/policies/${row.policy.id}`}
              style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "6px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}
            >
              <ChevronRight size={11} /> View
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const FILTER_LABELS: Record<string, string> = {
  expiring30: "Expiring in 30 days",
  expiring7: "Expiring in 7 days",
  expired: "Expired today",
  overdue: "Overdue payments",
  active: "Active policies",
  "cert-expiring": "Certificates expiring in 7 days",
  coverType: "Cover type",
  insurer: "Insurer",
  type: "Insurance type",
};

export default function PoliciesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [rows, setRows] = useState<PolicyRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [policyTab, setPolicyTab] = useState<"active" | "pending" | "expired">("active");
  const [overduePaymentPolicies, setOverduePaymentPolicies] = useState<Set<string>>(new Set());

  const filterParam = searchParams.get("filter");
  const filterValue = searchParams.get("value");

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/policies?limit=200");
      const data = await res.json();
      setRows(data.policies || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOverduePayments = useCallback(async () => {
    try {
      const res = await fetch("/api/payments");
      const data = await res.json();
      const today = new Date().toISOString().split("T")[0];
      
      // Find all payments that are overdue (not paid and due date is in the past)
      const overduePayments = (data.payments || []).filter(
        (p: any) => p.status !== "paid" && p.dueDate < today
      );
      
      // Get unique policy IDs from overdue payments
      const policyIds = new Set<string>(overduePayments.map((p: any) => p.policyId));
      setOverduePaymentPolicies(policyIds);
    } catch (error) {
      console.error("Failed to fetch overdue payments:", error);
    }
  }, []);

  useEffect(() => { 
    fetchPolicies();
    if (filterParam === "overdue") {
      fetchOverduePayments();
    }
  }, [fetchPolicies, filterParam, fetchOverduePayments]);

  // ── Tab classification logic ──
  const today = new Date().toISOString().split("T")[0];

  // STEP 1: Apply search and URL filters to ALL policies FIRST
  let filtered = rows.filter((r) => {
    if (!search) return true;
    const name = r.customer
      ? r.customer.customerType === "Company"
        ? r.customer.companyName || ""
        : `${r.customer.firstName} ${r.customer.lastName}`
      : "";
    const s = search.toLowerCase();
    return (
      name.toLowerCase().includes(s) ||
      (r.policy.policyNumber || "").toLowerCase().includes(s) ||
      (r.insurer?.name || "").toLowerCase().includes(s) ||
      r.policy.insuranceType.toLowerCase().includes(s)
    );
  });

  // Apply URL filters to ALL policies
  if (filterParam === "expiring30") {
    filtered = filtered.filter(r => r.policy.endDate >= today && r.policy.endDate <= new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0] && r.policy.status === "Active");
  } else if (filterParam === "expiring7") {
    filtered = filtered.filter(r => r.policy.endDate >= today && r.policy.endDate <= new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0] && r.policy.status === "Active");
  } else if (filterParam === "expired") {
    filtered = filtered.filter(r => r.policy.endDate < today);
  } else if (filterParam === "overdue") {
    filtered = filtered.filter(r => overduePaymentPolicies.has(r.policy.id));
  } else if (filterParam === "active") {
    filtered = filtered.filter(r => r.policy.status === "Active");
  } else if (filterParam === "cert-expiring") {
    filtered = filtered.filter(r => {
      if (!r.policy.certificateExpiryDate) return false;
      const certExpiryDate = r.policy.certificateExpiryDate;
      const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
      return certExpiryDate >= today && certExpiryDate <= in7Days;
    });
  } else if (filterParam === "coverType" && filterValue) {
    filtered = filtered.filter(r => r.policy.coverType === filterValue);
  } else if (filterParam === "insurer" && filterValue) {
    filtered = filtered.filter(r => r.insurer?.name === filterValue);
  } else if (filterParam === "type" && filterValue) {
    filtered = filtered.filter(r => r.policy.insuranceType === filterValue);
  }

  // STEP 2: Now split the filtered results into tabs
  const activePolicies = filtered.filter(r => {
    const startDate = r.policy.startDate;
    const endDate = r.policy.endDate;
    return startDate <= today && endDate >= today;
  });

  const pendingPolicies = filtered.filter(r => {
    return r.policy.startDate > today;
  });

  const expiredPolicies = filtered.filter(r => {
    return r.policy.endDate < today;
  });

  // Sort policies
  activePolicies.sort((a, b) => a.policy.endDate.localeCompare(b.policy.endDate));
  expiredPolicies.sort((a, b) => b.policy.endDate.localeCompare(a.policy.endDate));
  pendingPolicies.sort((a, b) => a.policy.startDate.localeCompare(b.policy.startDate));

  const TAB_CONFIG = [
    { key: "active" as const, label: "Active", count: activePolicies.length, color: "var(--brand)" },
    { key: "pending" as const, label: "Pending", count: pendingPolicies.length, color: "#60a5fa" },
    { key: "expired" as const, label: "Expired", count: expiredPolicies.length, color: "#9ca3af" },
  ];

  const currentRows = policyTab === "active" ? activePolicies : policyTab === "pending" ? pendingPolicies : expiredPolicies;

  const activeFilter = filterParam
    ? filterValue
      ? `${FILTER_LABELS[filterParam] || filterParam}: ${filterValue}`
      : FILTER_LABELS[filterParam] || filterParam
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          {loading ? "Loading..." : `${rows.length} polic${rows.length !== 1 ? "ies" : "y"}`}
        </p>
        <Link
          href="/policies/new"
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", backgroundColor: "var(--brand)", color: "#000000", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.85")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
        >
          <Plus size={15} strokeWidth={2.5} /> New Policy
        </Link>
      </div>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
        <input
          placeholder="Search by customer, policy number, insurer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", padding: "9px 12px 9px 36px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px", outline: "none" }}
          onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--brand)"; }}
          onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", borderBottom: "1px solid var(--border)", marginBottom: "16px" }}>
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setPolicyTab(tab.key)}
            style={{
              padding: "9px 16px",
              backgroundColor: "transparent",
              border: "none",
              borderBottom: policyTab === tab.key ? `2px solid ${tab.color}` : "2px solid transparent",
              color: policyTab === tab.key ? tab.color : "var(--text-muted)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                padding: "1px 6px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 700,
                backgroundColor: policyTab === tab.key ? `${tab.color}22` : "var(--bg-app)",
                color: policyTab === tab.key ? tab.color : "var(--text-muted)",
                border: `1px solid ${policyTab === tab.key ? tab.color : "var(--border)"}`,
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab-specific helper text */}
      {policyTab === "pending" && pendingPolicies.length > 0 && (
        <div style={{ marginBottom: "12px", padding: "10px 12px", backgroundColor: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: "8px" }}>
          <p style={{ fontSize: "12px", color: "#60a5fa", margin: 0 }}>
            <span style={{ display: "inline", marginRight: "4px" }}>Calendar:</span>
            These policies have been renewed early and will become active when their start date arrives. The customer has continuous cover.
          </p>
        </div>
      )}

      {/* Policy list */}
      {currentRows.length === 0 ? (
        <div style={{ padding: "32px 0", textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", marginBottom: "12px", fontSize: "14px" }}>
            {search || filterParam ? "No policies match your filter." : "No policies yet."}
          </p>
          {!search && !filterParam && (
            <Link href="/policies/new" style={{ color: "var(--brand)", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
              Create your first policy →
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {currentRows.map((row) => (
            <PolicyCard key={row.policy.id} row={row} tab={policyTab} />
          ))}
        </div>
      )}
    </div>
  );
}