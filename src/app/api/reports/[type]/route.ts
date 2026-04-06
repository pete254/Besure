// src/app/api/reports/[type]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  policies, customers, vehicles, insurers, payments,
  claims, garages, policyBenefits, policyTracking,
} from "@/drizzle/schema";
import { eq, gte, lte, and, desc, asc } from "drizzle-orm";

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (v: string | number | null | undefined) => {
    if (v == null) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ].join("\n");
}

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-KE", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtKES(v: string | number | null | undefined): string {
  if (v == null || v === "") return "0.00";
  return parseFloat(String(v)).toFixed(2);
}

// ──────────────────────────────────────────────────────────────
// Report generators — return { headers, rows, summary? }
// ──────────────────────────────────────────────────────────────

async function policyRegister(from?: string, to?: string) {
  const all = await db
    .select({
      policy: policies,
      customer: {
        firstName: customers.firstName,
        lastName: customers.lastName,
        companyName: customers.companyName,
        customerType: customers.customerType,
        phone: customers.phone,
      },
      insurer: { name: insurers.name },
      vehicle: {
        make: vehicles.make,
        model: vehicles.model,
        regNo: vehicles.regNo,
        year: vehicles.year,
      },
    })
    .from(policies)
    .leftJoin(customers, eq(policies.customerId, customers.id))
    .leftJoin(insurers, eq(policies.insurerId, insurers.id))
    .leftJoin(vehicles, eq(vehicles.policyId, policies.id))
    .orderBy(desc(policies.createdAt));

  let filtered = all;
  if (from) filtered = filtered.filter((r) => r.policy.startDate >= from);
  if (to) filtered = filtered.filter((r) => r.policy.startDate <= to);

  const headers = [
    "Policy Number", "Customer", "Phone", "Insurer", "Type", "Cover",
    "Vehicle", "Reg No.", "Sum Insured (KES)", "Premium (KES)",
    "Start Date", "End Date", "Status", "Payment Mode",
  ];

  const rows = filtered.map((r) => {
    const name =
      r.customer?.customerType === "Company"
        ? r.customer.companyName
        : `${r.customer?.firstName} ${r.customer?.lastName}`;
    const vehicle = r.vehicle
      ? `${r.vehicle.make} ${r.vehicle.model} (${r.vehicle.year})`
      : "";
    return [
      r.policy.policyNumber || "—",
      name,
      r.customer?.phone,
      r.insurer?.name || r.policy.insurerNameManual,
      r.policy.insuranceType,
      r.policy.coverType,
      vehicle,
      r.vehicle?.regNo,
      fmtKES(r.policy.sumInsured),
      fmtKES(r.policy.grandTotal),
      fmtDate(r.policy.startDate),
      fmtDate(r.policy.endDate),
      r.policy.status,
      r.policy.paymentMode,
    ];
  });

  const totalPremium = filtered.reduce(
    (s, r) => s + parseFloat(r.policy.grandTotal || "0"),
    0
  );

  return {
    headers,
    rows,
    summary: {
      total: filtered.length,
      totalPremium: totalPremium.toFixed(2),
      active: filtered.filter((r) => r.policy.status === "Active").length,
      expired: filtered.filter((r) => r.policy.status === "Expired").length,
    },
  };
}

async function renewalDue(days: number) {
  const today = new Date().toISOString().split("T")[0];
  const future = new Date(Date.now() + days * 86400000).toISOString().split("T")[0];

  const all = await db
    .select({
      policy: policies,
      customer: {
        firstName: customers.firstName,
        lastName: customers.lastName,
        companyName: customers.companyName,
        customerType: customers.customerType,
        phone: customers.phone,
        email: customers.email,
      },
      insurer: { name: insurers.name },
      vehicle: { make: vehicles.make, model: vehicles.model, regNo: vehicles.regNo },
    })
    .from(policies)
    .leftJoin(customers, eq(policies.customerId, customers.id))
    .leftJoin(insurers, eq(policies.insurerId, insurers.id))
    .leftJoin(vehicles, eq(vehicles.policyId, policies.id))
    .orderBy(asc(policies.endDate));

  const filtered = all.filter(
    (r) => r.policy.endDate >= today && r.policy.endDate <= future && r.policy.status === "Active"
  );

  const headers = [
    "Policy Number", "Customer", "Phone", "Email", "Insurer",
    "Vehicle", "Reg No.", "Cover", "Premium (KES)", "Expiry Date", "Days Left",
  ];

  const rows = filtered.map((r) => {
    const name =
      r.customer?.customerType === "Company"
        ? r.customer.companyName
        : `${r.customer?.firstName} ${r.customer?.lastName}`;
    const daysLeft = Math.ceil(
      (new Date(r.policy.endDate).getTime() - Date.now()) / 86400000
    );
    return [
      r.policy.policyNumber || "—",
      name,
      r.customer?.phone,
      r.customer?.email,
      r.insurer?.name || r.policy.insurerNameManual,
      r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : "",
      r.vehicle?.regNo,
      r.policy.coverType,
      fmtKES(r.policy.grandTotal),
      fmtDate(r.policy.endDate),
      daysLeft,
    ];
  });

  return {
    headers,
    rows,
    summary: { total: filtered.length, days },
  };
}

