# Revamp Web

Marketing site concepts, brand assets and business cards for **Revamp Web**, a two-person web studio: Rob on design and front-end, Dave on back-end and hosting.

Everything is plain HTML, CSS and JS with no build step. Open `index.html` in a browser to start.

## What's here

| Path | What it is |
| --- | --- |
| `index.html` | Concept board. Start here to compare the options. |
| `site/` | **Direction A · Signal**, a full 4-page site: home, work, pricing, contact |
| `concepts/midnight.html` | **Direction B · Midnight**, a dark one-page concept |
| `concepts/blueprint.html` | **Direction C · Blueprint**, a technical drawing one-page concept |
| `business-cards/` | 4 card designs (front and back, Rob and Dave) plus print exports |
| `assets/brand/` | Original logo PNG and vector versions (`rw-logo.svg`, `rw-logo-flat.svg`) |
| `assets/css`, `assets/js` | Shared styles and scripts for the Signal site |

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

- Domain `revampweb.com` and the email addresses
- Phone numbers and Dave's last name on the cards
- Work thumbnails are drawn stand-ins. Swap in real screenshots and add the juice company's name.
- The contact form isn't wired to a backend yet (`assets/js/site.js`).
