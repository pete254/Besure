// src/app/(dashboard)/commissions/page.tsx

"use client";

import { useState, useEffect } from "react";
import { Calendar, ChevronRight, DollarSign, Check, Clock, AlertCircle, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

interface CommissionRecord {
  commission: {
    id: string;
    policyId: string;
    commissionAmount: string;
    expectedDueDate: string;
    settledDate: string | null;
    status: "Pending" | "Paid";
    notes: string | null;
    updatedAt: string;
  };
  policy: {
    id: string;
    policyNumber: string | null;
    insuranceType: string;
    startDate: string;
    endDate: string;
    grandTotal: string | null;
    status: string;
  };
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    companyName: string | null;
    customerType: string;
  };
  insurer: {
    id: string;
    name: string;
  } | null;
}

function formatKES(amount: string | undefined | null) {
  if (!amount) return "KES 0";
  const num = parseFloat(amount);
  return `KES ${num.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getCustomerName(customer: CommissionRecord["customer"]) {
  if (customer.customerType === "Company") {
    return customer.companyName || "Unknown";
  }
  return `${customer.firstName} ${customer.lastName}`;
}

function CommissionEditModal({
  record,
  onClose,
  onSave,
}: {
  record: CommissionRecord;
  onClose: () => void;
  onSave: (updates: any) => Promise<void>;
}) {
  const [expectedDate, setExpectedDate] = useState(
    record.commission.expectedDueDate.split("T")[0]
  );
  const [status, setStatus] = useState(record.commission.status);
  const [settledDate, setSettledDate] = useState(
    record.commission.settledDate ? record.commission.settledDate.split("T")[0] : ""
  );
  const [notes, setNotes] = useState(record.commission.notes || "");
  const [commissionAmount, setCommissionAmount] = useState(record.commission.commissionAmount);
  const [commissionRate, setCommissionRate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRateChange = (newRate: string) => {
    setCommissionRate(newRate);
    if (newRate && record.policy.grandTotal) {
      const grandTotal = parseFloat(record.policy.grandTotal);
      const rate = parseFloat(newRate);
      const calculated = ((grandTotal * rate) / 100).toFixed(2);
      setCommissionAmount(calculated);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave({
        expectedDueDate: expectedDate,
        status: status,
        settledDate: status === "Paid" ? settledDate : null,
        commissionAmount: commissionAmount,
        notes: notes,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--bg-primary)",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
          border: "1px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: 600 }}>
          Edit Commission
        </h2>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>
            Expected Due Date
          </label>
          <input
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              fontSize: "14px",
              backgroundColor: "var(--bg-primary)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>
            Commission Amount (KES)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={commissionAmount}
            onChange={(e) => setCommissionAmount(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              fontSize: "14px",
              backgroundColor: "var(--bg-primary)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>
            Commission Rate (%) - Auto calculates amount
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="Enter rate to auto-calculate"
            value={commissionRate}
            onChange={(e) => handleRateChange(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              fontSize: "14px",
              backgroundColor: "var(--bg-primary)",
              color: "var(--text-primary)",
            }}
          />
          {record.policy.grandTotal && (
            <p style={{ marginTop: "4px", fontSize: "12px", color: "var(--text-secondary)" }}>
              Policy Premium: KES {parseFloat(record.policy.grandTotal).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "Pending" | "Paid")}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              fontSize: "14px",
              backgroundColor: "var(--bg-card)",
              color: "var(--text-primary)",
              colorScheme: "dark",
              cursor: "pointer",
            }}
          >
            <option value="Pending">Not Settled</option>
            <option value="Paid">Settled</option>
          </select>
        </div>

        {status === "Paid" && (
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>
              Settled Date
            </label>
            <input
              type="date"
              value={settledDate}
              onChange={(e) => setSettledDate(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              fontSize: "14px",
              backgroundColor: "var(--bg-primary)",
              color: "var(--text-primary)",
              fontFamily: "inherit",
              minHeight: "80px",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              border: "1px solid var(--border)",
              backgroundColor: "transparent",
              color: "var(--text-primary)",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: "8px 16px",
              backgroundColor: "var(--brand)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "14px",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CommissionCard({ record, onEdit }: { record: CommissionRecord; onEdit: (record: CommissionRecord) => void }) {
  const customerName = getCustomerName(record.customer);
  const isSettled = record.commission.status === "Paid";

  return (
    <div
      style={{
        padding: "16px",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        marginBottom: "12px",
        backgroundColor: "var(--bg-primary)",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onClick={() => onEdit(record)}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)";
        (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-secondary)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-primary)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
            {customerName}
          </h3>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
            Policy: {record.policy.policyNumber || "N/A"} • {record.policy.insuranceType}
          </p>
          {record.insurer && (
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Insurer: {record.insurer.name}
            </p>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--brand)", marginBottom: "8px" }}>
            {formatKES(record.commission.commissionAmount)}
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              borderRadius: "4px",
              backgroundColor: isSettled ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
              fontSize: "12px",
              fontWeight: 500,
              color: isSettled ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)",
            }}
          >
            {isSettled ? (
              <>
                <Check size={12} /> Settled
              </>
            ) : (
              <>
                <Clock size={12} /> Not Settled
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
        <div>
          <span style={{ color: "var(--text-secondary)" }}>Expected Due:</span>
          <p style={{ fontWeight: 500, marginTop: "2px" }}>
            {formatDate(record.commission.expectedDueDate)}
          </p>
        </div>
        {isSettled && (
          <div>
            <span style={{ color: "var(--text-secondary)" }}>Settled Date:</span>
            <p style={{ fontWeight: 500, marginTop: "2px" }}>
              {record.commission.settledDate ? formatDate(record.commission.settledDate) : "—"}
            </p>
          </div>
        )}
      </div>

      {record.commission.notes && (
        <div style={{ marginTop: "12px", padding: "8px", backgroundColor: "var(--bg-secondary)", borderRadius: "4px" }}>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            <strong>Notes:</strong> {record.commission.notes}
          </p>
        </div>
      )}
    </div>
  );
}



export default function CommissionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState<"all" | "pending" | "settled">("all");
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<CommissionRecord | null>(null);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [viewAll, setViewAll] = useState(false);

  const filterParam = searchParams.get("filter");
  const filterValue = searchParams.get("value");

  useEffect(() => {
    fetchCommissions();
  }, [tab, selectedYear, selectedMonth, viewAll, filterParam, filterValue]);

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const currentMonth = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
      const params = new URLSearchParams({
        tab,
        ...(currentMonth && !viewAll && { month: currentMonth }),
        ...(viewAll && { viewAll: "true" }),
        ...(filterParam && filterValue && { filter: filterParam, value: filterValue }),
      });

      const res = await fetch(`/api/commissions?${params}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch commissions (${res.status}): ${errorData.error || res.statusText}`
        );
      }
      const data = await res.json();
      setCommissions(data);
    } catch (error) {
      console.error("Error fetching commissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCommission = async (updates: any) => {
    if (!editingRecord) return;
    try {
      const res = await fetch(`/api/commissions/${editingRecord.commission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          `Failed to update commission (${res.status}): ${errorData.error || res.statusText}`
        );
      }
      fetchCommissions();
    } catch (error) {
      console.error("Error updating commission:", error);
    }
  };



  const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>
          Commissions
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
          Track and manage insurance commission payments
        </p>
      </div>

      {/* Active Filter Display */}
      {filterParam === "insurer" && filterValue && (
        <div
          style={{
            marginBottom: "24px",
            padding: "12px 16px",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            border: "1px solid rgb(59, 130, 246)",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              Filtered by Insurer:
            </span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "rgb(59, 130, 246)" }}>
              {filterValue}
            </span>
          </div>
          <button
            onClick={() => router.push("/commissions")}
            style={{
              padding: "4px 8px",
              backgroundColor: "transparent",
              border: "1px solid rgb(59, 130, 246)",
              color: "rgb(59, 130, 246)",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "rgba(59, 130, 246, 0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                "transparent";
            }}
          >
            ✕ Clear Filter
          </button>
        </div>
      )}

      {/* Year Selector */}
      <div style={{ marginBottom: "24px", display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>
            Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{
              padding: "8px 12px",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              fontSize: "14px",
              backgroundColor: "var(--bg-card)",
              color: "var(--text-primary)",
              cursor: "pointer",
            }}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "auto" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            <input
              type="checkbox"
              checked={viewAll}
              onChange={(e) => setViewAll(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            View All
          </label>
        </div>
      </div>

      {/* Month Tabs */}
      {!viewAll && (
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              paddingBottom: "8px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {monthNames.map((month, index) => (
              <button
                key={month}
                onClick={() => setSelectedMonth(index)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: selectedMonth === index ? "var(--brand)" : "transparent",
                  border: selectedMonth === index ? "none" : "1px solid var(--border)",
                  borderRadius: "6px",
                  color: selectedMonth === index ? "white" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: selectedMonth === index ? 600 : 400,
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (selectedMonth !== index) {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)";
                    (e.currentTarget as HTMLElement).style.color = "var(--brand)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedMonth !== index) {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                  }
                }}
              >
                {month.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {(["all", "pending", "settled"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "12px 16px",
              backgroundColor: "transparent",
              border: "none",
              color: tab === t ? "var(--brand)" : "var(--text-secondary)",
              borderBottom: tab === t ? "2px solid var(--brand)" : "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: tab === t ? 600 : 400,
              textTransform: "capitalize",
            }}
          >
            {t === "all" && "All Commissions"}
            {t === "pending" && "Not Settled"}
            {t === "settled" && "Settled"}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
        </div>
      ) : commissions.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            backgroundColor: "var(--bg-secondary)",
            borderRadius: "8px",
          }}
        >
          <DollarSign size={32} style={{ margin: "0 auto 12px", color: "var(--text-secondary)" }} />
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            No commissions found for this period
          </p>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: "16px", fontSize: "13px", color: "var(--text-secondary)" }}>
            Showing {commissions.length} commission{commissions.length !== 1 ? "s" : ""}
          </div>
          {commissions.map((commission) => (
            <CommissionCard
              key={commission.commission.id}
              record={commission}
              onEdit={setEditingRecord}
            />
          ))}
        </div>
      )}

      {editingRecord && (
        <CommissionEditModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSave={handleSaveCommission}
        />
      )}
    </div>
  );
}
