# North Splash OS Expansion

This build extends the existing working project rather than replacing its booking/payment foundation.

## Added owner/admin areas
- Owner Command Center
- Customer CRM
- Dispatch Board
- Fleet & Commercial Accounts
- Multi-location foundation
- Marketing attribution
- Automation Rules registry
- Unified Approvals Center
- Incident / damage reports
- Training Center
- Purchasing requests
- Communication templates
- Retention / referral campaigns
- Business continuity / export registry

## Portal appearance
A new responsive visual layer in `src/index.css` gives the portals a warmer North Splash presentation using `#9d7651`, cream surfaces, stronger typography, improved cards, grouped navigation, and phone/tablet breakpoints.

## Setup
1. Keep the existing Enterprise Suite and Field Operations SQL already used by this project.
2. Run `NORTH_SPLASH_OS_SETUP.sql` once in Supabase SQL Editor.
3. Deploy `supabase/functions/invite-employee` if it has not already been deployed.
4. Upload/commit the project to GitHub and wait for Vercel Ready.
5. Test Owner/Admin first, then Manager, Employee and D2D accounts.

## Important
The new SQL uses broad authenticated CRUD policies to stay compatible with the current portal architecture. Before giving many non-owner accounts access, the next security-hardening pass should replace these with role/permission-aware RLS policies.

Actual payroll tax filing, withholding, W-2 filing and direct deposit should remain with a regulated payroll provider. North Splash OS can track operational payroll inputs and exports.
