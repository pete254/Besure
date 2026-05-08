# Google Calendar Integration Setup Guide

This guide explains how to integrate BeSure Insurance's car sales reminders with your Google Calendar.

## Overview

The calendar integration allows you to:
- Sync all reminders to a specific Google Calendar
- Receive notifications on your phone/computer via Google Calendar
- Add events directly from Google Calendar that sync back to the system
- Manage reminders across multiple devices

---

## Step 1: Create a Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Sign in with your Google account (use your company Gmail account recommended)

2. **Create a new project**
   - Click on the project dropdown at the top
   - Click "New Project"
   - Name: `BeSure Insurance Calendar`
   - Click "Create"

3. **Wait for the project to be created** (takes ~30 seconds)

---

## Step 2: Enable Google Calendar API

1. **Search for Google Calendar API**
   - In the Google Cloud Console search bar, type: `Google Calendar API`
   - Click on "Google Calendar API" from results

2. **Enable the API**
   - Click the blue "Enable" button
   - Wait for it to complete

3. **Verify it's enabled**
   - You should see "Google Calendar API" in your enabled APIs list

---

## Step 3: Create OAuth 2.0 Credentials

1. **Go to Credentials page**
   - In Google Cloud Console, click "Credentials" (left sidebar)
   - Or click: APIs & Services → Credentials

2. **Create OAuth 2.0 Client ID**
   - Click blue "+ Create Credentials" button
   - Select "OAuth client ID"
   - If prompted: Click "Configure Consent Screen" first:
     - Select "External" user type
     - Click "Create"
     - Fill in: App name: `BeSure Insurance`
     - User support email: `your-company-email@gmail.com`
     - Developer contact: `your-company-email@gmail.com`
     - Click "Save and Continue"
     - On scopes page, click "Save and Continue"
     - Click "Back to Dashboard"

3. **Create the Client ID**
   - Click "+ Create Credentials" → "OAuth client ID" again
   - Application type: Select "Web application"
   - Name: `BeSure Calendar Integration`
   - Under "Authorized redirect URIs", click "Add URI"
   - Add this URL: `http://localhost:3000/api/auth/callback/google`
   - If deploying to production, also add: `https://your-domain.com/api/auth/callback/google`
   - Click "Create"

4. **Copy your credentials**
   - You'll see a popup with:
     - **Client ID** (copy this)
     - **Client Secret** (copy this)
   - Click "Download JSON" to save as backup

---

## Step 4: Create a Google API Key (Optional but recommended)

1. **Create API Key**
   - Click "+ Create Credentials" → "API Key"
   - Copy the API Key
   - (Optional) Restrict it to Google Calendar API only for security

---

## Step 5: Update .env.local File

Open your `.env.local` file and fill in the Google credentials:

```env
GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
GOOGLE_CALENDAR_API_KEY="your-api-key-here"
GOOGLE_CALENDAR_ID="your-calendar-id@gmail.com"
```

### How to get GOOGLE_CALENDAR_ID:

1. **Open Google Calendar**
   - Go to: https://calendar.google.com

2. **Find your calendar ID**
   - Look at the left sidebar
   - Find the calendar you want to sync (or create a new one named "BeSure Insurance")
   - Hover over the calendar name → click three dots → "Settings"
   - Scroll to "Integrate calendar" section
   - Copy the "Calendar ID" (looks like: `your-email@gmail.com`)

3. **If creating a new calendar:**
   - Click "+" next to "Other calendars" on the left
   - Select "Create new calendar"
   - Name: `BeSure Insurance Reminders`
   - Copy its Calendar ID from settings

---

## Step 6: Configure Your App

### Update your NextAuth configuration (if needed):

If you're using NextAuth.js for Google authentication, ensure your `auth.ts` includes Google provider:

```typescript
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
};
```

---

## Step 7: Test the Integration

1. **Restart your development server**
   ```bash
   npm run dev
   ```

2. **Go to the Calendar page**
   - Navigate to Car Sales → Click "Reminders & Calendar" card

3. **You should see:**
   - A calendar view with your reminders
   - Upcoming reminders listed on the right
   - Ability to check off completed reminders

4. **Test syncing:**
   - Create a reminder in BeSure for a specific date
   - Check if it appears on your Google Calendar (if sync API is implemented)

---

## Step 8: Production Deployment

### For Vercel (recommended):

1. **Add environment variables to Vercel:**
   - Go to your Vercel project → Settings → Environment Variables
   - Add:
     ```
     GOOGLE_CLIENT_ID
     GOOGLE_CLIENT_SECRET
     GOOGLE_CALENDAR_API_KEY
     GOOGLE_CALENDAR_ID
     ```

2. **Update authorized redirect URI:**
   - Go back to Google Cloud Console
   - Credentials → Your OAuth 2.0 Client
   - Add authorized redirect URI: `https://your-vercel-domain.vercel.app/api/auth/callback/google`
   - Also add: `https://your-custom-domain.com/api/auth/callback/google` (if you have one)

3. **Redeploy:**
   - Your app will automatically use production environment variables

---

## Troubleshooting

### "Invalid redirect URI" error:
- Make sure the redirect URI in Google Cloud Console matches exactly
- Include the full path: `https://domain.com/api/auth/callback/google`
- Check for trailing slashes

### Calendar not showing reminders:
- Verify `GOOGLE_CALENDAR_ID` is correct
- Check if the calendar exists and is accessible
- Ensure API is enabled in Google Cloud Console

### "Invalid Client ID" error:
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are copied correctly
- Check for extra spaces or typos
- Regenerate credentials if needed

### Reminders not syncing:
- This feature requires additional API implementation
- Contact development team for sync backend setup

---

## API Endpoints (for developers)

Once configured, these endpoints will be available:

- `GET /api/car-sales/reminders` - Fetch all reminders
- `POST /api/car-sales/reminders` - Create a new reminder
- `PATCH /api/car-sales/reminders/:id` - Update reminder status
- `GET /api/auth/callback/google` - OAuth callback endpoint

---

## Advanced: Service Account Setup (Optional)

For automated syncing without user interaction:

1. **Create Service Account:**
   - Google Cloud Console → Service Accounts
   - Create new service account
   - Click on service account → Keys → Add Key → JSON
   - Download and save the JSON file securely

2. **Grant calendar access:**
   - Open your Google Calendar settings
   - Share with service account email: `your-service-account@your-project.iam.gserviceaccount.com`
   - Give it "Make changes to events" permission

3. **Store safely:**
   - Add to environment variables (convert JSON to base64)
   - Use with Google Calendar API for syncing

---

## Security Notes

⚠️ **Important:**
- Never commit `.env.local` to git
- Keep your Client Secret confidential
- Rotate credentials every 6 months
- Use HTTPS in production (not HTTP)
- Restrict API keys to necessary APIs

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Google Calendar API documentation: https://developers.google.com/calendar
3. Contact your development team

---

## References

- Google Cloud Console: https://console.cloud.google.com
- Google Calendar API: https://developers.google.com/calendar
- NextAuth.js Google Provider: https://next-auth.js.org/providers/google
- Google OAuth Scopes: https://developers.google.com/identity/protocols/oauth2/scopes
