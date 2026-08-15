# North Splash OS V2 — Data API Checklist

Keep **Automatically expose new tables** OFF.

## New V2 tables to expose
- lead_contact_attempts
- customer_preferences
- business_daily_snapshots
- system_feature_flags

## Existing tables the active browser portals depend on
Make sure these remain exposed if their portal is enabled:
- profiles
- appointments
- employees
- leads
- lead_activities
- lead_territories
- territory_doors
- territory_door_history
- territory_routes
- territory_route_stops
- rep_locations
- rep_work_sessions
- d2d_daily_goals
- sales_records
- customer_estimates
- customer_vehicles
- crm_notes
- communication_templates
- communication_logs
- automation_rules
- automation_events
- crew_groups
- crew_membership_history
- crew_coaching_notes
- crew_daily_closeouts
- crew_alerts
- time_entries
- time_entry_breaks
- time_off_requests
- recruiting_candidates
- recruiting_events
- training_courses
- training_lessons
- training_questions
- training_question_options
- training_assignments
- training_attempts
- training_signoffs
- business_notifications
- business_tasks

Only expose tables that your deployed browser UI actually needs. Keep RLS enabled and do not switch on automatic exposure globally.
