# North Splash OS — Team Messaging + Portal UI V3

## Included
- Team messaging in Admin, Manager, D2D and Employee/Detailer portals.
- Company, role, crew and custom private groups.
- Manager/Admin group creation and member selection.
- D2D quick updates: Customer Won, Appointment Set, Need Manager, Hot Lead.
- Detailer quick updates: Detail Started, Detail Finished, Running Late, Need Supplies.
- Manager/Admin announcement quick actions.
- Realtime message updates through Supabase Realtime.
- Portal visual-system refinement for spacing, content width, cards, navigation and responsive layout.
- Territory Command white-screen fix: missing preview/previewBusy state declarations restored.

## Deploy
1. Upload the project contents to GitHub and wait for Vercel Ready.
2. Run `NORTH_SPLASH_TEAM_MESSAGING.sql` once in Supabase SQL Editor.
3. In Supabase Data API settings expose:
   - employee_message_channels
   - employee_message_channel_members
   - employee_messages
   - employee_message_reads
4. Keep Automatically expose new tables OFF.
5. Refresh the portal and test Messages from Admin first.

## Suggested test
- Admin: open Team Messages, create a private group, send message.
- Manager: verify company/crew/private groups and send Crew Update.
- D2D: verify Company Updates + D2D Sales + assigned crew; send Customer Won update.
- Detailer: verify Company Updates + Detailing Team + assigned crew; send Detail Finished update.
- Open two logged-in devices and verify realtime arrival.
- Open Admin > Territories and confirm it no longer white-screens.
