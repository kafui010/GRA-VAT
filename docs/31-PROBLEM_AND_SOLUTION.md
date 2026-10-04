# Problem and solution

## Problem statement

Businesses that charge VAT must report each sale to the tax authority. Today that is hard for two groups.

**Developers and businesses who need to connect.** Integrating with a tax authority's invoicing API means reading long, technical documentation, handling several tax codes and levies, signing requests, and dealing with errors that are hard to interpret. The project owner's own words, from the request that started this work, were that he wants "a good system that people can connect easily", because the existing documentation and everything around it feels complicated. Small businesses often cannot do this integration themselves.

**Tax authority staff who need to oversee.** Staff need a single place to answer questions such as: Did every invoice get sent? What did each company sell this month? How much VAT does each company owe after refunds? Which invoices were cancelled or refunded? Without a clear view, errors and under-reporting are hard to spot.

**Customers who need confidence.** A customer holding a receipt has no easy way to tell whether the invoice really was reported.

## Proposed solution

One platform with three faces:

1. **A simple business portal.** Staff issue an invoice, the system computes the tax, stamps the time, and produces a QR code. Cancelling and refunding are guided, and refunds never overwrite the original invoice. They create a linked credit note.
2. **A separate admin portal for tax staff.** Sign-in, then a national overview, company search and tracking, every invoice with timestamps and QR codes, cancelled and refunded lists, and totals for any month or custom date range, including total VAT to be paid.
3. **A customer verification page.** Scan the QR code on a receipt to see the invoice details and status.

A thin, well-documented API layer between businesses and the tax authority system (the earlier prototype sketched this as an SDK with one call to create an invoice) would hide the complexity from business developers. That SDK is not part of this repository.

## What this repository delivers

A working **front-end simulator** of the portals above, with realistic made-up data, so the design and flows can be reviewed before building a real backend. See [HOW_IT_WORKS.md](HOW_IT_WORKS.md) and [FEATURES_AND_ROLES.md](FEATURES_AND_ROLES.md).

## What it does not solve yet

Real authentication, a database, a real connection to any tax authority, public customer verification, and legal or tax correctness. See [LIMITATIONS_AND_SOURCES.md](LIMITATIONS_AND_SOURCES.md).
