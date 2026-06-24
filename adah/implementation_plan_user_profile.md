# Interactive User Profile Dropdown

Upgrade the static user profile card in the top navigation header to a premium interactive dropdown. This dropdown will display the current user's database name, email, and job title. It will allow editing their profile (name, job title, password, and uploading a profile picture), viewing workspace settings, and logging out.

## User Review Required

> [!IMPORTANT]
> **Database Schema Update Needed:**
> This change introduces a new `jobTitle` field in the `User` model inside [schema.prisma](file:///d:/ADS/adah/prisma/schema.prisma). To apply this to your Supabase PostgreSQL database, you will need to run the following command in your terminal after the files are updated:
> ```bash
> npx prisma db push
> ```

> [!NOTE]
> **Session Updates without Log Out:**
> We are implementing dynamic NextAuth session updates. When the user updates their profile name, job title, or avatar, we will trigger `update()` on the frontend client. This will update the local NextAuth token/session in real-time without requiring the user to log out and log back in.

## Open Questions

* No open questions remain. We will proceed with using a local image file-to-base64 upload for the profile image so the user can easily update it without setting up S3 bucket configurations.

## Proposed Changes

### Database Layer
---
#### [MODIFY] [schema.prisma](file:///d:/ADS/adah/prisma/schema.prisma)
* Add `jobTitle String?` field to the `User` model.

### Auth Layer
---
#### [MODIFY] [route.ts](file:///d:/ADS/adah/app/api/auth/%5B...nextauth%5D/route.ts)
* Fetch `jobTitle` from the database in the `authorize` callback.
* Include `jobTitle` in the `jwt` and `session` callbacks.
* Support dynamic JWT updates when the `update` trigger is called.

### API Layer
---
#### [NEW] [route.ts](file:///d:/ADS/adah/app/api/user/route.ts)
* Create `PUT` endpoint to update the current user's profile info (name, jobTitle, image, password) in the database.
* Ensure password updating hashes the password using SHA-256 to remain compatible with NextAuth credentials authentication.

### UI / Component Layer
---
#### [MODIFY] [Header.tsx](file:///d:/ADS/adah/components/layout/Header.tsx)
* Replace the static profile card with an interactive, animated dropdown menu.
* Render user details: Name, Email, and Job Title.
* Add buttons:
  * **تعديل الملف الشخصي (Edit Profile):** Opens a beautiful modal dialog to update user details.
  * **إعدادات مساحة العمل (Workspace Settings):** Navigates to `/settings`.
  * **تسجيل الخروج (Logout):** Triggers `signOut`.
* Implement a profile edit modal with inputs for:
  * Name (`name`)
  * Job Title (`jobTitle`)
  * Profile Photo (`image` via URL or file upload converted to Base64)
  * Password (`password`)
* Wire the modal form to send a `PUT` request to `/api/user` and call `update()` on `useSession`.

## Verification Plan

### Automated Tests
* We can run TypeScript checking to verify no build errors:
  ```bash
  npm run build
  ```

### Manual Verification
1. Run database push command: `npx prisma db push`.
2. Launch Next.js dev server.
3. Log in using `demo@adah.sa` / `password123`.
4. Click on the profile card to open the interactive dropdown menu.
5. Click **تعديل الملف الشخصي** to open the modal.
6. Modify name, job title, upload a profile picture, or set a new password, and click save.
7. Confirm that the UI updates dynamically and the dropdown displays the new information.
8. Verify that clicking **تسجيل الخروج** logs the user out successfully.
