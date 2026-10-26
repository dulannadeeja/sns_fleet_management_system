# Typography fix - 26 October 2026

Requested by Dulan: use the fonts already specified by the design screens.

- Gemunu Libre: display/title/heading tokens, existing screen headings, plates and figures.
- Yaldevi: body text and interface labels.
- Both design-system token copies are aligned, without changing type sizes or weights.
- Supplied variable fonts and their SIL OFL notices are in fonts/plate/. Components and previews now load them locally; Google Fonts is no longer required.
- Updated all 171 HTML previews and the existing walkthrough ZIP. Regenerated all 171 PNG previews, including the previously missing NeedsAttention phone preview.

Validation: all 171 screens rendered in Chrome with external network requests blocked. Both declared font families loaded on every screen; zero broken images and zero page-level horizontal overflows at each screen's recorded export width. Representative phone and desktop PNGs were visually inspected. Token family parity, local stylesheet links, and ZIP CRC checks passed. Detailed rendering results: design/previews/font-validation.json.

F05 and F14 are resolved in the local files. Online Claude artifacts have not been republished. Other audit findings remain open; the audit report retains its original pre-fix evidence. No business requirements, permissions, prices, or frozen proposal files were changed.
