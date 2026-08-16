# North Splash OS – Lead Intelligence V3

## What changed
- Territory Command now shows boundary-point count plus mapped houses and streets inside the drawn boundary.
- `Preview Houses / Streets` queries OpenStreetMap/Overpass without saving records, so a manager can see approximate territory workload before committing.
- Admin Leads Tracker now has an Archive view, 6-month archive action, reactivation controls, permanent DNK protection, cooldown dates, and Street View links.
- D2D duplicate checks now block archived/cooldown leads and permanent DNK records from being reused.
- Lost / Not Interested / Cancelled field outcomes automatically enter a 6-month cooldown. DNK is permanent until an administrator overrides it.
- D2D house drawer includes Street View next to Navigate.
- Automation worker now asks the database to mark expired cooldowns as eligible for manager review.
- Database adds archive history, assignment history, property-media foundation, contact summary fields, reactivation queue, and indexes.

## Deploy
1. Upload the project contents to GitHub and wait for Vercel Ready.
2. Run `NORTH_SPLASH_LEAD_INTELLIGENCE_V3.sql` once in Supabase SQL Editor.
3. In Supabase Data API settings expose these new tables if your project uses explicit table exposure:
   - `lead_archive_history`
   - `lead_assignment_history`
   - `lead_property_media`
4. Keep Automatically expose new tables OFF.
5. Redeploy `supabase/functions/automation-worker/index.ts` only if you want automatic cooldown eligibility updates during Run Pending Now.
6. Do not replace your current long `send-communication` function; this update does not require changing it.

## Tests
- Admin > Territories: draw 3+ points, click Preview Houses / Streets, verify counts and no unwanted zoom reset.
- Admin > Leads Tracker > Archive: archive a test lead and confirm cooldown date is about 6 months out.
- Admin > Leads Tracker: reactivate the test lead.
- D2D: mark a test lead Lost and verify it becomes unavailable for reuse.
- D2D: attempt duplicate entry for the archived address/phone; it should block the save.
- D2D: mark a test house DNK; selecting it again should show a permanent restriction warning.
- D2D house drawer: Street View opens for mapped coordinates.
