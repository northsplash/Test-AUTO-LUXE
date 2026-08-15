# Crew Command Hotfix

This hotfix corrects the actual source files used by Vite.

Updated files:
- src/pages/Admin/index.tsx
- src/pages/Admin/Phase300Suite.tsx
- src/index.css

The previous package accidentally included the Crew Command versions as loose files at the project root (`Admin-index-with-Crew-Command.tsx` and `Phase300Suite.tsx`) while the real files under `src/pages/Admin/` remained older. Vite builds from `src`, so the menu never appeared.

Expected Admin navigation after deploy:
People & Workforce > Recruiting > Team > Crew Command > Employee Schedule > Time Clock > Time-Off Requests > Timesheet Approval > Training

Crew Command uses these existing tables:
- crew_groups
- crew_membership_history
- crew_coaching_notes
- crew_daily_closeouts
- crew_alerts
