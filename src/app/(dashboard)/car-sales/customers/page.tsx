// src/app/(dashboard)/car-sales/customers/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Phone, Mail, Package, Trash2, Edit3, Search, X, ChevronRight,
  AlertCircle, Loader2, RefreshCw, Eye,
} from "lucide-react";
import { CalendarCard } from "@/components/car-sales/CalendarCard";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  sourceOfLead?: string | null;
  createdAt: string;
  updatedAt: string;
}

const SOURCE_OPTIONS = [
  "Referral", "Website", "Facebook", "Instagram", "Walk-in",
  "WhatsApp", "Phone Call", "Agent", "Other",
];

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

function focusBrand(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  (e.target as HTMLElement).style.borderColor = "var(--brand)";
}

function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  (e.target as HTMLElement).style.borderColor = "var(--border)";
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

// ─── New/Edit Customer Modal ──────────────────────────────────────────────────

function CustomerModal({
  mode,
  customer,
  onClose,
  onSuccess,
}: {
  mode: "new" | "edit";
  customer?: Customer | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: customer?.name || "",
    phone: customer?.phone || "",
    email: customer?.email || "",
    sourceOfLead: customer?.sourceOfLead || "",
  });

  async function save() {
    if (!form.name || !form.phone) {
      setError("Name and phone are required");
      return;
    }

    setSaving(true);
    try {
      const url =
        mode === "new"
          ? "/api/car-sales/customers"
          : `/api/car-sales/customers/${customer!.id}`;

      const res = await fetch(url, {
        method: mode === "new" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email || null,
          sourceOfLead: form.sourceOfLead || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save customer");
        return;
      }

      onSuccess();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
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
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
            {mode === "new" ? "New Customer" : "Edit Customer"}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 12px",
              backgroundColor: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "8px",
              color: "#fca5a5",
              fontSize: "12px",
              marginBottom: "14px",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={lbStyle}>Name</label>
            <input
              type="text"
              placeholder="Customer name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={inStyle}
              onFocus={focusBrand}
              onBlur={blurBorder}
            />
          </div>

          <div>
            <label style={lbStyle}>Phone</label>
            <input
              type="tel"
              placeholder="Phone number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              style={inStyle}
              onFocus={focusBrand}
              onBlur={blurBorder}
            />
          </div>

          <div>
            <label style={lbStyle}>Email (Optional)</label>
            <input
              type="email"
              placeholder="customer@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={inStyle}
              onFocus={focusBrand}
              onBlur={blurBorder}
            />
          </div>

          <div>
            <label style={lbStyle}>Source of Lead (Optional)</label>
            <select
              value={form.sourceOfLead}
              onChange={(e) => setForm({ ...form, sourceOfLead: e.target.value })}
              style={inStyle}
              onFocus={focusBrand}
              onBlur={blurBorder}
            >
              <option value="">Select source...</option>
              {SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "8px" }}>
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px",
                backgroundColor: "var(--bg-app)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                color: "var(--text-primary)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              style={{
                padding: "8px 16px",
                backgroundColor: saving ? "var(--text-muted)" : "var(--brand)",
                border: "none",
                borderRadius: "8px",
                color: "#000",
                fontSize: "13px",
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {saving && <Loader2 size={12} style={{ animation: "spin 0.6s linear infinite" }} />}
              {mode === "new" ? "Create" : "Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Customer Details Modal ───────────────────────────────────────────────────

function CustomerDetailsModal({
  customer,
  onClose,
  onEdit,
  onDelete,
}: {
  customer: Customer;
  onClose: () => void;
  onEdit: (c: Customer) => void;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/car-sales/customers/${customer.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("Failed to delete customer");
        return;
      }

      onDelete(customer.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
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
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
            {customer.name}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", margin: 0, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Phone
            </p>
            <p style={{ fontSize: "13px", color: "#ffffff", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Phone size={14} color="var(--brand)" />
              {customer.phone}
            </p>
          </div>

          {customer.email && (
            <div>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", margin: 0, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Email
              </p>
              <p style={{ fontSize: "13px", color: "#ffffff", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Mail size={14} color="var(--brand)" />
                {customer.email}
              </p>
            </div>
          )}

          {customer.sourceOfLead && (
            <div>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", margin: 0, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Source of Lead
              </p>
              <p style={{ fontSize: "13px", color: "var(--brand)", margin: 0 }}>
                {customer.sourceOfLead}
              </p>
            </div>
          )}

          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", margin: 0, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Created
            </p>
            <p style={{ fontSize: "13px", color: "#ffffff", margin: 0 }}>
              {fmtDate(customer.createdAt)}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            onClick={() => {
              onEdit(customer);
              onClose();
            }}
            style={{
              padding: "8px 14px",
              backgroundColor: "rgba(10, 182, 210, 0.1)",
              border: "1px solid rgba(10, 182, 210, 0.3)",
              borderRadius: "8px",
              color: "#06b6d4",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Edit3 size={12} /> Edit
          </button>
          <button
            onClick={confirmDelete}
            disabled={deleting}
            style={{
              padding: "8px 14px",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              color: "#f87171",
              fontSize: "13px",
              fontWeight: 600,
              cursor: deleting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              opacity: deleting ? 0.5 : 1,
            }}
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState<"new" | "edit" | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetails, setShowDetails] = useState<Customer | null>(null);

  const fetchCustomers = useCallback(async (query = "") => {
    try {
      setLoading(true);
      const url = new URL("/api/car-sales/customers", window.location.href);
      if (query) url.searchParams.set("search", query);
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers(search);
  }, [search, fetchCustomers]);

  const filteredCustomers = customers;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", margin: 0 }}>Customers</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0 0" }}>
            {loading ? "Loading..." : `${filteredCustomers.length} customer${filteredCustomers.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => fetchCustomers(search)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "7px 12px",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-muted)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-primary)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}
          >
            <RefreshCw size={12} /> Refresh
          </button>
          <button
            onClick={() => {
              setSelectedCustomer(null);
              setShowModal("new");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              backgroundColor: "var(--brand)",
              color: "#000",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            <Plus size={15} strokeWidth={2.5} /> New Customer
          </button>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div style={{ display: "flex", gap: "16px", flex: 1, minHeight: 0 }}>
        {/* Left Column - Search & Customers List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1, minWidth: 0 }}>
          {/* Search */}
          <div style={{ position: "relative", maxWidth: "320px" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: "11px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                ...inStyle,
                paddingLeft: "34px",
                maxWidth: "320px",
              }}
              onFocus={focusBrand}
              onBlur={blurBorder}
            />
          </div>

          {/* Customers List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--text-muted)",
            }}
          >
            <Loader2 size={20} style={{ animation: "spin 1s linear infinite", marginRight: "8px" }} />
            Loading...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            <Package size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <p style={{ fontSize: "14px", margin: 0 }}>
              {search ? "No customers match your search" : "No customers yet"}
            </p>
            {!search && (
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setShowModal("new");
                }}
                style={{
                  marginTop: "12px",
                  padding: "8px 16px",
                  backgroundColor: "var(--brand)",
                  color: "#000",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Create First Customer
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => setShowDetails(customer)}
                style={{
                  padding: "14px 16px",
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)";
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(16,185,129,0.05)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-card)";
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", margin: 0 }}>
                      {customer.name}
                    </p>
                    {customer.sourceOfLead && (
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          backgroundColor: "rgba(167,139,250,0.2)",
                          color: "#c4b5fd",
                          borderRadius: "4px",
                        }}
                      >
                        {customer.sourceOfLead}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--text-muted)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Phone size={11} />
                      {customer.phone}
                    </span>
                    {customer.email && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Mail size={11} />
                        {customer.email}
                      </span>
                    )}
                  </div>
                </div>
                <Eye size={16} color="var(--brand)" style={{ marginLeft: "8px", flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}
          </div>
        </div>

        {/* Right Column - Calendar Card */}
        <div style={{ width: "320px", flexShrink: 0 }}>
          <CalendarCard />
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <CustomerModal
          mode={showModal}
          customer={showModal === "edit" ? selectedCustomer : null}
          onClose={() => {
            setShowModal(null);
            setSelectedCustomer(null);
          }}
          onSuccess={() => {
            fetchCustomers(search);
          }}
        />
      )}

      {showDetails && (
        <CustomerDetailsModal
          customer={showDetails}
          onClose={() => setShowDetails(null)}
          onEdit={(c) => {
            setSelectedCustomer(c);
            setShowModal("edit");
            setShowDetails(null);
          }}
          onDelete={() => {
            fetchCustomers(search);
          }}
        />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
