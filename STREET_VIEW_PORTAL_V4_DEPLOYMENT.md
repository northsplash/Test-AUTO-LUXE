# North Splash Portal V4 — Territory Street View

## Included
- Territory Command live house/street count in multiple visible locations.
- Interactive Street View section below Territory Command.
- Click a mapped property to focus Street View.
- Previous/Next House controls.
- Scrollable territory property list.
- External Google Maps fallback when Street View imagery is unavailable.
- Portal-wide spacing/card/header polish.

## Required Vercel environment variable
Create this environment variable in Vercel for Production, Preview, and Development as needed:

`VITE_GOOGLE_MAPS_API_KEY`

Use a Google Maps Platform browser API key with Maps JavaScript API enabled. Restrict the key by HTTP referrer to your North Splash domains. Google Maps Platform billing must be enabled for the project.

After adding/changing the environment variable, redeploy the Vercel project.

## No new Supabase SQL
This release does not add database tables or require an Edge Function update.
