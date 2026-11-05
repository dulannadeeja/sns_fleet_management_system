# Plan: #20 Partner owners: list, add, details (ST-11.1 to ST-11.3)

## Decided (Dulan, 1 Nov 2026; Proposed in system design 3.2 "Partner accounts", 14)
- Whoever may add partners (the admin by default) creates the partner's account and types the first password; turning it off or on stays with the owner.
- A partner: name, sign-in phone, NIC as on the card (one per NIC), optional bank account, at least one partner car not yet linked, each with its commission and the costs the owner pays (service, tyres, repairs, battery).
- The agreement: only "signed on <date>" until the owner approves the wording; printing comes with the printouts.

## Approach
- `partner_owner` (user account, NIC, bank account, agreement signed on); `vehicle.partner_owner_id`; `vehicle_terms_version.owner_pays`. Migration 0014; the app may only set a car's owner link and a partner's date and bank account.
- `src/modules/partners`: `addPartner` (one transaction: account, partner, link each car with `linkCarToPartner`, new terms version if the terms differ), `recordAgreementSigned`, `listPartners`, `getPartner`, `unlinkedPartnerCars`.
- Pages `/partners` (11.1), `/partners/new` (11.3), `/partners/[id]` (11.2): seen with `seePartnerEarnings`, changed with `editPartners`. Menu item Partners.
- Cars: the owner's name on the car; the costs on the car's terms and edit page (partner terms, like the commission).

## Seams under test
- `tests/partners.test.ts`: account, links, terms, log; refusals save nothing; NIC, phone, password, commission, costs; permissions; agreement date.
- `tests/db/app-role-cars.test.ts`: what the app may change on partners and cars.
- `tests/e2e/partners.spec.ts`: the owner adds a car and a partner, records the date; the partner signs in; staff get 403.

## Out of scope
Earnings, cash-outs, the partner portal (Phase 3); the starting balance (Phase 4); printing the agreement (printouts).
