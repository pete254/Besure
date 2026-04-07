// src/app/api/dashboard/summary/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  policies,
  claims,
  payments,
  customers,
  insurers,
} from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";

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

    // ── Policies ────────────────────────────────────────────────
    const allPolicies = await db.select().from(policies);
    const activePolicies = allPolicies.filter((p) => p.status === "Active");

    const expiringIn30 = activePolicies.filter(
      (p) => p.endDate >= todayStr && p.endDate <= in30DaysStr
    );
    const expiringIn7 = activePolicies.filter(
      (p) => p.endDate >= todayStr && p.endDate <= in7DaysStr
    );
    const expiredToday = allPolicies.filter((p) => p.endDate === todayStr);

    // ── Claims ───────────────────────────────────────────────────
    const allClaims = await db.select().from(claims);
    // Terminal resolved states: "Released / Settled" and "Declined"
    const activeClaims = allClaims.filter(
      (c) => c.stage !== "Released / Settled" && c.stage !== "Declined"
    );
    const claimsByStage: Record<string, number> = {};
    for (const c of allClaims) {
      claimsByStage[c.stage] = (claimsByStage[c.stage] || 0) + 1;
    }

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];
    const claimsNearing30 = activeClaims.filter(
      (c) => c.dateReported <= thirtyDaysAgoStr
    ).length;

    // ── Payments ─────────────────────────────────────────────────
    const allPayments = await db.select().from(payments);

    const overduePayments = allPayments.filter(
      (p) => p.status !== "paid" && p.dueDate < todayStr
    );
    const overdueTotal = overduePayments.reduce(
      (sum, p) =>
        sum + (parseFloat(p.amountDue) - parseFloat(p.amountPaid || "0")),
      0
    );

    const dueIn7Days = allPayments.filter(
      (p) =>
        p.status !== "paid" &&
        p.dueDate >= todayStr &&
        p.dueDate <= in7DaysStr
    );
    const dueIn7Total = dueIn7Days.reduce(
      (sum, p) =>
        sum + (parseFloat(p.amountDue) - parseFloat(p.amountPaid || "0")),
      0
    );

    const revenueThisMonth = allPayments
      .filter((p) => p.paidDate && p.paidDate >= startOfMonthStr)
      .reduce((sum, p) => sum + parseFloat(p.amountPaid || "0"), 0);

    const revenueYTD = allPayments
      .filter((p) => p.paidDate && p.paidDate >= startOfYearStr)
      .reduce((sum, p) => sum + parseFloat(p.amountPaid || "0"), 0);

    // ── Insurers / commission ────────────────────────────────────
    const allInsurers = await db.select().from(insurers);
    const insurerMap = Object.fromEntries(allInsurers.map((i) => [i.id, i]));

    const policiesThisMonth = allPolicies.filter(
      (p) => p.createdAt.toISOString().split("T")[0] >= startOfMonthStr
    );
    const commissionThisMonth = policiesThisMonth.reduce((sum, p) => {
      if (!p.insurerId || !p.grandTotal) return sum;
      const ins = insurerMap[p.insurerId];
      const rate = parseFloat(ins?.commissionRate || "0") / 100;
      return sum + parseFloat(p.grandTotal) * rate;
    }, 0);

    const revenueByInsurer: Record<string, number> = {};
    for (const p of allPolicies) {
      const insurerName = p.insurerId
        ? insurerMap[p.insurerId]?.name || "Unknown"
        : p.insurerNameManual || "Manual";
      const paid = allPayments
        .filter((pay) => pay.policyId === p.id)
        .reduce((s, pay) => s + parseFloat(pay.amountPaid || "0"), 0);
      revenueByInsurer[insurerName] =
        (revenueByInsurer[insurerName] || 0) + paid;
    }

    // ── Monthly policy volume ────────────────────────────────────
    const monthlyVolume: { month: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStart = d.toISOString().split("T")[0];
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const monthEnd = nextMonth.toISOString().split("T")[0];
      const count = allPolicies.filter(
        (p) =>
          p.createdAt.toISOString().split("T")[0] >= monthStart &&
          p.createdAt.toISOString().split("T")[0] < monthEnd
      ).length;
      monthlyVolume.push({
        month: d.toLocaleString("en-KE", { month: "short", year: "2-digit" }),
        count,
      });
    }

    // ── Customer demographics ────────────────────────────────────
    const allCustomers = await db.select().from(customers);

    // Separate individuals from companies so gender stats are meaningful
    const individualCustomers = allCustomers.filter(
      (c) => c.customerType === "Individual"
    );
    const companyCustomers = allCustomers.filter(
      (c) => c.customerType === "Company"
    );

    // Gender breakdown for individuals only
    const genderCounts: Record<string, number> = {
      Male: 0,
      Female: 0,
      Other: 0,
      Unknown: 0,
    };
    for (const c of individualCustomers) {
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

    // ── Policy breakdowns ────────────────────────────────────────
    const typeCount: Record<string, number> = {};
    for (const p of allPolicies) {
      typeCount[p.insuranceType] = (typeCount[p.insuranceType] || 0) + 1;
    }

    const coverCount: Record<string, number> = {};
    for (const p of allPolicies) {
      if (p.coverType)
        coverCount[p.coverType] = (coverCount[p.coverType] || 0) + 1;
    }

    const byInsurer: Record<string, number> = {};
    for (const p of allPolicies) {
      const name = p.insurerId
        ? insurerMap[p.insurerId]?.name || "Unknown"
        : p.insurerNameManual || "Manual";
      byInsurer[name] = (byInsurer[name] || 0) + 1;
    }

    // ── Recent policies ──────────────────────────────────────────
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
      // Gender counts are for INDIVIDUALS only – companies are separate
      genderCounts,
      totalIndividuals: individualCustomers.length,
      totalCompanies: companyCustomers.length,
      topCounties,
      typeCount,
      coverCount,
      byInsurer,

      // Customers
      totalCustomers: allCustomers.length,

      // Recent activity
      recentPolicies: recentPolicies.map((r) => ({
        id: r.policy.id,
        insuranceType: r.policy.insuranceType,
        grandTotal: r.policy.grandTotal,
        createdAt: r.policy.createdAt,
        customerName:
          r.customer?.customerType === "Company"
            ? r.customer.companyName
            : `${r.customer?.firstName} ${r.customer?.lastName}`,
      })),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("GET /api/dashboard/summary error:", errorMessage, error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data", details: errorMessage },
      { status: 500 }
    );
  }
}