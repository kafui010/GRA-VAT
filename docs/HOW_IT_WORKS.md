# How the system works

All of this runs in the browser with seeded data. Terms: *company* is a business registered with the platform, *invoice* is a sale record, *credit note* is a refund document linked to an invoice.

## Invoice life cycle

1. **Reserve.** A cashier, manager or owner creates an invoice with a customer, items, quantities and unit prices. The app adds the demo tax (10%) and gives the invoice an ID such as like `INV-AK-0001`. Status: **Pending**.
2. **Certify (demo).** The invoice is marked **Certified** with a certification timestamp. In a real system this is where the tax authority would sign the invoice.
3. **Cancel.** A pending invoice can be cancelled by cashier, manager or owner with a reason. A certified invoice that has no refunds can be cancelled by manager or owner. Status: **Cancelled**, with a cancel timestamp and reason. Cancelled invoices do not count as sales.
4. **Refund.** Manager or owner issues a **credit note** against a certified invoice for a partial or full amount, with a reason. The original invoice is never edited. The app blocks refunds above the remaining refundable amount. Displayed status becomes **Part refunded** or **Refunded**.

Every action adds a line to the audit log (who, role, action, target, time).

## Timestamps

Each invoice records created time and certified time. Cancellations and credit notes carry their own times. All times are shown in UTC.

## QR code and verification

Each invoice page shows a QR code. It encodes the URL of the customer verification page for that invoice (`/verify/<invoice id>`) on whatever host serves the app. The verification page shows company, total, demo VAT, timestamps, status, and a banner: **"Not verified by GRA."** In this demo, newly created invoices exist only until the page is reloaded. Nothing is checked against a real authority.

The invoice page also shows a short "demo fingerprint" computed in the browser from the invoice data. It is a display aid, not a cryptographic signature.

## How totals are calculated

For a chosen period (a calendar month, all time, or a custom date range) and scope (one company or all):

- **Sales** = total of certified invoices certified in the period.
- **VAT collected** = tax portion of those invoices.
- **Refunded** = total of credit notes issued in the period.
- **VAT reversed** = tax portion of those credit notes (refund amount x 10/110).
- **Net sales** = sales minus refunded.
- **VAT to be paid** = VAT collected minus VAT reversed. This is the amount a company owes for the period in the demo. For the admin overview, "total to be paid" is the sum across companies.
- **Cancelled** = count and value of invoices cancelled in the period.

The report page shows these per company and per month, and the monthly rows add up to the all-time totals.

## Roles in one line each

GRA Admin oversees everything read-only and can flag invoices. Owner and manager run the business side (manager has no team or audit pages). Cashier creates invoices and sees recent ones. Auditor reads. Details in [FEATURES_AND_ROLES.md](FEATURES_AND_ROLES.md).

## Demo tax rule

The demo uses a single illustrative 10% rate. Real VAT rules (several tax codes, levies, flat-rate schemes, inclusive or exclusive pricing) are not modelled. See the note on the earlier v7 reference in [LIMITATIONS_AND_SOURCES.md](LIMITATIONS_AND_SOURCES.md).
