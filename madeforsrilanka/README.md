# MadeForSriLanka website design

Design files for Dulan's private Sri Lanka tour website, MadeForSriLanka. This is a separate project from the SNS Rent Car system. It only lives in this repository for safe keeping.

## What is here

| Path | What |
| --- | --- |
| [website/DESIGN.md](website/DESIGN.md) | The design system: colours, type, shapes, navigation (locked), logo, mascot, voice, motion, photos, guides, maps, icons, rules |
| [website/fresh.html](website/fresh.html) | The final website mockup ("Fresh") |
| `website/components.html`, `palette.html`, `typography.html`, `icons.html`, `motion.html`, `voice.html`, `photography.html`, `guides.html`, `mascot.html`, `mobilemenu.html` | Design system pages |
| [website/brief.md](website/brief.md), [website/product-truth.md](website/product-truth.md) | Design brief and product facts |
| `website/img/`, `website/vid/`, `website/map/` | Photos, the hero video, real map data (OpenStreetMap, Sri Lanka) |
| `logo/` | Logo page, logo and favicon files, the download zip, build scripts |
| `maps/` | Real map demo and the maps design page; `maps/source/` has the scripts that made the map data |
| [decisions.md](decisions.md) | Every decision from the interviews, with dates |

## Live copies (claude.ai)

- Website mockup: https://claude.ai/artifact/Hrk819SJ9hHjfwdhuRk23A
- Components: https://claude.ai/artifact/JrpzQfcTwJAMBf3VhvZgYt
- Source-of-truth doc: https://claude.ai/artifact/95o3PBpmZbbW23Cq7DeCRE

## How to open the pages

Pages with a map need a small local web server (browsers block map files opened straight from disk):

```bash
cd madeforsrilanka && python3 -m http.server 8000
```

Then open http://localhost:8000/website/fresh.html.

## Still open

- Hero video: confirm we have the rights before the live site.
- Kotiya name: trademark check.
- Google Maps terms for the live site.
