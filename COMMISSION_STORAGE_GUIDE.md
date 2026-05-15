# Commission Storage & Calculation Implementation

## Overview

The commission storage system has been implemented to automatically calculate and store commission data based on policy information and insurer rates. Previously, commissions were only calculated on-the-fly when generating reports, but were not persisted in the database. Now commissions are stored in the `commissions` table for proper tracking and management.

## Key Components

### 1. Commission Calculation Utility (`/src/lib/commission.ts`)

Core utility functions for commission calculations:

- **`calculateCommissionForPolicy(policyId)`**: Calculates commission for a single policy
  - Formula: `(Policy Grand Total × Insurer Commission Rate) ÷ 100`
  - Expected due date: 30 days after policy start date
  - Requires: Policy with insurer that has a commission rate

- **`storeCommission(data)`**: Stores a calculated commission in the database
  - Input: `CommissionData` object with policy, customer, insurer, amount, and due date
  - Returns: Created commission record

- **`calculateAndStoreCommission(policyId)`**: Combined operation
  - Calculates commission for a policy and stores it in one operation
  - Handles all error checking and data validation

- **`generateMissingCommissions()`**: Bulk operation
  - Generates commissions for all active policies that don't have one yet
  - Skips policies that already have commissions
  - Returns: Summary with success count, error count, and details

- **`regenerateAllCommissions()`**: Complete regeneration
  - Deletes and recreates all commissions for all active policies with insurers
  - Use with caution as it overwrites existing data
  - Returns: Summary with success count, error count, and details

## API Endpoints

### 1. Create Commission Endpoint
**Route**: `POST /api/commissions`

#### Three operation modes:

#### Mode 1: Auto-calculate from policy
```bash
curl -X POST http://localhost:3000/api/commissions \
  -H "Content-Type: application/json" \
  -d '{
    "policyId": "uuid-of-policy",
    "customerId": "uuid-of-customer"
  }'
```
The endpoint will:
- Fetch the policy and insurer information
- Calculate commission using insurer rate
- Set expected due date to 30 days after policy start
- Store in commissions table

#### Mode 2: Generate missing commissions for all policies
```bash
curl -X POST "http://localhost:3000/api/commissions?action=generate-missing" \
  -H "Content-Type: application/json"
```
Returns:
```json
{
  "successCount": 42,
  "errorCount": 2,
  "errors": {
    "policy-id-1": "error message",
    "policy-id-2": "error message"
  },
  "generated": [/* commission records */]
}
```

#### Mode 3: Regenerate all commissions (overwrite)
```bash
curl -X POST "http://localhost:3000/api/commissions?action=regenerate-all" \
  -H "Content-Type: application/json"
```

#### Mode 4: Manual commission creation
```bash
curl -X POST http://localhost:3000/api/commissions \
  -H "Content-Type: application/json" \
  -d '{
    "policyId": "uuid-of-policy",
    "customerId": "uuid-of-customer",
    "insurerId": "uuid-of-insurer",
    "commissionAmount": "5000.00",
    "expectedDueDate": "2024-02-14",
    "notes": "Manual entry"
  }'
```

### 2. Cron Job Endpoint
**Route**: `POST /api/cron/generate-commissions`

Requires: `Authorization: Bearer {CRON_SECRET}` header

#### Generate missing commissions
```bash
curl -X POST http://localhost:3000/api/cron/generate-commissions \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

#### Regenerate all commissions
```bash
curl -X POST "http://localhost:3000/api/cron/generate-commissions?action=regenerate-all" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

### 3. Manual Trigger Endpoint (for testing)
**Route**: `GET /api/cron/generate-commissions/trigger`

No authentication required for testing:
```bash
# Test: Generate missing commissions
curl "http://localhost:3000/api/cron/generate-commissions/trigger?action=generate-missing"

# Test: Regenerate all
curl "http://localhost:3000/api/cron/generate-commissions/trigger?action=regenerate-all"
```

## Automatic Commission Generation

### When policies are created
When a new policy is created via `POST /api/policies`:
1. Policy record is created
2. Vehicle record created (for motor policies)
3. Payment schedule created
4. **Commission is automatically calculated and stored** (if policy has an insurer with commission rate)
5. If commission generation fails, a warning is logged but policy creation succeeds

This ensures commissions are available immediately after policy creation.

