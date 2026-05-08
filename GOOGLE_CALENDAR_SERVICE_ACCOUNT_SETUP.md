# Google Calendar Service Account Setup

This guide walks you through setting up Google Calendar integration using a Service Account - the simplest approach with no OAuth popup or token storage issues.

## Overview

- **Method**: Service Account authentication
- **Benefits**: No OAuth flow, no token storage, automatic sync
- **Use Case**: Perfect for agency-wide calendar sharing

## Step 1: Google Cloud Console Setup

1. **Create/Select Project**
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Create new project or select existing one

2. **Enable Google Calendar API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

3. **Create Service Account**
   - Go to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - Give it a name (e.g., "besure-calendar-sync")
   - Click "Create and Continue"
   - Skip granting roles (not needed for calendar access)
   - Click "Done"

4. **Generate JSON Key**
   - Find your service account in the list
   - Click the three dots → "Manage keys"
   - Click "Add Key" → "Create new key"
   - Select "JSON" and click "Create"
   - Download the JSON file and keep it secure

## Step 2: Environment Variables

Add these to your `.env.local` file:

```env
# Service Account Email (from the JSON key file)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# Private Key (from the JSON key file - include the full key with newlines)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Calendar ID (use "primary" for your main calendar or specific calendar ID)
GOOGLE_CALENDAR_ID=primary
```

**Important**: The private key must include the `\n` characters for newlines exactly as shown above.

## Step 3: Share Your Google Calendar

1. **Open Google Calendar**
   - Go to [calendar.google.com](https://calendar.google.com)

2. **Share with Service Account**
   - Find the calendar you want to sync
   - Hover over it and click the three dots → "Settings and sharing"
   - Scroll to "Share with specific people"
   - Click "Add people"
   - Enter your service account email
   - Give "Make changes to events" permission
   - Click "Send"

3. **Get Calendar ID (if not using "primary")**
   - In calendar settings, scroll to "Integrate calendar"
   - Copy the "Calendar ID" (looks like: something@group.calendar.google.com)
   - Use this as your `GOOGLE_CALENDAR_ID`

## Step 4: Test the Integration

The system will automatically sync car sales leads to your Google Calendar when:

- **New leads are created** - Creates follow-up reminders
- **Leads are updated** - Updates existing calendar events
- **Dates are set** - Creates release and commission due events

### Calendar Events Created

1. **Follow Up Reminders** (📞)
   - Based on `reminderDate`
   - Color-coded by lead stage

2. **Car Release** (🚗)
   - Based on `releaseDate`
   - Green color for completed releases

3. **Commission Due** (💰)
   - Based on `commissionDueDate`
   - Purple color for payment tracking

### Color Coding

- **Teal (7)**: New Lead
- **Yellow (5)**: Follow Up
- **Orange (6)**: Hot Prospect
- **Purple (3)**: Deposit Paid
- **Green (10)**: Released
- **Red (11)**: Lost
- **Grey (8)**: Cancelled

## API Endpoints

### Calendar Management
- `GET /api/calendar` - List events
- `POST /api/calendar` - Create event
- `PUT /api/calendar/[eventId]` - Update event
- `DELETE /api/calendar/[eventId]` - Delete event

### Lead Sync
- `POST /api/calendar/sync-lead` - Manual sync for a specific lead

## Troubleshooting

### Common Issues

1. **"Missing env vars" error**
   - Check your `.env.local` file has all required variables
   - Ensure the private key includes `\n` for newlines

2. **"Permission denied" error**
   - Verify you shared the calendar with the service account email
   - Check the service account has "Make changes to events" permission

3. **"Invalid credentials" error**
   - Ensure the private key is copied correctly from the JSON file
   - Check the service account email matches exactly

### Testing

```bash
# Test calendar connection
curl -X GET http://localhost:3000/api/calendar

# Test lead sync
curl -X POST http://localhost:3000/api/calendar/sync-lead \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "test-123",
    "customerName": "Test Customer",
    "carType": "Toyota Corolla",
    "registrationNumber": "ABC123",
    "stage": "New Lead",
    "reminderDate": "2025-06-15"
  }'
```

## Security Notes

- Keep your service account JSON key file secure
- Never commit the private key to version control
- Use environment variables, not hardcoded keys
- Consider using Google Cloud KMS for production key management

## Next Steps

Once set up, your car sales system will automatically:
- Create calendar events for new leads
- Update events when lead details change
- Track important dates (reminders, releases, commissions)
- Provide color-coded visual organization

The calendar sync works silently in the background - no user interaction required after initial setup.
