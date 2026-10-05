# DESIGN.md — Northstar internal QBR dashboard

> A working instrument for the Fireworks account team: Fireworks' design language, dense but calm, where every surface is evidence and the only motion is a view settling into place.

Produced with the [web-design](https://github.com/xiaopu-ai/web-design) skill's spec-first workflow (Phase B). Scene: **Dashboard**, so the skill's baseline tier **L1** applies. This app shares its tokens, type and components with the customer dashboard ([`customer-health/DESIGN.md`](../customer-health/DESIGN.md)); this spec records what's the same and what's specific to the internal view.

## 1. Visual Theme & Atmosphere

**Style**: Fireworks editorial, light, working density
**Keywords**: candid, precise, scannable, branded, decision-oriented, restrained
**Tone**: frank internal briefing — NOT a sales deck, NOT decorative
**Feel**: the account team's annotated field notes, typeset by Fireworks

**Interaction Tier**: L1 (refined static)
**Dependencies**: CSS only. No CDN, no animation library.

## 2. Color Palette & Roles

Same tokens as the customer dashboard (`shared/src/theme/global.css`, from fireworks.ai's production CSS).

```css
:root {
  --bg: #FFFFFF;
  --surface: #FAF7FF;                     /* tiles, cards, table headers */
  --surface-alt: #FFFFFF;
  --surface-hover: #FFFFFF;
  --border: #E6EAF4;
  --border-hover: oklch(66% .2 294.66);   /* purple-200 */
  --text: oklch(21% .01 264.38);
  --text-secondary: oklch(28% .01 285.93);
  --text-tertiary: oklch(48% .01 256.74);
  --accent: rgb(103, 32, 255);            /* purple-400 */
  --accent-hover: oklch(43% .23 285.65);  /* purple-500 */
  --bg-rgb: 255, 255, 255;
  --accent-rgb: 103, 32, 255;
  --success: oklch(64% .11 180.47);       /* marine-700: Healthy, champion, done, high confidence, low risk */
  --error: oklch(64% .21 28.54);          /* red-500: At risk, gaps, high risk, incidents */
  --warning: oklch(76% .15 75);           /* amber: Positive-Watch, medium (only non-Fireworks colour) */
}
```

**Color Rules:**
- All colours through variables; components never hard-code hex.
- Purple is the single accent. Status colours encode meaning only, and the same meaning everywhere: confidence and risk read in opposite directions (high confidence is teal, high risk is red).
- Negative-Watch reuses red-100/red-700, so the status scale adds no new hues.

## 3. Typography Rules

Same stack and scale as the customer dashboard: **Inter** (variable, self-hosted) for headings, body and numbers; **Favorit 550** uppercase for labels, eyebrows, pills and table headers; system mono for the model ID.

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|------|------|------|--------|-------------|----------------|
| Page H1 | Inter | 3rem (2.25rem < 640px) | 500 | 1.25 | -0.12rem |
| Section H2 | Inter | 1.5rem | 500 | 1.33 | -0.06rem |
| Card / pillar title | Inter | 1rem | 500 | 1.5 | -0.02em |
| Body / table cell | Inter | 0.8125–0.875rem | 400 | 1.5 | — |
| Score | Inter | 4rem | 500 | 1 | -0.18rem, tabular-nums |
| Label / pill / th | Favorit | 0.625–0.75rem | 550 | 1–1.2 | 0.04em, uppercase |

**Typography Rules:**
- Tabular numerals for every figure; figures never animate.
- **NEVER use**: Google-hosted fonts, display/script faces, weights above 600, gradient or shadowed text.

**Text Decoration:** none at any heading level.

## 4. Component Stylings

### Buttons (Focus areas, view menu)
```css
.fw-button { border: 1px solid var(--text); background: #fff; color: var(--text); transition: color .15s, border-color .15s; }
.fw-button:hover { color: var(--accent); border-color: var(--accent); }
.fw-button:active { background: var(--surface); }
.fw-button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.fw-button:disabled { color: var(--text-tertiary); border-color: var(--border); cursor: not-allowed; }
```

### Cards (KPI tiles, chart cards, facts panels, health panel)
```css
.motion-l1 .kpi--link:hover { background: var(--surface-hover); box-shadow: 1px 0 0 var(--border), 0 1px 0 var(--border), inset 0 0 0 1px var(--border-hover); }
.motion-l1 .card:hover, .motion-l1 .facts-card:hover, .motion-l1 .table-wrap:hover { border-color: var(--border-hover); }
/* Corner tiles take the grid's radius so the outline follows the curve. */
```

### Navigation
Sticky white top bar in the 1392px framed header; view menu next to the logo; "Internal use only" badge on the right.

### Lists and tables (pipeline, risks, stakeholders, dependencies, competitors, actions, decisions)
```css
.motion-l1 .table tbody tr:hover { background: var(--surface); }
.motion-l1 .decision { transition: background-color .15s ease; }
.motion-l1 .decision:hover { background: var(--surface); }
```

### Tags / Pills / Status badge
Square, Favorit uppercase. Status badge: Healthy (teal), Positive-Watch (amber), Negative-Watch (red tint), At risk (red). Pills follow the colour rules above.

### Dialog (Focus areas)
Native `<dialog>`; blurred, dimmed backdrop; Esc and backdrop click close; 0.2s rise-in, disabled under reduced motion.

## 5. Layout Principles

**Container:** 1392px framed, padding 16 / 64 / 32px by breakpoint (shared with the customer app).
**Spacing Scale:** section 48px; component gap 16px; card padding 20px; table cell 12px 16px.
**Grid:** 4 / 2 / 1-column KPI grid; 2-up chart grid collapsing at ~1000px; plan sections stack single-column.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | hairline border | tiles, cards, tables, decisions |
| Highlight | accent hairline | hover |
| Raised | `0 16px 40px rgba(23,25,29,.12)` | view menu |
| Overlay | `0 24px 64px rgba(23,25,29,.18)` + blurred backdrop | Focus areas dialog |

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
None, except that a headline tile jumps to its chart in the trends view and pulses the target card once (existing behaviour).

### Hover & Focus States
As §4; every interactive element has a 2px accent focus ring. Pillar rows open one at a time.

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  .motion-l1 .view-in > * { animation: none; }
  .motion-l1 .kpi--link, .motion-l1 .card, .motion-l1 .table tbody tr, .motion-l1 .decision { transition: none; }
}
```

## 8. Do's and Don'ts

### Do
- Keep every figure readable at first paint; motion only ever decorates.
- Highlight with borders and tints; keep grids and tables perfectly still.
- Use status colours for meaning only, consistently across the score, pills and tables.
- Keep methodology prose in `docs/`, not on the page.
- Respect `prefers-reduced-motion` everywhere.

### Don't
- ❌ Animating figures (count-ups, tickers, rolling digits). *(Tried on the customer view and removed: decision #58.)*
- ❌ Scroll-triggered reveals.
- ❌ Lifting or scaling cards or rows on hover.
- ❌ WebGL, cursor effects, parallax, marquees, animated backgrounds.
- ❌ Animation longer than 700 ms, or anything that loops.
- ❌ Google Fonts, CDNs or stock imagery. The dashboard runs offline after install. *(Deliberate deviation from the skill's default.)*
- ❌ Outbound links or obscure source names on the page.
- ❌ New colours outside the Fireworks tokens (amber is the only exception).

## 9. Responsive Behavior

| Name | Width | Key Changes |
|------|-------|-------------|
| Desktop | ≥ 1024px | 4-up KPIs; plan facts card beside the dependencies table |
| Tablet | 640–1023px | 2-up KPIs; plan sections stack |
| Mobile | < 640px | 1-col KPIs below 480px; "Internal use only" badge hidden; pillar pips hidden |

**Touch Targets:** minimum 44 × 44px.
**Collapsing Strategy:** wide tables scroll inside their own container; the page never scrolls sideways.
