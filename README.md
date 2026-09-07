# North Splash Auto Luxe — public detailing website

This repository is the **customer-facing detailing site**: services, packages, ceramic protection, membership, and booking.

Portal login on this site sends people to the **operating system**, which is a separate product.

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
