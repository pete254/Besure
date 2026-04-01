// src/app/api/dashboard/summary/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { policies, claims, payments, customers, vehicles, insurers } from "@/drizzle/schema";
import { eq, gte, lte, and, lt, sql, desc } from "drizzle-orm";

export async function GET() {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 7);
    const in7DaysStr = in7Days.toISOString().split("T")[0];

    const in30Days = new Date(today);
    in30Days.setDate(today.getDate() + 30);
    const in30DaysStr = in30Days.toISOString().split("T")[0];

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfMonthStr = startOfMonth.toISOString().split("T")[0];

    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const startOfYearStr = startOfYear.toISOString().split("T")[0];

    // All policies
    const allPolicies = await db.select().from(policies);
    const activePolicies = allPolicies.filter(p => p.status === "Active");

    // Expiry buckets
    const expiringIn30 = activePolicies.filter(p =>
      p.endDate >= todayStr && p.endDate <= in30DaysStr
    );
    const expiringIn7 = activePolicies.filter(p =>
      p.endDate >= todayStr && p.endDate <= in7DaysStr
    );
    const expiredToday = allPolicies.filter(p => p.endDate === todayStr);

    // Claims
    const allClaims = await db.select().from(claims);
    const activeClaims = allClaims.filter(
      c => c.stage !== "Released / Settled"
    );
    const claimsByStage: Record<string, number> = {};
    for (const c of activeClaims) {
      claimsByStage[c.stage] = (claimsByStage[c.stage] || 0) + 1;
    }

    // Claims approaching 30 days
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];
    const claimsNearing30 = activeClaims.filter(
      c => c.dateReported <= thirtyDaysAgoStr
    ).length;

    // Payments
    const allPayments = await db.select().from(payments);
    const overduePayments = allPayments.filter(
      p => p.status !== "paid" && p.dueDate < todayStr
    );
    const overdueTotal = overduePayments.reduce(
      (sum, p) => sum + (parseFloat(p.amountDue) - parseFloat(p.amountPaid || "0")),
      0
    );

    const dueIn7Days = allPayments.filter(
      p => p.status !== "paid" && p.dueDate >= todayStr && p.dueDate <= in7DaysStr
    );
    const dueIn7Total = dueIn7Days.reduce(
      (sum, p) => sum + (parseFloat(p.amountDue) - parseFloat(p.amountPaid || "0")),
      0
    );

    // Revenue this month
    const paidThisMonth = allPayments.filter(
      p => p.paidDate && p.paidDate >= startOfMonthStr
    );
    const revenueThisMonth = paidThisMonth.reduce(
      (sum, p) => sum + parseFloat(p.amountPaid || "0"),
      0
    );

    // Revenue YTD
    const paidYTD = allPayments.filter(
      p => p.paidDate && p.paidDate >= startOfYearStr
    );
    const revenueYTD = paidYTD.reduce(
      (sum, p) => sum + parseFloat(p.amountPaid || "0"),
      0
    );

    // Commission this month — need insurer commission rates
    // We'll calculate from policies created this month with their grand totals
    const allInsurers = await db.select().from(insurers);
    const insurerMap = Object.fromEntries(allInsurers.map(i => [i.id, i]));

    const policiesThisMonth = allPolicies.filter(
      p => p.createdAt.toISOString().split("T")[0] >= startOfMonthStr
    );
    const commissionThisMonth = policiesThisMonth.reduce((sum, p) => {
      if (!p.insurerId || !p.grandTotal) return sum;
      const ins = insurerMap[p.insurerId];
      const rate = parseFloat(ins?.commissionRate || "0") / 100;
      return sum + parseFloat(p.grandTotal) * rate;
    }, 0);

    // Revenue by insurer (all time, paid payments linked via policy)
    const revenueByInsurer: Record<string, number> = {};
    for (const p of allPolicies) {
      const insurerName = p.insurerId
        ? insurerMap[p.insurerId]?.name || "Unknown"
        : p.insurerNameManual || "Manual";
      const paid = allPayments
        .filter(pay => pay.policyId === p.id)
        .reduce((s, pay) => s + parseFloat(pay.amountPaid || "0"), 0);
      revenueByInsurer[insurerName] = (revenueByInsurer[insurerName] || 0) + paid;
    }

    // Monthly policy volume — last 12 months
    const monthlyVolume: { month: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
      const count = allPolicies.filter(
        p => p.createdAt.toISOString() >= monthStart && p.createdAt.toISOString() < monthEnd
      ).length;
      monthlyVolume.push({
        month: d.toLocaleString("en-KE", { month: "short", year: "2-digit" }),
        count,
      });
    }

    // Demographics
    const allCustomers = await db.select().from(customers);
    const genderCounts: Record<string, number> = { Male: 0, Female: 0, Other: 0, Unknown: 0 };
    for (const c of allCustomers) {
      const g = c.gender || "Unknown";
      genderCounts[g] = (genderCounts[g] || 0) + 1;
    }

    const countyCounts: Record<string, number> = {};
    for (const c of allCustomers) {
      if (c.county) countyCounts[c.county] = (countyCounts[c.county] || 0) + 1;
    }
    const topCounties = Object.entries(countyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([county, count]) => ({ county, count }));

    // Policies by type
    const typeCount: Record<string, number> = {};
    for (const p of allPolicies) {
      typeCount[p.insuranceType] = (typeCount[p.insuranceType] || 0) + 1;
    }

    // Policies by cover type
    const coverCount: Record<string, number> = {};
    for (const p of allPolicies) {
      if (p.coverType) coverCount[p.coverType] = (coverCount[p.coverType] || 0) + 1;
    }

    // Policies by insurer
    const byInsurer: Record<string, number> = {};
    for (const p of allPolicies) {
      const name = p.insurerId
        ? insurerMap[p.insurerId]?.name || "Unknown"
        : p.insurerNameManual || "Manual";
      byInsurer[name] = (byInsurer[name] || 0) + 1;
    }

    // Recent policies for activity feed
    const recentPolicies = await db
      .select({
        policy: policies,
        customer: {
          firstName: customers.firstName,
          lastName: customers.lastName,
          companyName: customers.companyName,
          customerType: customers.customerType,
        },
      })
      .from(policies)
      .leftJoin(customers, eq(policies.customerId, customers.id))
      .orderBy(desc(policies.createdAt))
      .limit(5);

    return NextResponse.json({
      // Policy alerts
      expiringIn30: expiringIn30.length,
      expiringIn7: expiringIn7.length,
      expiredToday: expiredToday.length,
      totalActive: activePolicies.length,
      totalPolicies: allPolicies.length,

      // Claims
      claimsByStage,
      totalActiveClaims: activeClaims.length,
      claimsNearing30,

      // Finance
      revenueThisMonth,
      revenueYTD,
      commissionThisMonth,
      overdueTotal,
      dueIn7Total,
      revenueByInsurer,

      // Charts
      monthlyVolume,
      genderCounts,
      topCounties,
      typeCount,
      coverCount,
      byInsurer,

      // Customers
      totalCustomers: allCustomers.length,

      // Recent activity
      recentPolicies: recentPolicies.map(r => ({
        id: r.policy.id,
        insuranceType: r.policy.insuranceType,
        grandTotal: r.policy.grandTotal,
        createdAt: r.policy.createdAt,
        customerName: r.customer?.customerType === "Company"
          ? r.customer.companyName
          : `${r.customer?.firstName} ${r.customer?.lastName}`,
      })),
    });
  } catch (error) {
    console.error("GET /api/dashboard/summary error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}