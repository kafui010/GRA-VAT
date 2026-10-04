# Features and roles

## Shared across the app

Header with the Mabbin GRA name and a GRA DEMO mark, a navigation bar that changes with the signed-in role, and a footer stating this is a demo and not affiliated with or verified by the Ghana Revenue Authority. Phone layouts turn tables into stacked cards and the nav bar scrolls sideways.

## Public pages

- **Home** (`/`): overview, role cards, invoice verification entry, sample invoices.
- **Verification** (`/verify/:invoiceId`): invoice check with a "Not verified by GRA" banner.
- **Business login** (`/app`) and **admin login** (`/gra-admin-7q4k`).

## GRA Admin portal (`/gra-admin-7q4k`)

Read-only on business records.

| Page | What it does |
| --- | --- |
| Overview | Totals across all companies for a month or all time: invoices certified, sales, refunded, total VAT to be paid, per-company bars, attention counts |
| Companies | Search by company name or TIN, with per-company totals. "Track company" opens a company page |
| Company page | Totals, month-by-month table, and that company's invoices with search and filters |
| Invoices | All invoices. Filter by company, status (pending, certified, part refunded, refunded, cancelled) and date range. Search by invoice, order, customer or company |
| Invoice page | Items, totals, QR code, timeline with timestamps, credit notes, and a **Flag for review** action |
| Cancelled & refunds | Two searchable tabs: every credit note and every cancelled invoice, with reasons and timestamps |
| Reports | Pick a month or custom date range and all companies or one. Totals for sales, refunded, cancelled and VAT to be paid, a per-company table and a month-by-month table |
| Audit log | Who did what and when, searchable |

## Business portal (`/app`)

Each user sees only their own company.

| Page | Owner | Manager | Cashier | Auditor |
| --- | --- | --- | --- | --- |
| Dashboard | yes | yes | yes | yes |
| Invoices | all | all | last 7 days only | all |
| New invoice | yes | yes | yes | no |
| Refunds and cancellations | yes | yes | no | yes (read) |
| Reports | yes | yes | no | yes |
| Team | yes | no | no | no |
| Audit log | yes | no | no | yes |

| Action | Owner | Manager | Cashier | Auditor |
| --- | --- | --- | --- | --- |
| Reserve invoice | yes | yes | yes | no |
| Certify pending invoice | yes | yes | yes | no |
| Cancel pending invoice | yes | yes | yes | no |
| Cancel certified invoice (no refunds yet) | yes | yes | no | no |
| Issue refund (credit note) | yes | yes | no | no |

Opening a page outside a role shows "Not available for your role". Roles are enforced in the browser only. In a real system they must be enforced on the server.

## Seeded demo data

Three fake companies (Akwaaba Kitchen, a restaurant; Coastline Retail; Osu Stay, hospitality) with about 160 invoices between 1 Aug and 3 Oct 2026, including cancelled invoices and credit notes, generated deterministically in `src/data.ts`. Company TINs are labelled `DEMO-...` and are not real.
