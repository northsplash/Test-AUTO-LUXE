# North Splash Field Operations Expansion

## New in this build
- Collapsible grouped Owner/Admin navigation.
- D2D territory polygons drawn by clicking around a neighborhood.
- Optional OpenStreetMap/Overpass house import for a saved territory.
- Stored `territory_doors` records so reps tap houses instead of manually creating every lead.
- D2D door result sheet with customer, vehicle, value, status, follow-up and notes.
- Manual/out-of-territory lead capture remains available.
- Detailer Job Map with completed/cancelled/no-show/rescheduled/follow-up field statuses.
- Employee login invite/link Edge Function.
- Database foundation for QC/checklists, job media, incident reports, estimates, purchase requests, training and cash reconciliation.

## Required setup
1. Run `FIELD_OPERATIONS_SETUP.sql` once in Supabase SQL Editor.
2. Deploy Edge Function `supabase/functions/invite-employee/index.ts` as `invite-employee`.
3. No new secret is required beyond Supabase's server-side service-role secret already available to Edge Functions.
4. Deploy the site.
5. Admin > Territories: draw and save a territory, then click **Load Houses from Map**.
6. Admin > Portal Permissions: use **Employee Account Setup** to send/link employee logins.

## Map data note
House markers imported from OpenStreetMap depend on local OpenStreetMap building/address coverage. Missing houses can still be added manually by reps. The database keeps saved doors after import, so normal D2D use does not need to re-query OpenStreetMap each time.
