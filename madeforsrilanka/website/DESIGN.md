# MadeForSriLanka design system: Fresh (final direction)

Chosen by Dulan on 2026-11-22. Base look: Perk (perk.com). Added ideas from Ceylon Shen Tours, Look Lanka, BookLanka and The Pekoe Trail.
Not chosen: Spice (index.html), Luxe (luxe.html), Collage (collage.html). Kept only as records.

## Colour
Every colour used on the website, logo and Kotiya is listed here. Nothing else may be added without updating this table.
Visual palette page (swatches, contrast checks, copyable codes): palette.html, published at https://claude.ai/artifact/JYxf4JC6WNGLP97tu2R3HP. Keep the two in step: change this table and that page together.

### 1. Core website colours
| Token | Hex | Role |
| --- | --- | --- |
| page (stone) | #F5F5EB | Page background; cards inside white bands; tiles behind Kotiya |
| card (white) | #FFFFFF | Cards, nav bar, sheets, panels, white bands |
| tint | rgba(25,25,15,.05) | Closed accordion rows, empty photo slots |
| line | rgba(25,25,15,.10) | Hairline dividers |
| sand | #D2D2C8 | Outlines on chips, steppers, progress track |
| ink | #14140F | Text, dark buttons, selected chips; logo text; Kotiya outlines, eyes, spots |
| mute | #6E6E64 | Secondary text (4.7:1 on page, 5.2:1 on white) |
| lime | #BEFF50 | Brand fill: main buttons, price total, icon tiles, visited route, footer, logo tile, Kotiya's bandana |
| forest | #2F4A2A | Island on route maps; Hidden-Path Explorer hat |
| clay | #A4472A | "Never" marks and the Help button outline (6.0:1 on white) |

### 2. Website support colours (states and dark surfaces)
| Token | Hex | Role |
| --- | --- | --- |
| lime-hover | #D6FF8F | Lime button hover |
| ink-hover | #2B2B24 | Ink button hover |
| text-on-ink | #E8E8DE | Body text on the dark photo band |
| mute-on-ink | #C9C9BE | Secondary text on ink (11.1:1) |
| text-on-lime | #3A3A32 | Body text inside lime cards (9.6:1) |
| hard-chip | #FFD9CC | "Hard" effort chip on day lists |

### 3. Logo (Kotiya Tile)
| Token | Hex | Role |
| --- | --- | --- |
| lime | #BEFF50 | The tile (face) |
| ochre | #E3A13B | Ears |
| ink | #14140F | Ear centres (always dark, also on the ink tile), eyes, nose, rosettes, wordmark |
| white | #FFFFFF | White logo text on dark or photos (SriLanka at 80% opacity); face details on the one-colour ink logo |
| stone | #F5F5EB | SriLanka text on ink at 70% opacity |
Versions: on white (lime tile), on ink (lime tile, stone text), on lime (ink tile, lime face, ochre ears), one colour ink, one colour white. App icon and social avatar: lime background.

### 4. Kotiya (mascot) body
| Token | Hex | Role |
| --- | --- | --- |
| ochre | #E3A13B | Fur: head, body, tail, ears, paws |
| cream | #F8E7C6 | Muzzle and belly |
| ink | #14140F | Outlines, ear centres, eyes, nose, rosettes, whiskers (55%) |
| white | #FFFFFF | Eye whites, eye shine; Sticker style white edge |
| lime | #BEFF50 | Bandana; sparkles on the "excited" face |
| tongue | #E46F5E | Tongue when the mouth is open |
| sweat | #7FB7E6 | Sweat drop on the "oops" face |
Sticker style (social only): adds a white edge, an ink outline and a soft ink shadow at 25%.

### 5. Kotiya props (only inside drawings, never as website colours)
| Token | Hex | Used for |
| --- | --- | --- |
| lens | #6D8BA6 | Binocular lenses (Wild Tracker) |
| flower-centre | #F5C842 | Araliya flower centre (Sunset Sweetheart; petals are white) |
| banana-leaf | #4E8A3A | Leaf plate (Village Foodie) |
| leaf-vein | #2F5E25 | Leaf vein |
| curry | #C9662B | Curry on the plate |
| dhal | #E8B23E | Dhal on the plate |
| forest | #2F4A2A | Bucket hat (Hidden-Path Explorer), with a lime band |
Headphones (Party Leopard) use ink with lime glow; sunglasses (Beach Dreamer) use ink.

