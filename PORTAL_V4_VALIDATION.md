# North Splash Portal V4 Validation

Validated changes:
- Territory Command references the new TerritoryStreetView component.
- Territory preview retains discovered property coordinates for Street View navigation.
- Live house and street counters update from either discovered preview properties or persisted mapped territory doors.
- Territory map house clicks feed the Street View inspector.
- Interactive Street View gracefully falls back to opening Google Maps when a Google key is missing or imagery cannot be found.
- No new Supabase schema or Edge Function is required.

Local limitation:
The uploaded archive does not include node_modules. A parser/type pass was run with the available TypeScript compiler; dependency-resolution errors are expected locally because React/Vite packages are not installed. No syntax/parser errors were reported in the modified files before dependency-resolution failures.

Production validation:
Use Vercel's build as the definitive production compile check. After deployment, add VITE_GOOGLE_MAPS_API_KEY and redeploy before testing interactive Street View.
