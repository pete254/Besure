// src/app/api/commissions/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commissions, policies, customers, insurers } from "@/drizzle/schema";
import { eq, desc, gte, lte, and } from "drizzle-orm";
import { z } from "zod";
import { 
  calculateAndStoreCommission, 
  generateMissingCommissions,
  regenerateAllCommissions,
  storeCommission,
} from "@/lib/commission";

const createCommissionSchema = z.object({
  policyId: z.string().uuid(),
  customerId: z.string().uuid(),
  insurerId: z.string().uuid().nullable().optional(),
  commissionAmount: z.string().or(z.number()).optional(),
  expectedDueDate: z.string().optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "all"; // all, pending, settled
    const month = searchParams.get("month"); // YYYY-MM format
    const viewAll = searchParams.get("viewAll") === "true";
    const filter = searchParams.get("filter"); // filter type (e.g., "insurer")
    const filterValue = searchParams.get("value"); // filter value (e.g., insurer name)

    // Build all conditions
    const conditions = [];

    // Filter by tab
    if (tab === "pending") {
      conditions.push(eq(commissions.status, "Pending"));
    } else if (tab === "settled") {
      conditions.push(eq(commissions.status, "Paid"));
    }

    // Filter by month if not viewing all
    if (month && !viewAll) {
      const [year, monthNum] = month.split("-");
      const startDate = new Date(`${year}-${monthNum}-01T00:00:00Z`);
      const endDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      conditions.push(gte(commissions.expectedDueDate, startDateStr));
      conditions.push(lte(commissions.expectedDueDate, endDateStr));
    }

    // Filter by insurer if specified
    if (filter === "insurer" && filterValue) {
      conditions.push(eq(insurers.name, filterValue));
    }

    let query = db
      .select({
        commission: commissions,
        policy: {
          id: policies.id,
          policyNumber: policies.policyNumber,
          insuranceType: policies.insuranceType,
          startDate: policies.startDate,
          endDate: policies.endDate,
          grandTotal: policies.grandTotal,
          status: policies.status,
        },
        customer: {
          id: customers.id,
          firstName: customers.firstName,
          lastName: customers.lastName,
          companyName: customers.companyName,
          customerType: customers.customerType,
        },
        insurer: {
          id: insurers.id,
          name: insurers.name,
        },
      })
      .from(commissions)
      .innerJoin(policies, eq(commissions.policyId, policies.id))
      .innerJoin(customers, eq(commissions.customerId, customers.id))
      .leftJoin(insurers, eq(commissions.insurerId, insurers.id));

    // Apply all conditions at once
    if (conditions.length > 0) {
      query = (query as any).where(and(...conditions));
    }

    const results = await query.orderBy(desc(commissions.expectedDueDate));

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error fetching commissions:", {
      message: errorMessage,
      error: error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: `Failed to fetch commissions: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action"); // "calculate", "generate-missing", "regenerate-all"
    
    // If action is specified, handle bulk operations
    if (action === "generate-missing") {
      const result = await generateMissingCommissions();
      return NextResponse.json(result, { status: 200 });
    }

    if (action === "regenerate-all") {
      const result = await regenerateAllCommissions();
      return NextResponse.json(result, { status: 200 });
    }

    if (action === "calculate") {
      const body = await req.json();
      const policyId = body.policyId as string;
      
      if (!policyId) {
        return NextResponse.json(
          { error: "policyId is required for calculate action" },
          { status: 400 }
        );
      }

      const result = await calculateAndStoreCommission(policyId);
      return NextResponse.json(result, { status: 201 });
    }

    // Default: create commission from provided data
    const body = await req.json();
    const parsed = createCommissionSchema.parse(body);

    // If commissionAmount not provided, calculate it
    let commissionAmount = parsed.commissionAmount;
    let expectedDueDate = parsed.expectedDueDate;
    let insurerId = parsed.insurerId;

    if (!commissionAmount || !expectedDueDate) {
      // Calculate from policy
      const policy = await db
        .select({
          grandTotal: policies.grandTotal,
          startDate: policies.startDate,
          insurerId: policies.insurerId,
        })
        .from(policies)
        .where(eq(policies.id, parsed.policyId))
        .then((r) => r[0]);

      if (!policy) {
        return NextResponse.json(
          { error: `Policy not found: ${parsed.policyId}` },
          { status: 404 }
        );
      }

      // If insurer not provided, get from policy
      if (!insurerId) {
        insurerId = policy.insurerId || null;
      }

      if (!commissionAmount && policy.insurerId) {
        // Get insurer rate
        const insurer = await db
          .select({ commissionRate: insurers.commissionRate })
          .from(insurers)
          .where(eq(insurers.id, policy.insurerId))
          .then((r) => r[0]);

        if (insurer?.commissionRate) {
          const rate = parseFloat(insurer.commissionRate);
          const total = parseFloat(policy.grandTotal || "0");
          commissionAmount = ((total * rate) / 100).toFixed(2);
        }
      }

      if (!expectedDueDate) {
        // Default: 30 days after policy start
        const startDate = new Date(policy.startDate);
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + 30);
        expectedDueDate = dueDate.toISOString().split("T")[0];
      }
    }

    const created = await storeCommission({
      policyId: parsed.policyId,
      customerId: parsed.customerId,
      insurerId: insurerId || null,
      commissionAmount: String(commissionAmount || "0"),
      expectedDueDate: expectedDueDate,
      notes: parsed.notes,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error creating commission:", {
      message: errorMessage,
      error: error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: `Failed to create commission: ${errorMessage}` },
      { status: 500 }
    );
  }
}
