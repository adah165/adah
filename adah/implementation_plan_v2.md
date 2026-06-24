# Implementation Plan: Google Ads API, Secure Multi-Tenant Auth & Advanced Campaign Editor

This plan details the implementation of real Google Ads API integrations, secure OTP auth flow, and a comprehensive Campaign Edit Interface (Modal/Drawer with tabs) mapping advanced properties to the database.

## User Review Required

> [!IMPORTANT]
> - **Campaign Schema Updates**: We need to persist campaign details such as bid strategies, targeting locations, keywords, headlines, descriptions, and final URLs. We will add these fields to the `Campaign` model as optional columns.
> - **Database Alteration for Campaigns**: Similar to the auth fields, we will add SQL migration statements for the campaign columns to `/api/debug-db` so they can be applied directly to Supabase.
> - **Prisma Client & Migration Execution**: Due to sandbox permissions, you will need to run the Prisma CLI locally to generate Types and apply schemas (`npx prisma db push` or `npx prisma migrate dev`).

## Open Questions

None.

---

## Proposed Changes

### 1. Database Schema & API Helper

#### [MODIFY] [schema.prisma](file:///d:/ADS/adah/prisma/schema.prisma)
- Add the following columns to the `Campaign` model:
  - `bidStrategy String?`
  - `targetLocations String?` (JSON-serialized string of targeted locations)
  - `keywords String?` (JSON-serialized string of keywords)
  - `headlines String?` (JSON-serialized string of headlines)
  - `descriptions String?` (JSON-serialized string of descriptions)
  - `finalUrl String?`

#### [MODIFY] [route.ts](file:///d:/ADS/adah/app/api/debug-db/route.ts)
- Add PostgreSQL alter tables for the campaign columns:
  ```sql
  ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "bidStrategy" text;
  ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "targetLocations" text;
  ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "keywords" text;
  ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "headlines" text;
  ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "descriptions" text;
  ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "finalUrl" text;
  ```

---

### 2. Campaign API Endpoints

#### [MODIFY] [route.ts](file:///d:/ADS/adah/app/api/campaigns/route.ts)
- **POST**:
  - Accept `bidStrategy`, `locations` (array), `keywords` (array), `headlines` (array), `descriptions` (array), `finalUrl` from payload.
  - Serialize arrays (`locations`, `keywords`, `headlines`, `descriptions`) to JSON strings before saving.
- **GET**:
  - Fetch columns from the database, deserialize the JSON strings back into arrays, and return them in the JSON output.
- **PUT**:
  - Accept the updated campaign fields (`id`, `name`, `budget`, `status`, `bidStrategy`, `locations` [array], `keywords` [array], `headlines` [array], `descriptions` [array], `finalUrl`).
  - Validate and update the campaign record in the database.

---

### 3. Wizard Launch Update

#### [MODIFY] [page.tsx](file:///d:/ADS/adah/app/%28dashboard%29/campaigns/new/page.tsx)
- Ensure that `selectedLocations` and `keywords` are passed in the POST payload when calling `handleLaunch`.

---

### 4. Advanced Campaign Edit Interface

#### [MODIFY] [page.tsx](file:///d:/ADS/adah/app/%28dashboard%29/campaigns/page.tsx)
- Upgrade the edit dialog (`Dialog`) to support a tabbed layout:
  - **Tabs**:
    1. **الأساسيات (Basics)**: Edit Name, daily budget, status, and bid strategy.
    2. **الاستهداف والخرائط (Targeting & Maps)**:
       - Displays an interactive Leaflet/OpenStreetMap container.
       - Supports dropping a pin or dragging it, configuring target radius (km), and searching geographical regions by name.
       - Synchronizes badge lists of targets.
    3. **الكلمات المفتاحية (Keywords)**:
       - List current keywords with remove options.
       - Input to manually add new keywords.
       - Button to fetch AI-recommended keywords using `/api/keywords/suggest` in the background.
    4. **نصوص الإعلان (Ad Copy)**:
       - Input for final URL, headlines (up to 30 chars), descriptions (up to 90 chars).
       - Live Google Search simulated mobile/desktop ad preview.
       - Button to trigger AI copy suggestions using `/api/ad-copy/suggest`.
- Maintain clean RTL formatting, Cairo/Tajawal fonts, glassmorphism aesthetics, and loading states for a premium interface.

---

## Verification Plan

### Automated Tests
Run Next.js build:
```powershell
npm run build
```

### Manual Verification
1. Access `/api/debug-db` to run SQL migration for both user password columns and campaign columns.
2. Go to `/campaigns`, edit an existing campaign.
3. Verify that changing tabs works smoothly and all inputs are populated.
4. Interact with the map under the targeting tab, adjust the radius slider, drop a pin, and save.
5. In the keywords tab, request AI keywords, add new keywords, delete some, and save.
6. In the Ad Copy tab, change headlines, verify validation error if characters exceed 30, and save.
7. Confirm changes are updated dynamically in the main campaign list.
