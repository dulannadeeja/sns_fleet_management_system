# SNS Plate: audit and recommendations

> Follow-up: typography findings F05/F14 fixed locally on 26 October 2026 at Dulan's request. See TYPOGRAPHY_FIX.md. This report records the pre-fix audit baseline.

26 October 2026 | Requested by Dulan | All recommendations **Proposed**

## Outcome

Keep the Plate identity. Resolve source authority, export reproducibility and token/component drift before using this snapshot as an implementation contract. This audit approves no new rule.

## Coverage and limitations

- All 792 pre-existing files inventoried and hashed, excluding .git internals and this audit folder. Full-content automated scan of 459 UTF-8 files; this does not mean every sentence was manually reviewed.
- All 171 canvas sources and 171 static HTML previews checked for literal local href/src dependencies, placeholder anchors and cross-device links. JavaScript-generated routes and functional behaviour are not certified.
- All 170 available PNG previews visually surveyed on six contact sheets. This is not a pixel-level or responsive browser audit. Assets decoded; ZIP member lists and CRCs checked.
- Proposal: 25 pages rendered and visually surveyed, companion HTML read. No clause-by-clause equivalence certification. Client agreement photos are reference-only; no legal interpretation or transcription.
- Detailed review: source of truth, tokens, CSS/JS, declarations, component docs, agent instructions, changelog and CR-001. Third-party skill text is scan scope, not product authority.
- E: source of truth and workspace copy have identical SHA-256 hashes. Online Claude artifacts could not be retrieved; online freshness is unverified. CHANGELOG records canvas v64 / system v13 from 25 Oct 2026.
- Sinhala content is intact: the initial question-mark appearance came from terminal output encoding. No content repair is needed on that evidence.
- No production app, PRD or TRD was found. No production accessibility, permission, calculation, security or acceptance-scenario test pass is claimed.

## Findings

P1: before implementation handoff. P2: design-system hardening. These are priorities, not release approvals.

### F01 / P1: Snapshot coverage is inconsistent

171 canvas sources and HTML previews exist, but only 170 PNGs. 02-Home-NeedsAttention-Phone.png is missing. There are 81 desktop, 81 phone and 9 document/system boards. Two More screens are phone-only; StatusBlocks and selected navigation 19.1 are desktop-only.

**Evidence:** `AGENTS.md:29`; `README.md:14`; `design/previews/preview-report.json`

**Proposed improvement:** Publish a manifest separating product screens, documents and references. Regenerate the missing PNG and document intended pairing exceptions.

### F02 / P1: Canvas source runtime is absent

All 171 canvas sources reference ./support.js, which is absent. x-dc/x-import sources are not standalone applications.

**Evidence:** `design/canvas/01-Start-SignIn-Desktop.dc.html:6`

**Proposed improvement:** Document runtime requirements and a supported export entry point; direct offline reviewers to static previews.

### F03 / P1: Navigation token is stale

--rail is 128px; current sidebar CSS uses 264px, becoming 104px below 1100px.

**Evidence:** `design/design-system/tokens.css:45`; `design/design-system/components/bundle.css:280`; `design/design-system/components/bundle.css:23`

**Proposed improvement:** Propose explicit wide/compact sidebar tokens and a shared breakpoint, then update the online system.

### F04 / P2: Touch minimum has two definitions

Tokens and Button docs use 48px; responsive guidance and several controls use 44px. This is a policy mismatch, not a blanket accessibility failure.

**Evidence:** `design/design-system/tokens.json:313`; `design/design-system/README.md:149`; `design/design-system/components/bundle.css:209`

**Proposed improvement:** Agree whether 44px is an allowed compact exception and 48px the default; name both roles and verify actual clickable bounds.

### F05 / P1: Heading typography differs by implementation

display/title/heading token classes use Yaldevi; README and h1/h2/header overrides use Gemunu Libre.

**Evidence:** `design/design-system/tokens.css:53`; `design/design-system/components/bundle.css:234`; `design/design-system/README.md:56`

**Proposed improvement:** Approve one semantic heading family and generate token classes and component CSS from it.

### F06 / P2: Letter spacing contradicts the guide

