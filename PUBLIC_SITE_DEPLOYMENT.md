# North Splash Website
Deploy this project to `northsplash.com` / `www.northsplash.com`.

Required Vercel environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OS_URL=https://app.northsplash.com`

The public site intentionally does not contain the business portals.
Sign in / customer portal / create account links open the separate North Splash OS.
Bookings continue to write to the same Supabase project via `public-booking`.