### Map colours (base map only)
| Token | Hex | Role |
| --- | --- | --- |
| map-background | #EEF1E6 | Outside the land |
| map-land | #F5F5EB | Land (same as stone) |
| map-water | #BFD8DC | Sea, lakes, rivers |
| map-park | #DCE8CC / #D3E2C2 | National parks |
| map-wood | #D6E4C8 / #CCDDBB | Forest |
| map-scrub | #E3EBD5 / #DCE6CB | Scrubland |
| map-beach | #F2E8CC | Beaches, sand |
| map-roads | #FFFFFF | Main roads |
| map-sea-label | #5E8C92 | Ocean labels |
| map-town-label | #3A3A32 | Town labels (small places #6E6E64) |
| map-region-label | #9A9A8C | Province labels |
The route uses lime #BEFF50 with an ink #14140F edge. Maps page: https://claude.ai/artifact/GEPwzf6kD41fF747iFUvkJ.

### 6. Colour rules
- Text colours: ink on stone, white, lime, cream or ochre (8.3:1 or more). Lime on ink (15.5:1).
- Never use lime or ochre as text on white or stone: they fail contrast (1.1–2.2:1). They are fills only.
- Ochre, cream and the prop colours belong to Kotiya and the logo ears. They never become buttons, backgrounds or text.
- Kotiya always sits on a stone or white tile, never directly on lime (the bandana would vanish) or on photos with a real leopard.
- The logo pages and the mascot sketch page also have a dark theme (page #121210, card #1C1C18, text #F2F2E8, mute #A9A99C, clay #E0805F). The website itself stays light.

## Type
Visual typography page (fonts, named scale with live samples, numbers, rules): typography.html, published at https://claude.ai/artifact/UtAZyhMFjYgcBtNvLwim9c. Keep the two in step.
- Font choice confirmed by Dulan on 2026-11-23: Onest stays (option A). Compared against Instrument Serif + Instrument Sans, Bricolage Grotesque and Plus Jakarta Sans in real mockups (fontcmp/fonts.html).
- Fonts: Onest 400 / 500 / 600 (free stand-in for Perk's paid OTSono; covers German letters). Noto Sans Sinhala 500 for Sinhala words, always next to the English.
- Scale follows Perk (measured 2026-11-23: page title 80 px, section title 60 px, card title 28 px on a 1440 px screen; 42 / 36 / 24 px on phones). Reduced from the first mockup on Dulan's request.
- Weights: 400 body; 500 headlines, buttons, labels, prices; 600 only "MadeFor" in the logo and number badges.

| Style | Size (phone → laptop) | Weight · line · spacing | Used for |
| --- | --- | --- | --- |
| display-xl | 42 → 80 px | 500 · 0.95 · −0.03em | Hero headline, page titles |
| display-l | 36 → 60 px | 500 · 1.0 · −0.03em | Section titles, big statements |
| display-s | 24 → 36 px | 500 · 1.04 · −0.03em | Kotiya's bubble, quiz questions |
| marquee | 48 → 90 px | 500 · 1.1 · −0.04em | Moving line of places only |
| title-l | 28 px | 500 · 1.1 · −0.02em | Sheets, price panel, Never/Always |
| title-m | 24 px | 500 · 1.1 · −0.02em | Trip cards, promise cards, day titles |
| title-s | 22 px | 500 · 1.15 · −0.02em | Day-trip cards, moments, basics |
| label-l | 20 px | 500 · 1.1 · −0.02em | Accordion rows, crew names, number chips |
| lead | 18 px | 400 · 1.55 | Grey text under section titles |
| body | 17 px | 400 · 1.55 | All normal text, inputs |
| button | 16 / 17 px | 500 · 1 | Buttons, menu links |
| body-s | 15.5 px | 400 · 1.5 | Card text, stops, footer links |
| label | 14 px | 500 · 1.3 | Field labels, facts, quiz progress |
| caption | 13.5 px | 400 · 1.4 | Notes, badges, day chips |
| tiny | 12.5 px | 400 · 1.4 | Under prices, placeholder tags |
| price-xl / l / m / s | 36 / 30 / 24 / 20 px | 500, tabular figures, −0.02 to −0.03em | Stats, hero price card, totals, trip cards |

- Rules: sentence case, no all caps, no labels above headings; reading lines 56–64 characters; nothing under 12 px, Sinhala never under 14 px; numbers always tabular; one H1 per page; leave room for German (about 30% longer); never retype the logo wordmark.
- To tidy in the real build: the mockup uses a few near-duplicate sizes (15 and 15.5, 12 and 12.5, 13 and 13.5 px, several display ranges). Map them to the named styles above.

## Shape
Spacing and components page (spacing scale, layout, corners, shadows, touch sizes, 25 live components with specs): components.html.
- Spacing: 4, 8, 12, 16, 24, 32, 48, 64 px; 96–112 px between sections (64 on phones).
- Corners: pill 999 · xl 28 (big blocks, sheets) · l 24 (cards) · m 20 (photos in cards, tiles, bubbles) · s 14 (fields, icon tiles, date chips).
- Shadows only on floating parts: float-s (menu), float-m (WhatsApp, hero price card), float-l (hero phone, share card), float-up (sticky bar, sheets).
- Breakpoints: phone under 760, tablet 760, laptop 1000, small phone under 430. Content max 1280 px, side margin 16 px.
- Touch targets at least 44 × 44 px.
- Cards 26px radius, big blocks 28px, photos inside cards 18–20px, inputs 14px.
- Buttons are pills (999px) with a small chevron. Lime = main action, ink = secondary, outline = third.
- Menu bar works like Perk's (Dulan, 2026-11-23): at the top it is flat, full width and stone, part of the hero; after about 24 px of scrolling it becomes a floating stone bar (28 px corners, hairline edge, soft shadow) that stays at the top. 0.25 s ease out. Soft shadows only on floating things (scrolled menu, phone, sheets, WhatsApp button).

## Navigation — LOCKED (Dulan, 2026-11-25)
Final. Change only if Dulan asks.

**Computers (960 px and wider)**
- Bar: full logo 38 px tall, page links, Plan my trip (lime pill), always visible.
- At the top: flat stone bar, 14 px above and below. After 24 px of scrolling: floating stone bar, 28 px corners, hairline edge, soft shadow, 8 px inside.

**Phones and tablets (under 960 px)**
- Top of the page: full logo (28 px; 25 px at 375 px or less; 21 px at 340 px or less; 38 px on tablets) + menu button. No Plan my trip in the bar, because the hero has its own big button.
- After the hero button scrolls under the bar (other pages: after 24 px): logo gets smaller with the name kept (22 px; 20 px at 375 px or less; 18 px at 340 px or less; 26 px on tablets), and a smaller Plan my trip (38 px tall, 14 px text) fades in. Smooth 0.3 s change, nothing jumps.
- Bar space: flat 24 px above and below, 8 px on the right; floating 12 px above and below, 10–16 px on the right (less on 320–340 px phones).
- Logo, Plan my trip and menu button always fit inside the bar, down to 320 px wide.

**Phone menu (dropdown)**
- Perk style: white card, 28 px corners, under the bar; page behind covered by stone at 45% with a 14 px blur.
- The bar keeps its state while open (flat at the top, floating after scrolling); the menu button becomes a cross on a soft square.
- While open, Plan my trip leaves the bar and shows only in the menu; the bar shows the full logo.
- Rows: Trips ›, Day trips ›, How it works, Guides ›, Our crew, My trip; rows with › open a short list in place.
- Then lime Plan my trip, outline WhatsApp us, EN/DE and USD.
- Tight spacing (card 8/18/18 px, rows 13 px above and below); fits a 390 × 844 phone without scrolling.
- Closes on the cross, tapping outside, Escape, or choosing a link.

## Voice and tone
Voice page (who speaks, five traits, tone by moment, word lists, writing rules, small-text examples, languages, checklist): voice.html.
- Speakers: "we" (the crew) for almost everything; Kotiya only in the quiz, tips, 404 and celebrations; a named person for WhatsApp, help and complaints.
- Voice: local and real, honest and specific, energetic not loud, simple, kind.
- Tone drops energy and play near money and problems: Dream, Plan, Decide, Book, Travel, Problem, Goodbye.
- Never: brochure clichés (paradise, hidden gem), unprovable "best" claims, licence claims before the SLTDA licence, fake urgency, "free cancellation" for round trips, medical claims, guaranteed wildlife.
- Open: British or American spelling (recommended British); German "du" or "Sie" (recommended "du").

## Motion
Motion page (timing tokens, curves, 11 live examples, less-motion preview, rules): motion.html.
- Speeds: fast 150 ms (hover, press), base 250 ms (chips, toasts, fades), slow 350–500 ms (sheets, Kotiya's bounce, quiz progress), party 1300 ms (booking confetti, once). Marquee 60 s linear loop.
- Curves: ease out cubic-bezier(.2,.7,.1,1) for almost everything; ease in-out cubic-bezier(.45,0,.2,1) for paths (route drawing); linear only for loops.
- Only Kotiya bounces. Animate transform and opacity only. Anything moving over 5 s can be paused. Always respect Reduce motion (video waits, marquee stops, no bounce or confetti, instant sheets, jump scrolling).
- Planned: route draws itself (1.2 s), card lift on laptops (4 px, 150 ms).

## Photography and video
Photography page (principles, page recipe, crops, look, video, permission and law, files, shot list): photography.html.
- Real only: own photos or guests' with permission; no stock, no AI images. Current mockup photos are AI-looking placeholders and must all be replaced before launch.
- Every page: 1 wide view, 2 close details, 1 people moment, plus one silent 3–10 s clip where useful. Natural light and colours, light edits only, subject inside the middle 60% so every crop works.
- Crops: hero 16:8 and 4:5, cards 4:3, vibe 3:2, stories 9:16, link preview 1.91:1. Upload originals; the site serves WebP/AVIF; page under ~2 MB on phones.
- Permission: guests per photo on WhatsApp (withdrawable, GDPR); children only with a parent's yes; friends' and drone footage with written permission; drones only flown legally (CAASL); no baited or captive wildlife.

## Travel guides
Guides page (two templates, sample Ella page, writing, Google search, launch plan, checklist): https://claude.ai/artifact/Lu4EVJR15PdDf2mwtbGTmd.
- Place page: drone clip or wide photo; why go in 3 lines; 12-month best-time bar (dry lime, mixed, rainy water blue); top 5 things each with an honest insider tip (what to skip, traps); drive times from the places list; our trips with live from-prices; map; 3 questions; byline with "checked" date and language switch.
- Planning guide: answer first; table or live calculator; short sections; honest warnings; one sample trip with live price; questions and official sources; one "Plan my trip" button.
- Written by us from our own visits; system numbers only; changing facts link to official sources with a checked date; recheck yearly. EN and DE twins.
- Launch: 4 planning guides + 8 place pages (Galle, Mirissa/Weligama, Yala, Ella, Kandy, Sigiriya/Dambulla, Unawatuna/Hikkaduwa, Elpitiya), then one guide a month and every place in priority order.

## Maps
Maps page (two live states, parts and sizes, map colours, behaviour, data, Google plan, rules): https://claude.ai/artifact/GEPwzf6kD41fF747iFUvkJ.
- Decided by Dulan 2026-11-23: the live website will use **Google Maps** in future. Mockups use a real OpenStreetMap map (MapLibre + Protomaps data hosted with the mockup), because claude.ai blocks Google and Mapbox map images.
- Never draw a map per route. Places are saved once (name, lat/lng, and later a Google Place ID); a trip is an ordered list of places with nights. One RouteMap part draws any route: lime road line with ink edge, numbered white stops, names placed automatically. Guest trip page: visited legs and stops lime, upcoming white.
- Each day shows road km and drive time ("about 2 h 58 by road"). Drive times are routing estimates; add a safety margin for Sri Lankan roads (amount still open).
- Drivers get an "Open in Google Maps" link with the stops.
- When switching to Google: use the Maps JavaScript API with cloud map styling in our colours; road legs from Google's Routes API. Check Google's terms first: routes from Google must be shown on a Google map, and saving Google results long term is limited, so the "save each leg once" approach may need to change. Free allowance about 10,000 map loads a month for the standard map (check current prices); trip cards and PDFs can use static map images.
- Credits always visible: © OpenStreetMap in mockups, Google's logo and terms on the live site.

## Icons
Icons page (style, 17 icons used now, 16 planned, sizes, rules, copyable SVG): icons.html.
- One line style: 24 × 24 grid, 2.2 px line (2.4–2.6 px for small arrows and ticks), round ends, outline only (play and pause filled), currentColor.
- Sizes 16, 20 and 24 px. Icon next to words; icon-only buttons need a spoken name.
- No emoji or text symbols as icons; WhatsApp uses our chat bubble; no star ratings drawn by us.

## Section backgrounds
- Recommended and card sections sit on full-width white bands (Perk style): promises, trips + day trips, guest videos, basics + how it works. Cards inside a white band turn stone (#F5F5EB).
- Statement, vibe accordion, price, never/always, places line and crew stay on stone. The footer is lime.

## Phone menu
- Option A chosen by Dulan 2026-11-23 (Perk style): under 960 px a two-line menu button (turns into a cross) opens a white card (28 px corners) under the bar. While open, the bar keeps its state (flat stone at the top, floating bar after scrolling) and everything behind is covered by a stone layer with a 14 px blur; the close button sits on a soft square. Rows: Trips ›, Day trips ›, How it works, Guides ›, Our crew, My trip; rows with › open a short sub-list in place. Then lime Plan my trip, outline WhatsApp us, EN/DE and USD. While the menu is open on phones, Plan my trip fades out of the bar (its place stays, so nothing moves) and shows only in the menu; it comes back when the menu closes (Dulan, 2026-11-25). Bar on phones and tablets changes with scrolling (Dulan, 2026-11-25): at the top of the home page the hero already has Plan my trip, so the bar shows the full logo and the menu button only; once the hero button scrolls under the bar, the full logo gets smaller (22 px on phones, 20 px at 375 px or less, 18 px at 340 px or less, 26 px on tablets; the name always stays) and a smaller Plan my trip (38 px tall, 14 px text) fades into the bar. Other pages do the same after 24 px of scrolling. Computers always show the full logo and the button. Top bar space on phones and tablets, under 960 px (Dulan, 2026-11-25; computers keep 14 px flat and 8 px floating): flat bar 24 px above and below with 8 px extra on the right; floating bar 12 px above and below with 12–16 px on the right; the dropdown card does not change; logo in the bar 38 px tall on computers, 28 px on phones (25 px on phones 375 px wide or less with a smaller Plan my trip and menu button, 21 px on phones 340 px wide or less); on phones the logo, Plan my trip and menu button must always fit inside the bar with its right-side space, down to 320 px wide; 10 px between Plan my trip and the menu button on phones. The menu card itself keeps its tighter spacing. Options page: https://claude.ai/artifact/3mE29wpx1TnbsqfXTXmdEK.

## Showing the path (no step bar)
- Removed the always-on "Find your vibe · See your trip and price · Book" bar (Dulan, 2026-11-23).
- Buttons name the next step: Plan my trip in 2 minutes → See my trip and price (quiz) → Make it yours and book → Book with a 30% deposit / Continue to payment → Pay.
- One line under the hero buttons: "2 minutes to your plan · see every price · book only when you love it"; How it works (3 steps, with a Plan my trip button) sits right after the big-tour comparison.
- Progress only inside tasks: quiz progress bar; booking sheets say "Step 1 of 2" and "Step 2 of 2 · Pay".

## Sections (home, in order)
1. Hero: greeting, centred headline "Sri Lanka without the tourist traps." (chosen by Dulan 2026-11-23, replaces "Your Sri Lanka, your way. Honest price."), grey line under it (private trips, own driver, young locals, prices upfront, change as you go), 4-tick checklist (Ceylon Shen), lime + outline buttons, video in a 28px frame with pause button, trip-page phone and lime price card on top (Perk product picture).
2. "Where we drive" line of places.
3. Big statement "0 shop stops. Not one, ever." + 4 promise cards (Perk).
4. Vibe accordion: 6 rows, one open, moments left, photo right (Perk role accordion).
4b. Kotiya quiz teaser: lime card, Kotiya + speech bubble, three personality previews, ink "Start with Kotiya" button. No prices in this card.
5. Trip cards with "N nights" badge, stops, facts, price, round arrow button (Look Lanka).
6. Coast day trips with lime price chip on the photo (BookLanka).
7. Honest price breakdown in a white card, lime total row.
8. "Not another big-coach round tour": comparison of a typical big tour vs us (route, on the road, shopping, guide, changes, price, group), three real-moment photo cards, fair-use note, "Plan a real trip with us". Replaces the Never / Always cards. Never names a competitor.
9. Guest and Raptor/drone video cards (Ceylon Shen).
10. Moving line of place names with photo chips (Perk cities).
11. Sri Lanka basics: visa, getting around, when to go, money (Ceylon Shen).
12. How it works, 3 steps (Look Lanka).
13. Dark photo band for the crew + 3 crew cards (Perk).
14. Lime footer: link columns, giant wordmark, SLTDA licence line (Look Lanka).
15. Floating WhatsApp button (all Sri Lanka sites): Kotiya's head in a circle with a small lime chat badge, "WhatsApp us · Real people, 24/7". Never says "Ask Kotiya": a real person answers. When the Kotiya card is on screen, the button switches to a plain chat icon (one Kotiya per screen). Shown on home (Kotiya head), trip page (plain icon, because prices are on screen; sits above the price bar on phones; hidden on laptops because the price panel has its own "Ask us on WhatsApp" button) and 404 (plain icon, Kotiya is already there). Not on the quiz or the guest trip page.

Guest trip page: one Kotiya card under the actions. Shows a tip for today, then reacts to "How was today?" (Great: excited, Okay: curious). On "Not good" Kotiya steps aside and a plain message from the crew shows. Kotiya never sits in the Help flow.

Instagram share card (from the quiz result, "Share on Instagram"): 9:16 story on lime. Wordmark, "I'm a" + personality name, a real photo for that vibe with Kotiya in Sticker style (ink outline, white edge, tilted) breaking out of the photo corner, one line "My Sri Lanka: ...", ink pill "Which leopard are you? 2-minute quiz · madeforsrilanka.com". No prices, no guest names. Never a photo with a real leopard behind the cartoon.

Booking confirmation (sheet, after paying for a day trip or the trip deposit): Kotiya excited on a tile with a short confetti burst, bubble "You're booked! Bohoma sthuthi" (with Sinhala), the trip name, 3 numbered next steps, then the receipt in its own outlined card with no leopard. Day trip ends with "Done", round trip with "See my trip page".

404 page: Kotiya with the "oops" face on a white tile, "This page wandered off into Yala.", buttons to home and the quiz, quick links, WhatsApp line.

Trip page adds big number boxes (Pekoe Trail) above the map, day list and sticky price panel.

## Logo
- Kotiya Tile (chosen 2026-11-23): lime rounded square with Kotiya's ochre ears (dark backs), eyes, nose; rosettes on forehead and cheeks only at 48 px and up. Wordmark MadeFor (Onest SemiBold) + SriLanka (Onest Regular), outlined shapes. Files in logo/files (logo.svg, logo-white.svg, logo-mono.svg, logo-mark.svg, favicon.svg/.ico, apple-touch-icon.png, icon-192/512.png, og-avatar.png).
- Header: lockup 34 px high (27 px on phones). Footer on lime: full-width lockup with an ink tile and lime face. Share card: small ink tile.
- The logo is not the mascot: it may appear on every page, including price, payment and Help. The one-Kotiya-per-screen rule counts the mascot drawing only.

## Mascot
- Name: Kotiya (කොටියා, the Sinhala word for leopard), chosen by Dulan 2026-11-22.
- Sri Lankan leopard, Shape style (flat ochre #E3A13B, cream #F8E7C6, ink rosettes, lime bandana). Chosen by Dulan 2026-11-22. Sticker style (white edge) only for social posts and video stickers.
- Quiz: leopard + speech bubble asks each question; its face reacts to answers (happy, curious, excited, thinking, sleepy, oops); result shows the personality leopard with its prop. Price sits in a separate card, never beside the leopard.
- Never in the hero, price, payment, Help/safety screens, driver app, admin, or next to real wildlife photos. At most one per screen.
- Current drawings are sketches for the illustrator brief (mascot.html), not final art.

## Cancellation wording (must match the terms)
- Round trips: never say "free cancellation". Use "Move your trip once, free" (hero) or "Move dates once, free" (cards). Full rule: full refund 30+ days before minus payment fees; 15–29 days 50% of deposit kept; under 15 days deposit kept.
- Day trips and transfers: "Free cancellation until 24 hours before".

## Rules
- No labels above headings, no emoji icons (drawn SVG only), no gradients or glass.
- Never copy: fake discount labels ("-20%"), "likely to sell out", invented review counts.
- Sample prices always say "sample". Placeholders always say "Placeholder".
- Video: MP4 (H.264) + poster frame, muted, loop, plays inline, pause button, waits for play when the device asks for less motion.
- Hero video `vid/hero.mp4` comes from Dulan's upload `Home-Banner.webm`. Its rights are not confirmed yet (it looks like a professional tourism advert). Mockup only until written permission, or replace with our own drone and Raptor clips.
