# North Splash OS V2 — Implemented Scope

This release is the platform/UI foundation for the large roadmap rather than a claim that hundreds of independent future workflows are production-complete.

## Portal UI V2
- Unified North Splash design tokens, spacing, cards, buttons, forms, page headers, KPIs, panels, filters, drawers, responsive breakpoints and mobile navigation behavior.
- Accordion-style portal navigation to reduce sidebar overload.
- Responsive desktop, iPad/tablet, and phone layouts.

## D2D V2
- Territory-first workspace, status filtering, route/next-house controls, mobile gesture lock, address/door workflow, lead scoring, smart pipeline, Kanban/List views, quick call/text/navigation, performance goals/funnel/recent sales, contact-attempt/activity logging.
- Territory map no longer auto-fits after every drawing click.

## Crew Command V2
- Crew/manager/member organization, date ranges, D2D and detailer performance cards, status/activity, alerts, closeouts, coaching notes, goals, member drill-down and manager My Crew view.

## Owner Command Center V2
- 30-day collected revenue, booked revenue, average ticket, jobs, customers, 7-day revenue view, today run, attention queue and lifetime snapshot.

## Communications & Automations
- Production-safe `send-communication` source using current/legacy Supabase server keys.
- Customer senders remain `noreply@northsplash.com`; employee/recruiting senders remain `Admin@northsplash.com`.
- `automation-worker` queues appointment reminders, review requests, overdue lead follow-ups and D2D inactivity events when invoked.
- Default automation rules are seeded in the V2 SQL.

## Database V2
- Communication-template dedupe guard.
- Lead contact attempts.
- Customer communication/preferences foundation.
- Daily business snapshot foundation.
- Feature flags.
- Expanded Crew Command policy/access foundation.

## Remaining deeper phases
Native App Store packaging, MDM, true background cron scheduling, SMS, advanced geospatial route optimization, accounting/payroll tax filing integrations, full offline conflict resolution, deep multi-location/fleet workflows, and comprehensive disaster-recovery automation remain separate production phases.
