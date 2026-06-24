# Fix: TypeScript type error in Google Ads customer resolution

The Netlify build was failing during Next.js type checking due to a TypeScript error in `app/api/auth/[...nextauth]/route.ts`.

The code was calling `api.listAccessibleCustomers(account.refresh_token)` and then treating the result as a plain array (checking `.length` and indexing with `[0]`). However, the `listAccessibleCustomers` method from `google-ads-api` returns a `ListAccessibleCustomersResponse` object — a protobuf-based class with a `resource_names: string[]` property, not a bare array.

The fix updates lines 143–145 to access `customers.resource_names` instead of `customers` directly, making both the runtime behavior and TypeScript types correct:

- `customers.length` → `customers.resource_names.length`
- `customers[0].split("/")[1]` → `customers.resource_names[0].split("/")[1]`

This resolves the `Property 'length' does not exist on type 'ListAccessibleCustomersResponse'` TypeScript error that was blocking the build.
