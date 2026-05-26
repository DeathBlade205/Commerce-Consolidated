# Commerce Consolidated — Agency Website

## What this is
Website for **Commerce Consolidated**, a small Sydney digital agency offering Web, Brand, and Marketing services. Positioned as restrained, high-craft, typographic — minimal dark aesthetic. Think studio rather than agency.

**Stack:** Vue 3 (Composition API `<script setup>`) + Vite + vue-router 4 + pnpm. No UI library, no Tailwind — all scoped CSS per component.

**Run dev:** `pnpm dev`
**Build:** `pnpm build`

## File structure
```
src/
  main.js                  # App entry — mounts Vue, imports router + CSS, registers v-reveal directive
  App.vue                  # Root: CustomCursor, GrainOverlay, CornerMarks, NavBar, RouterView (fade transition)
  router/index.js          # Routes: / → Home, /about → Practice, /contact → Contact
  directives/
    reveal.js              # v-reveal — shared IntersectionObserver. Adds `is-visible` when element scrolls into view. Optional binding: { delay: ms } for per-item stagger.
  assets/styles/
    base.css               # CSS custom properties + reset + body styles
    main.css               # Global utility classes (.label, .label--lg, .serif)
  views/
    HomeView.vue           # Landing page — flashlight hero only
    AboutView.vue          # Practice page — services, case studies, process, clients, stats
    ContactView.vue        # Contact page — email blocks, address, social links, footer
  components/
    NavBar.vue             # Fixed top nav, mix-blend-mode: difference
    FlashlightReveal.vue   # Slot-based mouse-tracked radial mask reveal. `hidden` prop omits dim base layer (content only visible inside flashlight). On touch devices, renders content fully visible with no mask.
    LogoMark.vue           # SVG "CC" monogram in outlined square — used inside hidden FlashlightReveal on Home
    BackgroundField.vue    # Canvas 2D background layer. **No longer used on Home** (removed in favour of the minimal Swiss/typographic aesthetic — just grain + corner brackets). File kept for reference / possible future use on other views.
    CustomCursor.vue       # 6px dot cursor, expands to 32px on links/buttons
    GrainOverlay.vue       # SVG fractalNoise grain, fixed, mix-blend-mode: overlay, z-index 1
    CornerMarks.vue        # Four fixed SVG corner brackets, z-index 200
    ServiceRow.vue         # 4-col grid row: number / title / description / deliverables list
    CaseStudyCard.vue      # Card with client, discipline, summary, year, "View case →" link
    ProcessStep.vue        # Single step: number, title, duration, description
```

## Design system

### CSS custom properties (`base.css`)
```css
--bg: #0a0a0a           /* near-black page background */
--grey-100: #f5f5f5     /* primary text / headings */
--grey-300: #a8a8a8     /* secondary text, italic serif accents */
--grey-500: #555555     /* muted text, labels, section markers */
--grey-700: #2a2a2a     /* hairlines, corner marks, dim serif */
--hairline: rgba(255,255,255,0.08)  /* subtle dividers */
--font-serif: 'Instrument Serif', Georgia, serif
--font-sans: 'Geist', system-ui, sans-serif
--font-mono: 'Geist Mono', ui-monospace, ...   /* squared/geometric — used for Home title + mission */
```

### Global utility classes (`main.css`)
- `.label` — 10px, sans, 0.28em tracking, uppercase, `--grey-500`
- `.label--lg` — same but 11px, 0.32em tracking
- `.serif` — font-family serif, weight 400
- `.reveal` / `.reveal.is-visible` — scroll-reveal pair used by `v-reveal`. Element starts at `opacity: 0; translateY(28px)` and transitions in over 900ms with optional `--reveal-delay`. Respects `prefers-reduced-motion`.

### Typography pattern
- **Display headings:** `font-family: var(--font-serif)`, `clamp()` sizes, `letter-spacing: -0.015em` to `-0.02em`
- **Italic emphasis:** `<em>` inside serif headings renders italic + `--grey-300`
- **Body text:** 13–16px sans, `--grey-300`, `line-height: 1.7–1.8`
- **Section labels:** `.label.label--lg` prefixed with `—` dash (e.g. `— Services`)
- **`cursor: none`** on html/body — custom cursor handles pointer globally

### Layout
- **Nav:** `position: fixed`, `padding: 32px 48px`, `mix-blend-mode: difference` (inverts against page)
- **Page padding:** `padding: 140px 48px 80px` (top clears fixed nav), mobile `120px 24px 60px`
- **Max width:** `max-width: 1200px; margin: 0 auto` on view containers
- **Section spacing:** `margin-bottom: 120px` per section, mobile `80px`
- **Breakpoint:** `880px` (mobile)

## Views

### HomeView (`/`)
Minimal centred hero. No background canvas — just the global grain overlay + corner marks. The `.home` is `display: flex` with `align-items: center` and `justify-content: center` so the composition sits in the middle of the viewport.

**`.eyebrow`** — centred at the top with leading + trailing dash brackets.

**`.hero-stack`** — title + mission stacked vertically, container `align-items: center`.
- **Title** — `COMMERCE` over `CONSOLIDATED`, both lines `text-align: center` so they share a vertical axis. Mono uppercase, weight 500, `letter-spacing: -0.02em`, `line-height: 1.06`. Wrapped in `FlashlightReveal` (dim at `--grey-500`, bright reveal to `--grey-100`).
- **Mission** — staggered to the right of the centred title block by one `--stagger` step (`clamp(80px, 13vw, 200px)`). Smaller mono body with `max-width: 520px`. Wrapped in `FlashlightReveal`, with `:deep(.layer.dim)` lifting dim to `--grey-300`.

