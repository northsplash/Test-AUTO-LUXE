# Crew Command Update

## Included
- Crew Command Center in Admin > People & Workforce.
- D2D and Detailer crew creation with assigned manager.
- Employee assignment/removal and membership-history records.
- Clickable employee performance drill-down.
- D2D: doors today, last knock, average time between knocks, contacts, appointments and sales.
- Detailers: jobs today, last detail start/finish, completed jobs, average detail duration, revenue and QC count.
- Territory Command drawing no longer auto-fits/zooms out after each boundary point.
- Existing territory drag, numbered vertices, right-click remove, undo and clear remain intact.
- Database foundation for coaching notes, crew alerts, daily closeouts and crew goals.

## Deploy
1. Upload the project contents to GitHub and wait for Vercel Ready.
2. Run `20260814203000_crew_command_center.sql` in Supabase SQL Editor once.
3. In Supabase Data API settings, expose these tables if your project uses explicit table exposure:
   - crew_groups
   - crew_membership_history
   - crew_coaching_notes
   - crew_daily_closeouts
   - crew_alerts
4. Refresh Admin and open People & Workforce > Crew Command.

No Edge Function changes are required for this update.
