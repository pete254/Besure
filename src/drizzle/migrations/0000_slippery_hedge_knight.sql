CREATE TYPE "public"."body_type" AS ENUM('S Wagon', 'Saloon', 'Pickup/Van', 'Bus', 'Truck', 'Prime Mover', 'Trailer');--> statement-breakpoint
CREATE TYPE "public"."car_sales_stage" AS ENUM('New Lead', 'Follow Up', 'Hot Prospect', 'Deposit Paid', 'Released', 'Lost', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."claim_doc_type" AS ENUM('Police Abstract', 'Claim Form', 'Vehicle Photos', 'Repair Estimate', 'Driver Licence', 'Log Book', 'Loss Assessor Report', 'Final Repair Invoice', 'Registration Certificate', 'National ID', 'KRA PIN', 'Certificate of Incorporation', 'CR12', 'Company KRA PIN', 'Directors KYC', 'Other');--> statement-breakpoint
CREATE TYPE "public"."claim_stage" AS ENUM('Reported', 'Documents Pending', 'Fully Documented', 'Assessed', 'Approved', 'Released / Settled', 'Declined');--> statement-breakpoint
CREATE TYPE "public"."commission_status" AS ENUM('Pending', 'Paid');--> statement-breakpoint
CREATE TYPE "public"."cover_type" AS ENUM('Comprehensive', 'TPO', 'TPFT');--> statement-breakpoint
CREATE TYPE "public"."customer_doc_type" AS ENUM('ID', 'PASSPORT', 'KRA', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."customer_type" AS ENUM('Individual', 'Company');--> statement-breakpoint
CREATE TYPE "public"."doc_status" AS ENUM('Pending', 'Uploaded', 'Not Applicable');--> statement-breakpoint
CREATE TYPE "public"."followup_channel" AS ENUM('Phone', 'Email', 'WhatsApp', 'In-Person');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('Male', 'Female', 'Other');--> statement-breakpoint
CREATE TYPE "public"."insurance_type" AS ENUM('Motor - Private Comp', 'Motor - Commercial', 'Motor - PSV / Matatu', 'Motor - Commercial Institutional', 'Motor - Commercial TSV', 'Motor - Commercial Third Party', 'Fire & Perils', 'Domestic Package', 'Medical / Health', 'Life Insurance', 'Travel Insurance');--> statement-breakpoint
CREATE TYPE "public"."kenya_bank" AS ENUM('KCB', 'Equity Bank', 'Cooperative Bank', 'NCBA', 'Absa', 'Standard Chartered', 'Stanbic', 'I&M', 'Family Bank', 'DTB', 'SBM', 'Kingdom Bank', 'Prime Bank', 'Credit Bank', 'Gulf African Bank');--> statement-breakpoint
CREATE TYPE "public"."nature_of_loss" AS ENUM('Accident', 'Theft', 'Fire', 'Flood', 'Vandalism', 'Other');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('sent', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('payment_reminder_10d', 'payment_reminder_3d', 'payment_reminder_1d', 'policy_expiry');--> statement-breakpoint
CREATE TYPE "public"."payment_mode" AS ENUM('Full Payment', '2 Installments', '3 Installments', 'IPF');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'partial', 'paid');--> statement-breakpoint
CREATE TYPE "public"."policy_doc_status" AS ENUM('Pending', 'Received', 'Verified', 'Not Required');--> statement-breakpoint
CREATE TYPE "public"."policy_doc_type" AS ENUM('LOGBOOK', 'VALUATION', 'PROPOSAL', 'QUOTATION', 'PREVIOUS_POLICY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."policy_status" AS ENUM('Active', 'Expired', 'Cancelled', 'Pending');--> statement-breakpoint
CREATE TYPE "public"."purchase_type" AS ENUM('Cash', 'Bank');--> statement-breakpoint
CREATE TYPE "public"."tracking_stage" AS ENUM('Cover Recorded', 'Documents Pending', 'Fully Documented', 'Submitted to Insurer', 'Policy Issued / Approved');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'staff');--> statement-breakpoint
CREATE TABLE "benefit_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"applicable_to" varchar(50) DEFAULT 'both' NOT NULL,
	"calc_config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "car_sales_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"source_of_lead" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "car_sales_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"stage" "car_sales_stage" DEFAULT 'New Lead' NOT NULL,
	"car_type" varchar(255) NOT NULL,
	"registration_number" varchar(20) NOT NULL,
	"commission_amount" numeric(14, 2),
	"purchase_type" "purchase_type",
	"kenya_bank" "kenya_bank",
	"deposit_amount" numeric(14, 2),
	"payment_date" date,
	"balance_remaining" numeric(14, 2),
	"reminder_date" date,
	"release_date" date,
	"commission_due_date" date,
	"commission_status" "commission_status" DEFAULT 'Pending',
	"final_notes" text,
	"lost_reason" text,
	"cancelled_reason" text,
	"follow_up_notes" text,
	"next_action" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "car_sales_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"notes" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"staff_id" uuid
);
--> statement-breakpoint
CREATE TABLE "car_sales_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"reminder_date" date NOT NULL,
	"reminder_type" varchar(100) NOT NULL,
	"notes" text,
	"is_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"staff_id" uuid
);
--> statement-breakpoint
CREATE TABLE "claim_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" uuid NOT NULL,
	"doc_type" "claim_doc_type" NOT NULL,
	"doc_label" varchar(255),
	"status" "policy_doc_status" DEFAULT 'Pending' NOT NULL,
	"file_url" text,
	"blob_key" text,
	"doc_value" varchar(255),
	"received_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid NOT NULL,
	"claim_number" varchar(50) NOT NULL,
	"date_of_loss" date NOT NULL,
	"date_reported" date NOT NULL,
	"nature_of_loss" "nature_of_loss" NOT NULL,
	"location" text,
	"third_party_involved" boolean DEFAULT false NOT NULL,
	"third_party_details" jsonb,
	"police_abstract_number" varchar(100),
	"stage" "claim_stage" DEFAULT 'Reported' NOT NULL,
	"garage_id" uuid,
	"garage_free_text" varchar(255),
	"repair_estimate" numeric(14, 2),
	"approved_amount" numeric(14, 2),
	"settlement_date" date,
	"settlement_method" varchar(100),
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "claims_claim_number_unique" UNIQUE("claim_number")
);
--> statement-breakpoint
CREATE TABLE "customer_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"doc_type" "customer_doc_type" NOT NULL,
	"file_url" text,
	"blob_key" text,
	"doc_value" varchar(255),
	"doc_label" varchar(255),
	"status" "doc_status" DEFAULT 'Pending' NOT NULL,
	"uploaded_at" timestamp,
	"uploaded_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"id_number" varchar(50),
	"id_number_value" varchar(100),
	"kra_pin" varchar(50),
	"kra_pin_value" varchar(100),
	"date_of_birth" date,
	"gender" "gender",
	"county" varchar(100),
	"physical_address" text,
	"customer_type" "customer_type" DEFAULT 'Individual' NOT NULL,
	"company_name" varchar(255),
	"town" varchar(100),
	"postal_address" varchar(100),
	"company_email" varchar(255),
	"company_phone" varchar(20),
	"cert_of_incorporation_url" text,
	"cert_of_incorporation_blob_key" text,
	"cert_of_incorporation_value" varchar(100),
	"cr12_url" text,
	"cr12_blob_key" text,
	"cr12_value" varchar(100),
	"company_kra_pin_url" text,
	"company_kra_pin_blob_key" text,
	"company_kra_pin_value" varchar(100),
	"directors" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draft_type" varchar(50) NOT NULL,
	"draft_key" varchar(100) NOT NULL,
	"session_id" varchar(100),
	"data" text NOT NULL,
	"step" varchar(10),
	"label" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "followup_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid,
	"claim_id" uuid,
	"customer_id" uuid,
	"note_date" timestamp DEFAULT now() NOT NULL,
	"channel" "followup_channel",
	"notes" text NOT NULL,
	"next_followup_date" date,
	"staff_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "garage_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" uuid NOT NULL,
	"parts_ordered" jsonb,
	"parts_received" jsonb,
	"progress_pct" integer,
	"expected_completion" date,
	"delay_reason" text,
	"notes" text,
	"update_date" timestamp DEFAULT now() NOT NULL,
	"staff_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "garages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"location" varchar(255),
	"county" varchar(100),
	"contact_person" varchar(255),
	"phone" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insurers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"commission_rate" numeric(5, 2),
	"rate_motor_private" numeric(5, 2),
	"rate_motor_commercial" numeric(5, 2),
	"rate_psv" numeric(5, 2),
	"min_premium_private" numeric(12, 2),
	"min_premium_commercial" numeric(12, 2),
	"min_premium_psv" numeric(12, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid,
	"payment_id" uuid,
	"notification_type" "notification_type" NOT NULL,
	"sent_to_email" varchar(255),
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"status" "notification_status" DEFAULT 'sent' NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid NOT NULL,
	"installment_number" integer DEFAULT 1 NOT NULL,
	"total_installments" integer DEFAULT 1 NOT NULL,
	"amount_due" numeric(14, 2) NOT NULL,
	"amount_paid" numeric(14, 2) DEFAULT '0',
	"due_date" date NOT NULL,
	"paid_date" date,
	"payment_method" varchar(100),
	"reference_no" varchar(100),
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"receipt_url" text,
	"recorded_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"insurer_id" uuid,
	"insurer_name_manual" varchar(255),
	"insurance_type" "insurance_type" NOT NULL,
	"cover_type" "cover_type",
	"policy_number" varchar(100),
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"sum_insured" numeric(14, 2),
	"basic_rate" numeric(5, 2),
	"basic_premium" numeric(14, 2),
	"total_benefits" numeric(14, 2) DEFAULT '0',
	"ira_levy" numeric(14, 2),
	"training_levy" numeric(14, 2),
	"stamp_duty" numeric(14, 2) DEFAULT '40',
	"phcf" numeric(14, 2) DEFAULT '100',
	"grand_total" numeric(14, 2),
	"payment_mode" "payment_mode",
	"ipf_provider" varchar(255),
	"ipf_loan_reference" varchar(255),
	"status" "policy_status" DEFAULT 'Pending' NOT NULL,
	"certificate_expiry_date" date,
	"certificate_expiry_reason" varchar(255),
	"renewed_by_policy_id" uuid,
	"renews_policy_id" uuid,
	"medical_meta" jsonb,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_benefits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid NOT NULL,
	"benefit_option_id" uuid,
	"benefit_name" varchar(255) NOT NULL,
	"amount_kes" numeric(14, 2) NOT NULL,
	"meta_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid NOT NULL,
	"doc_type" "policy_doc_type" NOT NULL,
	"doc_label" varchar(255),
	"status" "policy_doc_status" DEFAULT 'Pending' NOT NULL,
	"file_url" text,
	"blob_key" text,
	"doc_value" varchar(255),
	"received_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid NOT NULL,
	"stage" "tracking_stage" NOT NULL,
	"stage_date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"staff_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'staff' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid NOT NULL,
	"make" varchar(100) NOT NULL,
	"model" varchar(100) NOT NULL,
	"year" integer NOT NULL,
	"cc" integer,
	"tonnage" numeric(6, 2),
	"seats" integer,
	"chassis_no" varchar(100) NOT NULL,
	"engine_no" varchar(100) NOT NULL,
	"reg_no" varchar(20) NOT NULL,
	"body_type" "body_type",
	"colour" varchar(50),
	"logbook_url" text,
	"logbook_blob_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_policy_id_unique" UNIQUE("policy_id")
);
--> statement-breakpoint
ALTER TABLE "car_sales_leads" ADD CONSTRAINT "car_sales_leads_customer_id_car_sales_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."car_sales_customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_sales_notes" ADD CONSTRAINT "car_sales_notes_lead_id_car_sales_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."car_sales_leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_sales_notes" ADD CONSTRAINT "car_sales_notes_staff_id_users_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_sales_reminders" ADD CONSTRAINT "car_sales_reminders_lead_id_car_sales_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."car_sales_leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_sales_reminders" ADD CONSTRAINT "car_sales_reminders_staff_id_users_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_documents" ADD CONSTRAINT "claim_documents_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_garage_id_garages_id_fk" FOREIGN KEY ("garage_id") REFERENCES "public"."garages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_documents" ADD CONSTRAINT "customer_documents_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_documents" ADD CONSTRAINT "customer_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followup_notes" ADD CONSTRAINT "followup_notes_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followup_notes" ADD CONSTRAINT "followup_notes_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followup_notes" ADD CONSTRAINT "followup_notes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followup_notes" ADD CONSTRAINT "followup_notes_staff_id_users_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "garage_updates" ADD CONSTRAINT "garage_updates_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "garage_updates" ADD CONSTRAINT "garage_updates_staff_id_users_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_insurer_id_insurers_id_fk" FOREIGN KEY ("insurer_id") REFERENCES "public"."insurers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_renewed_by_policy_id_policies_id_fk" FOREIGN KEY ("renewed_by_policy_id") REFERENCES "public"."policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_renews_policy_id_policies_id_fk" FOREIGN KEY ("renews_policy_id") REFERENCES "public"."policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_benefits" ADD CONSTRAINT "policy_benefits_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_benefits" ADD CONSTRAINT "policy_benefits_benefit_option_id_benefit_options_id_fk" FOREIGN KEY ("benefit_option_id") REFERENCES "public"."benefit_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_documents" ADD CONSTRAINT "policy_documents_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_tracking" ADD CONSTRAINT "policy_tracking_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_tracking" ADD CONSTRAINT "policy_tracking_staff_id_users_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "car_sales_customers_phone_idx" ON "car_sales_customers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "car_sales_leads_customer_idx" ON "car_sales_leads" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "car_sales_leads_stage_idx" ON "car_sales_leads" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "car_sales_leads_registration_idx" ON "car_sales_leads" USING btree ("registration_number");--> statement-breakpoint
CREATE INDEX "car_sales_leads_commission_due_idx" ON "car_sales_leads" USING btree ("commission_due_date");--> statement-breakpoint
CREATE INDEX "car_sales_notes_lead_idx" ON "car_sales_notes" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "car_sales_notes_created_at_idx" ON "car_sales_notes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "car_sales_reminders_lead_idx" ON "car_sales_reminders" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "car_sales_reminders_date_idx" ON "car_sales_reminders" USING btree ("reminder_date");--> statement-breakpoint
CREATE INDEX "car_sales_reminders_completed_idx" ON "car_sales_reminders" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX "claims_policy_idx" ON "claims" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "claims_stage_idx" ON "claims" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "claims_date_reported_idx" ON "claims" USING btree ("date_reported");--> statement-breakpoint
CREATE INDEX "customers_phone_idx" ON "customers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "customers_id_number_idx" ON "customers" USING btree ("id_number");--> statement-breakpoint
CREATE INDEX "customers_county_idx" ON "customers" USING btree ("county");--> statement-breakpoint
CREATE INDEX "payments_policy_idx" ON "payments" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "payments_due_date_idx" ON "payments" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "policies_customer_idx" ON "policies" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "policies_insurer_idx" ON "policies" USING btree ("insurer_id");--> statement-breakpoint
CREATE INDEX "policies_end_date_idx" ON "policies" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "policies_certificate_expiry_idx" ON "policies" USING btree ("certificate_expiry_date");--> statement-breakpoint
CREATE INDEX "policies_status_idx" ON "policies" USING btree ("status");