# North Splash OS V2 — Deployment

## 1. Frontend
1. Extract `NorthSplash-OS-V2-Advanced-Deployment.zip`.
2. Upload the extracted project contents to the repository root.
3. Commit to `main` with: `North Splash OS V2 portal and operations upgrade`.
4. Wait for Vercel to report **Ready**.

## 2. Database
Run `NORTH_SPLASH_OS_V2_SETUP.sql` once in Supabase SQL Editor.

This update is additive. It keeps the existing operating tables and adds the V2 intelligence/support tables, deduplicates communication templates, adds manager crew access policies, and seeds the default automation rules.

## 3. Data API
Because this project has **Automatically expose new tables** disabled, expose these new tables in Supabase Data API settings if you want their browser-facing features enabled:

- `lead_contact_attempts`
- `customer_preferences`
- `business_daily_snapshots`
- `system_feature_flags`

Keep Row Level Security enabled. Existing tables already used by the portals must remain exposed, including the crew, communications, automation, D2D, appointments, employees, and profiles tables that are already enabled in production.

## 4. Edge Functions
Update these function sources from the package after the frontend is Ready:

- `send-communication`
- `automation-worker`

The other existing functions can remain unchanged unless their source differs from production.

Required custom secret:
- `RESEND_API_KEY`

Existing Square secrets remain unchanged.

## 5. Automatic scheduled automation
`automation-worker` now queues appointment reminders, post-job review requests, overdue lead follow-ups, and D2D inactivity signals when invoked. The Admin **Run Pending Now** button works immediately.

For hands-off timed execution, configure a secure scheduled invocation after deployment. Do not expose an unauthenticated public cron endpoint.

## 6. PWA refresh behavior
The service worker was updated so navigation, JavaScript, and CSS are network-first. This prevents stale portal versions after deployments while keeping image/font caching and offline shell support.
