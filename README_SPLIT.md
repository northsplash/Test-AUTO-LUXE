# North Splash Website

Public marketing + booking application intended for `northsplash.com`.

## Shared data
This app uses the same Supabase project as North Splash OS. Public booking is sent through the `public-booking` Edge Function, which writes directly into the existing `appointments` table with customer name/email/phone. Those bookings are immediately visible in North Splash OS.

## Environment
Copy `.env.example` to your deployment environment. Deploy `supabase/functions/public-booking/index.ts` once to the shared Supabase project.
