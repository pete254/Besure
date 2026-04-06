// src/app/api/pdf/risk-note/[policyId]/route.tsx
// Generates a Risk Note / Cover Note PDF for a given policy
// GET /api/pdf/risk-note/[policyId]

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { policies, customers, vehicles, insurers, policyBenefits } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 36,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
  },

  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#10b981",
  },
  agencyBlock: { maxWidth: "55%" },
  agencyName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#10b981", marginBottom: 2 },
  agencyTagline: { fontSize: 7.5, color: "#555", marginBottom: 6 },
  agencyLine: { fontSize: 7.5, color: "#333", marginBottom: 1 },

  // Risk note title
  docTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#10b981",
    textAlign: "right",
    marginBottom: 2,
  },
  draftBadge: {
    fontSize: 7,
    color: "#888",
    textAlign: "right",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Section title bar
  sectionBar: {
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 14,
    marginBottom: 6,
  },
  sectionBarText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // Two-column info grid
  infoGrid: { flexDirection: "row", flexWrap: "wrap" },
  infoCell: { width: "50%", marginBottom: 7, paddingRight: 10 },
  infoLabel: {
    fontSize: 7,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 1.5,
  },
  infoValue: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#111",
  },
  infoValueNormal: {
    fontSize: 8.5,
    color: "#333",
  },

  // Table
  table: { marginTop: 6 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0fdf4",
    borderBottomWidth: 1,
    borderBottomColor: "#10b981",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: "#fafafa",
  },
  th: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#333" },
  td: { fontSize: 8, color: "#333" },

  // Premium table
  premiumRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
  },
  premiumRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#10b981",
    marginTop: 4,
    borderRadius: 2,
  },
  premiumLabel: { fontSize: 8.5, color: "#333" },
  premiumValue: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#111" },
  premiumTotalLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  premiumTotalValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#ffffff" },

  // Benefits table
  benefitRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 0.5,
    borderTopColor: "#ccc",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 6.5, color: "#888" },

  // Divider
  divider: { borderBottomWidth: 0.5, borderBottomColor: "#e0e0e0", marginVertical: 8 },

  // Signature block
  signatureRow: { flexDirection: "row", marginTop: 20, gap: 40 },
  signatureBlock: { flex: 1 },
  signatureLine: { borderBottomWidth: 0.5, borderBottomColor: "#333", marginTop: 24, marginBottom: 3 },
  signatureLabel: { fontSize: 7, color: "#555" },

  // Notice box
  noticeBox: {
    backgroundColor: "#fefce8",
    borderWidth: 0.5,
    borderColor: "#fbbf24",
    borderRadius: 3,
    padding: 8,
    marginTop: 10,
  },
  noticeTitle: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#92400e", marginBottom: 3 },
  noticeText: { fontSize: 7, color: "#713f12", lineHeight: 1.5 },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n?: string | null) {
  if (!n) return "—";
  const num = parseFloat(n);
  if (isNaN(num)) return "—";
  return `KES ${num.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── PDF Document ─────────────────────────────────────────────────────────────

function RiskNoteDocument({ data }: { data: any }) {
  const { policy, customer, vehicle, insurer, benefits } = data;
  const coverType = policy.coverType || "Comprehensive";
  const insurerName = insurer?.name || policy.insurerNameManual || "—";
  const customerName =
    customer?.customerType === "Company"
      ? customer.companyName
      : `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim();

  const totalBenefits = parseFloat(policy.totalBenefits || "0");
  const grandTotal = parseFloat(policy.grandTotal || "0");

  return (
    <Document title={`Risk Note — ${policy.policyNumber || "Draft"}`}>
      <Page size="A4" style={styles.page}>

        {/* ── HEADER ── */}
        <View style={styles.headerRow}>
          {/* Agency info */}
          <View style={styles.agencyBlock}>
            <Text style={styles.agencyName}>BeSure Insurance Solutions</Text>
            <Text style={styles.agencyTagline}>IRA Regulated Insurance Agency · Kenya Motor Insurance</Text>
            <Text style={styles.agencyLine}>Westlands Commercial Centre, 2nd Floor, Wing B</Text>
            <Text style={styles.agencyLine}>P.O Box 12345 – 00100, Nairobi, Kenya</Text>
            <Text style={styles.agencyLine}>Tel: +254 700 000 000  |  Email: info@besure.co.ke</Text>
            <Text style={styles.agencyLine}>Website: www.besure.co.ke</Text>
          </View>

          {/* Doc title */}
          <View>
            <Text style={styles.docTitle}>RISK NOTE / COVER NOTE</Text>
            <Text style={styles.draftBadge}>
              {policy.policyNumber ? `Policy No: ${policy.policyNumber}` : "— DRAFT —"}
            </Text>
          </View>
        </View>

        {/* ── POLICY INFORMATION ── */}
        <View style={styles.sectionBar}>
          <Text style={styles.sectionBarText}>Policy Information</Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Agency</Text>
            <Text style={styles.infoValue}>BeSure Insurance Solutions</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Class of Insurance</Text>
            <Text style={styles.infoValue}>{policy.insuranceType?.replace("Motor - ", "MOTOR ").toUpperCase()}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Insurer Policy No.</Text>
            <Text style={styles.infoValue}>{policy.policyNumber || "Pending"}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Cover Type</Text>
            <Text style={styles.infoValue}>{coverType === "Comprehensive" ? "COMP" : coverType}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Insurer</Text>
            <Text style={styles.infoValue}>{insurerName.toUpperCase()}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Ref No.</Text>
            <Text style={styles.infoValue}>{policy.policyNumber || "—"}</Text>
          </View>
        </View>

        {/* ── INSURED DETAILS ── */}
        <View style={styles.sectionBar}>
          <Text style={styles.sectionBarText}>Insured Details</Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={[styles.infoCell, { width: "100%" }]}>
            <Text style={styles.infoLabel}>Insured</Text>
            <Text style={styles.infoValue}>{customerName?.toUpperCase()}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Telephone</Text>
            <Text style={styles.infoValueNormal}>{customer?.phone || "—"}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValueNormal}>{customer?.email || customer?.companyEmail || "—"}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>ID Number / PIN</Text>
            <Text style={styles.infoValueNormal}>
              {customer?.idNumberValue || customer?.idNumber || "—"}
              {(customer?.kraPinValue || customer?.kraPin) ? `  /  ${customer.kraPinValue || customer.kraPin}` : ""}
            </Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>County / Location</Text>
            <Text style={styles.infoValueNormal}>{customer?.county || "—"}</Text>
          </View>
        </View>

        {/* ── PERIOD OF INSURANCE ── */}
        <View style={styles.sectionBar}>
          <Text style={styles.sectionBarText}>Period of Insurance</Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>From</Text>
            <Text style={styles.infoValue}>{fmtDate(policy.startDate)}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>To</Text>
            <Text style={styles.infoValue}>{fmtDate(policy.endDate)}</Text>
          </View>
          <View style={[styles.infoCell, { width: "100%" }]}>
            <Text style={styles.infoValueNormal}>Both dates inclusive. The next renewal date will be {fmtDate(policy.endDate)}.</Text>
          </View>
        </View>

        {/* ── VEHICLE DETAILS (motor only) ── */}
        {vehicle && (
          <>
            <View style={styles.sectionBar}>
              <Text style={styles.sectionBarText}>Schedule of Insured Items</Text>
            </View>

            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: "8%" }]}>No.</Text>
                <Text style={[styles.th, { width: "12%" }]}>Reg. No.</Text>
                <Text style={[styles.th, { width: "12%" }]}>Make</Text>
                <Text style={[styles.th, { width: "12%" }]}>Model</Text>
                <Text style={[styles.th, { width: "14%" }]}>Engine No.</Text>
                <Text style={[styles.th, { width: "14%" }]}>Chassis No.</Text>
                <Text style={[styles.th, { width: "8%" }]}>YOM</Text>
                <Text style={[styles.th, { width: "8%" }]}>Seats</Text>
                <Text style={[styles.th, { width: "12%", textAlign: "right" }]}>Value (KES)</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.td, { width: "8%" }]}>1</Text>
                <Text style={[styles.td, { width: "12%" }]}>{vehicle.regNo}</Text>
                <Text style={[styles.td, { width: "12%" }]}>{vehicle.make?.toUpperCase()}</Text>
                <Text style={[styles.td, { width: "12%" }]}>{vehicle.model?.toUpperCase()}</Text>
                <Text style={[styles.td, { width: "14%" }]}>{vehicle.engineNo}</Text>
                <Text style={[styles.td, { width: "14%" }]}>{vehicle.chassisNo}</Text>
                <Text style={[styles.td, { width: "8%" }]}>{vehicle.year}</Text>
                <Text style={[styles.td, { width: "8%" }]}>{vehicle.seats || "—"}</Text>
                <Text style={[styles.td, { width: "12%", textAlign: "right" }]}>
                  {policy.sumInsured ? parseFloat(policy.sumInsured).toLocaleString("en-KE", { minimumFractionDigits: 2 }) : "—"}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ── ADDITIONAL BENEFITS ── */}
        {benefits && benefits.length > 0 && (
          <>
            <View style={styles.sectionBar}>
              <Text style={styles.sectionBarText}>Additional Benefits</Text>
            </View>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 1 }]}>Benefit</Text>
                <Text style={[styles.th, { width: "25%", textAlign: "right" }]}>Premium (KES)</Text>
              </View>
              {benefits.map((b: any, i: number) => (
                <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.td, { flex: 1 }]}>{b.benefitName}</Text>
                  <Text style={[styles.td, { width: "25%", textAlign: "right" }]}>
                    {parseFloat(b.amountKes || "0").toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── PREMIUM SUMMARY ── */}
        <View style={styles.sectionBar}>
          <Text style={styles.sectionBarText}>Premium Summary</Text>
        </View>

        <View style={{ marginHorizontal: 0, marginTop: 4 }}>
          <View style={styles.premiumRow}>
            <Text style={styles.premiumLabel}>Sum Insured (Vehicle Value)</Text>
            <Text style={styles.premiumValue}>{fmt(policy.sumInsured)}</Text>
          </View>
          <View style={styles.premiumRow}>
            <Text style={styles.premiumLabel}>Basic Premium Rate</Text>
            <Text style={styles.premiumValue}>{policy.basicRate ? `${parseFloat(policy.basicRate).toFixed(2)}%` : "—"}</Text>
          </View>
          <View style={styles.premiumRow}>
            <Text style={styles.premiumLabel}>Basic Premium</Text>
            <Text style={styles.premiumValue}>{fmt(policy.basicPremium)}</Text>
          </View>
          {benefits && benefits.length > 0 && (
            <View style={styles.premiumRow}>
              <Text style={styles.premiumLabel}>Additional Benefits Total</Text>
              <Text style={styles.premiumValue}>{fmt(policy.totalBenefits)}</Text>
            </View>
          )}
          <View style={styles.premiumRow}>
            <Text style={styles.premiumLabel}>IRA Levy (0.45%)</Text>
            <Text style={styles.premiumValue}>{fmt(policy.iraLevy)}</Text>
          </View>
          <View style={styles.premiumRow}>
            <Text style={styles.premiumLabel}>Training Levy (0.2%)</Text>
            <Text style={styles.premiumValue}>{fmt(policy.trainingLevy)}</Text>
          </View>
          <View style={styles.premiumRow}>
            <Text style={styles.premiumLabel}>Policyholders Compensation Fund (PHCF)</Text>
            <Text style={styles.premiumValue}>{fmt(policy.phcf)}</Text>
          </View>
          <View style={styles.premiumRow}>
            <Text style={styles.premiumLabel}>Stamp Duty</Text>
            <Text style={styles.premiumValue}>{policy.stampDuty === "0" || !policy.stampDuty ? "NIL" : fmt(policy.stampDuty)}</Text>
          </View>
          <View style={styles.premiumRowTotal}>
            <Text style={styles.premiumTotalLabel}>GROSS PREMIUM</Text>
            <Text style={styles.premiumTotalValue}>{fmt(policy.grandTotal)}</Text>
          </View>
        </View>

        {/* ── PAYMENT MODE ── */}
        <View style={styles.infoGrid}>
          <View style={[styles.infoCell, { width: "100%", marginTop: 10 }]}>
            <Text style={styles.infoLabel}>Payment Arrangement</Text>
            <Text style={styles.infoValueNormal}>
              {policy.paymentMode || "Full Payment"}
              {policy.paymentMode === "IPF" && policy.ipfProvider ? ` — ${policy.ipfProvider}` : ""}
            </Text>
          </View>
        </View>

        {/* ── IMPORTANT NOTES ── */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>IMPORTANT NOTES</Text>
          <Text style={styles.noticeText}>
            1. VALUATION: Please ensure that you obtain a current valuation for your vehicle. Average clause will apply in the event of a loss if the vehicle is under-insured.{"\n"}
            2. OWNERSHIP: Proof of ownership (copy of logbook) is required before cover is confirmed. It is a legal requirement that insurance is issued to the registered owner of the vehicle.{"\n"}
            3. CLAIMS: In case of an accident or theft, please report to us immediately and provide: completed motor accident/theft report form, original police abstract, driver's valid driving licence, and the applicable policy excess.{"\n"}
            4. This Cover Note is only a summary of cover provided. Full terms and conditions are as per the policy wording, a copy of which is available on request.
          </Text>
        </View>

        {/* ── SIGNATURES ── */}
        <View style={styles.signatureRow}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Prepared By (BeSure Insurance Solutions)</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Authorised By</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Date</Text>
          </View>
        </View>

        {/* ── FOOTER ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            BeSure Insurance Solutions · IRA Regulated · www.besure.co.ke
          </Text>
          <Text style={styles.footerText}>
            Generated on {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </Text>
        </View>

      </Page>
    </Document>
  );
}

// ─── API Handler ──────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ policyId: string }> }
) {
  try {
    const { policyId } = await params;

    // Fetch policy
    const [policy] = await db.select().from(policies).where(eq(policies.id, policyId));
    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    // Parallel data fetch
    const [customer, vehicle, insurer, benefits] = await Promise.all([
      db.select().from(customers).where(eq(customers.id, policy.customerId)).then(r => r[0]),
      db.select().from(vehicles).where(eq(vehicles.policyId, policyId)).then(r => r[0]),
      policy.insurerId
        ? db.select().from(insurers).where(eq(insurers.id, policy.insurerId)).then(r => r[0])
        : Promise.resolve(null),
      db.select().from(policyBenefits).where(eq(policyBenefits.policyId, policyId)),
    ]);

    // Render PDF
    const buffer = await renderToBuffer(
      <RiskNoteDocument data={{ policy, customer, vehicle, insurer, benefits }} />
    );

    const policyRef = policy.policyNumber || policyId.slice(0, 8);
    const filename = `RiskNote-${policyRef}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    console.error("Risk Note PDF error:", error);
    return NextResponse.json({ error: "Failed to generate risk note PDF" }, { status: 500 });
  }
}