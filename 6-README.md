# GRA-VAT (Mabbin GRA demo)

A front-end **simulator** of an E-VAT invoicing platform with a GRA admin portal. Everything runs in the browser with made-up data.

**This is a demo.** It is not affiliated with, endorsed by or verified by the Ghana Revenue Authority. Logins are fake and checked in the browser, nothing is secure, the 10% tax rate is illustrative, and the QR codes point at this app's own demo verify page. State resets on refresh. Do not enter real credentials or real data.

## Run

    npm install
    npm run dev

## Routes

- `/` home, roles overview, invoice verify
- `/gra-admin-7q4k` GRA admin portal (overview, companies, invoices, cancelled and refunds, reports, audit log)
- `/app` business portal (owner, manager, cashier, auditor)
- `/verify/:invoiceId` customer verification page ("Not verified by GRA")

## Demo logins

- GRA admin: `gra.admin@mabbin.demo` / `GRA-Admin@2026`
- Business roles, password `Demo@2026`: `owner@akwaaba.demo`, `manager@akwaaba.demo`, `cashier@akwaaba.demo`, `auditor@akwaaba.demo`, `owner@coastline.demo`, `owner@osustay.demo`

## Known gaps

No backend, no real authentication, no real GRA integration. Next step is a real API and database (for example Supabase) with proper auth and role checks.

QR generator: MIT-licensed qrcode-generator algorithm (see `src/qr`).
