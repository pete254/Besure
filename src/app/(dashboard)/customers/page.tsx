// src/app/(dashboard)/customers/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, User, Building2, ChevronRight, Trash2, X, AlertTriangle } from "lucide-react";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  phone: string;
  email?: string | null;
  idNumber?: string | null;
  county?: string | null;
  customerType: "Individual" | "Company";
  companyName?: string | null;
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/customers?${params}`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/customers/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error || "Failed to delete customer");
        return;
      }
      // Remove from list and close dialog
      setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setDeleteError("Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
            Customers
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "2px 0 0" }}>
            {loading ? "Loading..." : `${customers.length} customer${customers.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href="/customers/new"
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "8px 14px", backgroundColor: "var(--brand)",
            color: "#000000", borderRadius: "8px", fontSize: "13px",
            fontWeight: 600, textDecoration: "none",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.85")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
        >
          <Plus size={15} strokeWidth={2.5} />
          New Customer
        </Link>
      </div>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input
          type="text"
          placeholder="Search by name, phone, ID number or county..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "9px 12px 9px 36px",
            backgroundColor: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "8px", color: "#ffffff", fontSize: "13px", outline: "none",
          }}
          onFocus={(e) => ((e.target as HTMLElement).style.borderColor = "var(--brand)")}
          onBlur={(e) => ((e.target as HTMLElement).style.borderColor = "var(--border)")}
        />
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 80px", padding: "10px 16px", borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-sidebar)" }}>
          {["Name", "Phone", "ID Number", "County", "Type", ""].map((h) => (
            <span key={h} style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            Loading customers...
          </div>
        ) : customers.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "12px" }}>
              {debouncedSearch ? "No customers found matching your search." : "No customers yet."}
            </p>
            {!debouncedSearch && (
              <Link href="/customers/new" style={{ color: "var(--brand)", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
                Add your first customer →
              </Link>
            )}
          </div>
        ) : (
          customers.map((c, i) => (
            <div
              key={c.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 80px",
                padding: "12px 16px",
                borderBottom: i < customers.length - 1 ? "1px solid var(--border)" : "none",
                alignItems: "center",
                transition: "background-color 0.1s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
            >
              {/* Name */}
              <Link
                href={`/customers/${c.id}`}
                style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
              >
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "var(--brand-dim)", border: "1px solid var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {c.customerType === "Company"
                    ? <Building2 size={14} color="var(--brand)" />
                    : <User size={14} color="var(--brand)" />}
                </div>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", margin: 0 }}>
                    {c.customerType === "Company" ? c.companyName : `${c.firstName} ${c.lastName}`}
                  </p>
                  {c.email && <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>{c.email}</p>}
                </div>
              </Link>

              {/* Phone */}
              <Link href={`/customers/${c.id}`} style={{ textDecoration: "none" }}>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{c.phone}</span>
              </Link>

              {/* ID Number */}
              <Link href={`/customers/${c.id}`} style={{ textDecoration: "none" }}>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  {c.idNumber || <span style={{ color: "var(--text-muted)" }}>—</span>}
                </span>
              </Link>

              {/* County */}
              <Link href={`/customers/${c.id}`} style={{ textDecoration: "none" }}>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  {c.county || <span style={{ color: "var(--text-muted)" }}>—</span>}
                </span>
              </Link>

              {/* Type badge */}
              <Link href={`/customers/${c.id}`} style={{ textDecoration: "none" }}>
                <span style={{
                  display: "inline-block", padding: "2px 8px", borderRadius: "20px",
                  fontSize: "11px", fontWeight: 600,
                  backgroundColor: c.customerType === "Company" ? "rgba(139,92,246,0.15)" : "rgba(16,185,129,0.15)",
                  color: c.customerType === "Company" ? "#a78bfa" : "var(--brand)",
                }}>
                  {c.customerType}
                </span>
              </Link>

              {/* Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
                <Link
                  href={`/customers/${c.id}`}
                  style={{ padding: "5px", borderRadius: "6px", color: "var(--text-muted)", display: "flex" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#ffffff")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}
                >
                  <ChevronRight size={14} />
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(c);
                    setDeleteError("");
                  }}
                  style={{
                    padding: "5px", borderRadius: "6px", border: "none",
                    backgroundColor: "transparent", cursor: "pointer",
                    color: "var(--text-muted)", display: "flex",
                    transition: "color 0.1s, background-color 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#f87171";
                    (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(239,68,68,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  }}
                  title="Delete customer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => { if (!deleting) setDeleteTarget(null); }}
        >
          <div
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "24px",
              width: "100%",
              maxWidth: "420px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <AlertTriangle size={18} color="#f87171" />
                </div>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                  Delete Customer
                </h3>
              </div>
              <button
                onClick={() => { if (!deleting) setDeleteTarget(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "2px", display: "flex" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#ffffff")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}
              >
                <X size={16} />
              </button>
            </div>

            {/* Message */}
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px" }}>
              Are you sure you want to delete{" "}
              <span style={{ color: "#ffffff", fontWeight: 600 }}>
                {deleteTarget.customerType === "Company"
                  ? deleteTarget.companyName
                  : `${deleteTarget.firstName} ${deleteTarget.lastName}`}
              </span>?
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px" }}>
              This action cannot be undone. All associated records may be affected.
            </p>

            {deleteError && (
              <div style={{ padding: "10px 12px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#fca5a5", fontSize: "12px", marginBottom: "16px" }}>
                {deleteError}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                style={{
                  padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)",
                  backgroundColor: "transparent", color: "var(--text-secondary)",
                  fontSize: "13px", fontWeight: 600, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "8px 16px", borderRadius: "8px", border: "none",
                  backgroundColor: deleting ? "rgba(239,68,68,0.4)" : "#ef4444",
                  color: "#ffffff", fontSize: "13px", fontWeight: 600,
                  cursor: deleting ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: "6px",
                }}
              >
                <Trash2 size={13} />
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}