async function paymentCollection(from?: string, to?: string) {
  const allPayments = await db
    .select({
      payment: payments,
      policy: {
        id: policies.id,
        policyNumber: policies.policyNumber,
        insuranceType: policies.insuranceType,
        grandTotal: policies.grandTotal,
      },
      customer: {
        firstName: customers.firstName,
        lastName: customers.lastName,
        companyName: customers.companyName,
        customerType: customers.customerType,
        phone: customers.phone,
      },
    })
    .from(payments)
    .leftJoin(policies, eq(payments.policyId, policies.id))
    .leftJoin(customers, eq(policies.customerId, customers.id))
    .orderBy(desc(payments.dueDate));

  let filtered = allPayments;
  if (from) filtered = filtered.filter((r) => r.payment.dueDate >= from);
  if (to) filtered = filtered.filter((r) => r.payment.dueDate <= to);

  const headers = [
    "Policy Number", "Customer", "Phone", "Type",
    "Installment", "Amount Due (KES)", "Amount Paid (KES)",
    "Outstanding (KES)", "Due Date", "Paid Date", "Method", "Reference", "Status",
  ];

  const rows = filtered.map((r) => {
    const name =
      r.customer?.customerType === "Company"
        ? r.customer.companyName
        : `${r.customer?.firstName} ${r.customer?.lastName}`;
    const due = parseFloat(r.payment.amountDue);
    const paid = parseFloat(r.payment.amountPaid || "0");
    const outstanding = Math.max(due - paid, 0);
    return [
      r.policy?.policyNumber || "—",
      name,
      r.customer?.phone,
      r.policy?.insuranceType,
      `${r.payment.installmentNumber}/${r.payment.totalInstallments}`,
      fmtKES(r.payment.amountDue),
      fmtKES(r.payment.amountPaid),
      outstanding.toFixed(2),
      fmtDate(r.payment.dueDate),
      fmtDate(r.payment.paidDate),
      r.payment.paymentMethod,
      r.payment.referenceNo,
      r.payment.status,
    ];
  });

  const totalDue = filtered.reduce((s, r) => s + parseFloat(r.payment.amountDue), 0);
  const totalPaid = filtered.reduce((s, r) => s + parseFloat(r.payment.amountPaid || "0"), 0);

  return {
    headers,
    rows,
    summary: {
      total: filtered.length,
      totalDue: totalDue.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      totalOutstanding: (totalDue - totalPaid).toFixed(2),
      paidCount: filtered.filter((r) => r.payment.status === "paid").length,
      pendingCount: filtered.filter((r) => r.payment.status === "pending").length,
    },
  };
}

