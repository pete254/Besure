// src/app/api/calculator/proposal-pdf/route.ts
// Generates a branded Quote / Proposal PDF from calculator inputs
// POST /api/calculator/proposal-pdf

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Line,
  Svg,
} from "@react-pdf/renderer";

// ─── Styles ───────────────────────────────────────────────────────────────────

const GREEN = "#10b981";
const DARK_GREEN = "#059669";
const DIM_GREEN = "#064e3b";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#374151";
const TEXT_MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const BG_LIGHT = "#f9fafb";
const BG_GREEN_LIGHT = "#f0fdf4";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: TEXT_PRIMARY,
    backgroundColor: "#ffffff",
    paddingTop: 0,
    paddingBottom: 36,
    paddingHorizontal: 0,
  },

  // ── Header band ──
  headerBand: {
    backgroundColor: TEXT_PRIMARY,
    paddingHorizontal: 36,
    paddingVertical: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  accentStripe: {
    height: 4,
    backgroundColor: GREEN,
  },
  agencyName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: GREEN,
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  agencyTagline: {
    fontSize: 7.5,
    color: "#9ca3af",
    marginBottom: 5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  agencyDetail: { fontSize: 7.5, color: "#9ca3af", marginBottom: 1 },

  docLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#9ca3af",
    textAlign: "right",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  docTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textAlign: "right",
    marginBottom: 3,
  },
  docRef: {
    fontSize: 7.5,
    color: "#6b7280",
    textAlign: "right",
  },

  // ── Body padding wrapper ──
  body: {
    paddingHorizontal: 36,
    paddingTop: 20,
  },

  // ── Section title bar ──
  sectionBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: GREEN,
    paddingBottom: 4,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
    marginRight: 7,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: TEXT_SECONDARY,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // ── Info grid ──
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
  },
  infoCell: {
    width: "50%",
    marginBottom: 9,
    paddingRight: 12,
  },
  infoCellFull: {
    width: "100%",
    marginBottom: 9,
  },
  infoLabel: {
    fontSize: 7,
    color: TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
    fontFamily: "Helvetica-Bold",
  },
  infoValue: {
    fontSize: 9,
    color: TEXT_PRIMARY,
    fontFamily: "Helvetica-Bold",
  },
  infoValueLight: {
    fontSize: 9,
    color: TEXT_SECONDARY,
  },

  // ── Premium table ──
  premiumTable: {
    backgroundColor: BG_LIGHT,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    marginTop: 4,
  },
  premiumTableHeader: {
    backgroundColor: TEXT_PRIMARY,
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  premiumTableHeaderText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  premiumRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  premiumRowAlt: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    backgroundColor: "#ffffff",
  },
  premiumRowSubtotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    backgroundColor: BG_GREEN_LIGHT,
  },
  premiumLabel: { fontSize: 8.5, color: TEXT_SECONDARY },
  premiumLabelBold: { fontSize: 8.5, color: TEXT_PRIMARY, fontFamily: "Helvetica-Bold" },
  premiumValue: { fontSize: 8.5, color: TEXT_PRIMARY, fontFamily: "Helvetica-Bold" },
  premiumValueMuted: { fontSize: 8.5, color: TEXT_MUTED },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: GREEN,
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },

  // ── Installment scenarios ──
  installmentGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  installmentCard: {
    flex: 1,
    backgroundColor: BG_LIGHT,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    padding: 10,
    alignItems: "center",
  },
  installmentCardAccent: {
    flex: 1,
    backgroundColor: BG_GREEN_LIGHT,
    borderWidth: 1,
    borderColor: GREEN,
    borderRadius: 4,
    padding: 10,
    alignItems: "center",
  },
  installmentLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  installmentAmount: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  installmentAmountGreen: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: GREEN,
    marginBottom: 2,
  },
  installmentSub: {
    fontSize: 7,
    color: TEXT_MUTED,
    textAlign: "center",
  },

  // ── Notice box ──
  noticeBox: {
    marginTop: 16,
    backgroundColor: "#fffbeb",
    borderWidth: 0.5,
    borderColor: "#f59e0b",
    borderRadius: 4,
    padding: 10,
  },
  noticeTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#92400e",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  noticeText: {
    fontSize: 7,
    color: "#78350f",
    lineHeight: 1.6,
  },

  // ── Validity box ──
  validityBox: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BG_GREEN_LIGHT,
    borderWidth: 0.5,
    borderColor: GREEN,
    borderRadius: 4,
    padding: 10,
  },
  validityText: {
    fontSize: 7.5,
    color: DARK_GREEN,
    fontFamily: "Helvetica-Bold",
  },
  validitySubText: {
    fontSize: 7,
    color: "#065f46",
    marginTop: 2,
  },

  // ── Signature row ──
  signatureRow: {
    flexDirection: "row",
    marginTop: 20,
    gap: 24,
  },
  signatureBlock: { flex: 1 },
  signatureLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: TEXT_PRIMARY,
    marginTop: 28,
    marginBottom: 3,
  },
  signatureLabel: {
    fontSize: 7,
    color: TEXT_MUTED,
  },

  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: TEXT_PRIMARY,
    paddingVertical: 8,
    paddingHorizontal: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    fontSize: 7,
    color: "#6b7280",
  },
  footerRight: {
    fontSize: 7,
    color: GREEN,
    fontFamily: "Helvetica-Bold",
  },

  // ── Commission note ──
  commissionNote: {
    marginTop: 8,
    padding: "6 10",
    backgroundColor: "#f5f3ff",
    borderWidth: 0.5,
    borderColor: "#c4b5fd",
    borderRadius: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  commissionLabel: {
    fontSize: 7.5,
    color: "#5b21b6",
    fontFamily: "Helvetica-Bold",
  },
  commissionValue: {
    fontSize: 8,
    color: "#5b21b6",
    fontFamily: "Helvetica-Bold",
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

// ─── PDF Document ─────────────────────────────────────────────────────────────

interface ProposalData {
  insuranceType: string;
  insurerName: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  vehicleReg?: string;
  vehicleMake?: string;
  vehicleYear?: string;
  sumInsured: number;
  basicRate: number;
  basicPremium: number;
  minimumApplied: boolean;
  minPremium?: number | null;
  benefits: { benefitName: string; amountKes: number }[];
  totalBenefits: number;
  iraLevy: number;
  stampDuty: number;
  phcf: number;
  grandTotal: number;
  agencyCommission?: number;
  commissionRate?: number;
  validDays?: number;
  notes?: string;
}

function ProposalDocument({ data }: { data: ProposalData }) {
  const refNo = `QT-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + (data.validDays || 30));

  return (
    <Document title={`Quote Proposal — ${data.clientName || "Client"}`}>
      <Page size="A4" style={styles.page}>

        {/* ── Accent stripe ── */}
        <View style={styles.accentStripe} />

        {/* ── Header band ── */}
        <View style={styles.headerBand}>
          <View>
            <Text style={styles.agencyName}>Myloe</Text>
            <Text style={styles.agencyTagline}>Insurance Solutions · IRA Regulated</Text>
            <Text style={styles.agencyDetail}>Westlands Commercial Centre, 2nd Floor</Text>
            <Text style={styles.agencyDetail}>P.O Box 12345 – 00100, Nairobi, Kenya</Text>
            <Text style={styles.agencyDetail}>Tel: +254 700 000 000</Text>
            <Text style={styles.agencyDetail}>info@myloe.co.ke  |  www.myloe.co.ke</Text>
          </View>
          <View>
            <Text style={styles.docLabel}>Insurance Quote</Text>
            <Text style={styles.docTitle}>PROPOSAL</Text>
            <Text style={styles.docRef}>Ref: {refNo}</Text>
            <Text style={styles.docRef}>
              Date: {fmtDate(new Date())}
            </Text>
          </View>
        </View>

        <View style={styles.body}>

          {/* ── CLIENT & COVER DETAILS ── */}
          <View style={styles.sectionBar}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>Proposed Insured & Cover Details</Text>
          </View>

          <View style={styles.infoGrid}>
            {data.clientName && (
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Proposed Insured</Text>
                <Text style={styles.infoValue}>{data.clientName.toUpperCase()}</Text>
              </View>
            )}
            {data.clientPhone && (
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Telephone</Text>
                <Text style={styles.infoValueLight}>{data.clientPhone}</Text>
              </View>
            )}
            {data.clientEmail && (
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValueLight}>{data.clientEmail}</Text>
              </View>
            )}
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Class of Insurance</Text>
              <Text style={styles.infoValue}>
                {data.insuranceType.replace("Motor - ", "MOTOR — ").toUpperCase()}
              </Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Proposed Insurer</Text>
              <Text style={styles.infoValue}>{data.insurerName.toUpperCase()}</Text>
            </View>
            {data.vehicleReg && (
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Vehicle Registration</Text>
                <Text style={styles.infoValue}>{data.vehicleReg.toUpperCase()}</Text>
              </View>
            )}
            {data.vehicleMake && (
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Vehicle</Text>
                <Text style={styles.infoValueLight}>
                  {data.vehicleMake}{data.vehicleYear ? ` (${data.vehicleYear})` : ""}
                </Text>
              </View>
            )}
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Sum Insured (Vehicle Value)</Text>
              <Text style={styles.infoValue}>{fmt(data.sumInsured)}</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoLabel}>Basic Premium Rate</Text>
              <Text style={styles.infoValue}>{data.basicRate.toFixed(2)}%</Text>
            </View>
          </View>

          {/* ── PREMIUM BREAKDOWN ── */}
          <View style={styles.sectionBar}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>Premium Breakdown</Text>
          </View>

          <View style={styles.premiumTable}>
            {/* Table header */}
            <View style={styles.premiumTableHeader}>
              <Text style={[styles.premiumTableHeaderText, { flex: 1 }]}>Description</Text>
              <Text style={[styles.premiumTableHeaderText, { textAlign: "right" }]}>Amount (KES)</Text>
            </View>

            {/* Basic Premium */}
            <View style={styles.premiumRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumLabelBold}>Basic Premium</Text>
                {data.minimumApplied && data.minPremium && (
                  <Text style={{ fontSize: 7, color: "#d97706", marginTop: 2 }}>
                    ⚠ Minimum premium applied ({fmt(data.minPremium)})
                  </Text>
                )}
              </View>
              <Text style={styles.premiumValue}>{fmt(data.basicPremium)}</Text>
            </View>

            {/* Benefits */}
            {data.benefits.length > 0 && (
              <>
                <View style={[styles.premiumRow, { backgroundColor: "#f3f4f6" }]}>
                  <Text style={[styles.premiumLabelBold, { fontSize: 7.5, color: TEXT_MUTED }]}>
                    ADDITIONAL BENEFITS
                  </Text>
                  <Text style={[styles.premiumValueMuted, { fontSize: 7.5 }]}></Text>
                </View>
                {data.benefits.map((b, i) => (
                  <View key={i} style={i % 2 === 0 ? styles.premiumRowAlt : styles.premiumRow}>
                    <Text style={styles.premiumLabel}>  • {b.benefitName}</Text>
                    <Text style={styles.premiumValue}>{fmt(b.amountKes)}</Text>
                  </View>
                ))}
                <View style={styles.premiumRowSubtotal}>
                  <Text style={styles.premiumLabelBold}>Benefits Sub-total</Text>
                  <Text style={styles.premiumValue}>{fmt(data.totalBenefits)}</Text>
                </View>
              </>
            )}

            {/* Statutory Levies */}
            <View style={[styles.premiumRow, { backgroundColor: "#f3f4f6" }]}>
              <Text style={[styles.premiumLabelBold, { fontSize: 7.5, color: TEXT_MUTED }]}>
                STATUTORY LEVIES
              </Text>
              <Text style={[styles.premiumValueMuted, { fontSize: 7.5 }]}></Text>
            </View>
            <View style={styles.premiumRowAlt}>
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumLabel}>IRA Levy (0.45%)</Text>
                <Text style={{ fontSize: 7, color: TEXT_MUTED, marginTop: 1 }}>
                  Applied on Basic Premium + Benefits
                </Text>
              </View>
              <Text style={styles.premiumValue}>{fmt(data.iraLevy)}</Text>
            </View>
            <View style={styles.premiumRow}>
              <Text style={styles.premiumLabel}>Stamp Duty</Text>
              <Text style={styles.premiumValue}>{fmt(data.stampDuty)}</Text>
            </View>
            <View style={styles.premiumRowAlt}>
              <Text style={styles.premiumLabel}>
                Policyholders Compensation Fund (PHCF)
              </Text>
              <Text style={styles.premiumValue}>{fmt(data.phcf)}</Text>
            </View>

            {/* Grand Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GROSS PREMIUM</Text>
              <Text style={styles.totalValue}>{fmt(data.grandTotal)}</Text>
            </View>
          </View>

          {/* ── PAYMENT SCENARIOS ── */}
          <View style={styles.sectionBar}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>Payment Options</Text>
          </View>

          <View style={styles.installmentGrid}>
            <View style={styles.installmentCardAccent}>
              <Text style={styles.installmentLabel}>Full Payment</Text>
              <Text style={styles.installmentAmountGreen}>{fmt(data.grandTotal)}</Text>
              <Text style={styles.installmentSub}>Due on inception date</Text>
            </View>
            <View style={styles.installmentCard}>
              <Text style={styles.installmentLabel}>2 Installments</Text>
              <Text style={styles.installmentAmount}>{fmt(data.grandTotal / 2)}</Text>
              <Text style={styles.installmentSub}>each · 30 days apart</Text>
            </View>
            <View style={styles.installmentCard}>
              <Text style={styles.installmentLabel}>3 Installments</Text>
              <Text style={styles.installmentAmount}>{fmt(data.grandTotal / 3)}</Text>
              <Text style={styles.installmentSub}>each · 30 days apart</Text>
            </View>
          </View>


          {/* ── Notes ── */}
          {data.notes && (
            <>
              <View style={styles.sectionBar}>
                <View style={styles.sectionDot} />
                <Text style={styles.sectionTitle}>Additional Notes</Text>
              </View>
              <Text style={{ fontSize: 8.5, color: TEXT_SECONDARY, lineHeight: 1.5 }}>
                {data.notes}
              </Text>
            </>
          )}

          {/* ── Validity ── */}
          <View style={styles.validityBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.validityText}>
                This quote is valid until {fmtDate(validUntil)}
              </Text>
              <Text style={styles.validitySubText}>
                Rates are subject to change after expiry. Contact us to confirm cover.
              </Text>
            </View>
          </View>

          {/* ── Important notes ── */}
          <View style={styles.noticeBox}>
            <Text style={styles.noticeTitle}>IMPORTANT NOTES</Text>
            <Text style={styles.noticeText}>
              1. This is a quotation only and does not constitute a binding insurance contract.{"\n"}
              2. Cover will only commence upon receipt of the full premium or first installment and issuance of a Cover Note.{"\n"}
              3. The insured value should reflect the current market value of the vehicle. Under-insurance may result in proportional claims settlement.{"\n"}
              4. Full terms and conditions are as per the policy wording issued by the selected insurer.{"\n"}
              5. Myloe Insurance Agency is regulated by the Insurance Regulatory Authority (IRA) of Kenya.
            </Text>
          </View>

          {/* ── Signature ── */}
          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Prepared by (Myloe Insurance Agency)</Text>
            </View>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Acknowledged by (Proposed Insured)</Text>
            </View>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Date</Text>
            </View>
          </View>

        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerLeft}>
            Myloe Insurance Agency · IRA Regulated · Ref: {refNo}
          </Text>
          <Text style={styles.footerRight}>www.myloe.co.ke</Text>
        </View>

      </Page>
    </Document>
  );
}

// ─── API Handler ──────────────────────────────────────────────────────────────

const proposalSchema = require("zod").z.object({
  insuranceType: require("zod").z.string(),
  insurerName: require("zod").z.string().default("—"),
  clientName: require("zod").z.string().optional().nullable(),
  clientPhone: require("zod").z.string().optional().nullable(),
  clientEmail: require("zod").z.string().optional().nullable(),
  vehicleReg: require("zod").z.string().optional().nullable(),
  vehicleMake: require("zod").z.string().optional().nullable(),
  vehicleYear: require("zod").z.string().optional().nullable(),
  sumInsured: require("zod").z.number(),
  basicRate: require("zod").z.number(),
  basicPremium: require("zod").z.number(),
  minimumApplied: require("zod").z.boolean().default(false),
  minPremium: require("zod").z.number().optional().nullable(),
  benefits: require("zod").z.array(require("zod").z.object({
    benefitName: require("zod").z.string(),
    amountKes: require("zod").z.number(),
  })).default([]),
  totalBenefits: require("zod").z.number().default(0),
  iraLevy: require("zod").z.number(),
  stampDuty: require("zod").z.number().default(40),
  phcf: require("zod").z.number().default(0),
  grandTotal: require("zod").z.number(),
  agencyCommission: require("zod").z.number().optional().nullable(),
  commissionRate: require("zod").z.number().optional().nullable(),
  validDays: require("zod").z.number().default(30),
  notes: require("zod").z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = proposalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const buffer = await renderToBuffer(
      <ProposalDocument data={parsed.data} />
    );

    const clientRef = parsed.data.clientName
      ? parsed.data.clientName.replace(/\s+/g, "-").toUpperCase()
      : "Quote";
    const filename = `Myloe-Proposal-${clientRef}-${new Date().toISOString().split("T")[0]}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    console.error("Proposal PDF error:", error);
    return NextResponse.json({ error: "Failed to generate proposal PDF" }, { status: 500 });
  }
}