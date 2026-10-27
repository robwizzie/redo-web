# Redo Websites

Marketing site concepts, brand assets and business cards for **Redo Websites**, a two-person web studio (formerly working name Revamp Web; the repo keeps that name): Rob on design and front-end, Dave on back-end and hosting.

Everything is plain HTML, CSS and JS with no build step. Open `index.html` in a browser to start.

## What's here

| Path | What it is |
| --- | --- |
| `index.html` | Concept board. Start here to compare the options. |
| `site/` | **Signal**, the main site in dark mode: home, work, pricing, contact |
| `concepts/midnight.html` | **Midnight**, an alternate one-page concept |
| `concepts/blueprint.html` | **Blueprint**, an alternate one-page concept |
| `business-cards/` | 4 card designs (front and back, Rob and Dave) plus print exports |
| `assets/brand/` | Original logo PNG and vector versions (`rw-logo.svg`, `rw-logo-flat.svg`) |
| `assets/css`, `assets/js` | Shared styles and scripts for Signal. `gradient.js` is the WebGL mesh gradient. |

## The gradient

`assets/js/gradient.js` uses the same technique as Stripe's homepage gradient, written from scratch for us. A dense plane mesh is lifted by 3D simplex noise, and each vertex is colored by stacking three noise-driven wave layers over a base color. Colors come from `--gradient-1` to `--gradient-4` in `site.css`. The canvas sits in a `skewY(-12deg)` band, pauses when off-screen and renders one still frame for people who prefer reduced motion. Without WebGL it falls back to a CSS gradient.

## Photos and art

- `assets/team/` holds Rob's and Dave's portraits with the backgrounds removed, so they sit on the brand blue.
- `assets/brand/rw-logo-gradient.png` and `gradient-still.jpg` are frames of the live gradient, used on the business cards.
- The footer has a marked spot (`.footer__art`) for Rob's illustration.

## Brand

- RW Blue `#5E94F7` (sampled from the logo), Mark Black `#000000`, Deep Blue `#2A5FD8` for text links on white, Night `#0E1F45`.
- `rw-logo.svg` is a vector trace of the original PNG, so it stays sharp at any size and in print.

## Pricing (starting point)

| Package | Price |
| --- | --- |
| Launch (up to 5 pages) | $1,800 |
| Growth (up to 12 pages, CMS) | $4,200 |
| Custom (stores, booking, integrations) | from $8,500 |
| Host / Care / Partner | $39 / $99 / $249 per month |
| Extra work | $85/hr |

**Main Street Program:** small businesses, new businesses and nonprofits get a budget-based quote with no public price, plus payment plans.

## Business card exports

`business-cards/exports/*.png` are 3.75 × 2.25 in (3.5 × 2 trim + 0.125 in bleed) at 300 dpi. To change names or phone numbers, edit `PEOPLE` in `business-cards/index.html`, then run:

```sh
npm i -D playwright   # once
node business-cards/export.js
```

## Placeholders to replace

- Email inboxes at redowebsites.com (hello@, rob@, dave@) still need setting up
- Phone numbers on the cards
- Work page screenshots in `assets/work/` and `assets/work/cases/` were captured from the live sites; the Mile A Day app screens come from that repo's marketing screenshots. Re-capture them when the sites change.
- The contact form isn't wired to a backend yet (`assets/js/site.js`).