### Updating existing policies
For policies that already exist but don't have commissions (e.g., from before this feature):
- Use `POST /api/commissions?action=generate-missing` endpoint
- Or set up a cron job to run daily

## Commission Calculation Logic

### Base Formula
```
Commission Amount = (Policy Grand Total × Insurer Commission Rate) ÷ 100
```

### Example
- Policy Grand Total: KES 50,000
- Insurer Commission Rate: 5%
- Commission Amount: KES 2,500
- Expected Due Date: 30 days from policy start date

### Requirements
- Policy must have a valid `grandTotal`
- Policy must have an associated insurer
- Insurer must have a `commissionRate` set
- If any requirement is missing, commission is not generated

## Commission Data Structure

```
commissions table:
├── id (UUID) - Primary key
├── policyId (UUID) - Reference to policies
├── customerId (UUID) - Reference to customers
├── insurerId (UUID, nullable) - Reference to insurers
├── commissionAmount (numeric) - Calculated commission
├── expectedDueDate (date) - Due date (30 days after policy start)
├── settledDate (date, nullable) - When commission was paid
├── status (enum) - "Pending" or "Paid"
├── notes (text, nullable) - Additional notes
├── createdAt (timestamp) - When commission record created
└── updatedAt (timestamp) - Last update timestamp
```

## Setup Instructions

### 1. Environment Variable
Ensure `CRON_SECRET` is set in your `.env` file for cron job authentication:
```env
CRON_SECRET=your-secure-cron-secret-here
```

### 2. Deploy the code
- The new files will be automatically included in the build
- No database migrations needed (table already exists)

### 3. Generate initial commissions
One-time operation to backfill commissions for existing policies:

```bash
# Option A: Using manual trigger (for testing)
curl "http://localhost:3000/api/cron/generate-commissions/trigger"

# Option B: Using API directly
curl -X POST http://localhost:3000/api/commissions?action=generate-missing
```

### 4. Schedule daily cron job (optional)
Set up your cron service (Vercel Cron, AWS EventBridge, etc.) to call:
```
POST /api/cron/generate-commissions
Header: Authorization: Bearer {CRON_SECRET}
Daily at: 2:00 AM UTC (or your preferred time)
```

## Commission Report Integration

The commission report now has two options:

### Option 1: Query stored commissions (recommended)
```sql
SELECT * FROM commissions 
WHERE status = 'Pending'
ORDER BY expectedDueDate ASC;
```

### Option 2: Calculate on-the-fly (fallback)
Original calculation method still available in reports for comparison or if commissions aren't stored.

## Troubleshooting

### Commissions not being generated
1. Verify insurer has a `commissionRate` set
2. Verify policy has a `grandTotal` value
3. Check logs for commission generation errors
4. Run: `POST /api/commissions?action=generate-missing` manually

### Commission amount incorrect
1. Verify insurer commission rate
2. Verify policy grand total calculation
3. Use `regenerate-all` to recalculate all commissions

### Getting commission generation errors
Check the API response errors object for details per policy. Common issues:
- Policy not found
- Customer not found
- Missing insurer rate
- Invalid date calculations

## Performance Considerations

- Commission calculations are efficient and use indexed queries
- Bulk generation (`generate-missing`) processes policies sequentially to avoid database contention
- For large datasets (1000+ policies), consider running during off-peak hours
- Commission storage reduces report generation time significantly

## Database Indexes
The following indexes optimize commission queries:
- `commissions_policy_idx` - Policy lookups
- `commissions_customer_idx` - Customer lookups
- `commissions_insurer_idx` - Insurer lookups
- `commissions_expected_due_date_idx` - Date range queries
- `commissions_status_idx` - Status filtering

These were created in the existing migration and ensure fast queries.

## Summary of Changes

### Files Created:
1. `/src/lib/commission.ts` - Commission utility functions
2. `/src/app/api/cron/generate-commissions/route.ts` - Cron endpoint
3. `/src/app/api/cron/generate-commissions/trigger/route.ts` - Test trigger

### Files Modified:
1. `/src/app/api/commissions/route.ts` - Added POST endpoint for commission creation
2. `/src/app/api/policies/route.ts` - Auto-generate commissions on policy creation

### No Database Changes Needed
- The `commissions` table already exists with proper schema
- All indexes are already in place
