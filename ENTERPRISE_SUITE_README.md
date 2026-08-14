[ENTERPRISE_SUITE_README.md](https://github.com/user-attachments/files/31063020/ENTERPRISE_SUITE_README.md)
# North Splash Enterprise Operations Platform

This build extends the existing owner/admin system without removing the existing customer portal, bookings, Square checkout, availability, recruiting, scheduling, payroll tracking, inventory, archived appointments, or other working features.

## New portals
- `/admin` — Owner/Admin master system
- `/manager` — Manager / recruiter / finance operations portal, controlled by permissions
- `/employee` — Detailer/employee portal for assigned jobs, schedule, time clock, pay estimate, tasks and time-off
- `/d2d` — D2D field-sales portal with territory map, GPS lead capture, follow-ups, sales/commission and time clock
- `/portal` — Existing customer portal

## New owner features
- Portal Permissions with granular permissions and automatic employee-account linking by matching email
- Job Assignment (detailer, manager and originating D2D rep)
- TeleMapper-style D2D lead tracker with OpenStreetMap map, GPS coordinates, territories, lead status pipeline and activity tracking
- Tasks & Operations
- Equipment & Assets
- Document Vault index
- Notification Center
- Time-Off approval
- Timesheet & Payroll Approval
- Reports & Analytics
- Audit Log

## Setup
1. Deploy the code.
2. In Supabase SQL Editor, run **all of `ENTERPRISE_SUITE_SETUP.sql` once**.
3. Existing owner account remains Owner/Admin automatically.
4. Staff members should create a normal account using the same email listed in their Team employee record.
5. Go to Admin → Portal Permissions, select that account, choose Manager / Employee / D2D / Recruiter / Finance, review permissions, and Save Access.
6. When the profile email matches an employee email, the Admin UI links that login to the employee record automatically.

## Security
Portal routing is not the only protection. The migration adds Supabase RLS permission checks and a database trigger that prevents a normal user from editing their own `portal_role`, `role`, or `permissions` to elevate access.

## Maps
The D2D map loads Leaflet + OpenStreetMap from their public CDN at runtime, so this build does not require a Google Maps API key. GPS capture requires the employee to grant browser location permission and should be used only while actively working.

## Payroll note
The system tracks hours, commissions, estimated gross pay, timecard approval and payroll periods. It is not intended to replace legal tax withholding, payroll tax deposits, W-2 filing, or direct deposit processing.
