# Data API additions
Expose only the new tables required by the frontend:

- lead_archive_history
- lead_assignment_history
- lead_property_media

Existing tables that must remain exposed for these screens:
- leads
- lead_activities
- lead_contact_attempts
- lead_territories
- territory_doors
- territory_door_history
- employees

Do not enable automatic exposure for every future table.
