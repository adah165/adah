# Sprint Walkthrough: Secure Auth, Campaign Wizard & Advanced Campaign Editor

This walkthrough details the implementations of Phase 1 (Secure Authentication, Sign Up, and OTP Verification via Resend), Phase 2 (Google Ads API integration, Google Maps Proximity Pin & Radius targeting, and Contextual Keyword Planning), and Phase 3 (Advanced Campaign Editor & DB Persistence).

---

## 1. Authentication Security (Phase 1)

### Database Schema Alterations
- Added `password` (hashed String), `otpCode` (String), and `otpExpires` (DateTime) optional fields to the `User` model inside [schema.prisma](file:///d:/ADS/adah/prisma/schema.prisma).
- Created a database migration helper endpoint at `/api/debug-db` (in [route.ts](file:///d:/ADS/adah/app/api/debug-db/route.ts)) which executes raw SQL `ALTER TABLE` queries on the Supabase PostgreSQL database to add these columns.

### Register / Signup Endpoint
- Created a new registration route at `/api/auth/signup` (in [route.ts](file:///d:/ADS/adah/app/api/auth/signup/route.ts)):
  - Validates email uniqueness.
  - Hashes passwords using SHA-256 (`crypto`).
  - Initializes a new `Workspace` and `WorkspaceMember` link with the `ADMIN` role for the user.
  - Generates a random 6-digit verification code and sets a 15-minute expiration timestamp.
  - Dispatches the OTP verification code via the **Resend API**. If the API key is mock, the generated OTP is logged directly to the server terminal console.

### Email Verification Endpoint
- Created `/api/auth/verify` (in [route.ts](file:///d:/ADS/adah/app/api/auth/verify/route.ts)):
  - `POST` validates the OTP matching code and timestamp, updates `emailVerified: new Date()`, and clears OTP parameters.
  - `PUT` generates and resends a new OTP verification code to their email.

### NextAuth Database Credentials Matching
- Modified NextAuth configuration in [route.ts](file:///d:/ADS/adah/app/api/auth/%5B...nextauth%5D/route.ts) to verify logins:
  - Validates credentials against user records in the PostgreSQL database.
  - Hashes password input using SHA-256 and compares it with the saved database hash.
  - Pass the database `emailVerified` timestamp through NextAuth's `jwt` and `session` callbacks.

### Dashboard Access Gating (Lock)
- Modified the main dashboard [layout.tsx](file:///d:/ADS/adah/app/%28dashboard%29/layout.tsx):
  - Fetches the active NextAuth session server-side.
  - Queries the database for the user.
  - Securely redirects the user to `/verify` if `emailVerified` is null.
  - Bypasses this verification rule only for the default developer account (`demo@adah.sa`).

### Signup & Verification Interfaces
- Created [signup/page.tsx](file:///d:/ADS/adah/app/signup/page.tsx): A premium, RTL-compliant user registration page matching the primary platform styling.
- Created [verify/page.tsx](file:///d:/ADS/adah/app/verify/page.tsx): A glassmorphic OTP verification entry interface with a resend button and a 60-second spam-protection cooldown timer.
- Linked signup from the login page [login/page.tsx](file:///d:/ADS/adah/app/login/page.tsx).

---

## 2. Google Ads API & Wizard Enhancements (Phase 2)

### Geographic Location Search via GAQL
- Updated `/api/locations/search` (in [route.ts](file:///d:/ADS/adah/app/api/locations/search/route.ts)):
  - Inspects user's workspace for a connected Google Ads account.
  - If connected, translates Arabic input queries to English search parameters using a translation mapping dictionary.
  - Runs a GAQL query against the Google Ads API `geo_target_constant` resource to search matching locations dynamically:
    ```sql
    SELECT geo_target_constant.id, geo_target_constant.name, geo_target_constant.canonical_name, geo_target_constant.target_type 
    FROM geo_target_constant 
    WHERE geo_target_constant.canonical_name LIKE '%...%' AND geo_target_constant.status = 'ENABLED' 
    LIMIT 10
    ```
  - Maps result target types to Arabic.
  - Falls back to a rich static Middle Eastern locations list if not connected.

### Proximity Radius Map Targeting
- Integrated a Proximity Radius interactive Map selector in Step 2 of the Campaign Wizard [page.tsx](file:///d:/ADS/adah/app/%28dashboard%29/campaigns/new/page.tsx):
  - Swapped Google Maps API for a fully free, open-source **Leaflet** map with **OpenStreetMap** tiles (loaded dynamically from CDN at runtime).
  - Allows users to switch between searching by name and targeting a circle radius on a map.
  - User can click anywhere on the map to place a draggable marker.
  - Renders a semi-transparent blue search circle around the marker reflecting the selected target radius (1 km to 50 km) which resizes dynamically using the slider.
  - Automatically handles state synchronization and cleanup to prevent memory leaks in the browser.

### Context-Aware AI Keyword Ideas
- Updated `/api/keywords/suggest` (in [route.ts](file:///d:/ADS/adah/app/api/keywords/suggest/route.ts)) to accept a business context description.
- If connected to Google Ads, extracts seed words from the context and calls `generateKeywordIdeas` via `KeywordPlanIdeaService` to fetch real metrics.
- If offline, falls back to OpenAI or uses a context-aware local template generator returning dynamic volumes/competition metrics customized to their inputs.

### Custom Copy Templates
- Updated `/api/ad-copy/suggest` (in [route.ts](file:///d:/ADS/adah/app/api/ad-copy/suggest/route.ts)) to produce goal-tailored headlines and descriptions matching Google Ads length bounds (30 and 90 characters respectively) when OpenAI is offline.

---

## 3. Advanced Campaign Editor & DB Persistence (Phase 3)

### Schema updates for Campaign Metadata
- Added `bidStrategy`, `targetLocations`, `keywords`, `headlines`, `descriptions`, and `finalUrl` to the `Campaign` model in [schema.prisma](file:///d:/ADS/adah/prisma/schema.prisma).
- Registered corresponding `ALTER TABLE` commands inside [route.ts](file:///d:/ADS/adah/app/api/debug-db/route.ts) to push these fields to PostgreSQL/Supabase during test runs.

### Serialization & Controller Upgrades
- Updated `/api/campaigns` controller in [route.ts](file:///d:/ADS/adah/app/api/campaigns/route.ts):
  - **GET**: Safely parses `targetLocations`, `keywords`, `headlines`, and `descriptions` JSON strings into native JavaScript arrays.
  - **POST**: Accepts bid strategies, locations, keywords, headlines, descriptions, and final URLs, serializing arrays to JSON format.
  - **PUT**: Fully updates the expanded metadata fields and validates the campaign identifier.
- Synced the wizard's `handleLaunch` callback to send target locations and keywords on campaign creation.

### High-Fidelity 4-Tab Edit Interface
- Overhauled the Campaign Edit Modal in [page.tsx](file:///d:/ADS/adah/app/%28dashboard%29/campaigns/page.tsx):
  1. **الأساسيات (Basics)**: Configures campaign name, daily budget limits, active/paused status, and Google Ads bidding strategies.
  2. **الاستهداف والخرائط (Geotargeting)**: Embeds the Leaflet/OpenStreetMap engine dynamically inside a modal tab. Dropping pins, sliding radius circles (1 km to 50 km), and querying regional boundaries by name are supported and updated dynamically.
  3. **الكلمات المفتاحية (Keywords)**: Displays active keyword tag lists, lets users add/remove words, and runs background AI search suggestions based on description inputs.
  4. **نصوص الإعلان (Ad Copy)**: Manages URL destinations, three 30-character headlines, two 90-character descriptions, and updates a Google sponsored search simulated live viewport (supporting desktop and mobile form factors) in real-time. Includes AI generation hooks.

---

## 4. Verification Instructions

1. **Schema Migration**:
   - Access `http://localhost:3000/api/debug-db` in your browser. It will execute the raw SQL schema alterations to add password/OTP fields to Supabase and new campaign columns.
2. **Signup & Login Flow**:
   - Navigate to `http://localhost:3000/signup`. Create an account (e.g. `test@example.com`).
   - Check your node.js server terminal logs. The mock OTP verification code will be printed inside a simulated email block.
   - You will be automatically signed in and redirected to `http://localhost:3000/verify`.
   - Enter the code. The dashboard will unlock and redirect you home.
3. **Advanced Campaign Editing**:
   - Navigate to the Campaign Management list (`http://localhost:3000/campaigns`).
   - Click "تعديل" (Edit) next to a campaign.
   - Check out the 4-Tab Advanced Campaign Dialog:
     - Change settings in **الأساسيات** (Basics) and switch tabs.
     - In **الاستهداف والخرائط** (Targeting), switch to Radius Map, click to drop a pin, drag it, select radius, and add it.
     - In **الكلمات المفتاحية** (Keywords), write a brief context description, click "AI Keywords" to fetch ideas, and click the "+" button to add them.
     - In **نصوص الإعلان** (Ad Copy), tweak the final destination URL or write headings, look at the desktop/mobile preview, and save.
     - Confirm all updates are instantly displayed in the campaigns list!
