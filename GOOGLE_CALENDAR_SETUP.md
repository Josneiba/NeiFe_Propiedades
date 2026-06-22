# 📅 Google Calendar Integration Setup

## Overview

The CRM now integrates with Google Calendar, allowing brokers to automatically sync deals to their calendar and receive smart recommendations.

## What's New

### 1. **RecommendationsPanel** (✅ Completed)

- **Location**: `/broker` dashboard
- **Features**:
  - Smart recommendations based on deal analysis
  - 7 recommendation types: FOLLOWUP, DEADLINE, STALE, MATCH, RENEWAL, RISK, CLOSING
  - Color-coded by priority (HIGH=red, MEDIUM=gold, LOW=teal)
  - Clickable actions with navigation
  - **Endpoint**: `GET /api/crm/recommendations`

### 2. **GoogleCalendarButton** (✅ Completed)

- **Location**: CRM deal drawer (right side of date field)
- **Features**:
  - Creates calendar events from deals
  - Syncs to broker's Google Calendar
  - Auto-prefixes events with "NeiFe:"
  - Includes property address & deal details
  - Opens event in Google Calendar after creation
  - **Endpoint**: `POST /api/calendar/google-sync`

### 3. **Google OAuth 2.0 Configuration** (✅ Completed)

- Added Google provider to NextAuth.ts
- Configured Calendar API scope: `https://www.googleapis.com/auth/calendar`
- Enabled offline access for long-lived tokens
- Configured consent prompt for re-auth when needed

---

## Setup Instructions

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project: **NeiFe Propiedades**
3. Enable APIs:
   - Google Calendar API
   - Google+ API (for user info)

### Step 2: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Configure Authorized redirect URIs:
   - Local: `http://localhost:3001/api/auth/callback/google`
   - Production: `https://neifehome.com/api/auth/callback/google`
5. Copy **Client ID** and **Client Secret**

### Step 3: Update Environment Variables

Add to `.env.local`:

```bash
GOOGLE_CLIENT_ID="your-client-id-from-step-2"
GOOGLE_CLIENT_SECRET="your-client-secret-from-step-2"
```

Or in Vercel dashboard:

```
Environment Variables → Add:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
```

### Step 4: Test the Integration

1. Run `npm run dev`
2. Navigate to `/broker` dashboard
3. Scroll down to **"🔔 Recomendaciones inteligentes"** section
4. Open a CRM deal in workspace
5. In the drawer, click the **📅** button to create a calendar event
6. First-time users will be prompted to authorize Google account
7. Event should appear in broker's Google Calendar

---

## API Endpoints

### Recommendations

```bash
GET /api/crm/recommendations
# Returns array of Recommendation objects sorted by priority
# [
#   {
#     id: "followup-dealid",
#     type: "FOLLOWUP|DEADLINE|STALE|RENEWAL|RISK|CLOSING",
#     priority: "HIGH|MEDIUM|LOW",
#     title: "string",
#     message: "string",
#     actionLabel: "string",
#     actionUrl: "/path/to/action",
#     dealId?: "optional"
#   }
# ]
```

### Google Calendar Sync

```bash
POST /api/calendar/google-sync
Content-Type: application/json

{
  "dealId": "crm_deal_id",
  "title": "Deal title",
  "description": "Optional description",
  "startDate": "2026-06-22T10:00:00Z",
  "location": "Property address"
}

# Returns:
{
  "eventId": "google_event_id",
  "htmlLink": "https://calendar.google.com/...",
  "success": true
}
```

---

## File Changes

### New Files Created

- `lib/google-calendar.ts` - Google Calendar API helpers
- `lib/crm-recommendations.ts` - Recommendation engine
- `app/api/calendar/google-sync/route.ts` - Calendar sync endpoint
- `app/api/crm/recommendations/route.ts` - Recommendations API
- `components/broker/crm/recommendations-panel.tsx` - UI component

### Modified Files

- `lib/auth.ts` - Added Google provider
- `app/broker/page.tsx` - Added RecommendationsPanel
- `components/broker/crm/deal-drawer.tsx` - Added GoogleCalendarButton
- `.env.local` - Added GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET variables

---

## Troubleshooting

### "Conecta con Google para usar esta función"

- User needs to sign in with Google
- Click the button to trigger OAuth flow
- Authorize calendar access

### Calendar events not appearing

1. Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set
2. Check that user authorized Google OAuth
3. Ensure Google Calendar API is enabled in Cloud Console
4. Check browser console for API errors

### Recommendations not showing

1. Verify database has CRM data (deals, contacts, activities)
2. Check `/api/crm/recommendations` endpoint directly
3. Ensure broker has active deals (status="ACTIVE")
4. Check server logs for query errors

---

## Next Steps (PARTE 5-6)

- [ ] Add metrics dashboard (stage velocity, conversion rates, etc.)
- [ ] Implement deal sequences & automation
- [ ] Add WhatsApp integration
- [ ] Create PDF export functionality
- [ ] Build post-venta (post-sale) dashboard

---

## Support

For issues or questions:

1. Check the API response in Network tab
2. Review server logs: `npm run dev`
3. Verify OAuth credentials in Google Cloud Console
4. Ensure Prisma migrations are up to date