**`.logo-positioner` + `.logo`** — logo is absolutely positioned (`right: 8vw; top: 50%; translateY(-50%)`) so it doesn't pull the centred hero off-axis. The `LogoMark` is wrapped in `FlashlightReveal hidden` — fully invisible until the flashlight passes over it. One-shot `logo--flourish` on intro, continuous `logo--breath` after.

Under 880px: `.logo-positioner` drops back into flow under the mission (`position: static`), `--stagger` shrinks to `clamp(20px, 6vw, 36px)`, mission `align-self: stretch` so it wraps naturally instead of pinning right. Touch devices skip both the flashlight intro sweep and the dim/bright reveal (content renders at the bright color by default).

### AboutView (`/about`) — nav label: "Practice"
Six sections in order:
1. **Intro** — 2-col grid: heading left, 2 body paragraphs right (first has `.drop-cap`)
2. **Services** — `ServiceRow` × 3: Web, Brand, Marketing
3. **Selected Work** — `CaseStudyCard` × 4 in 2-col grid (**all placeholder**)
4. **Engagement** — `ProcessStep` × 4: Brief, Design, Build, Handover
5. **Clients** — serif names separated by hairline borders (**all placeholder**)
6. **Stats** — 4-col grid of big serif numbers (**all placeholder**)

### ContactView (`/contact`)
- Large serif heading: "Tell us something *worth* making."
- Intro paragraph (brief review cadence)
- 2-col contact grid with 4 blocks: New Business email, Studio address, Press email, Elsewhere links
- Footer: `© Commerce Consolidated MMXXVI · All rights reserved`

## Components detail

### Naming gotcha — `.reveal` is global
The scroll-reveal directive uses the global class `.reveal` (in `main.css`) which sets `opacity: 0` until `.is-visible` is added. **Do not** use `.reveal` as a class name on any other component — `FlashlightReveal`'s wrapper is intentionally `.fl-root` to avoid hiding its content. Any new component that introduces a class named `reveal` will silently render invisible.

### `FlashlightReveal.vue`
Props: `hidden: boolean` (default false), `radius: number` (default 220)
- Slot-based: any content (text, SVG, etc.) can be wrapped in the reveal effect
- Renders two layers: `.dim` (grey-700, base) and `.bright` (white, masked), stacked absolutely
- `.bright` uses CSS `mask-image: radial-gradient(circle var(--radius) at var(--x) var(--y))` — tracks mouse position to reveal bright layer
- When `hidden=true`, the dim base is omitted entirely — content is fully invisible except where the flashlight passes (used for the logo on Home)
- Mouse position set via `el.style.setProperty('--x', ...)` on `mousemove`

### `LogoMark.vue`
Props: `size: number` (default 140)
- Inline SVG: outlined square (98×98 viewBox 100), dashed horizontal midline, "CC" monogram (Geist Mono), "EST · MMXXVI" caption
- Uses `currentColor` so the parent (typically inside `FlashlightReveal`) controls fill

### `CustomCursor.vue`
- Hidden on touch devices (`ontouchstart` check)
- `translate(x, y)` via `:style` binding (no lag CSS)
- Expands from 6px → 32px when hovering `a` or `button`
- `mix-blend-mode: difference` — appears white on dark, dark on white

### `NavBar.vue`
- Logo: `Commerce <em>Consolidated</em>` serif, links to `/`
- Three links: Index (`/`), Practice (`/about`), Contact (`/contact`)
- Active link gets full underline via `.router-link-active::after { width: 100% }`
- `mix-blend-mode: difference` — nav stays visible over any background

### `ServiceRow.vue`
Props: `number`, `title`, `description`, `deliverables: string[]`
Grid: `64px | 200px | 1fr | 160px` (number / title / description / deliverables)

### `CaseStudyCard.vue`
Props: `client`, `discipline`, `summary`, `year`, `placeholder: boolean`
Card has hover border highlight. "View case →" link currently points to `#`.

### `ProcessStep.vue`
(Not read — likely: `number`, `title`, `duration`, `description` props, stacked flex layout)

### `GrainOverlay.vue`
Fixed SVG fractalNoise grain texture, `opacity: 0.5`, `mix-blend-mode: overlay`, `pointer-events: none`, `z-index: 1`

### `CornerMarks.vue`
Four fixed SVG L-shaped corner brackets at viewport corners, `--grey-700`, `z-index: 200`

## What's placeholder — needs replacing with real client content
| Location | What to replace |
|---|---|
| `AboutView.vue` — `caseStudies` array | Real client names, disciplines, summaries, years; wire up case study links |
| `AboutView.vue` — `clients` array | Real client/brand names |
| `AboutView.vue` — `stats` array | Accurate figures (engagements, sectors, avg weeks) |
| `ContactView.vue` — `blocks` | Real email addresses, correct studio address, real social hrefs |
| `CaseStudyCard.vue` — `view-link` `href` | Real case study URLs or route |
| `HomeView.vue` — meta strip label | Update "Q3" availability as needed |

## Conventions to follow
- All styles are **scoped per component** (`<style scoped>`) — no global classes except `.label`, `.label--lg`, `.serif` from `main.css`
- Use `<script setup>` (Composition API) for all new components
- Props defined with `defineProps()` — no TypeScript, plain JS objects
- New views go in `src/views/`, new components in `src/components/`
- Register new routes in `src/router/index.js`
- `cursor: none` is global — never add `cursor: pointer` in component CSS
- Serif font for display/headings, sans for labels/body
- `<em>` inside headings = italic serif + `--grey-300` colour (consistent with existing pattern)
- Section labels always: `<p class="label label--lg section-label">— Section Name</p>`