async function commissionReport(from?: string, to?: string) {
  const all = await db
    .select({
      policy: policies,
      insurer: insurers,
      customer: {
        firstName: customers.firstName,
        lastName: customers.lastName,
        companyName: customers.companyName,
        customerType: customers.customerType,
      },
    })
    .from(policies)
    .leftJoin(insurers, eq(policies.insurerId, insurers.id))
    .leftJoin(customers, eq(policies.customerId, customers.id))
    .orderBy(desc(policies.createdAt));

  let filtered = all;
  if (from) filtered = filtered.filter((r) => r.policy.createdAt.toISOString().split("T")[0] >= from);
  if (to) filtered = filtered.filter((r) => r.policy.createdAt.toISOString().split("T")[0] <= to);

  const headers = [
    "Policy Number", "Customer", "Insurer", "Type",
    "Grand Total (KES)", "Commission Rate (%)", "Commission (KES)",
    "Start Date", "Status",
  ];

  const rows = filtered.map((r) => {
    const name =
      r.customer?.customerType === "Company"
        ? r.customer.companyName
        : `${r.customer?.firstName} ${r.customer?.lastName}`;
    const total = parseFloat(r.policy.grandTotal || "0");
    const rate = parseFloat(r.insurer?.commissionRate || "0");
    const commission = (total * rate) / 100;
    return [
      r.policy.policyNumber || "—",
      name,
      r.insurer?.name || r.policy.insurerNameManual,
      r.policy.insuranceType,
      fmtKES(r.policy.grandTotal),
      rate > 0 ? `${rate}%` : "—",
      commission.toFixed(2),
      fmtDate(r.policy.startDate),
      r.policy.status,
    ];
  });

  // Summary by insurer
  const byInsurer: Record<string, { premium: number; commission: number; count: number }> = {};
  for (const r of filtered) {
    const name = r.insurer?.name || r.policy.insurerNameManual || "Manual";
    if (!byInsurer[name]) byInsurer[name] = { premium: 0, commission: 0, count: 0 };
    const total = parseFloat(r.policy.grandTotal || "0");
    const rate = parseFloat(r.insurer?.commissionRate || "0");
    byInsurer[name].premium += total;
    byInsurer[name].commission += (total * rate) / 100;
    byInsurer[name].count += 1;
  }

  const totalCommission = Object.values(byInsurer).reduce((s, v) => s + v.commission, 0);

  return {
    headers,
    rows,
    summary: {
      total: filtered.length,
      totalCommission: totalCommission.toFixed(2),
      byInsurer,
    },
  };
}

async function claimsRegister(from?: string, to?: string) {
  const all = await db
    .select({
      claim: claims,
      policy: {
        policyNumber: policies.policyNumber,
        insuranceType: policies.insuranceType,
      },
      customer: {
        firstName: customers.firstName,
        lastName: customers.lastName,
        companyName: customers.companyName,
        customerType: customers.customerType,
        phone: customers.phone,
      },
      vehicle: { make: vehicles.make, model: vehicles.model, regNo: vehicles.regNo },
      garage: { name: garages.name },
    })
    .from(claims)
    .leftJoin(policies, eq(claims.policyId, policies.id))
    .leftJoin(customers, eq(policies.customerId, customers.id))
    .leftJoin(vehicles, eq(vehicles.policyId, policies.id))
    .leftJoin(garages, eq(claims.garageId, garages.id))
    .orderBy(desc(claims.dateReported));

  let filtered = all;
  if (from) filtered = filtered.filter((r) => r.claim.dateReported >= from);
  if (to) filtered = filtered.filter((r) => r.claim.dateReported <= to);

  const headers = [
    "Claim No.", "Policy No.", "Customer", "Phone", "Vehicle", "Reg No.",
    "Nature", "Date of Loss", "Date Reported", "Stage",
    "Repair Estimate (KES)", "Approved Amount (KES)", "Settlement Date", "Garage",
  ];

  const rows = filtered.map((r) => {
    const name =
      r.customer?.customerType === "Company"
        ? r.customer.companyName
        : `${r.customer?.firstName} ${r.customer?.lastName}`;
    return [
      r.claim.claimNumber,
      r.policy?.policyNumber || "—",
      name,
      r.customer?.phone,
      r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : "",
      r.vehicle?.regNo,
      r.claim.natureOfLoss,
      fmtDate(r.claim.dateOfLoss),
      fmtDate(r.claim.dateReported),
      r.claim.stage,
      fmtKES(r.claim.repairEstimate),
      fmtKES(r.claim.approvedAmount),
      fmtDate(r.claim.settlementDate),
      r.garage?.name || r.claim.garageFreeText,
    ];
  });

  const totalEstimate = filtered.reduce(
    (s, r) => s + parseFloat(r.claim.repairEstimate || "0"),
    0
  );
  const totalApproved = filtered.reduce(
    (s, r) => s + parseFloat(r.claim.approvedAmount || "0"),
    0
  );

  return {
    headers,
    rows,
    summary: {
      total: filtered.length,
      settled: filtered.filter((r) => r.claim.stage === "Released / Settled").length,
      active: filtered.filter((r) => r.claim.stage !== "Released / Settled").length,
      totalEstimate: totalEstimate.toFixed(2),
      totalApproved: totalApproved.toFixed(2),
    },
  };
}

