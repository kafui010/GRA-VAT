# Architecture

## Current: front-end only

    index.html
    src/
      main.tsx      mounts the app inside a BrowserRouter
      App.tsx       pages, routing, role rules, in-memory store
      ui.tsx        icons, QR renderer, cards, stat tiles, bars
      data.ts       types, demo accounts, seeded data, totals and status helpers
      style.css     layout and theme (admin theme is blue, business theme is green)
      qr/           MIT-licensed QR code algorithm

Fonts (Montserrat, Open Sans) come from the `@fontsource` npm packages, imported in `main.tsx`.

- **Routing.** The app reads the current path and chooses a portal: `/gra-admin-7q4k...` for admin, `/app...` for business, `/verify/...` for customers, otherwise public pages. `react-router-dom` (BrowserRouter) supplies the current path and links; there are no per-route components in a config file, `App.tsx` switches on the path itself. Static hosting needs a rewrite of every path to `index.html` so deep links work.
- **State.** One React state store holds invoices, refunds and the audit log, seeded from `buildSeed()`. Signed-in user is plain React state. Refreshing the page resets everything, including the login.
- **Auth.** `accounts` in `src/data.ts` holds demo emails and passwords in plain text, and the login form compares them in the browser. This is a stand-in, not security.
- **Money.** Amounts are integers in pesewas (1 GHS = 100) and formatted for display.
- **Data model.** `Invoice` (id, company, order, customer, lines, rate set, net, tax, total, status, timestamps, cancel reason, flagged, created by), `Refund` (credit note linked to an invoice, amount, tax portion, reason, time), `Audit` entries, `Account` and `Company`.
- **Derived status.** An invoice is stored as Pending, Certified or Cancelled. "Part refunded" and "Refunded" are computed from its credit notes.

## What a real system needs

This is a proposal, not something in the repo.

1. **Backend and database** (for example Postgres, or Supabase) storing companies, users, invoices, credit notes and an append-only audit log.
2. **Real authentication** with server-side role checks, per-company data isolation, multi-factor for admin staff, and session handling. The admin portal must not rely on an unlisted URL.
3. **Tax authority integration** server-side only, with secrets never shipped to a browser. The integration must follow the authority's current official API documentation.
4. **Server-side tax rules** with the real VAT codes and levies, and rounding rules agreed with the authority.
5. **Public verification** endpoint for QR codes that confirms an invoice against the authority's records, with the authority's official branding only if authorised.
6. **Idempotency and retries** so a network failure never creates duplicate invoices, plus integrity checks (for example gap detection in invoice sequences).
7. **Hosting** with an SPA rewrite so deep links work, and tests for roles, refunds and totals.
