// src/app/(dashboard)/operations/page.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText, AlertTriangle, Activity, ChevronRight, AlertCircle,
} from "lucide-react";

interface ApplicationHistoryData {
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

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <h3
        style={{
          fontSize: "15px",
          fontWeight: 700,
          color: "#ffffff",
          margin: "0 0 4px",
        }}
      >
        {title}
      </h3>
      {sub && (
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            margin: 0,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function ApplicationHistoryModule({ data }: { data: ApplicationHistoryData }) {
  const [activeTab, setActiveTab] = useState<"recent" | "drafts">("recent");
  const [showAll, setShowAll] = useState(false);

  const recentData = showAll ? data.applicationHistoryAll : data.applicationHistoryLimited;

  return (
    <div>
      <SectionHeader
        title="Application History"
        sub={`${data.applicationHistoryTotal} total applications · ${data.draftsTotal} drafts`}
      />
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--border)",
            backgroundColor: "var(--bg-app)",
          }}
        >
          {[
            { id: "recent", label: `Recent (${data.applicationHistoryTotal})` },
            { id: "drafts", label: `Drafts (${data.draftsTotal})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "recent" | "drafts")}
              style={{
                flex: 1,
                padding: "14px 16px",
                backgroundColor: "transparent",
                border: "none",
                borderBottom:
                  activeTab === tab.id ? "2px solid var(--brand)" : "2px solid transparent",
                color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-muted)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Recent Tab */}
        {activeTab === "recent" && (
          <div style={{ padding: "16px 0" }}>
            {recentData.length === 0 ? (
              <div
                style={{
                  padding: "32px 24px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                <Activity size={28} style={{ opacity: 0.5, marginBottom: "8px" }} />
                <p style={{ fontSize: "13px", margin: 0 }}>No applications yet.</p>
              </div>
            ) : (
              <>
                {recentData.map((app, idx) => {
                  const isPolicy = app.type === "policy";
                  const icon = isPolicy ? <FileText size={14} /> : <AlertCircle size={14} />;
                  const iconColor = isPolicy ? "var(--brand)" : "#f87171";
                  const date = new Date(app.createdAt).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "short",
                    year: "2-digit",
                  });
                  const time = new Date(app.createdAt).toLocaleTimeString("en-KE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const href = isPolicy ? `/policies/${app.id}` : `/claims/${app.id}`;
                  const number = (app as any).policyNumber || (app as any).claimNumber || "—";

                  return (
                    <a
                      key={app.id}
                      href={href}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 16px",
                        borderTop: idx > 0 ? "1px solid var(--border)" : "none",
                        textDecoration: "none",
                        color: "inherit",
                        transition: "background-color 0.1s",
                        cursor: "pointer",
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
                      {/* Number */}
                      <div
                        style={{
                          minWidth: "24px",
                          height: "24px",
                          borderRadius: "4px",
                          backgroundColor: "var(--brand-dim)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "var(--brand)",
                          flexShrink: 0,
                        }}
                      >
                        {app.number}
                      </div>

                      {/* Type icon */}
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          backgroundColor: `${iconColor}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          color: iconColor,
                        }}
                      >
                        {icon}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "3px",
                          }}
                        >
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
                            {app.customerName || "Unknown"}
                          </p>
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              backgroundColor: `${iconColor}15`,
                              color: iconColor,
                              fontSize: "10px",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              flexShrink: 0,
                            }}
                          >
                            {isPolicy ? "Policy" : "Claim"}
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              color: "var(--text-muted)",
                              flexShrink: 0,
                            }}
                          >
                            {number}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "var(--text-muted)",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {app.description}
                        </p>
                      </div>

                      {/* Amount + Date */}
                      <div
                        style={{
                          textAlign: "right",
                          flexShrink: 0,
                        }}
                      >
                        {app.amount && (
                          <p
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: isPolicy ? "var(--brand)" : "#f87171",
                              margin: 0,
                            }}
                          >
                            {fmtShort(parseFloat(app.amount as any) || 0)}
                          </p>
                        )}
                        <p
                          style={{
                            fontSize: "10px",
                            color: "var(--text-muted)",
                            margin: "2px 0 0",
                          }}
                        >
                          {date}
                        </p>
                        <p
                          style={{
                            fontSize: "10px",
                            color: "var(--text-muted)",
                            margin: 0,
                          }}
                        >
                          {time}
                        </p>
                      </div>

                      <ChevronRight
                        size={14}
                        color="var(--text-muted)"
                        style={{ flexShrink: 0 }}
                      />
                    </a>
                  );
                })}

                {/* View All / View Less Button */}
                {data.applicationHistoryTotal > 15 && (
                  <div
                    style={{
                      padding: "12px 16px",
                      borderTop: "1px solid var(--border)",
                      textAlign: "center",
                    }}
                  >
                    <button
                      onClick={() => setShowAll(!showAll)}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "var(--bg-app)",
                        border: "1px solid var(--border)",
                        borderRadius: "6px",
                        color: "var(--brand)",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "var(--brand-dim)";
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "var(--bg-app)";
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                      }}
                    >
                      {showAll ? "View Less" : `View All (${data.applicationHistoryTotal})`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Drafts Tab */}
        {activeTab === "drafts" && (
          <div style={{ padding: "16px 0" }}>
            {data.drafts.length === 0 ? (
              <div
                style={{
                  padding: "32px 24px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                <FileText size={28} style={{ opacity: 0.5, marginBottom: "8px" }} />
                <p style={{ fontSize: "13px", margin: 0 }}>No drafts yet.</p>
              </div>
            ) : (
              <>
                {data.drafts.map((draft, idx) => {
                  const draftDate = new Date(draft.updatedAt).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "short",
                    year: "2-digit",
                  });
                  const draftTime = new Date(draft.updatedAt).toLocaleTimeString("en-KE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <a
                      key={draft.id}
                      href={`/drafts/${draft.id}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 16px",
                        borderTop: idx > 0 ? "1px solid var(--border)" : "none",
                        textDecoration: "none",
                        color: "inherit",
                        transition: "background-color 0.1s",
                        cursor: "pointer",
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
                      {/* Number */}
                      <div
                        style={{
                          minWidth: "24px",
                          height: "24px",
                          borderRadius: "4px",
                          backgroundColor: "#fbbf2415",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#fbbf24",
                          flexShrink: 0,
                        }}
                      >
                        {draft.number}
                      </div>

                      {/* Draft icon */}
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          backgroundColor: "#fbbf2415",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          color: "#fbbf24",
                        }}
                      >
                        <FileText size={14} />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "3px",
                          }}
                        >
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
                            {draft.label}
                          </p>
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              backgroundColor: "#fbbf2415",
                              color: "#fbbf24",
                              fontSize: "10px",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              flexShrink: 0,
                            }}
                          >
                            Draft
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "var(--text-muted)",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {draft.draftType} {draft.step ? `• Step: ${draft.step}` : ""}
                        </p>
                      </div>

                      {/* Date */}
                      <div
                        style={{
                          textAlign: "right",
                          flexShrink: 0,
                        }}
                      >
                        <p
                          style={{
                            fontSize: "10px",
                            color: "var(--text-muted)",
                            margin: 0,
                          }}
                        >
                          Updated
                        </p>
                        <p
                          style={{
                            fontSize: "10px",
                            color: "var(--text-muted)",
                            margin: 0,
                          }}
                        >
                          {draftDate}
                        </p>
                        <p
                          style={{
                            fontSize: "10px",
                            color: "var(--text-muted)",
                            margin: 0,
                          }}
                        >
                          {draftTime}
                        </p>
                      </div>

                      <ChevronRight
                        size={14}
                        color="var(--text-muted)"
                        style={{ flexShrink: 0 }}
                      />
                    </a>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OperationsPage() {
  const [data, setData] = useState<ApplicationHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to fetch data");
        const dashboardData = await res.json();
        
        // Extract only the application history related data
        const applicationHistoryData: ApplicationHistoryData = {
          applicationHistoryLimited: dashboardData.applicationHistoryLimited || [],
          applicationHistoryAll: dashboardData.applicationHistoryAll || [],
          applicationHistoryTotal: dashboardData.applicationHistoryTotal || 0,
          drafts: dashboardData.drafts || [],
          draftsTotal: dashboardData.draftsTotal || 0,
        };
        
        setData(applicationHistoryData);
      } catch (err) {
        setError("Failed to load application history");
        console.error("Error fetching operations data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
        Loading operations data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "48px", textAlign: "center" }}>
        <p style={{ color: "#fca5a5", marginBottom: "12px" }}>{error}</p>
        <Link href="/dashboard" style={{ color: "var(--brand)", fontSize: "13px" }}>
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "48px", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", marginBottom: "12px" }}>No data available.</p>
        <Link href="/dashboard" style={{ color: "var(--brand)", fontSize: "13px" }}>
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#ffffff", margin: "0 0 8px" }}>
          Operations
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
          Application history and draft management
        </p>
      </div>

      {/* Application History Module */}
      <ApplicationHistoryModule data={data} />
    </div>
  );
}