async function documentationCompliance() {
  // Policies missing documents / in early tracking stages
  const allPolicies = await db
    .select({
      policy: policies,
      customer: {
        firstName: customers.firstName,
        lastName: customers.lastName,
        companyName: customers.companyName,
        customerType: customers.customerType,
        phone: customers.phone,
      },
      insurer: { name: insurers.name },
      vehicle: { make: vehicles.make, model: vehicles.model, regNo: vehicles.regNo },
    })
    .from(policies)
    .leftJoin(customers, eq(policies.customerId, customers.id))
    .leftJoin(insurers, eq(policies.insurerId, insurers.id))
    .leftJoin(vehicles, eq(vehicles.policyId, policies.id))
    .where(eq(policies.status, "Active"))
    .orderBy(asc(policies.startDate));

  // Get latest tracking stage for each policy
  const allTracking = await db.select().from(policyTracking).orderBy(desc(policyTracking.stageDate));
  const latestStage: Record<string, string> = {};
  for (const t of allTracking) {
    if (!latestStage[t.policyId]) {
      latestStage[t.policyId] = t.stage;
    }
  }

  const incomplete = allPolicies.filter((r) => {
    const stage = latestStage[r.policy.id] || "Cover Recorded";
    return (
      stage === "Cover Recorded" ||
      stage === "Documents Pending" ||
      !r.policy.policyNumber
    );
  });

  const headers = [
    "Policy Number", "Customer", "Phone", "Insurer",
    "Vehicle", "Reg No.", "Cover Type", "Start Date",
    "Tracking Stage", "Policy # Issued?", "Days Since Start",
  ];

  const rows = incomplete.map((r) => {
    const name =
      r.customer?.customerType === "Company"
        ? r.customer.companyName
        : `${r.customer?.firstName} ${r.customer?.lastName}`;
    const stage = latestStage[r.policy.id] || "Cover Recorded";
    const daysSince = Math.floor(
      (Date.now() - new Date(r.policy.startDate).getTime()) / 86400000
    );
    return [
      r.policy.policyNumber || "Not Issued",
      name,
      r.customer?.phone,
      r.insurer?.name || r.policy.insurerNameManual,
      r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : "",
      r.vehicle?.regNo,
      r.policy.coverType,
      fmtDate(r.policy.startDate),
      stage,
      r.policy.policyNumber ? "Yes" : "No",
      daysSince,
    ];
  });

  return {
    headers,
    rows,
    summary: {
      total: incomplete.length,
      noPolicyNumber: incomplete.filter((r) => !r.policy.policyNumber).length,
      pendingDocs: incomplete.filter(
        (r) =>
          (latestStage[r.policy.id] || "Cover Recorded") === "Documents Pending" ||
          (latestStage[r.policy.id] || "Cover Recorded") === "Cover Recorded"
      ).length,
    },
  };
}