The guide permits tracking only on plates; CSS adds 0.01em to numbers, h1, h2 and header titles.

**Evidence:** `design/design-system/README.md:61`; `design/design-system/components/bundle.css:234`

**Proposed improvement:** Remove non-plate tracking in the online system or approve an explicit exception; check Sinhala vowel signs.

### F07 / P2: Money-state blue needs an explicit exception

The guide says action blue never marks status, but matched/deposit pills use its tint and strong shade. Token descriptions acknowledge this usage.

**Evidence:** `design/design-system/README.md:44`; `design/design-system/components/bundle.css:240`

**Proposed improvement:** Separate vehicle status, money state and action semantics in the colour policy before recolouring anything.

### F08 / P1: Proposed catalogue photo looks like approved scope

CR-001 is pending owner agreement; both EditCar boards expose Add photo without a local Proposed/CR-001 qualification.

**Evidence:** `SNS_SYSTEM_DESIGN.md:124`; `change-requests/CR-001-vehicle-catalogue-photo.md:6`; `design/canvas/04-Cars-EditCar-Desktop.dc.html:26`; `design/canvas/04-Cars-EditCar-Phone.dc.html:35`

**Proposed improvement:** Annotate the design as Proposed, CR-001 pending. Do not implement as confirmed scope; ask for the owner decision separately.

### F09 / P1: Fuel inclusion contradicts itself in rank 1

Section 16 marks fuel accounting Confirmed in scope; section 18 still lists fuel module inclusion as an open decision.

**Evidence:** `SNS_SYSTEM_DESIGN.md:400`; `SNS_SYSTEM_DESIGN.md:486`

**Proposed improvement:** Ask Dulan to distinguish confirmed inclusion from unresolved workflow and reconcile the source of truth first.

### F10 / P1: Commercial readiness language is inconsistent

Section 1 says the proposal is approved/frozen; sections 16/20 still describe delivery price or a fixed-price commitment as undecided/not ready. Internal costs may remain open, but wording conflates them.

**Evidence:** `SNS_SYSTEM_DESIGN.md:28`; `SNS_SYSTEM_DESIGN.md:413`; `SNS_SYSTEM_DESIGN.md:529`

**Proposed improvement:** Ask the stakeholder to separate approved client terms from unresolved internal costs and technical readiness. Preserve the frozen proposal.

### F11 / P2: Component manifest lags the runtime

The bundle header lists 22 components. Runtime additionally exports PageHeader, GameIcon, LauncherTile, LauncherGrid and EmptyState.

**Evidence:** `design/design-system/components/bundle.js:1`; `design/design-system/components/bundle.js:403`

**Proposed improvement:** Generate header metadata, catalogue and declarations from one manifest, with helpers listed separately.

### F12 / P2: Vehicle fallback documentation differs from code

Docs say models beyond the six launch models use generic art; runtime recognises more families, including Hustler, SUVs and pickup.

**Evidence:** `design/design-system/components/VehicleImage/README.md:5`; `design/design-system/components/bundle.js:137`

**Proposed improvement:** Document actual asset mapping separately from approved business packages. Extra artwork does not add scope.

### F13 / P2: Walkthrough contains placeholder links

There are 36 href="#" occurrences in canvas sources and 40 in static previews. They are not missing-file links but have no destination.

**Evidence:** `design/canvas/*.dc.html`; `design/previews/html/*.html`

**Proposed improvement:** Classify intentional static controls versus missing routes; clearly label previews as non-production.

### F14 / P1: Preview font import follows CSS rules

Static previews concatenate token rules before the bundle @import. In Chrome, OwnerHome-Desktop has zero CSS import rules and zero declared FontFace entries. This verifies the font-loading defect for that preview; the same export pattern appears elsewhere. Local fonts are supplied inside a ZIP.

**Evidence:** `design/previews/html/02-Home-OwnerHome-Desktop.html:62`; `design/design-system/components/bundle.css:1`

**Proposed improvement:** Put font loading in a valid head/stylesheet position and use licensed local font files for reproducible exports. Verify loaded faces, not just CSS declarations.

### F15 / P2: Matched attribution is optional in the API

Docs require Matched to name who/against what/when. The by prop is optional in TypeScript and runtime, allowing an unattributed pill.

