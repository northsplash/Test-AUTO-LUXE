# D2D Mobile + Leads Update

## What changed
- Added mobile map scroll-lock so the Leaflet map no longer traps page scrolling on phones/tablets.
- On touch devices the map starts in scroll-safe mode. Tap **Tap to use map** to interact, then **Done · Scroll Page** to return to normal page scrolling.
- Added ResizeObserver/orientation invalidation to reduce blank/frozen/stuck Leaflet states after layout/orientation changes.
- Added Smart Field Queue that ranks the highest-value/most urgent/closest doors.
- Added Rapid Knock mode for fast canvassing.
- Added one-tap outcomes for No Answer, Revisit, Not Interested, and Do Not Knock.
- Added Call, Text, and Navigate actions inside the house drawer.
- Expanded quick lead statuses and kept manual outside-territory leads.
- Updated automation-worker server key support for current Supabase secret-key format.

## No SQL migration is required for this update
Existing Phase 300 tables are reused.

## Deployment
Upload the extracted project contents to GitHub and wait for Vercel Ready.
Then redeploy `automation-worker` from `supabase/functions/automation-worker/index.ts` so it uses the same current Supabase secret-key handling as send-communication.
