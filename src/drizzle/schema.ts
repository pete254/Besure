// BeSure Insurance Solutions — Drizzle ORM Schema
// Neon DB (Serverless PostgreSQL) | Version 2.1
// Run: npx drizzle-kit push  to apply to Neon

import {
  pgTable, uuid, text, varchar, integer, numeric,
  boolean, date, timestamp, pgEnum, jsonb, index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export const customerTypeEnum = pgEnum("customer_type", ["Individual", "Company"]);
export const genderEnum = pgEnum("gender", ["Male", "Female", "Other"]);

export const docStatusEnum = pgEnum("doc_status", [
  "Pending", "Uploaded", "Not Applicable",
]);

export const customerDocTypeEnum = pgEnum("customer_doc_type", [
  "ID", "PASSPORT", "KRA", "OTHER",
]);

export const insuranceTypeEnum = pgEnum("insurance_type", [
  "Motor - Private", "Motor - Commercial", "Motor - PSV / Matatu",
  "Fire & Perils", "Domestic Package", "Medical / Health",
  "Life Insurance", "Travel Insurance",
]);

export const coverTypeEnum = pgEnum("cover_type", ["Comprehensive", "TPO", "TPFT"]);

// Updated body types per client requirement
export const bodyTypeEnum = pgEnum("body_type", [
  "S Wagon", "Saloon", "Pickup/Van", "Bus", "Truck", "Prime Mover", "Trailer",
]);

export const paymentModeEnum = pgEnum("payment_mode", [
  "Full Payment", "2 Installments", "3 Installments", "IPF",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending", "partial", "paid",
]);

export const policyStatusEnum = pgEnum("policy_status", [
  "Active", "Expired", "Cancelled", "Pending",
]);

export const policyDocTypeEnum = pgEnum("policy_doc_type", [
  "LOGBOOK", "VALUATION", "PROPOSAL", "PREVIOUS_POLICY", "OTHER",
]);

export const policyDocStatusEnum = pgEnum("policy_doc_status", [
  "Pending", "Received", "Verified", "Not Required",
]);

export const trackingStageEnum = pgEnum("tracking_stage", [
  "Cover Recorded", "Documents Pending", "Fully Documented",
  "Submitted to Insurer", "Policy Issued / Approved",
]);

export const followupChannelEnum = pgEnum("followup_channel", [
  "Phone", "Email", "WhatsApp", "In-Person",
]);

export const claimStageEnum = pgEnum("claim_stage", [
  "Reported", "Documents Pending", "Fully Documented",
  "Assessed", "Executed", "Approved", "Released / Settled",
]);

export const natureOfLossEnum = pgEnum("nature_of_loss", [
  "Accident", "Theft", "Fire", "Flood", "Vandalism", "Other",
]);

export const claimDocTypeEnum = pgEnum("claim_doc_type", [
  "Police Abstract", "Claim Form", "Vehicle Photos", "Repair Estimate",
  "Driver Licence", "Log Book", "Loss Assessor Report", "Final Repair Invoice",
  "Registration Certificate", "National ID", "KRA PIN",
  "Certificate of Incorporation", "CR12", "Company KRA PIN",
  "Directors KYC", "Other",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "payment_reminder_10d", "payment_reminder_3d", "payment_reminder_1d", "policy_expiry",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "sent", "failed", "skipped",
]);

export const userRoleEnum = pgEnum("user_role", ["admin", "staff"]);

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("staff"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    middleName: varchar("middle_name", { length: 100 }),
    phone: varchar("phone", { length: 20 }).notNull(),
    email: varchar("email", { length: 255 }),
    idNumber: varchar("id_number", { length: 50 }),
    idNumberValue: varchar("id_number_value", { length: 100 }), // text value alternative
    kraPin: varchar("kra_pin", { length: 50 }),
    kraPinValue: varchar("kra_pin_value", { length: 100 }), // text value alternative
    dateOfBirth: date("date_of_birth"),
    gender: genderEnum("gender"),
    county: varchar("county", { length: 100 }),
    physicalAddress: text("physical_address"),
    customerType: customerTypeEnum("customer_type").notNull().default("Individual"),

    // ── Company-specific fields ──
    companyName: varchar("company_name", { length: 255 }),
    town: varchar("town", { length: 100 }),
    postalAddress: varchar("postal_address", { length: 100 }),
    companyEmail: varchar("company_email", { length: 255 }),
    companyPhone: varchar("company_phone", { length: 20 }),

    // Company documents — each has optional file URL and optional text value
    certOfIncorporationUrl: text("cert_of_incorporation_url"),
    certOfIncorporationBlobKey: text("cert_of_incorporation_blob_key"),
    certOfIncorporationValue: varchar("cert_of_incorporation_value", { length: 100 }),

    cr12Url: text("cr12_url"),
    cr12BlobKey: text("cr12_blob_key"),
    cr12Value: varchar("cr12_value", { length: 100 }),

    companyKraPinUrl: text("company_kra_pin_url"),
    companyKraPinBlobKey: text("company_kra_pin_blob_key"),
    companyKraPinValue: varchar("company_kra_pin_value", { length: 100 }),

    // Directors stored as JSONB array:
    // [{ name, idNumber, idNumberValue, kraPin, kraPinValue, idFileUrl, pinFileUrl }]
    directors: jsonb("directors"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    phoneIdx: index("customers_phone_idx").on(t.phone),
    idNumberIdx: index("customers_id_number_idx").on(t.idNumber),
    countyIdx: index("customers_county_idx").on(t.county),
  })
);

