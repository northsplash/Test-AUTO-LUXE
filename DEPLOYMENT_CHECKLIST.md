[DEPLOYMENT_CHECKLIST.md](https://github.com/user-attachments/files/31063007/DEPLOYMENT_CHECKLIST.md)
# Deployment Checklist

1. Back up the current working GitHub branch / Vercel deployment.
2. Run `ENTERPRISE_SUITE_SETUP.sql` in the existing Supabase project **before staff use the new portals**.
3. Commit/deploy this project to Vercel.
4. Sign in as the existing owner/admin and open Admin → Portal Permissions.
5. Staff members create a normal website account using the same email used in Admin → Team.
6. Owner selects the account in Portal Permissions, chooses the portal, reviews toggles, and clicks Save Access. If the email matches the Team record it is linked automatically; there is also a manual Linked Employee Record selector.
7. Test one Manager, one Detailer/Employee and one D2D account before giving access to the team.
8. In D2D, grant browser location permission only while working. The map uses OpenStreetMap/Leaflet loaded from public CDN.
9. Review RLS policies in Supabase after the migration. The migration prevents self-escalation of portal roles/permissions and self-approval of timecards.
10. Keep a real payroll/tax provider for withholding, filings, W-2s and direct deposit; the portal tracks operational payroll data and approvals.
