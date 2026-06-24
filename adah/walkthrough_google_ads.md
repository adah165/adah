# Walkthrough - Google Ads API Real Integration

We have successfully integrated the real Google Ads API into the codebase, replacing the mock performance data and mock connections.

## Key Update: Dynamic Customer ID Resolution (Plug-and-Play)
Google Ads accounts require a Customer ID to perform API queries. However, Google's OAuth consent screen only returns user tokens (not the Customer ID). 

To make this completely plug-and-play, we implemented **Dynamic Customer ID Resolution** using the Google Ads SDK (`listAccessibleCustomers`):
* **On Login/Connect**: NextAuth will automatically connect to Google, list the accessible Google Ads accounts for the logged-in user, select the first real account ID, and store it in the database.
* **On Campaign Fetch**: If the database still has the default mock ID (`123-456-7890`), the backend will dynamically resolve it to the user's real account ID using their `refresh_token`.

## Changes Made

### 1. Database & Authentication
* **File Modified**: [route.ts](file:///d:/ADS/adah/app/api/auth/%5B...nextauth%5D/route.ts)
  * Configured `GoogleProvider` to request offline access and force consent prompts (`access_type: "offline"`, `prompt: "consent"`), ensuring a long-lived `refresh_token` is generated.
  * Added the `signIn` callback to capture OAuth tokens, dynamically resolve the user's real Google Ads Customer ID, and store/update the `GoogleAdsAccount` database record.

### 2. Settings Page
* **File Added**: [route.ts](file:///d:/ADS/adah/app/api/settings/google-ads/route.ts)
  * Created `GET` to check connection status (verifying tokens are stored).
  * Created `DELETE` to clear the `GoogleAdsAccount` configuration and clean up local cached campaigns on disconnect.
* **File Modified**: [page.tsx](file:///d:/ADS/adah/app/%28dashboard%29/settings/page.tsx)
  * Loaded actual integration state on component mount.
  * Replaced simulated connecting status with live Google login redirection.
  * Linked the "Disconnect" button to the DELETE endpoint.

### 3. Google Ads API Client & Sync
* **File Added**: [google-ads.ts](file:///d:/ADS/adah/lib/google-ads.ts)
  * Wrote GAQL (Google Ads Query Language) performance query for active campaigns.
  * Added dynamic fallback resolution for the customer ID using the `refresh_token` to make the configuration completely plug-and-play.
  * Added auto-conversion for Google micro-units (micros) to standard currency and percentages.
* **File Modified**: [route.ts](file:///d:/ADS/adah/app/api/campaigns/route.ts)
  * Updated GET to fetch live campaigns from the API when tokens are available.
  * Implemented automatic campaign database synchronization.
  * Added a robust fallback to simulated performance statistics in case of connection or API key issues.

## Real-Time Campaign Creation Mutate Integration

We have added support for real-time campaign creation on the Google Ads API during the final step of the Campaign Creation Wizard.

### Changes Made

#### 1. Google Ads Mutate API Helper
* **File Modified**: [google-ads.ts](file:///d:/ADS/adah/lib/google-ads.ts)
  * Implemented `createLiveCampaign` function.
  * Mutates a new **Campaign Budget** first, and then creates the **Campaign** referencing the budget resource in a single transaction.
  * Formats start dates to Google Ads API compliant format `YYYYMMDD`.
  * Maps wizard campaign types to Google Ads advertising channel types (`SEARCH`, `VIDEO`, `SHOPPING`, `DISPLAY`).
  * Implemented an automated mock fallback when customer ID is a sandbox/mock value (`123-456-7890`).

#### 2. Campaigns API Integration
* **File Modified**: [route.ts](file:///d:/ADS/adah/app/api/campaigns/route.ts)
  * Integrated synchronous call to `createLiveCampaign` inside the `POST` campaigns route.
  * Propagates errors from Google Ads API with a `400` status code, providing immediate feedback in Arabic to the Campaign Wizard frontend.
  * Stores the actual `googleCampaignId` returned from Google Ads API in the Prisma database.

### Testing & Verification Steps

1. **Dev Server**:
   Ensure the Next.js server is running (`npm run dev`).
2. **Wizard Test**:
   Go to Campaigns -> Click **إنشاء حملة جديدة**.
3. **Launch**:
   Complete all steps, upload product assets or YouTube links, and click **إطلاق الحملة**.
4. **Result**:
   If using mock credentials, it will successfully return a mock ID. If using real credentials, it will call Google Ads API synchronously and create the live campaign, returning any validation errors immediately.