export const customersRelations = relations(customers, ({ many }) => ({
  documents: many(customerDocuments),
  policies: many(policies),
  followupNotes: many(followupNotes),
}));

// ─────────────────────────────────────────────
// CUSTOMER DOCUMENTS
// ─────────────────────────────────────────────

export const customerDocuments = pgTable("customer_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  docType: customerDocTypeEnum("doc_type").notNull(),
  fileUrl: text("file_url"),
  blobKey: text("blob_key"),
  docValue: varchar("doc_value", { length: 255 }), // text value alternative to file upload
  docLabel: varchar("doc_label", { length: 255 }),
  status: docStatusEnum("status").notNull().default("Pending"),
  uploadedAt: timestamp("uploaded_at"),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const customerDocumentsRelations = relations(customerDocuments, ({ one }) => ({
  customer: one(customers, {
    fields: [customerDocuments.customerId],
    references: [customers.id],
  }),
}));

// ─────────────────────────────────────────────
// INSURERS
// ─────────────────────────────────────────────

export const insurers = pgTable("insurers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }),
  rateMotorPrivate: numeric("rate_motor_private", { precision: 5, scale: 2 }),
  rateMotorCommercial: numeric("rate_motor_commercial", { precision: 5, scale: 2 }),
  ratePsv: numeric("rate_psv", { precision: 5, scale: 2 }),
  minPremiumPrivate: numeric("min_premium_private", { precision: 12, scale: 2 }),
  minPremiumCommercial: numeric("min_premium_commercial", { precision: 12, scale: 2 }),
  minPremiumPsv: numeric("min_premium_psv", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insurersRelations = relations(insurers, ({ many }) => ({
  policies: many(policies),
}));

// ─────────────────────────────────────────────
// BENEFIT OPTIONS
// ─────────────────────────────────────────────

export const benefitOptions = pgTable("benefit_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  // Auto-calculation hints stored as JSONB
  // e.g. { type: "percentage", rate: 0.5 } for excess protector
  // { type: "windscreen" } for windscreen
  // { type: "loss_of_use", dailyRate: 3000, options: [10,20,30] }
  calcConfig: jsonb("calc_config"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const benefitOptionsRelations = relations(benefitOptions, ({ many }) => ({
  policyBenefits: many(policyBenefits),
}));

// ─────────────────────────────────────────────
// POLICIES
// ─────────────────────────────────────────────

export const policies = pgTable(
  "policies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").notNull().references(() => customers.id),
    insurerId: uuid("insurer_id").references(() => insurers.id),
    insurerNameManual: varchar("insurer_name_manual", { length: 255 }),
    insuranceType: insuranceTypeEnum("insurance_type").notNull(),
    coverType: coverTypeEnum("cover_type"),
    policyNumber: varchar("policy_number", { length: 100 }),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    sumInsured: numeric("sum_insured", { precision: 14, scale: 2 }),
    basicRate: numeric("basic_rate", { precision: 5, scale: 2 }),
    basicPremium: numeric("basic_premium", { precision: 14, scale: 2 }),
    totalBenefits: numeric("total_benefits", { precision: 14, scale: 2 }).default("0"),
    iraLevy: numeric("ira_levy", { precision: 14, scale: 2 }),
    trainingLevy: numeric("training_levy", { precision: 14, scale: 2 }),
    stampDuty: numeric("stamp_duty", { precision: 14, scale: 2 }).default("40"),
    phcf: numeric("phcf", { precision: 14, scale: 2 }).default("100"),
    grandTotal: numeric("grand_total", { precision: 14, scale: 2 }),
    paymentMode: paymentModeEnum("payment_mode"),
    ipfProvider: varchar("ipf_provider", { length: 255 }),
    ipfLoanReference: varchar("ipf_loan_reference", { length: 255 }),
    status: policyStatusEnum("status").notNull().default("Pending"),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    customerIdx: index("policies_customer_idx").on(t.customerId),
    insurerIdx: index("policies_insurer_idx").on(t.insurerId),
    endDateIdx: index("policies_end_date_idx").on(t.endDate),
    statusIdx: index("policies_status_idx").on(t.status),
  })
);

export const policiesRelations = relations(policies, ({ one, many }) => ({
  customer: one(customers, { fields: [policies.customerId], references: [customers.id] }),
  insurer: one(insurers, { fields: [policies.insurerId], references: [insurers.id] }),
  vehicle: one(vehicles),
  benefits: many(policyBenefits),
  payments: many(payments),
  documents: many(policyDocuments),
  trackingEntries: many(policyTracking),
  claims: many(claims),
  followupNotes: many(followupNotes),
  notificationLogs: many(notificationLog),
}));

// ─────────────────────────────────────────────
// VEHICLES
// ─────────────────────────────────────────────

export const vehicles = pgTable("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  policyId: uuid("policy_id").notNull().unique().references(() => policies.id, { onDelete: "cascade" }),
  make: varchar("make", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  year: integer("year").notNull(),
  cc: integer("cc"),
  tonnage: numeric("tonnage", { precision: 6, scale: 2 }),
  seats: integer("seats"),
  chassisNo: varchar("chassis_no", { length: 100 }).notNull(),
  engineNo: varchar("engine_no", { length: 100 }).notNull(),
  regNo: varchar("reg_no", { length: 20 }).notNull(),
  bodyType: bodyTypeEnum("body_type"),
  colour: varchar("colour", { length: 50 }),
  logbookUrl: text("logbook_url"),
  logbookBlobKey: text("logbook_blob_key"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const vehiclesRelations = relations(vehicles, ({ one }) => ({
  policy: one(policies, { fields: [vehicles.policyId], references: [policies.id] }),
}));

// ─────────────────────────────────────────────
// POLICY BENEFITS
// Store extra config (e.g. windscreen value, loss of use days) in metaJson
// ─────────────────────────────────────────────

export const policyBenefits = pgTable("policy_benefits", {
  id: uuid("id").primaryKey().defaultRandom(),
  policyId: uuid("policy_id").notNull().references(() => policies.id, { onDelete: "cascade" }),
  benefitOptionId: uuid("benefit_option_id").references(() => benefitOptions.id),
  benefitName: varchar("benefit_name", { length: 255 }).notNull(),
  amountKes: numeric("amount_kes", { precision: 14, scale: 2 }).notNull(),
  // Extra data: windscreen value, loss of use days, etc.
  metaJson: jsonb("meta_json"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const policyBenefitsRelations = relations(policyBenefits, ({ one }) => ({
  policy: one(policies, { fields: [policyBenefits.policyId], references: [policies.id] }),
  benefitOption: one(benefitOptions, { fields: [policyBenefits.benefitOptionId], references: [benefitOptions.id] }),
}));

// ─────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    policyId: uuid("policy_id").notNull().references(() => policies.id, { onDelete: "cascade" }),
    installmentNumber: integer("installment_number").notNull().default(1),
    totalInstallments: integer("total_installments").notNull().default(1),
    amountDue: numeric("amount_due", { precision: 14, scale: 2 }).notNull(),
    amountPaid: numeric("amount_paid", { precision: 14, scale: 2 }).default("0"),
    dueDate: date("due_date").notNull(),
    paidDate: date("paid_date"),
    paymentMethod: varchar("payment_method", { length: 100 }),
    referenceNo: varchar("reference_no", { length: 100 }),
    status: paymentStatusEnum("status").notNull().default("pending"),
    receiptUrl: text("receipt_url"),
    recordedBy: uuid("recorded_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    policyIdx: index("payments_policy_idx").on(t.policyId),
    dueDateIdx: index("payments_due_date_idx").on(t.dueDate),
    statusIdx: index("payments_status_idx").on(t.status),
  })
);

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  policy: one(policies, { fields: [payments.policyId], references: [policies.id] }),
  notificationLogs: many(notificationLog),
}));

// ─────────────────────────────────────────────
// NOTIFICATION LOG
// ─────────────────────────────────────────────

export const notificationLog = pgTable("notification_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  policyId: uuid("policy_id").references(() => policies.id),
  paymentId: uuid("payment_id").references(() => payments.id),
  notificationType: notificationTypeEnum("notification_type").notNull(),
  sentToEmail: varchar("sent_to_email", { length: 255 }),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  status: notificationStatusEnum("status").notNull().default("sent"),
  errorMessage: text("error_message"),
});

export const notificationLogRelations = relations(notificationLog, ({ one }) => ({
  policy: one(policies, { fields: [notificationLog.policyId], references: [policies.id] }),
  payment: one(payments, { fields: [notificationLog.paymentId], references: [payments.id] }),
}));

// ─────────────────────────────────────────────
// POLICY TRACKING
// ─────────────────────────────────────────────

export const policyTracking = pgTable("policy_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  policyId: uuid("policy_id").notNull().references(() => policies.id, { onDelete: "cascade" }),
  stage: trackingStageEnum("stage").notNull(),
  stageDate: timestamp("stage_date").notNull().defaultNow(),
  notes: text("notes"),
  staffId: uuid("staff_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const policyTrackingRelations = relations(policyTracking, ({ one }) => ({
  policy: one(policies, { fields: [policyTracking.policyId], references: [policies.id] }),
  staff: one(users, { fields: [policyTracking.staffId], references: [users.id] }),
}));

// ─────────────────────────────────────────────
// POLICY DOCUMENTS
// ─────────────────────────────────────────────

export const policyDocuments = pgTable("policy_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  policyId: uuid("policy_id").notNull().references(() => policies.id, { onDelete: "cascade" }),
  docType: policyDocTypeEnum("doc_type").notNull(),
  docLabel: varchar("doc_label", { length: 255 }),
  status: policyDocStatusEnum("status").notNull().default("Pending"),
  fileUrl: text("file_url"),
  blobKey: text("blob_key"),
  docValue: varchar("doc_value", { length: 255 }), // text value alternative
  receivedDate: date("received_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const policyDocumentsRelations = relations(policyDocuments, ({ one }) => ({
  policy: one(policies, { fields: [policyDocuments.policyId], references: [policies.id] }),
}));

