// src/app/(dashboard)/settings/page.tsx

"use client";

import Link from "next/link";
import { Shield, Wrench, Star, ChevronRight } from "lucide-react";

const sections = [
  {
    href: "/settings/insurers",
    icon: <Shield size={20} color="var(--brand)" />,
    title: "Insurer Management",
    description: "Add and edit insurers, set default rates, minimum premiums and commission percentages.",
  },
  {
    href: "/settings/benefits",
    icon: <Star size={20} color="var(--brand)" />,
    title: "Benefits Manager",
    description: "Add, rename or deactivate benefit options that appear in the policy creation dropdown.",
  },
  {
    href: "/settings/garages",
    icon: <Wrench size={20} color="var(--brand)" />,
    title: "Garage Register",
    description: "Manage preferred garages used for claim repairs and parts follow-up.",
  },
];

export default function SettingsPage() {
  return (
    <div style={{ maxWidth: "700px" }}>
   <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
  Configure insurers, benefits and garages for your agency.
   </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "18px 20px",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              textDecoration: "none",
              transition: "border-color 0.1s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--brand)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")}
          >
            <div style={{
              width: "40px", height: "40px", borderRadius: "10px",
              backgroundColor: "var(--brand-dim)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {s.icon}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff", margin: "0 0 3px" }}>
                {s.title}
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                {s.description}
              </p>
            </div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </Link>
        ))}
      </div>
    </div>
  );
}