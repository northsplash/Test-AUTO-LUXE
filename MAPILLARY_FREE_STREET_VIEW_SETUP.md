# North Splash — Free Street View Setup (Mapillary)

North Splash Territory Command now uses Mapillary instead of Google Street View.

## Why
- No Google Maps billing account is required.
- The existing Leaflet/OpenStreetMap territory map stays unchanged.
- The embedded viewer supports interactive street-level imagery and navigation where Mapillary coverage exists.

## Setup
1. Create/sign in to a Mapillary account.
2. Register an application in Mapillary's developer dashboard.
3. Copy the application's client access token.
4. In Vercel open Project → Settings → Environment Variables.
5. Add: `VITE_MAPILLARY_ACCESS_TOKEN`
6. Paste the Mapillary client access token as the value.
7. Apply it to Production (and Preview if desired).
8. Redeploy the project.

## Important
Mapillary imagery is crowdsourced, so some streets may have no imagery or older imagery. The portal handles missing coverage and offers a Mapillary fallback link.

No Supabase SQL or Edge Function changes are required for this switch.