// ─────────────────────────────────────────────
// FOLLOW-UP NOTES (Polymorphic)
// ─────────────────────────────────────────────

export const followupNotes = pgTable("followup_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  policyId: uuid("policy_id").references(() => policies.id),
  claimId: uuid("claim_id").references(() => claims.id),
  customerId: uuid("customer_id").references(() => customers.id),
  noteDate: timestamp("note_date").notNull().defaultNow(),
  channel: followupChannelEnum("channel"),
  notes: text("notes").notNull(),
  nextFollowupDate: date("next_followup_date"),
  staffId: uuid("staff_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const followupNotesRelations = relations(followupNotes, ({ one }) => ({
  policy: one(policies, { fields: [followupNotes.policyId], references: [policies.id] }),
  claim: one(claims, { fields: [followupNotes.claimId], references: [claims.id] }),
  customer: one(customers, { fields: [followupNotes.customerId], references: [customers.id] }),
  staff: one(users, { fields: [followupNotes.staffId], references: [users.id] }),
}));

// ─────────────────────────────────────────────
// GARAGES
// ─────────────────────────────────────────────

export const garages = pgTable("garages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  county: varchar("county", { length: 100 }),
  contactPerson: varchar("contact_person", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const garagesRelations = relations(garages, ({ many }) => ({
  claims: many(claims),
}));

// ─────────────────────────────────────────────
// CLAIMS
// ─────────────────────────────────────────────

export const claims = pgTable(
  "claims",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    policyId: uuid("policy_id").notNull().references(() => policies.id),
    claimNumber: varchar("claim_number", { length: 50 }).notNull().unique(),
    dateOfLoss: date("date_of_loss").notNull(),
    dateReported: date("date_reported").notNull(),
    natureOfLoss: natureOfLossEnum("nature_of_loss").notNull(),
    location: text("location"),
    thirdPartyInvolved: boolean("third_party_involved").notNull().default(false),
    thirdPartyDetails: jsonb("third_party_details"),
    policeAbstractNumber: varchar("police_abstract_number", { length: 100 }),
    stage: claimStageEnum("stage").notNull().default("Reported"),
    garageId: uuid("garage_id").references(() => garages.id),
    garageFreeText: varchar("garage_free_text", { length: 255 }),
    repairEstimate: numeric("repair_estimate", { precision: 14, scale: 2 }),
    approvedAmount: numeric("approved_amount", { precision: 14, scale: 2 }),
    settlementDate: date("settlement_date"),
    settlementMethod: varchar("settlement_method", { length: 100 }),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    policyIdx: index("claims_policy_idx").on(t.policyId),
    stageIdx: index("claims_stage_idx").on(t.stage),
    dateReportedIdx: index("claims_date_reported_idx").on(t.dateReported),
  })
);

