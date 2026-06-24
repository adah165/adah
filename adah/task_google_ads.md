# Google Ads Integration Tasks

- [x] Modify `app/api/auth/[...nextauth]/route.ts` to request offline access and implement the `signIn` callback to save access/refresh tokens to the `GoogleAdsAccount` table.
- [x] Create `app/api/settings/google-ads/route.ts` for connection status check and disconnection.
- [x] Modify `app/(dashboard)/settings/page.tsx` to dynamically query connection status, trigger real Google sign-in, and handle disconnection.
- [x] Create `lib/google-ads.ts` for GAQL querying live campaign stats with a robust fallback.
- [x] Modify `app/api/campaigns/route.ts` to fetch campaigns from Google Ads API for connected accounts.
- [x] Verify using compilation/build check (User manual verification due to runner environment restrictions).
- [x] Implement `createLiveCampaign` in `lib/google-ads.ts` with mock fallback.
- [x] Update POST handler in `app/api/campaigns/route.ts` to call `createLiveCampaign` and store real `googleCampaignId` in DB.
- [x] Verify the implementation.
