# Walkthrough - Interactive User Profile Dropdown

I have successfully updated the User Profile Card in the Navigation Header into an interactive, animated dropdown menu with complete edit profile capabilities, workspace links, and log out functionality.

## Changes Made

### 1. Database Schema Update
* **File:** [schema.prisma](file:///d:/ADS/adah/prisma/schema.prisma)
* Added a new `jobTitle` nullable String field to the `User` model to persist the user's specific role/occupation in the Supabase database.

### 2. NextAuth Configuration
* **File:** [route.ts](file:///d:/ADS/adah/app/api/auth/%5B...nextauth%5D/route.ts)
* Updated database lookup logic to fetch and return the `jobTitle`.
* Added `jobTitle` to JWT token and session callback.
* Configured NextAuth to listen for session update requests (using `trigger === "update"`) to allow modifying the active session dynamically in the client without requiring a logout/login sequence.

### 3. User Update API Endpoint
* **File:** [route.ts](file:///d:/ADS/adah/app/api/user/route.ts)
* Created a `PUT /api/user` endpoint that takes the request body (`name`, `jobTitle`, `image`, `password`), performs authorization, hashes the password (if changed), and updates the user's profile information in the live database via Prisma.

### 4. Interactive Dropdown and Modal Dialog
* **File:** [Header.tsx](file:///d:/ADS/adah/components/layout/Header.tsx)
* Turned the static User Card button into a toggle button that displays the user's current avatar, name, and job title.
* Implemented a premium glassmorphic dropdown list with options to:
  * **تعديل الملف الشخصي (Edit Profile):** Opens an overlay modal.
  * **إعدادات مساحة العمل (Workspace Settings):** Links to `/settings`.
  * **تسجيل الخروج (Log Out):** Standard next-auth `signOut`.
* Implemented the edit profile modal with inputs for name, job title, new password, and profile photo file upload (converted instantly to Base64 in-browser).
* Handled loading state spinners, success indicators, and error banners in the form submission.

---

## How to Verify the Changes

To verify the modifications:

1. **Push the Schema Changes:**
   Execute this command in your local terminal to update the Supabase database structure (adding the `jobTitle` column):
   ```bash
   npx prisma db push
   ```

2. **Run the App:**
   ```bash
   npm run dev
   ```

3. **Login & Try:**
   * Go to the login screen and log in with credentials:
     * **Email:** `demo@adah.sa`
     * **Password:** `password123`
   * Click on the user profile card at the top-right of the header. It will toggle open the dropdown displaying current user info.
   * Click on **تعديل الملف الشخصي** (Edit Profile) to open the modal.
   * Modify the name, job title, select a local image from your machine, and click **حفظ التعديلات** (Save Changes).
   * Notice that the user card and dropdown update in real-time with your new details!