export const claimsRelations = relations(claims, ({ one, many }) => ({
  policy: one(policies, { fields: [claims.policyId], references: [policies.id] }),
  garage: one(garages, { fields: [claims.garageId], references: [garages.id] }),
  documents: many(claimDocuments),
  garageUpdates: many(garageUpdates),
  followupNotes: many(followupNotes),
}));

// ─────────────────────────────────────────────
// CLAIM DOCUMENTS
// Each document has: status, optional file upload, optional text value
// ─────────────────────────────────────────────

export const claimDocuments = pgTable("claim_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  claimId: uuid("claim_id").notNull().references(() => claims.id, { onDelete: "cascade" }),
  docType: claimDocTypeEnum("doc_type").notNull(),
  docLabel: varchar("doc_label", { length: 255 }),
  status: policyDocStatusEnum("status").notNull().default("Pending"),
  fileUrl: text("file_url"),
  blobKey: text("blob_key"),
  docValue: varchar("doc_value", { length: 255 }), // text value alternative
  receivedDate: date("received_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const claimDocumentsRelations = relations(claimDocuments, ({ one }) => ({
  claim: one(claims, { fields: [claimDocuments.claimId], references: [claims.id] }),
}));

// ─────────────────────────────────────────────
// GARAGE UPDATES
// ─────────────────────────────────────────────

