# Plan: #13 Plate in the app: token check and app frame

## Goal
The app draws with Plate: the same tokens, styles, fonts, logo and icons as `design-system/`, and the app frame ported as typed React components in `app/src/ui/`: Icon, BrandMark, LanguageSwitch, AppHeader, NavRail, PageHeader, BottomTabBar, with the names and props of `design-system/components/index.d.ts`. Other components are ported by the ticket that first needs them.

## Inherited, not re-decided
- TRD T9 and §9: the Plate components ported to typed React with plain CSS using `tokens.css`; no Tailwind or UI kit; a build check fails if the app's tokens differ from `design-system/tokens.json`; new components go to `design-system/` first.
- `design-system/AGENTS.md`, skill sns-plate-component: the app never invents its own look.
- Guidebook 07 (layout and navigation): 264px sidebar from 1,100px, 104px rail below; top bar; phone tab bar with the staff centre action; phone page header with a real back link.
- PRD ST-19.1 (navigation): only its shape here; counts that open filtered lists come with each feature.

## Approach (technical, decided here)
- **One source, copied at build time, not committed.** `app/scripts/sync-plate.mjs` copies `design-system/tokens.css`, `components/bundle.css` (without its two font imports), the six static font files, the logo and the 3D icons into `app/src/ui/plate/` and `app/public/plate/`. It runs before `dev`, `build`, `test` and `typecheck` (npm `pre…` scripts). The copies are git-ignored, so they can never differ from the design system; `--check` fails when a copy is stale, and a test runs it. (This is how "the build fails if the tokens differ" is met.)
- **Same class names.** The React components emit the same `rt-*` classes as `bundle.js`, so `bundle.css` styles them unchanged.
- **Words.** Components take their words as props, as in `index.d.ts`; screens pass them from `src/i18n/`. Defaults inside components are the design system's own (e.g. "ආපසු · Back").
- **Preview.** A development-only page `/plate` shows the desktop frame and the phone frame with sample items (404 in production builds), for checking against boards 19.1 and the home boards.

## Out of scope
- Real menu items per role and permission (#15); counts and filtered lists (each feature); the other 21 components; saving each person's language (#14/#15).
- Deployment: the Docker build will need the repository root as its context so the sync can read `design-system/` (noted for the server setup).

## Versions (at least two weeks old)
`@testing-library/react` 16.3.3, `@testing-library/dom` 10.4.2, `@testing-library/user-event` 14.6.8, `jsdom` 30.1.3.

## Seams under test
- Each component, rendered with Testing Library in jsdom: structure, states and accessibility (active item `aria-current`, a count as its own link, grouping by label, the bilingual split, the centre action in the middle, the back link's label, the language buttons' `aria-pressed` and `onChange`).
- `sync-plate.mjs --check`: passes after a sync, fails when a copy differs.
- The `/plate` page in the browser at 1280 and 390 px: no sideways scrolling; sidebar, header and tab bar present.

## Files
Read first: `design-system/components/bundle.js` (Icon, BrandMark, LanguageSwitch, AppHeader, NavRail, PageHeader, BottomTabBar, helpers `bi`, `nb`, `cx`), `index.d.ts`, `bundle.css`, `tokens.css`, `fonts.css`; the boards 19.1 and 02.1.

Create: `app/scripts/sync-plate.mjs`; `app/src/ui/{text.ts, icons.ts, Icon.tsx, BrandMark.tsx, LanguageSwitch.tsx, AppHeader.tsx, NavRail.tsx, PageHeader.tsx, BottomTabBar.tsx, types.ts, index.ts}`; `app/src/app/plate/page.tsx`; `app/tests/ui/*.test.tsx`; `app/tests/plate-sync.test.ts`; `app/tests/e2e/plate-frame.spec.ts`.
Change: `app/package.json` (devDependencies, pre-scripts), `app/vitest.config.ts` (jsdom for `tests/ui`), `app/src/app/layout.tsx` (global CSS), `app/.gitignore` (the copies), `app/AGENTS.md`.

## Tasks (test first)
1. `tests/plate-sync.test.ts` → `scripts/sync-plate.mjs` and the pre-scripts. VALIDATE: `npx vitest run tests/plate-sync.test.ts`.
2. `tests/ui/text.test.ts` (bilingual split, unbreakable ids) and `tests/ui/Icon.test.tsx` → `text.ts`, `icons.ts`, `Icon.tsx`. VALIDATE: `npx vitest run tests/ui`.
3. BrandMark, LanguageSwitch tests → components.
4. AppHeader, PageHeader tests → components.
5. NavRail tests (groups, English echo, active, badge link, footer group) → component.
6. BottomTabBar tests (tabs, badge, centre action in the middle) → component.
7. Layout CSS and `/plate` preview; `tests/e2e/plate-frame.spec.ts`. VALIDATE: `npm run build && npm run test:e2e`.
8. `app/AGENTS.md` (sync, `src/ui/` usage). VALIDATE: `npm run typecheck && npm run lint`.

## Validation at the end
`validate`; compare `/plate` screenshots with boards 19.1 and 02.1 at 1280 and 390 px; `review-changes`; `ship` (PR into development, closes #13).
