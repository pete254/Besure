# Add these lines to your .env.local file

Replace the existing Google Calendar section with this:

# ─── GOOGLE CALENDAR (Service Account) ─────────────────────
# Step 1: Go to console.cloud.google.com → Create project → Enable "Google Calendar API"
# Step 2: IAM & Admin → Service Accounts → Create service account
# Step 3: Create JSON key → download it
# Step 4: Add these env vars from the JSON key file
# Step 5: Share your Google Calendar with the service account email (give "Make changes to events" permission)

# Service Account Email (from JSON key file)
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"

# Private Key (from JSON key file - include full key with newlines)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Calendar ID (use "primary" for main calendar or specific calendar ID)
GOOGLE_CALENDAR_ID="primary"

# Legacy API Key (keep for backward compatibility)
GOOGLE_CALENDAR_API_KEY="AIzaSyDmQWEXms9qij1nYwvyVoPJxDm0ZvYp6dg"

# ─── RESEND (Email) ────────────