**Evidence:** `design/design-system/components/StatePill/README.md:11`; `design/design-system/components/index.d.ts:17`; `design/design-system/components/bundle.js:111`

**Proposed improvement:** Use a discriminated prop contract or validation requiring attribution for Matched. Keep manual reconciliation semantics.

### F16 / P2: Snapshot provenance is outside its entry point

design/README.md repeats the guide. CHANGELOG identifies canvas v64 / system v13 from 25 Oct 2026, but the README lacks a version/coverage/runtime manifest.

**Evidence:** `CHANGELOG.md:7`; `design/README.md:1`

**Proposed improvement:** Add artifact IDs, versions, export date, checksums and viewing instructions. JSON schema/token versions are not artifact versions.

### F17 / P2: Historical references weaken the current guide

References to unchanged Concept A flows and Ratna evidence are historical, not proof of active retired design use; however, they make the current guide less self-contained.

**Evidence:** `design/design-system/README.md:21`; `design/design-system/README.md:172`

**Proposed improvement:** Restate current Plate rules explicitly. Retain legitimate history and selected navigation 19.1; never rewrite frozen proposal artwork.

### F18 / P2: Finalised colour wording is stale

StatePill README calls Finalised solid navy; CSS uses ink (#1b1f1d).

**Evidence:** `design/design-system/components/StatePill/README.md:12`; `design/design-system/components/bundle.css:47`

**Proposed improvement:** Align the documentation to the agreed semantic colour while preserving the lock icon and label.

### F19 / P2: Sample labelling needs point-of-use review

Screens contain sample names, plates and money. Marker scans alone cannot establish that every example is qualified clearly where used. This is a review gap, not a claim all screens lack labels.

**Evidence:** `AGENTS.md`; `design/canvas/*.dc.html`

**Proposed improvement:** Add a consistent preview-level Sample data label and check printable examples separately. Do not treat example values as requirements.

## Sync audit

| Check | Result |
| --- | --- |
| Numbers | Initial daily package prices in proposal HTML align with SoT 4.1. Full sample arithmetic is not certified. |
| Open decisions | Mismatches F08-F10. No status upgraded. |
| Tokens/components | Mismatches F03-F07, F11-F12, F15, F18. |
| Links | 171 missing support.js references; no missing literal local static-preview paths or cross-device href/src paths. Placeholder anchors remain. |
| Scope/phases | Frozen proposal preserved. Fuel and commercial-readiness wording need reconciliation. |
| Words | Sinhala intact; historical references and finalised colour wording need clarification. |
| Traceability | AT-01 through AT-29 exist. PRD/TRD and production tests absent; no end-to-end coverage pass claimed. |

## Proposed improvement sequence

1. Reconcile rank-1 fuel and commercial-readiness wording with Dulan. Leave CR-001 pending owner agreement.
2. Approve a semantic contract for navigation, heading typography, touch targets and money-state colours.
3. Update the online design system first, then screens; refresh the snapshot with a manifest and functioning font/runtime export.
4. Verify keyboard navigation, modal focus, Escape, field labels/errors, disabled reasons, confirmation announcements, sticky-bar overlap and zoom. Check 360/390/768/1100/1280/1920px, long Sinhala text and print pagination.
5. In the eventual application, test AT-28 filtered links, handover gates, separation of recorded/reconciled payments and partner access to final amounts only.

## Strengths to preserve

Plate-first vehicle identification; restrained brand yellow; clear vehicle state labels; Sinhala-first copy; separate money blocks; persistent confirmations; explicit blocked reasons; supplied model art and 3D icons used for distinct purposes. The visual survey supports maintaining this identity rather than redesigning it.

## Changes and remaining decisions

Added audit/reference/specification/inventory and a reproducible extraction script. Existing requirements, design snapshot, proposal, client reference images, permissions and financial rules remain unchanged. All pre-existing files, including CHANGELOG, are unchanged. No deletion, rename, move or deployment.

All existing Open and Proposed decisions remain unresolved. The earlier AGENTS.md instructions were withdrawn by Dulan after this audit was drafted. Findings describe the audited baseline; workflow references do not reimpose those instructions. This report does not approve or apply fixes.