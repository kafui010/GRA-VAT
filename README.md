# GRA-VAT (Mabbin GRA demo)

A front-end **simulator** of an E-VAT invoicing platform with a separate admin portal for tax-authority staff. Businesses issue invoices that get a timestamp and a QR code. Admin staff can see every company, invoice, cancellation and refund, and total what each company owes in VAT.

> **This is a demo.** It is not affiliated with, endorsed by or verified by the Ghana Revenue Authority (GRA). Logins are fake and checked in the browser. There is no backend and nothing is secure. The 10% tax rate is illustrative, not Ghana law. QR codes open this app's own demo verify page. State resets on every page refresh. Do not enter real credentials or real data.

## Run it

Needs Node 18 or newer.

    npm install
    npm run dev          # dev server, http://localhost:5173
    npm run build        # type-check and production build into dist/
    npm run preview      # serve the built app, http://localhost:4173

For static hosting, rewrite every path to `index.html`, otherwise deep links such as `/gra-admin-7q4k` or `/verify/INV-AK-0001` return 404 on a hard load.

## Routes

- `/` home, roles overview, invoice verify box
- `/gra-admin-7q4k` GRA admin portal: overview, companies, invoices, cancelled and refunds, reports, audit log
- `/app` business portal: dashboard, invoices, new invoice, refunds, reports, team, audit log (depends on role)
- `/verify/:invoiceId` customer verification page ("Not verified by GRA")

## Demo logins

- GRA admin: `gra.admin@mabbin.demo` / `GRA-Admin@2026`
- Business roles, password `Demo@2026`: `owner@akwaaba.demo`, `manager@akwaaba.demo`, `cashier@akwaaba.demo`, `auditor@akwaaba.demo`, `owner@coastline.demo`, `owner@osustay.demo`

Sign-in is held in memory only. A page reload logs you out and resets all data, so move around with the in-app links, not by typing a new address.

## What it does

- Business roles (owner, manager, cashier, auditor) work inside one company: reserve an invoice, certify it with a demo timestamp and QR code, cancel it with a reason, or issue partial or full credit notes (refunds) with a reason.
- GRA admin sees every company, searches invoices, filters by month or custom date range, flags invoices for review, and reads the cancelled and refunded list, reports and audit log. Admin is read-only on business records.
- VAT payable per company = VAT collected on certified invoices minus VAT reversed on credit notes, for the chosen period.
- Customers open the QR link to a verify page that states clearly it is not verified by GRA.

## Documentation

- [docs/PROBLEM_AND_SOLUTION.md](docs/PROBLEM_AND_SOLUTION.md) what problem this addresses and how
- [docs/HOW_IT_WORKS.md](docs/HOW_IT_WORKS.md) invoice life cycle, QR verify, how totals and refunds are calculated
- [docs/FEATURES_AND_ROLES.md](docs/FEATURES_AND_ROLES.md) pages and the role permission matrix
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) code layout, state, data model, what a real backend needs
- [docs/LIMITATIONS_AND_SOURCES.md](docs/LIMITATIONS_AND_SOURCES.md) demo limits and what is verified or not

## Security notes for a public repo

- Everything here is made up: companies, TINs (prefixed `DEMO-`), people, invoices and the logins above. There are no real credentials, API keys, tokens or personal data in the code or docs.
- The app makes no network calls and talks to no GRA or other real endpoint. There is nothing to configure and no `.env` file. `.gitignore` excludes env files and key files in case a backend is added later.
- The admin address in this README is not a secret. Anyone reading the repo can open it, and the demo logins are public by design. Do not reuse these passwords anywhere real.
- Never put real taxpayer data, real GRA credentials or real API keys in this repo. A real system must keep those server-side only.
- `npm audit` reports 0 known vulnerabilities for the pinned dependencies at the time of writing.

## Known gaps

No backend, no real authentication, no real GRA integration. New invoices exist only until the page is reloaded, so a QR code for one will not resolve in a new session. Next step is a real API and database (for example Supabase) with proper auth and role checks. The QR code was checked visually, not scanned with a physical phone.

Stack: React 18, TypeScript, Vite 6, react-router-dom 7. QR generator: MIT-licensed qrcode-generator algorithm (see `src/qr`). Fonts: `@fontsource` Montserrat and Open Sans.
