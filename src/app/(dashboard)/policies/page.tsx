// src/app/(dashboard)/policies/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
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
    grandTotal?: string | null;
    status: string;
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

const FILTER_LABELS: Record<string, string> = {
  expiring30: "Expiring in 30 days",
  expiring7: "Expiring in 7 days",
  expired: "Expired today",
  overdue: "Overdue payments",
  active: "Active policies",
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

  useEffect(() => { fetchPolicies(); }, [fetchPolicies]);

  // Apply filters based on URL params
  const today = new Date().toISOString().split("T")[0];
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

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

  // Apply URL filter
  if (filterParam === "expiring30") {
    filtered = filtered.filter(r => r.policy.endDate >= today && r.policy.endDate <= in30 && r.policy.status === "Active");
  } else if (filterParam === "expiring7") {
    filtered = filtered.filter(r => r.policy.endDate >= today && r.policy.endDate <= in7 && r.policy.status === "Active");
  } else if (filterParam === "expired") {
    filtered = filtered.filter(r => r.policy.endDate < today);
  } else if (filterParam === "active") {
    filtered = filtered.filter(r => r.policy.status === "Active");
  } else if (filterParam === "coverType" && filterValue) {
    filtered = filtered.filter(r => r.policy.coverType === filterValue);
  } else if (filterParam === "insurer" && filterValue) {
    filtered = filtered.filter(r => (r.insurer?.name || r.policy.insuranceType) === filterValue);
  } else if (filterParam === "type" && filterValue) {
    filtered = filtered.filter(r => r.policy.insuranceType === filterValue);
  }

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
          {loading ? "Loading..." : `${filtered.length} of ${rows.length} polic${rows.length !== 1 ? "ies" : "y"}`}
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

      {/* Active filter badge */}
      {activeFilter && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Filtered by:</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "20px", backgroundColor: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", fontSize: "12px", fontWeight: 600, color: "var(--brand)" }}>
            {activeFilter}
            <button
              onClick={() => router.push("/policies")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--brand)", display: "flex", padding: 0 }}
            >
              <X size={12} />
            </button>
          </span>
        </div>
      )}

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

      {/* Table */}
      <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr 32px", padding: "10px 16px", borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-sidebar)" }}>
          {["Customer", "Insurer", "Type", "Cover", "Expiry", "Premium", ""].map((h) => (
            <span key={h} style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>Loading policies...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
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
          filtered.map((r) => {
            const customerName = r.customer
              ? r.customer.customerType === "Company"
                ? r.customer.companyName
                : `${r.customer.firstName} ${r.customer.lastName}`
              : "Unknown";

            const days = daysUntilExpiry(r.policy.endDate);
            const expiryColor = days < 0 ? "#f87171" : days <= 7 ? "#fbbf24" : days <= 30 ? "#fb923c" : "var(--text-secondary)";

            return (
              <Link
                key={r.policy.id}
                href={`/policies/${r.policy.id}`}
                style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr 32px", padding: "12px 16px", alignItems: "center", textDecoration: "none", borderBottom: "1px solid var(--border)", transition: "background-color 0.1s" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "50%", backgroundColor: "var(--brand-dim)", border: "1px solid var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FileText size={13} color="var(--brand)" />
                  </div>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{customerName}</p>
                    {r.policy.policyNumber && <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>{r.policy.policyNumber}</p>}
                  </div>
                </div>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{r.insurer?.name || "—"}</span>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{r.policy.insuranceType.replace("Motor - ", "")}</span>
                <span>
                  {r.policy.coverType ? (
                    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: r.policy.coverType === "Comprehensive" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: r.policy.coverType === "Comprehensive" ? "var(--brand)" : "#fbbf24" }}>
                      {r.policy.coverType}
                    </span>
                  ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                </span>
                <div>
                  <p style={{ fontSize: "12px", color: expiryColor, margin: 0, fontWeight: 600 }}>
                    {new Date(r.policy.endDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p style={{ fontSize: "11px", color: expiryColor, margin: 0 }}>
                    {days < 0 ? "Expired" : days === 0 ? "Today" : `${days}d left`}
                  </p>
                </div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{formatKES(r.policy.grandTotal)}</span>
                <ChevronRight size={14} color="var(--text-muted)" />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}