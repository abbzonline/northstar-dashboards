# DESIGN.md — Northstar customer health dashboard

> Fireworks' own design language, applied to an executive dashboard: quiet surfaces, one purple accent, and nothing that gets between a VP and the figure they came for.

Produced with the [web-design](https://github.com/xiaopu-ai/web-design) skill's spec-first workflow (Phase B). Scene: **Dashboard**, so the skill's baseline tier **L1** applies. Its landing-page rules (hero "wow" moments, WebGL, six-category signature motion) are out of scope for this scene; see §8 for the deliberate deviations.

## 1. Visual Theme & Atmosphere

**Style**: Fireworks editorial, light
**Keywords**: precise, calm, evidential, branded, legible, restrained
**Tone**: confident and transparent — NOT salesy, playful or decorative
**Feel**: a well-set annual report that happens to be live

**Interaction Tier**: L1 (refined static)
**Dependencies**: CSS only. No CDN, no animation library.

## 2. Color Palette & Roles

Exact fireworks.ai tokens (from the site's production CSS); defined once in `shared/src/theme/global.css`.

```css
:root {
  /* Backgrounds */
  --bg: #FFFFFF;                          /* page */
  --surface: #FAF7FF;                     /* tiles, cards, facts panels (--fw-surface-tint) */
  --surface-alt: #FFFFFF;                 /* chart cards, tables */
  --surface-hover: #FFFFFF;               /* tinted surfaces lift to white on hover */

  /* Borders */
  --border: #E6EAF4;                      /* hairlines everywhere (--fw-border) */
  --border-hover: oklch(66% .2 294.66);   /* purple-200 */

  /* Text */
  --text: oklch(21% .01 264.38);          /* headings, values (--fw-ink) */
  --text-secondary: oklch(28% .01 285.93);/* body (--fw-body) */
  --text-tertiary: oklch(48% .01 256.74); /* captions, axis labels (--fw-gray) */

  /* Accent */
  --accent: rgb(103, 32, 255);            /* purple-400: primary series, links, active */
  --accent-hover: oklch(43% .23 285.65);  /* purple-500 */

  /* RGB variants for rgba() */
  --bg-rgb: 255, 255, 255;
  --accent-rgb: 103, 32, 255;

  /* Semantic */
  --success: oklch(64% .11 180.47);       /* marine-700: improving deltas */
  --error: oklch(64% .21 28.54);          /* red-500: incident markers, error series */
  --warning: oklch(76% .15 75);           /* amber: the only non-Fireworks colour */
}
```

**Color Rules:**
- All colours through variables; components never hard-code hex.
- One accent per view: purple. Teal only for "improving" deltas and the secondary chart series; red only for incidents and the error series.
- Status colours carry meaning, never decoration.

## 3. Typography Rules

**Font Stack** (self-hosted; no network after `npm install`):
```css
@import '@fontsource-variable/inter';              /* Inter variable, OFL */
@font-face { font-family: 'Favorit'; src: url('./fonts/favorit-550.woff2') format('woff2'); font-weight: 550; }
--font-inter: 'Inter Variable', 'Inter Fallback', ui-sans-serif, system-ui, sans-serif;
--font-favorit: 'Favorit', 'Favorit Fallback', ui-monospace, monospace;
```

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|------|------|------|--------|-------------|----------------|
| Page H1 | Inter | 3rem (2.25rem < 640px) | 500 | 1.25 | -0.12rem |
| Section H2 | Inter | 1.5rem | 500 | 1.33 | -0.06rem |
| Card title H3 | Inter | 1rem | 500 | 1.5 | -0.02em |
| Body | Inter | 0.875–1rem | 400 | 1.5 | — |
| KPI value | Inter | 1.875rem | 500 | 1.2 | -0.075rem, tabular-nums |
| Label / eyebrow | Favorit | 0.6875–0.875rem | 550 | 1 | 0, normal case |
| Mono (model ID) | system mono | 0.875em | 400 | 1.5 | — |

**Typography Rules:**
- Numbers use `font-variant-numeric: tabular-nums` so columns line up.
- Labels are Favorit in normal case, as written ("01 · Expansion pipeline"); nothing is forced to capitals.
- **NEVER use**: Google-hosted fonts, display/script faces, weights above 600, gradient or shadowed text.

**Text Decoration:** H1, H2 and H3 are plain (restrained, data-first): no gradient, no shadow.

## 4. Component Stylings

### Buttons (view menu trigger)
```css
.viewmenu__trigger { background: transparent; color: var(--text); border-radius: 8px; transition: background-color .2s, color .2s; }
.viewmenu__trigger:hover, .viewmenu__trigger[aria-expanded='true'] { background: var(--surface); color: var(--accent); }
.viewmenu__trigger:active { background: var(--border); }
.viewmenu__trigger:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.viewmenu__trigger:disabled { color: var(--text-tertiary); cursor: not-allowed; }
```

### Cards (KPI tiles, chart cards, facts panels)
```css
/* KPI tile: tint → white, with an inset accent hairline (no lift: it breaks the grid). */
.motion-l1 .kpi--link { transition: background-color .2s ease, box-shadow .2s ease; }
.motion-l1 .kpi--link:hover { background: var(--surface-hover); box-shadow: 1px 0 0 var(--border), 0 1px 0 var(--border), inset 0 0 0 1px var(--border-hover); }
.motion-l1 .kpi--link:active { background: var(--surface); }
.motion-l1 .kpi--link:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }

/* Chart card: border highlight only. */
.motion-l1 .card { transition: border-color .2s ease; }
.motion-l1 .card:hover { border-color: var(--border-hover); }
```

### Navigation (top bar)
Sticky, white, hairline bottom border; 1392px frame with side rules (unchanged from the Fireworks header).

### Links
```css
.viewmenu__item { border-left: 2px solid transparent; transition: background-color .15s; }
.viewmenu__item:hover { background: var(--surface); }
.viewmenu__item.is-active { border-left-color: var(--accent); }
```

### Tags / Badges
Square, Favorit in normal case, 0.75rem; purple fill for the audience badge; status pills tinted by meaning.

### Tables
```css
.motion-l1 .table tbody tr { transition: background-color .15s ease; }
.motion-l1 .table tbody tr:hover { background: var(--surface); }
```

## 5. Layout Principles

**Container:** max width 1392px with hairline side rules; padding 16px (< 640px), 64px (640–1023px), 32px (≥ 1024px).

**Spacing Scale:** section 48px; component gap 16px; card padding 20px; KPI padding 18px 20px.

**Grid:**
```css
.kpis { grid-template-columns: 1fr; }
@media (min-width: 480px) { .kpis { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .kpis { grid-template-columns: repeat(4, 1fr); } }
.section__grid { grid-template-columns: repeat(auto-fit, minmax(min(100%, 480px), 1fr)); gap: 16px; }
```

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | hairline border, no shadow | tiles, cards, tables |
| Highlight | inset or border accent hairline | hover on tiles and cards |
| Raised | `0 16px 40px rgba(23,25,29,.12)` | view menu dropdown |
| Overlay | `0 24px 64px rgba(23,25,29,.18)` | dialogs |

## 7. Animation & Interaction

**Motion Philosophy**: views settle in once, surfaces respond to the pointer, numbers never move.
**Tier**: L1

### Entrance Animation (once per view, on load; not scroll-triggered)
```css
@keyframes view-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.motion-l1 .view-in > * { animation: view-in .45s cubic-bezier(.16, 1, .3, 1) both; }
.motion-l1 .view-in > *:nth-child(2) { animation-delay: .06s; }
.motion-l1 .view-in > *:nth-child(3) { animation-delay: .12s; }
.motion-l1 .view-in > *:nth-child(n + 4) { animation-delay: .18s; }
```

### Scroll Behavior
None. Dashboard rule: information is visible immediately.

### Hover & Focus States
As §4: tiles and cards highlight their border, rows tint, menu items tint; every interactive element has a 2px accent focus ring.

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  .motion-l1 .view-in > * { animation: none; }
  .motion-l1 .kpi--link, .motion-l1 .card, .motion-l1 .table tbody tr { transition: none; }
}
```

## 8. Do's and Don'ts

### Do
- Keep every figure readable at first paint; motion only ever delays decoration, never data.
- Highlight with borders and tints; keep the grid perfectly still.
- Keep one accent (purple) per view; reserve teal and red for meaning.
- Respect `prefers-reduced-motion` everywhere.
- Scope all motion under `.motion-l1` so the internal dashboard is unaffected.

### Don't
- ❌ Scroll-triggered reveals (the skill's own Dashboard rule).
- ❌ Lifting or scaling data cards on hover: it shifts the grid.
- ❌ WebGL, cursor followers, parallax, marquees or animated backgrounds.
- ❌ Animation longer than 700 ms, or anything that loops.
- ❌ Google Fonts, CDNs or Unsplash: the dashboard must run offline after install. *(Deliberate deviation from the skill's default.)*
- ❌ Emoji, gradient text or decorative illustrations.
- ❌ New colours outside the Fireworks tokens (amber remains the only exception).
- ❌ Animating figures (count-ups, tickers, rolling digits): numbers render at their final value. *(Tried and removed: decision #58.)*

## 9. Responsive Behavior

| Name | Width | Key Changes |
|------|-------|-------------|
| Desktop | ≥ 1024px | 4-up KPI grid, 2-up charts, 32px frame padding |
| Tablet | 640–1023px | 2-up KPIs, charts stack below 1000px, 64px padding |
| Mobile | < 640px | 1-col KPIs below 480px, badge hidden, 16px padding, pillar pips hidden |

**Touch Targets:** minimum 44 × 44px (view menu items, KPI tiles, pillar rows).
**Collapsing Strategy:** wide tables scroll horizontally inside their own container; the page itself never scrolls sideways.