export const garageUpdates = pgTable("garage_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  claimId: uuid("claim_id").notNull().references(() => claims.id, { onDelete: "cascade" }),
  partsOrdered: jsonb("parts_ordered"),
  partsReceived: jsonb("parts_received"),
  progressPct: integer("progress_pct"),
  expectedCompletion: date("expected_completion"),
  delayReason: text("delay_reason"),
  notes: text("notes"),
  updateDate: timestamp("update_date").notNull().defaultNow(),
  staffId: uuid("staff_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const garageUpdatesRelations = relations(garageUpdates, ({ one }) => ({
  claim: one(claims, { fields: [garageUpdates.claimId], references: [claims.id] }),
  staff: one(users, { fields: [garageUpdates.staffId], references: [users.id] }),
}));

// ─────────────────────────────────────────────
// TYPE EXPORTS
// ─────────────────────────────────────────────

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type CustomerDocument = typeof customerDocuments.$inferSelect;
export type NewCustomerDocument = typeof customerDocuments.$inferInsert;
export type Insurer = typeof insurers.$inferSelect;
export type NewInsurer = typeof insurers.$inferInsert;
export type BenefitOption = typeof benefitOptions.$inferSelect;
export type NewBenefitOption = typeof benefitOptions.$inferInsert;
export type Policy = typeof policies.$inferSelect;
export type NewPolicy = typeof policies.$inferInsert;
export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
export type PolicyBenefit = typeof policyBenefits.$inferSelect;
export type NewPolicyBenefit = typeof policyBenefits.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type PolicyTracking = typeof policyTracking.$inferSelect;
export type PolicyDocument = typeof policyDocuments.$inferSelect;
export type FollowupNote = typeof followupNotes.$inferSelect;
export type Garage = typeof garages.$inferSelect;
export type NewGarage = typeof garages.$inferInsert;
export type Claim = typeof claims.$inferSelect;
export type NewClaim = typeof claims.$inferInsert;
export type ClaimDocument = typeof claimDocuments.$inferSelect;
export type GarageUpdate = typeof garageUpdates.$inferSelect;
export type User = typeof users.$inferSelect;