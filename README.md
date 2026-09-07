# North Splash Auto Luxe — public detailing website

This repository is the **customer-facing detailing site**: services, packages, ceramic protection, membership, booking, and job applications. Mobile detailing is all over North Carolina, not a single city or ZIP. Public phone stays 330-990-3956.

Portal login on this site sends people to the **operating system**, which is a separate product.

Service prices and packages on this site follow the same catalog as the OS: nine detail selves (Exterior / Interior / Full × Essential / Signature / Elite), paint correction, ceramic coating tiers, add-ons, and memberships.

The footer **Apply for a job** button opens `/apply`: a four-step application (role, contact, fit, review) for Mobile Detailer, Door-to-door Sales, and Operations / Concierge. Submissions land on the OS hiring board (`People → Hiring`) as stage `applied`, source `Website`.

## Two sites

| Site | Repo | Live URL | What it is |
|---|---|---|---|
| Detailing website | `northsplash/Test-AUTO-LUXE` | https://test-auto-luxe.vercel.app/ | Public marketing and booking |
| Portals / OS | `northsplash/NS-Auto-Luxe-OS` | https://ns-auto-luxe-os.vercel.app/ | Owner, D2D, Detail, Manager, customer portal |

Do not replace this website with the OS. Booking and “Portal” / “Sign In” links should keep pointing at the OS.

## Run locally

```bash
npm install
cp env.example .env
npm run dev
```

The site serves at `http://127.0.0.1:43128`. Open `/apply` from the footer **Apply for a job** bar to walk the four-step hiring form.
