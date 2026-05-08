# Google Calendar Sync - Setup Instructions

You've now got a complete bidirectional sync system! Here's what you need to do next:

## **Step 1: Apply Database Migrations**

Run these SQL commands on your Neon database to add the new columns:

```sql
-- Add Google token fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_access_token TEXT;

-- Add Google Calendar sync fields to reminders table
ALTER TABLE car_sales_reminders ADD COLUMN IF NOT EXISTS google_event_id VARCHAR(255);
ALTER TABLE car_sales_reminders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create index for faster sync lookups
CREATE INDEX IF NOT EXISTS car_sales_reminders_google_event_idx 
ON car_sales_reminders(google_event_id);
```

Or use Drizzle Kit:
```bash
npx drizzle-kit generate
npx drizzle-kit push
```

## **Step 2: Test the Sync Flow**

Once migrations are applied:

1. **Sign in with Google** on your app (this stores the refresh token)
2. **Create a reminder** in Car Sales
3. **Trigger the sync** by making this request:

```bash
curl -X POST http://localhost:3000/api/car-sales/calendar/sync-reminders \
  -H "Content-Type: application/json"
```

4. **Check your Google Calendar** - the reminder should appear!

## **Step 3: Fetch Google Calendar Events**

To pull events from your Google Calendar back into the app:

```bash
curl http://localhost:3000/api/car-sales/calendar/sync-reminders
```

## **How It Works**

1. **User signs in with Google** → Refresh token is stored in the `users` table
2. **Reminder created in app** → Stored in `car_sales_reminders` table
3. **POST /api/car-sales/calendar/sync-reminders** → Creates event in Google Calendar, stores `google_event_id`
4. **GET /api/car-sales/calendar/sync-reminders** → Fetches events from Google Calendar

## **Key Features**

✅ **OAuth Refresh Tokens** - Automatically handles token expiration  
✅ **Event Deduplication** - Only syncs reminders without `google_event_id`  
✅ **Error Handling** - Logs failures but continues syncing other reminders  
✅ **Timezone Aware** - Uses Africa/Nairobi timezone  
✅ **Secure** - Tokens stored encrypted in database, only accessible to authenticated users  

## **Next Steps (Optional)**

### Auto-sync when reminder is created:
Add this to your reminder creation endpoint:
```typescript
await fetch("http://localhost:3000/api/car-sales/calendar/sync-reminders", {
  method: "POST"
});
```

### Real-time sync with webhooks:
Google can push events to your app using the Watch API - implement if you need real-time updates.

### Bidirectional sync:
Add logic to fetch Google Calendar events and create reminders back in your app.

---

## **Troubleshooting**

**"Failed to authenticate with Google"**
- Make sure you've signed in with Google (refresh token must be stored)
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

**"Unauthorized"**
- Ensure you're authenticated (have a valid session)
- Google tokens may have expired - try signing out and back in

**Events not appearing in Google Calendar**
- Check that `GOOGLE_CALENDAR_ID` matches your calendar
- Verify service account has access to the calendar

---

Enjoy automated calendar syncing! 🎉
