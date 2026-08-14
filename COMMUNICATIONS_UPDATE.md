# Communications Center Update

- Admin sidebar: Communications moved to System & Security so it is visible beside Automations.
- Existing Communications Center preserved: template editing, enable/disable, sender display, test recipient, Send Test, and delivery log.
- send-communication security tightened: arbitrary direct-address test sends require Admin, Owner, or communications.manage permission.
- Customer operational mail remains from noreply@northsplash.com.
- Recruiting/onboarding/HR mail remains from Admin@northsplash.com.

After frontend deployment, redeploy `supabase/functions/send-communication/index.ts` because its authorization logic changed.
