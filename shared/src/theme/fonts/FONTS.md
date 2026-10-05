# Fonts

| File / package | Family | Source | Licence |
|---|---|---|---|
| `@fontsource-variable/inter` (npm) | Inter, variable 100–900 | Same family fireworks.ai serves as its default font | SIL Open Font License |
| `favorit-550.woff2` | Favorit, weight 550 | Copied from fireworks.ai's production CSS (`/_next/static/media/2677a118b945864f-s.p.woff2`) | **Commercial — © Dinamo Typefaces GmbH.** Licensed to Fireworks AI for fireworks.ai. Included only so this private submission renders exactly like the Fireworks site. Do not publish, host or redistribute it. |

To remove Favorit, delete the `@font-face` for it in `global.css`. Labels fall back to the site's own
"Favorit Fallback" metrics (Arial), then to the system monospace font.
