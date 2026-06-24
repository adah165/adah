# Google Ads API & Secure Auth Integration Checklist

## Phase 1: Secure Auth & OTP Verification
- [x] Add `password`, `otpCode`, and `otpExpires` to `prisma/schema.prisma` User model.
- [x] Implement database schema alter statements inside `/api/debug-db` route and execute it.
- [x] Implement Sign Up endpoint (`/api/auth/signup`) with SHA-256 password hashing and OTP generation/delivery via Resend API (with console logging fallback).
- [x] Implement OTP Verification endpoint (`/api/auth/verify`).
- [x] Update NextAuth config (`/api/auth/[...nextauth]/route.ts`) to query database, match passwords, and pass `emailVerified` to JWT/session.
- [x] Secure Dashboard layout (`app/(dashboard)/layout.tsx`) using `getServerSession` and check `emailVerified` (force redirect to `/verify`).
- [x] Create custom glassmorphism Register/Signup Page (`app/signup/page.tsx`).
- [x] Create custom glassmorphism Verification Page (`app/verify/page.tsx`).

## Phase 2: Google Ads API & Wizard Enhancements
- [x] Connect geographic target search API (`/api/locations/search`) to Google Ads API GAQL `geo_target_constant` query (with Arabic-English mapping and rich local fallback).
- [x] Implement Google Maps Radius Targeting (Proximity Target) in Step 2 of the Campaign Wizard (`app/(dashboard)/campaigns/new/page.tsx`) with a slider and interactive pin-dropping (with high-fidelity visual fallback).
- [x] Connect keyword suggests API (`/api/keywords/suggest`) to Google Ads API `generateKeywordIdeas` using user's business description/activity context.
- [x] Enhance ad copy suggestions API (`/api/ad-copy/suggest`) with a custom goal-tailored fallback template engine.

## Phase 3: Advanced Campaign Edit Modal & DB Persistence
- [x] Add new optional fields (`bidStrategy`, `targetLocations`, `keywords`, `headlines`, `descriptions`, `finalUrl`) to `Campaign` model in `prisma/schema.prisma`.
- [x] Add ALTER TABLE statements to `app/api/debug-db/route.ts` to update local/production tables dynamically.
- [x] Update `/api/campaigns/route.ts` handlers to:
  - Serialize targeting locations, keywords, headlines, and descriptions as JSON strings before writing to DB.
  - Deserialize these JSON strings when fetching campaign records.
  - Expose all these properties inside `GET`, `POST`, and `PUT` request parameters.
- [x] Sync the Campaign Wizard (`new/page.tsx`) so geographic targeted locations and keywords are sent in the POST payload.
- [x] Develop the full Campaign Edit Interface (Modal/Drawer) in `app/(dashboard)/campaigns/page.tsx` split into 4 tabs:
  - **الأساسيات (Basics)**: Name, daily budget, status, bid strategy.
  - **الاستهداف والخرائط (Geotargeting)**: Interactive Leaflet Map for Radius pinning, range slider, name search.
  - **الكلمات المفتاحية (Keywords)**: List existing, add manually, get AI suggestions with volume/competition.
  - **نصوص الإعلان (Ad Copy)**: Final URL, headlines, descriptions, simulated Google Search preview, and AI text generators.
- [x] Verify the entire build compile status and test functionality locally.
