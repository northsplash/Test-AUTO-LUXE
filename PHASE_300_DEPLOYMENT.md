# North Splash OS — Phase 300 deployment

This build preserves the existing customer/admin/payment/membership features and expands the field-sales, dispatch, job, training, communications, automation, security and mobile foundations.

## Deploy order

1. Upload the extracted project contents to the existing GitHub repository and wait for Vercel **Ready**.
2. Run `NORTH_SPLASH_PHASE_300_SETUP.sql` in Supabase SQL Editor once. It is written to be idempotent and can be rerun after fixing a failed statement.
3. In Supabase Edge Functions, deploy/update:
   - `invite-employee`
   - `send-communication`
   - `geocode`
   - `automation-worker`
4. Confirm the Edge Function secret `RESEND_API_KEY` exists.
5. Keep the existing Square secrets unchanged.
6. Test in this order: Owner/Admin → Permissions → Territory Command → D2D → Dispatch → Employee Job Mode → Manager QC → Training → Communications.

## Email identities

- Customer operational messages: `North Splash Auto Luxe <noreply@northsplash.com>`
- Recruiting/onboarding/training messages: `North Splash Admin <Admin@northsplash.com>`
- Employee/HR messages use `Admin@northsplash.com` as Reply-To.

Both addresses rely on the already-verified `northsplash.com` Resend domain. Do not place the Resend API key in frontend/Vercel browser variables.

## Main new operational systems

### D2D / territories
- Editable/resizable polygon territories
- Real house/building import from OpenStreetMap Overpass
- Exact house/door records kept in Supabase
- House click/tap and address reverse-geocoding
- Permanent Do-Not-Knock flag/history
- Full status history
- Optimized on-device field route
- Pause/resume route sessions
- Offline lead/door queue groundwork
- Daily goals and performance metrics
- Sales/commission attribution

### Dispatch / detailing
- Drag/drop dispatch board
- Schedule conflict calculation using duration + travel buffer
- Detailer job map
- En Route / Arrived / Started / Finished / QC / Completed workflow
- Package checklist templates
- Vehicle condition report
- Before/after/damage photo storage
- Customer signature
- Manager QC/rework

### Workforce / training
- Employee invitation/linking function
- Correct portal assignment by role
- Training courses, lessons, PDFs/videos/procedures
- Multiple-choice quizzes and passing scores
- Employee assignments and progress
- Manager hands-on signoff
- Break/time-clock foundation and payroll approval records

### Communications / automations
- Customer emails from `noreply@northsplash.com`
- HR/recruiting emails from `Admin@northsplash.com`
- Editable templates and delivery logs
- Automation event queue
- Appointment reminder discovery
- D2D follow-up due events
- Post-completion review event

### Mobile / PWA
- Installable web manifest
- iPhone/iPad standalone metadata
- Service worker shell/static-asset caching
- Mobile/iPad responsive territory, lead, manager, detailer and job views

## Important testing

Test with test records before real customer/employee use. In particular verify RLS/permissions for Customer, D2D, Detailer and Manager accounts. Confirm a non-owner cannot edit pay settings, portal permissions, or other employees' records.

The browser/PWA is now native-app ready, but App Store packaging is a separate final phase requiring Apple Developer membership, Capacitor/Xcode, signing, TestFlight and Apple review.