async function insurerPerformance(from?: string, to?: string) {
  const allPolicies = await db
    .select({ policy: policies, insurer: insurers })
    .from(policies)
    .leftJoin(insurers, eq(policies.insurerId, insurers.id));

  const allClaims = await db
    .select({ claim: claims, policy: { insurerId: policies.insurerId } })
    .from(claims)
    .leftJoin(policies, eq(claims.policyId, policies.id));

  const allTracking = await db.select().from(policyTracking).orderBy(desc(policyTracking.stageDate));

  // Build per-insurer stats
  interface InsurerStats {
    name: string;
    policyCount: number;
    totalPremium: number;
    claimsCount: number;
    settledClaims: number;
    avgTurnaround: number | null;
    turnaroundSamples: number[];
  }

  const statsMap: Record<string, InsurerStats> = {};

  for (const { policy, insurer } of allPolicies) {
    const id = policy.insurerId || "manual";
    const name = insurer?.name || policy.insurerNameManual || "Manual";
    if (!statsMap[id]) {
      statsMap[id] = { name, policyCount: 0, totalPremium: 0, claimsCount: 0, settledClaims: 0, avgTurnaround: null, turnaroundSamples: [] };
    }
    statsMap[id].policyCount++;
    statsMap[id].totalPremium += parseFloat(policy.grandTotal || "0");
  }

  for (const { claim, policy: cp } of allClaims) {
    if (!cp) continue;
    const id = cp.insurerId || "manual";
    if (statsMap[id]) {
      statsMap[id].claimsCount++;
      if (claim.stage === "Released / Settled" && claim.settlementDate) {
        statsMap[id].settledClaims++;
        const days = Math.floor(
          (new Date(claim.settlementDate).getTime() - new Date(claim.dateReported).getTime()) / 86400000
        );
        if (days >= 0) statsMap[id].turnaroundSamples.push(days);
      }
    }
  }

  for (const s of Object.values(statsMap)) {
    if (s.turnaroundSamples.length > 0) {
      s.avgTurnaround = Math.round(
        s.turnaroundSamples.reduce((a, b) => a + b, 0) / s.turnaroundSamples.length
      );
    }
  }

  const headers = [
    "Insurer", "Policies Written", "Total Premium (KES)",
    "Claims Filed", "Claims Settled", "Settlement Rate (%)",
    "Avg Claim Turnaround (days)",
  ];

  const rows = Object.values(statsMap).map((s) => {
    const settlementRate =
      s.claimsCount > 0 ? ((s.settledClaims / s.claimsCount) * 100).toFixed(1) : "0.0";
    return [
      s.name,
      s.policyCount,
      s.totalPremium.toFixed(2),
      s.claimsCount,
      s.settledClaims,
      `${settlementRate}%`,
      s.avgTurnaround != null ? s.avgTurnaround : "N/A",
    ];
  });

  return { headers, rows, summary: { insurerCount: rows.length } };
}

async function customerDemographics() {
  const allCustomers = await db.select().from(customers);

  const headers = [
    "Name", "Phone", "Email", "Type", "Gender", "County",
    "Date of Birth", "Customer Since",
  ];

  const rows = allCustomers.map((c) => {
    const name =
      c.customerType === "Company"
        ? c.companyName
        : `${c.firstName} ${c.lastName}`;
    return [
      name,
      c.phone,
      c.email,
      c.customerType,
      c.gender,
      c.county,
      c.dateOfBirth ? fmtDate(c.dateOfBirth) : "",
      fmtDate(c.createdAt),
    ];
  });

  // Summaries
  const genderMap: Record<string, number> = {};
  const countyMap: Record<string, number> = {};
  for (const c of allCustomers) {
    const g = c.gender || "Unknown";
    genderMap[g] = (genderMap[g] || 0) + 1;
    if (c.county) countyMap[c.county] = (countyMap[c.county] || 0) + 1;
  }

  return {
    headers,
    rows,
    summary: {
      total: allCustomers.length,
      individual: allCustomers.filter((c) => c.customerType === "Individual").length,
      company: allCustomers.filter((c) => c.customerType === "Company").length,
      genderMap,
      countyMap,
    },
  };
}

// ──────────────────────────────────────────────────────────────
// Route handler
// ──────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const { searchParams } = new URL(req.url);

    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const format = searchParams.get("format") || "json"; // json | csv
    const days = parseInt(searchParams.get("days") || "30");

    let result: { headers: string[]; rows: any[][]; summary?: any };

    switch (type) {
      case "policy-register":
        result = await policyRegister(from, to);
        break;
      case "renewal-due":
        result = await renewalDue(days);
        break;
      case "payment-collection":
        result = await paymentCollection(from, to);
        break;
      case "commission":
        result = await commissionReport(from, to);
        break;
      case "claims-register":
        result = await claimsRegister(from, to);
        break;
      case "documentation-compliance":
        result = await documentationCompliance();
        break;
      case "insurer-performance":
        result = await insurerPerformance(from, to);
        break;
      case "customer-demographics":
        result = await customerDemographics();
        break;
      default:
        return NextResponse.json({ error: "Unknown report type" }, { status: 404 });
    }

    if (format === "csv") {
      const csv = toCSV(result.headers, result.rows);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${type}-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      type,
      headers: result.headers,
      rows: result.rows,
      summary: result.summary,
      generatedAt: new Date().toISOString(),
      from,
      to,
    });
  } catch (error) {
    console.error(`GET /api/reports/[type] error:`, error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}