# Limitations and sources

## This is a simulator

- Not affiliated with, endorsed by or verified by the Ghana Revenue Authority. The GRA DEMO mark is a placeholder, not an official logo.
- No backend. Data is generated in the browser and resets on refresh.
- Logins and role checks are client-side and for demonstration only.
- Tax follows the 2026 Ghana rates GRA publishes (VAT 15%, NHIL 2.5%, GETFund 2.5% on the same base) by default, with an illustrative flat 10% option. Tax codes, exemptions, zero-rating and input credits are not modelled, and the rates were read from https://gra.gov.gh/domestic-tax/tax-types/vat/ on 4 October 2026 and may change.
- Certification is simulated. No invoice is sent to any authority.
- QR codes encode this app's own `/verify/<invoice id>` URL. The verify page says "Not verified by GRA". The QR code was rendered and checked visually. It has not been scanned with a physical phone camera.
- A new invoice can be verified only while the page stays open.

## Tested in the browser

Admin sign-in and every admin page, company tracking, invoice and QR pages, manager issuing a partial credit note, cashier restricted navigation and reserve then certify, customer verify page, wrong-password message, and a 390px phone width on the admin overview and invoices. Not tested: owner and auditor pages visually, the other company owner logins, scanning with a physical camera, or older browsers.

## Where the project background came from

- **Project owner's requests.** The problem framing, the roles, the admin portal wishes, the typography (Montserrat headings, Open Sans body) and the name Mabbin GRA come from the owner's messages while the prototype was built.
- **Earlier reference prototype (not in this repo).** A first simulator was built from reading a public Postman collection described as GRA E-VAT v7.0, and a document referred to as "Sentinal v1.5.8". That prototype modelled tax codes A to E, a 15% standard VAT, flat-rate 3%, levies (NHIL 2.5%, GETFL 2.5%, COVID 1%, tourism 1%), exclusive and inclusive pricing, and a flow of create, submit, wait for signature, then QR. These details are recorded here as background only. They were **not re-verified** for this repository and may be out of date.
- **Not read: v8.1.** A later version (referred to as v8.1) was not read, so current rules and endpoints are unverified. Check the authority's official, current documentation before building any real integration.
