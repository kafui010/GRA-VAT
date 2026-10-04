# GRA-VAT (Mabbin GRA demo)

A front-end **simulator** of an E-VAT invoicing platform with a separate admin portal for tax-authority staff. Businesses issue invoices that get a timestamp and a QR code. Admin staff can see every company, invoice, cancellation and refund, and total what each company owes.

> **This is a demo.** It is not affiliated with, endorsed by or verified by the Ghana Revenue Authority (GRA). Logins are fake and checked in the browser. There is no backend and nothing is secure. The 10% tax rate is illustrative, not Ghana law. QR codes open this app's own demo page. State resets on page refresh. Do not enter real credentials or real data.

## Documentation

| Doc | What it covers |
| --- | --- |
| [docs/PROBLEM_AND_SOLUTION.md](docs/PROBLEM_AND_SOLUTION.md) | The problem, who it affects, and what this project proposes |
| [docs/HOW_IT_WORKS.md](docs/HOW_IT_WORKS.md) | Invoice life cycle, QR verification, refunds, totals and how VAT payable is calculated |
| [docs/FEATURES_AND_ROLES.md](docs/FEATURES_AND_ROLES.md) | Every page and feature, and what each role can see and do |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Code layout, routing, state, data model, and the real system this would need |
| [docs/LIMITATIONS_AND_SOURCES.md](docs/LIMITATIONS_AND_SOURCES.md) | What is simulated, what is unverified, and where facts came from |

## Run it

    npm install
    npm run dev       # local dev server
    npm run build     # type-check and production build

Node 18 or newer. Stack: React 18, TypeScript, Vite, react-router-dom. Fonts: Montserrat (headings, 700/900) and Open Sans (body, 400/600).

If you host the built `dist/` folder, add a rewrite so every path serves `index.html` (the app uses real URLs such as `/gra-admin-7q4k` and `/verify/INV-AK-0063`).

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Home, roles overview, invoice verification entry |
| `/gra-admin-7q4k` | GRA admin portal (unlisted path, not linked from the public nav) |
| `/app` | Business portal for owner, manager, cashier and auditor |
| `/verify/:invoiceId` | Customer verification page ("Not verified by GRA") |

## Demo logins (all fake)

| Role | Email | Password |
| --- | --- | --- |
| GRA Admin | `gra.admin@mabbin.demo` | `GRA-Admin@2026` |
| Owner, Akwaaba Kitchen | `owner@akwaaba.demo` | `Demo@2026` |
| Manager, Akwaaba Kitchen | `manager@akwaaba.demo` | `Demo@2026` |
| Cashier, Akwaaba Kitchen | `cashier@akwaaba.demo` | `Demo@2026` |
| Auditor, Akwaaba Kitchen | `auditor@akwaaba.demo` | `Demo@2026` |
| Owner, Coastline Retail | `owner@coastline.demo` | `Demo@2026` |
| Owner, Osu Stay | `owner@osustay.demo` | `Demo@2026` |

The admin account only works on the admin path and business accounts only on `/app`.

## Status

Prototype. No backend, no real authentication, no integration with any tax authority system. See [docs/LIMITATIONS_AND_SOURCES.md](docs/LIMITATIONS_AND_SOURCES.md) and the next steps in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

QR generation uses an MIT-licensed QR code algorithm (see `src/qr`).
