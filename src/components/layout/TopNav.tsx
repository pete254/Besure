// src/components/layout/TopNav.tsx

"use client";

import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/customers": "Customers",
  "/customers/new": "New Customer",
  "/policies": "Policies",
  "/policies/new": "New Policy",
  "/claims": "Claims",
  "/claims/new": "New Claim",
  "/calculator": "Premium Calculator",
  "/reports": "Reports",
  "/settings": "Settings",
  "/settings/insurers": "Insurer Management",
  "/settings/benefits": "Benefits Manager",
  "/settings/garages": "Garage Register",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.includes("/customers/") && pathname.includes("/edit")) return "Edit Customer";
  if (pathname.includes("/customers/")) return "Customer Profile";
  if (pathname.includes("/policies/") && pathname.includes("/payment")) return "Record Payment";
  if (pathname.includes("/policies/")) return "Policy Details";
  if (pathname.includes("/claims/")) return "Claim Details";
  return "Myloe";
}

interface TopNavProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export default function TopNav({ user }: TopNavProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  return (
    <header
      className="h-14 flex items-center justify-between px-5 shrink-0"
      style={{
        backgroundColor: "var(--bg-sidebar)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Page title */}
      <h1
        className="text-sm font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h1>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* User pill — like Expo's username dropdown */}
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md"
          style={{
            backgroundColor: "var(--bg-active)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Avatar */}
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{
              backgroundColor: "var(--brand-dim)",
              color: "var(--brand)",
              border: "1px solid var(--brand)",
            }}
          >
            {initials}
          </div>
          <span
            className="text-xs font-medium hidden sm:block"
            style={{ color: "var(--text-primary)" }}
          >
            {user.name}
          </span>
          {/* Chevron */}
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            style={{ color: "var(--text-muted)" }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Sign out button */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-100"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(239,68,68,0.1)";
            (e.currentTarget as HTMLElement).style.color = "#f87171";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
          }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </header>
  );
}