# North Splash OS Deployment Checklist

1. Upload the extracted project contents to GitHub (not the ZIP itself).
2. Confirm the Vercel deployment reaches **Ready**.
3. In Supabase SQL Editor, run setup SQL in this order if not already applied:
   - ENTERPRISE_SUITE_SETUP.sql
   - FIELD_OPERATIONS_SETUP.sql
   - NORTH_SPLASH_OS_SETUP.sql
4. Deploy/update the Supabase Edge Functions in `supabase/functions/`.
5. Confirm required Supabase secrets are configured for Square and email delivery.
6. Verify `northsplash.com` sender-domain authentication before sending production email.
7. Test Admin/Owner access first.
8. Test D2D territory assignment, houses, statuses, and lead conversion.
9. Test Dispatch and Detailer job flow.
10. Test employee invites/portal routing and Training Center.
11. Test customer emails from `noreply@northsplash.com` and HR/recruiting emails from `Admin@northsplash.com`.
12. Test desktop, iPad/tablet, and phone layouts.
13. Keep a database backup/export before production schema changes.

## Build validation note
The source package was cleaned and inspected, but `node_modules` is intentionally not included in the deployment ZIP. Run `npm ci && npm run typecheck && npm run build` locally when dependencies are available; Vercel's build is the production gate.
