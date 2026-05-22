# Clean Up False Lead Reminders

After the fix for the auto-populated dates bug, existing leads may still show "commission overdue" and "reminder due" badges even though there are no actual reminders.

## Option 1: Using the API Endpoint (Easiest)

### Preview which leads will be affected:

```bash
curl -X GET http://localhost:3000/api/car-sales/cleanup-dates \
  -H "Authorization: Bearer YOUR_API_SECRET_KEY"
```

### Execute the cleanup:

```bash
curl -X POST http://localhost:3000/api/car-sales/cleanup-dates \
  -H "Authorization: Bearer YOUR_API_SECRET_KEY" \
  -H "Content-Type: application/json"
```

**Note:** Set your `API_SECRET_KEY` in your `.env` file first. If not set, add:
```
API_SECRET_KEY=your-secret-key-here
```

## Option 2: Using npm script

```bash
npm run cleanup-lead-dates
```

This script will:
1. Show a preview of affected leads
2. Show 3 sample leads that will be cleaned
3. Execute the cleanup
4. Report how many leads were updated

## What the cleanup does:

✅ Sets `reminderDate`, `releaseDate`, and `commissionDueDate` to `NULL` for:
- Leads that are NOT in "Released", "Lost", or "Cancelled" stages
- AND have dates set to today or in the past (indicating auto-population)
- AND don't have any actual reminders created in the `carSalesReminders` table

✅ Preserves:
- Any leads in "Released", "Lost", or "Cancelled" stages (these may have legitimate dates)
- Any leads that have actual reminders created via the modal
- Any dates set in the future

## After cleanup:

Users can now explicitly add reminders via the lead modal's "Add Reminder" feature. These will be properly stored and displayed both on the card and in the modal.
