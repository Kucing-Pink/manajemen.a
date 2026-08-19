# id.pinterest.com — Design System Brief
> Paste this file into your AI agent (Lovable, Cursor, Claude Code…) as the design source of truth.
## Context
- Source: https://id.pinterest.com/
- Page title: Pinterest - Indonesia
- Description: Discover recipes, home ideas, style inspiration and other ideas to try.
## Design Tokens
- Primary / brand colors: `#0866FF`, `#583B91`, `#6845AB`, `#774FC4`, `#DB5B06`, `#DD0E0E`
- Neutral colors: `#000000`, `#181816`, `#242421`, `#0B0B0A`, `#F6F6F3`, `#FFFFFF`, `#EFEFEB`, `#111111`
- Fonts: Pin Sans
- Radii: `50%`
## Instructions for the AI agent
1. Define every color, font and radius above as semantic design tokens in the global stylesheet — never hardcode raw values in components.
2. Use the typography scale below for headings, body copy and UI labels.
3. Keep the visual tone consistent with the source site: same contrast level, same density, same corner rounding.
4. Do not introduce new brand colors or fonts that are not listed here.
## Full extracted specification
# DESIGN.md — id.pinterest.com
> Source: https://id.pinterest.com/
> Discover recipes, home ideas, style inspiration and other ideas to try.
## Colors
### Primary
- `#0866FF` — used 4×
- `#583B91` — used 3×
- `#6845AB` — used 3×
- `#774FC4` — used 3×
- `#DB5B06` — used 2×
- `#DD0E0E` — used 2×
- `#068440` — used 2×
- `#376DF6` — used 2×
### Neutral
- `#000000` — used 12×
- `#181816` — used 12×
- `#242421` — used 8×
- `#0B0B0A` — used 6×
- `#F6F6F3` — used 6×
- `#FFFFFF` — used 4×
- `#EFEFEB` — used 4×
- `#111111` — used 2×
- `#2D2D29` — used 2×
- `#474742` — used 2×
## Typography Scale
Fonts: Pin Sans
### var(--base-font-family-default-latin)
| element | size | weight | line-height | uses |
| --- | --- | --- | --- | --- |
| button | — | — | — | — |
| input | — | — | — | — |
| body | — | — | — | — |
### Pin Sans
| element | size | weight | line-height | uses |
| --- | --- | --- | --- | --- |
| a | — | var(--sema-font-weight-ui-100) | — | — |
## Radii
- `50%`
## Extraction Audit
- Method: Static parse of the page's real HTML, <style> blocks, style attributes and linked stylesheets. Values are as declared in CSS — not browser-computed, and cascade/media-query overrides are approximated by preferring concrete values.
- Stylesheets: 0/0 fetched · 4474 rules · 453 KB CSS
- Color accuracy: 75% (high) — 317 literal color declarations parsed from 0 stylesheet(s) + inline CSS.
- Typography accuracy: 8% (low) — 1/12 type fields resolved to concrete declared values (size · weight · line-height).
### CSS sources
- `inline` <style> blocks in HTML — 453 KB · 4472 rules · 317 colors · 4 type hits
- `style-attr` inline style="…" attributes — 0 KB · 2 rules · 0 colors · 0 type hits