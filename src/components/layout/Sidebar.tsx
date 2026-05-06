// src/components/layout/Sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  AlertTriangle,
  Calculator,
  BarChart3,
  Settings,
  Activity,
} from "lucide-react";

const navigation = [
  {
    label: "Main",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Customers", href: "/customers", icon: Users },
      { name: "Policies",  href: "/policies",  icon: FileText },
      { name: "Claims",    href: "/claims",    icon: AlertTriangle },
      { name: "Application History", href: "/operations", icon: Activity },
    ],
  },
  {
    label: "Finance",
    items: [
      { name: "Calculator", href: "/calculator", icon: Calculator },
      { name: "Reports",    href: "/reports",    icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside
      style={{
        width: "224px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Brand header */}
      <div
        style={{
          height: "64px",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: "10px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <div style={{ width: "32px", height: "32px", flexShrink: 0, overflow: "hidden" }}>
          <img
            src="/myloe_logo.png"
            alt="Myloe"
            style={{ width: "32px", height: "32px", objectFit: "contain", display: "block" }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
          <span
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "#ffffff",
              whiteSpace: "nowrap",
              lineHeight: 1.2,
            }}
          >
            Myloe
          </span>
          <span
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              whiteSpace: "nowrap",
              lineHeight: 1.2,
            }}
          >
            Insurance Solutions
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>
        {navigation.map((group) => (
          <div key={group.label} style={{ marginBottom: "20px" }}>
            <p
              style={{
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--text-muted)",
                padding: "0 12px",
                marginBottom: "4px",
              }}
            >
              {group.label}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "7px 12px",
                      borderRadius: "6px",
                      fontSize: "14px",        // increased from 13px
                      fontWeight: 600,          // bold
                      textDecoration: "none",
                      backgroundColor: active ? "var(--bg-active)" : "transparent",
                      color: active ? "#ffffff" : "#bbbbbb",  // white when active, light grey otherwise
                      transition: "background-color 0.1s, color 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)";
                        (e.currentTarget as HTMLElement).style.color = "#ffffff";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                        (e.currentTarget as HTMLElement).style.color = "#bbbbbb";
                      }
                    }}
                  >
                    <Icon
                      size={16}
                      color={active ? "var(--brand)" : "#666666"}
                      strokeWidth={2}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          🇰🇪 IRA Regulated · Kenya
        </p>
      </div>
    </aside>
  );
}