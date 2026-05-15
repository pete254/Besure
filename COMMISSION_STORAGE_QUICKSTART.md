# Commission Storage - Quick Start Guide

## What Was Done

The commission storage system has been implemented to **automatically calculate and store** commission data from policies instead of calculating it only when generating reports.

### The Problem
- Commissions were only calculated on-the-fly when generating the commission report
- No commission data was stored in the `commissions` table
- Commission tracking was impossible

### The Solution
- **Automatic**: Commissions are now generated automatically when a policy is created
- **Stored**: All commissions are persisted in the `commissions` table with proper tracking
- **Manageable**: Commission status can be updated (Pending → Paid) and tracked over time
- **Bulk Operations**: Can generate missing commissions or regenerate all at once

## Files Created

1. **`/src/lib/commission.ts`** - Core commission calculation and storage utilities
   - `calculateCommissionForPolicy()` - Calculate from policy
   - `storeCommission()` - Store in database
   - `calculateAndStoreCommission()` - Combined operation
   - `generateMissingCommissions()` - Bulk generate for policies without commissions
   - `regenerateAllCommissions()` - Recreate all commissions

2. **`/src/app/api/cron/generate-commissions/route.ts`** - Cron job for scheduled generation
3. **`/src/app/api/cron/generate-commissions/trigger/route.ts`** - Test trigger endpoint

## Files Modified

1. **`/src/app/api/commissions/route.ts`**
   - Added `POST` endpoint with 3 operation modes
   - `?action=generate-missing` - Generate for all policies without commissions
   - `?action=regenerate-all` - Regenerate for all policies (overwrites)
   - Manual creation with calculated or provided values

2. **`/src/app/api/policies/route.ts`**
   - Auto-generates commissions when new policies are created
   - Won't fail if commission generation fails (graceful degradation)

## How to Use

### Option 1: Generate Missing Commissions (Recommended for existing policies)

```bash
# Generate commissions for all policies that don't have one yet
curl -X POST http://localhost:3000/api/commissions?action=generate-missing
```

### Option 2: Automatic Generation (New policies)

When you create a new policy via the UI, commission is **automatically** generated and stored (if the insurer has a commission rate set).

### Option 3: Manual API Call

```bash
# Create commission by providing all data
curl -X POST http://localhost:3000/api/commissions \
  -H "Content-Type: application/json" \
  -d '{
    "policyId": "your-policy-id",
    "customerId": "your-customer-id",
    "commissionAmount": "5000.00",
    "expectedDueDate": "2024-02-15"
  }'
```

### Option 4: Cron Job (For daily automated generation)

Set up your cron service to call:
```
POST /api/cron/generate-commissions
Authorization: Bearer {CRON_SECRET}
Schedule: Daily at 2:00 AM UTC
```

## Commission Calculation

**Formula**: `(Policy Grand Total × Insurer Commission Rate) ÷ 100`

**Example**:
- Policy Premium: KES 50,000
- Insurer Rate: 5%
- Commission: KES 2,500
- Expected Due Date: 30 days from policy start

## Key Features

✅ **Automatic**: Commissions generated when policies are created  
✅ **Stored**: All commissions in database with status tracking  
✅ **Trackable**: Commission status (Pending/Paid) can be managed  
✅ **Bulk Operations**: Generate missing or regenerate all in one call  
✅ **Graceful Errors**: Failed commission generation won't break policy creation  
✅ **No Data Loss**: Existing commissions in reports are still accessible  

## Verification

To verify commissions are being stored:

```sql
-- Check if commissions table has data
SELECT COUNT(*) FROM commissions;

-- View pending commissions
SELECT 
  c.id,
  p.policy_number,
  c.commission_amount,
  c.expected_due_date,
  c.status
FROM commissions c
JOIN policies p ON c.policy_id = p.id
WHERE c.status = 'Pending'
ORDER BY c.expected_due_date;
```

Or via the API:

```bash
curl http://localhost:3000/api/commissions?tab=pending
```

## Next Steps

1. ✅ **Test**: Generate commissions for existing policies
   ```bash
   curl -X POST http://localhost:3000/api/commissions?action=generate-missing
   ```

2. ✅ **Verify**: Check that commissions are stored
   ```bash
   curl http://localhost:3000/api/commissions
   ```

3. ✅ **Create New Policy**: Test that commission is auto-generated
   - Create a policy with an insurer that has a commission rate
   - Check that commission appears in the list

4. ✅ **Track Commission**: Update commission status when paid
   - Use PATCH endpoint to mark commission as "Paid"

## Common Issues

**Q: No commissions generated?**
- A: Ensure insurer has a `commissionRate` set in the insurers table

**Q: Wrong commission amount?**
- A: Check policy `grandTotal` and insurer `commissionRate` are correct
- Run: `regenerate-all` to recalculate

**Q: Commission generation failed?**
- A: Check API response for error details. Common causes:
  - Policy ID doesn't exist
  - Customer ID doesn't match
  - Insurer doesn't have commission rate

## Documentation

For detailed documentation, see: **`COMMISSION_STORAGE_GUIDE.md`**

This includes:
- Complete API reference
- All endpoint modes
- Database structure
- Performance considerations
- Troubleshooting guide
- Setup instructions for cron jobs
