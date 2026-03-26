// src/app/(dashboard)/layout.tsx

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || !session.user) redirect("/login");

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "var(--bg-app)" }}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav user={session.user} />
        <main
          className="flex-1 overflow-y-auto p-5"
          style={{ backgroundColor: "var(--bg-app)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}