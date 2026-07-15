# Commerce Consolidated — Agency Website

## What this is
Website for **Commerce Consolidated**, a small Sydney digital agency offering Web, Brand, and Marketing services. Positioned as restrained, high-craft, typographic — minimal dark aesthetic. Think studio rather than agency.

**Stack:** Vue 3 (Composition API `<script setup>`) + Vite + vue-router 4 + pnpm. No UI library, no Tailwind — all scoped CSS per component.

**Run dev:** `pnpm dev` (served at `http://127.0.0.1:5174`)
**Build:** `pnpm build`
**Live:** https://commerce-consolidated.vercel.app (Vercel — SPA deep-link refresh depends on the rewrites in `vercel.json`)

---

## Design vision (capture before changing anything)

The site is built around a **single conceptual mechanic**: scrolling moves you horizontally along a "page-line" of three pages, with full slide animations between them. Internally the Process page is a 3-step deck that you scroll through before the next scroll continues onto the next page.

The aesthetic is **noir-typographic with a flashlight metaphor**. Text sits at near-invisible greys by default; a soft white "flashlight" zone follows the cursor and reveals brighter text where it passes. Combined with the custom crosshair-like cursor (small white dot + 40px trailing ring), the page reads as something the user *uncovers* rather than reads.

User intent (from conversation):
- Restrained, high-craft, studio-grade — not flashy agency
- Founded **2026** (MMXXVI)
- Bilingual EN / 中 — real i18n (see i18n section); Chinese strings are DeepL-sourced
- "Do not overload area with text or information" — strip clutter aggressively
- Animations: **threshold-triggered, full-play** — never gradual / scroll-position-tied
- Logo is placeholder ("I'll work on logo later")

---

## Page-line model — the single source of architecture

Three pages live on a horizontal number line via `route.meta.x`:

```
  -1            0              1
[Process] ← [Home] → [Contact]
```

- `meta.x` drives the slide direction in `App.vue` (`slide-left` when going right along the line, `slide-right` when going left)
- `useScrollNav` reads the current `meta.x` and the direction of scroll/key to pick the neighbour page
- The same line governs ArrowLeft/ArrowRight keyboard nav and the bottom `PageProgressBar`
- Three vertical "pages" + ProcessView's internal 3-step deck = effectively a 5-step linear journey:
  `Process step1 → step2 → step3 → Home → Contact`

Routes: `/process` (was `/about` — old path 301s via a router redirect), `/`, `/contact`, plus a catch-all that redirects unknown paths to `/`. Deep-link refresh on static hosts is covered by `dist/404.html` (a copy of `index.html` emitted by the `spa-404-fallback` plugin in `vite.config.js`) and `vercel.json` rewrites.

When extending: any new route MUST have a `meta.x` integer, and `ORDERED_PATHS` in `useScrollNav.js` MUST be updated in sync.

---

## File structure (current)

```
src/
  main.js                          # App entry — mounts Vue, imports router + CSS, registers v-reveal directive
  App.vue                          # Root composition: CustomCursor, GrainOverlay, CornerMarks, NavBar,
                                   #   PageProgressBar, RouterView wrapped in a directional slide Transition.
                                   #   Calls useScrollNav() to attach wheel/touch/key listeners globally.
  router/index.js                  # 3 routes, each with meta.x (Process -1, Home 0, Contact 1),
                                   #   plus /about → /process redirect and a catch-all → /.
                                   #   scrollBehavior returns top:0 (we don't actually scroll the doc).
  composables/
    useScrollNav.js                # ★ Central nav engine. See "Scroll/keyboard navigation" below.
    useFinePointer.js              # hasFinePointer() — (hover:hover)+(pointer:fine) media check.
                                   #   Single source of truth for cursor/flashlight device gating.
    useI18n.js                     # Lightweight i18n (no dep): reactive locale + t(path) over
                                   #   i18n/messages.js. zh falls back to en per-key. Persists to
                                   #   localStorage, sets <html lang>. NavBar flips the locale.
  i18n/
    messages.js                    # en (source of truth) + zh (DeepL-generated, target ZH). Brand
                                   #   terms / social proper nouns / handles are NOT here.
    useBootReveal.js               # bootDone ref + markBootRevealDone(). Pages gate their entry
                                   #   choreography on it (HomeView waits for the boot ripple).
  directives/
    reveal.js                      # v-reveal — IntersectionObserver-based scroll reveal. Used in ContactView.
                                   #   Adds .reveal + .reveal--from-{up,left,right} classes that animate in.
  assets/styles/
    base.css                       # Custom props, reset, body styles. cursor:none gated to
                                   #   (hover:hover)+(pointer:fine) devices; overscroll-behavior-y none.
    main.css                       # .label, .label--lg, .serif; .reveal transition classes for v-reveal.
  views/
    HomeView.vue                   # Landing — title block + logo + bottom corner nav callouts.
    ProcessView.vue                # Process — 3-step slide deck. Registers as step host with useScrollNav.
    ContactView.vue                # Contact — section label, heading, intro, contact grid (4 blocks).
  components/
    BootReveal.vue                 # Page-LOAD animation (plays once per full load): a single white
                                   #   droplet falls into the centre and its impact throws a white
                                   #   ripple that UNCOVERS the page (black shroud erased behind the
                                   #   wavefront, not faded in). Greyscale only. ~1.5s. Click skips.
                                   #   Locks scroll nav while up; honours prefers-reduced-motion.
                                   #   ROBUSTNESS: a MAX_MS watchdog force-calls finish() so a stalled
                                   #   rAF (bg tab / slow GPU) can never leave the site locked under
                                   #   the shroud. finish() is idempotent (the `done` guard).
                                   #   PERF CONTRACT: shroud + wave are ONE 2D canvas (a few fills
                                   #   and one gradient stroke per frame). No CSS masks, no SVG
                                   #   filters, no blurs — glow is a radial-gradient stroke, the
                                   #   organic edge a precomputed noise polygon. Earlier CSS-mask +
                                   #   displacement-filter versions were unfixably janky on real GPUs
                                   #   — do not reintroduce. GrainOverlay is v-show-gated off in
                                   #   App.vue until bootDone (its blend pass recomposites every frame).
    NavBar.vue                     # Fixed top nav: CC LogoMark (compact) + sliding EN/中 language switch.
    CustomCursor.vue               # Dot + trailing ring. Native cursor hidden site-wide.
    PageProgressBar.vue            # Fixed bottom-centre. 3 horizontal bars + labels. Click to nav.
                                   #   Current page = wider + brighter. Neighbour bar charges as user scrolls.
    PageEdgeHint.vue               # Big "scroll up/down → [Label]" callout. Only used in ContactView (top).
    FlashlightReveal.vue           # Slot wrapper. Dim base + bright layer masked by radial gradient at cursor.
                                   #   `hidden` prop omits dim base (used for logo on Home).
    LogoMark.vue                   # <img> of assets/logo.png (the brand mark). `compact` prop kept for
                                   #   API compat; same artwork at all sizes.
    GrainOverlay.vue               # Fixed SVG fractalNoise grain, mix-blend-mode: overlay.
    CornerMarks.vue                # Four fixed L-shaped corner brackets.
```

### Orphaned files (kept for now, no references)
`ProcessRow.vue`, `ProcessStep.vue`, `ServiceRow.vue`, `CaseStudyCard.vue`, `BackgroundField.vue` — leftover from earlier iterations of the Process page. Safe to delete if not bringing back the services / case studies / clients / stats sections.

---

## Scroll/keyboard navigation (`useScrollNav.js`) — read this carefully

**Constants** (tune here, not at call sites):
- `WHEEL_THRESHOLD = 450` — wheel-delta needed to commit a swap
- `LOCK_MS = 900` — lockout window after a swap
- `TOUCH_THRESHOLD = 100` — finger-travel px for swipe swap (either axis). Touch nav takes the DOMINANT axis of the swipe: horizontal swipes are the primary phone gesture (carousel semantics — swipe LEFT advances along the page-line / step deck, swipe RIGHT retreats, matching the slide animation), vertical swipes still work for continuity. Horizontal page-intent swipes skip the atTop/atBottom edge requirement (no x overflow to fight); vertical ones still require the scroll edge.
- `DECAY_IDLE_MS = 650` — idle time before charge starts draining. Must exceed the finger-lift gap between TRACKPAD swipe gestures (~400-600ms): at the old 320ms, repeated small two-finger swipes (~180px each) fully drained between swipes and could NEVER reach the threshold ("can't keep scrolling to the next page" on laptops).
- `DECAY_RATE = 0.035` — fraction drained per RAF frame after idle (an abandoned partial charge still drains in about a second)
- `FRESH_GAP_MS = 140` / `GUARD_MAX_MS = 2500` — post-swap inertia tail guard. A hard trackpad flick emits wheel events for 2s+ (past LOCK_MS) and the leftover tail used to re-charge a SECOND swap (one flick on Contact blew through Home onto Process). After a swap, same-direction events with tight gaps and a DECAYING |delta| envelope are swallowed; a pause > FRESH_GAP_MS, a direction reversal, or a sharply rising |delta| (deliberate re-flick) releases immediately. Time caps alone don't work — long tails still hold >450px of charge 1.6s in.

**State** (module-level reactive refs, NOT instance-scoped):
- `scrollCharge: Ref<number>` — signed -1..1 ratio of accumulated charge / threshold. **Only updated when intent is `page`** (so PageProgressBar doesn't fill during step charging).
- `scrollLocked: Ref<boolean>` — true during the swap animation window.
- `stepHost: Ref<host | null>` — at most one. The page that owns the wheel for internal step nav.

**Intent model** — the wheel handler asks `intentFor(direction)`:
- No step host registered → `'page'`
- Step host registered AND `getCurrentStep() + direction` is within `[0, count)` → `'step'`
- Step host registered AND that would overflow → `'page'` (fall through to page swap)

Page intent additionally requires `atTop()` or `atBottom()` (so a long page's internal scroll isn't hijacked). Step intent doesn't — the host page has no scroll, the wheel always belongs to the host. `atTop`/`atBottom` use `document.scrollingElement` with `EDGE_SLACK = 3` px (browsers settle scroll at fractional offsets, so strict equality made the scroll-up edge unreachable — that was the "can't scroll up to previous page" bug).

**Browser-nav hijack (mb4/mb5 prevention):** `onWheel` calls `e.preventDefault()` on *every* event it owns — step nav, or page nav while sitting at an edge — not just at the threshold, so the browser never bounces, scroll-chains, or fires history back/forward mid-charge. Horizontal/tilt wheel (`|deltaX| > |deltaY|`) is eaten outright. Events during `scrollLocked` are also preventDefaulted to swallow the inertial tail. `overscroll-behavior: none` (both axes, base.css) backs this for trackpad/touch overscroll. Mid-page scroll (not at an edge) is deliberately NOT prevented, so Contact's long content scrolls normally.

**Step host API** — pages call `registerStepHost(host)`:
```js
{
  count: number,                  // total steps in the deck
  getCurrentStep: () => number,   // explicit getter — DO NOT pass a ref, see "Known traps"
  setStep: (n: number) => void,   // callback when nav advances/retreats
}
```
Returns an unregister fn. Pages must register **synchronously in setup** (NOT in onMounted) — see "Known traps."

**Keyboard:**
- `ArrowLeft` / `ArrowRight` — page nav (always)
- `ArrowUp` / `ArrowDown` / `Space` — owned by step host if registered (handled by ProcessView's own listener)
- Suppressed when target is `INPUT`, `TEXTAREA`, or contenteditable

---

## Views

### HomeView (`/`) — the landing
Single viewport hero. No document scroll (`overflow: hidden`). Layout:

```
                                            CC
[ COMMERCE                          ┊       ┌─┐
  CONSOLIDATED              divider ┊       │ │   <-- 220px logo
                                    ┊       └─┘
  Digital practice. Web, brand,
  marketing.
  use cursor to look around                            ]

  ←  PROCESS                              CONTACT  →
     scroll up                          scroll down
```

- `.hero-row` is a single flex row: `.hero-stack` (title + subtitle + hint), `.hero-divider` (1px × 240px), `.hero-logo`. `align-items: center` puts everything on one Y axis — no `position: absolute` games.
- Title is two flex-column lines, both left-aligned (no staircase indent — user explicitly aligned them).
- Subtitle and hint both crushed to `rgba(255,255,255,0.08)` dim — only readable when the flashlight is over them.
- Logo is `LogoMark size=220` wrapped in `<FlashlightReveal hidden>` — fully invisible until the cursor passes. A subtle `.logo-sub` cue ("click to view past work", i18n `home.logoHint`) sits under the mark with the same crushed-dim flashlight treatment as the hint. Wrapped in `<a class="logo-link">` that opens a past project in a new tab (`pastSites` array — PLACEHOLDER URLs). One-shot `flourish` on first load (cleared on animationend), and replays on **hover** via `.logo-link:hover .logo`. **No idle/breath animation** (removed — user found the drift distracting).
- Bottom corner callouts (`← PROCESS` / `CONTACT →`) at `clamp(22px, 2.4vw, 34px)` with small `SCROLL UP` / `SCROLL DOWN` cues underneath. These are real RouterLinks too. **Mobile:** arrows stay horizontal (`← PROCESS` / `CONTACT →`) — phones navigate with horizontal swipes now — and the small cue text swaps per device (`.cue-scroll` "scroll up/down" on desktop, `.cue-swipe` "swipe right/left" on mobile, i18n `common.swipeLeft/swipeRight`), toggled by the 880px media query.

User instructed: **removed** the eyebrow strap (`DIGITAL PRACTICE · SYDNEY · EST 2026`), the long mission paragraph, and the bottom meta strip (`Currently taking briefs` / Sydney coords) — all "clutter."

### ProcessView (`/process`) — Process, the 3-step deck
**This is NOT a long scrollable page.** It's a fixed-viewport step deck. `overflow: hidden`, content fits in one viewport.

Layout: heading on top, then a `.step-stage` (relative, overflow hidden) holding one `.step-pair` per step — a flex row of two bordered cards:
- `.step-card--marker` (30% wide) — Step number + title
- `.step-card--body` (66% wide) — Description + duration

**Conveyor animation:** the pair is keyed by `currentStep` inside a `<Transition>`; advancing slides the whole outgoing pair off to the LEFT while the new pair slides in from the RIGHT (`step-next`), stepping back plays the mirror (`step-prev`, direction tracked in `stepDir`). `.step-pair--flip` (`flex-direction: row-reverse`) alternates which side the small marker sits on per step. Pairs are absolute against the stage on desktop so cards fill its height; mobile reverts them to in-flow stacks with the leaving pair absolute during the slide.

Steps (content lives in `i18n/messages.js` `process.steps[]`; only `number` + `side` are local layout meta in the view):
- Step 1 (The Brief) — `side: 'left'`, emphasis word **collaborative** (协作)
- Step 2 (Refinement) — `side: 'right'`, emphasis word **considered** (用心)
- Step 3 (Build & Launch) — `side: 'left'`, emphasis word **consolidated** (整合)

The heading "A studio for *{word}* commerce." swaps its emphasis word per step (cross-fades via a `word-fade` Transition, `mode=out-in`). `currentData` is a computed over `t(\`process.steps.${i}.…\`)` so it's reactive to both step and locale.

A `.step-dots` indicator (one dot per step, current lit) sits under the stage inside the centred `.step-deck` wrapper — it's the swipe affordance on touch and taps jump directly via `setStep`. Dots carry a 32px transparent hit area around a 7px `::before` visual.

ProcessView calls `registerStepHost` **synchronously in setup**, providing a getter `() => currentStep.value` (NOT the ref itself — see traps). It also installs its own keydown listener for ArrowUp / ArrowDown / Space for keyboard step nav (skipped when a button/link/input has focus, so native activation wins).

Mobile (`<880px`) collapses the row to a vertical stack — slots become static, side-swap transitions disabled. The `step-fade` leave card is absolutely positioned there so the cross-fade doesn't double the column height mid-transition.

### ContactView (`/contact`)
- `PageEdgeHint` at the top — `direction="up"`, `to="/"`, label `Home`. Clickable; reinforces that scroll-up returns Home.
- Section label, big serif heading ("Tell us how you'll change the *world*." — emphasis on **world**), intro paragraph.
- Contact methods row: each is a logo tile (icon in a circle) with the handle underneath, the whole tile a shortcut link (mailto / social profile). Handles are PLACEHOLDERS. Email/WeChat stay in-page; http(s) links open in a new tab.
- Footer: copyright (brand, untranslated) + rights.

**Single-viewport now (changed):** Contact was a tall document-scroll page, which hid the details below the fold behind `v-reveal` (opacity 0) — users reported "details gone / can't scroll". It's now a centred single-viewport page like Home/Process (`min-height: 100svh`, `.contact__body` flex-centred between the edge hint and footer), no `v-reveal`, so every detail is visible at once. On desktop it fits exactly (no scroll); on small phones it may scroll a little (document scroll still allowed). `useScrollNav` `atTop()` handles scroll-up-to-Home.

---

## Components

### `CustomCursor.vue` — the cursor
Native pointer hidden via `cursor: none` in `base.css` — applied to html, body, and all interactive elements, but **only under the `cc-fine-pointer` class that `useFinePointer.js` stamps on `<html>`**. That module owns the decision: it seeds from `(hover: hover) and (pointer: fine)`, then UPGRADES when a real mouse `pointermove` arrives (Windows convertibles like Surface Pro report touch-primary even with a trackpad attached — the media query alone disabled the cursor + flashlight there). CustomCursor renders from the same reactive ref, so CSS and JS can never disagree (a touchscreen laptop must not end up with no cursor at all). Never downgrades mid-session.

Two layers:
- **`.cursor-dot`** — 6px solid white circle, snapped to exact pointer position (no easing). Grows to 12px on hover over interactive elements. `z-index: 9999`.
- **`.cursor-ring`** — 40px outline circle, trails the dot via critically-damped lerp (`k = 0.22` per frame). Tightens to 22px and brightens on hover. `z-index: 9998`.

Both use `mix-blend-mode: difference` so they invert against any background.

**Hover detection** — per-`mousemove`, not `mouseover/mouseout`. The handler checks `e.target.closest('a, button, [role="button"], input, textarea, select, label')` on every move. This avoids the bubbling-flicker bug where moving between children of a link toggled the hover state off.

Devices without a hover-capable fine pointer render nothing (no pointer to indicate).

### `NavBar.vue` — fixed top
Left: compact `LogoMark size=42` linking to `/`. Right: sliding EN / 中 language switch — both segments visible at all times; the selected one flex-grows and fills with the bright pill background; the other shrinks to a 30px chip. Flex transition (420ms) animates the swap. Drives the real i18n locale via `useI18n().setLocale` (`en` / `zh`).

User explicitly **removed** the `PROCESS` / `CONTACT` links from the top nav per "already at the bottom, redundant at top."

### `PageProgressBar.vue` — fixed bottom centre
Three horizontal bars (Process / Home / Contact), each with a small label underneath. Click any bar to navigate directly to that page.
- Current page: 96px wide bar at 55% opacity, label at `--grey-100`
- Neighbour bars: 56px wide at 35% opacity, labels at `--grey-300`
- During scroll-charge toward a neighbour page, that neighbour bar fills with a bright overlay (scale-x from the side adjacent to the current page)
- `scrollCharge` from useScrollNav drives the fill — **only updates during page intent**, not step intent (intentional: we don't want to mislead users on Process)
- `transition: transform 70ms linear` on the fill — keep it 1:1 with input rather than easing

### `PageEdgeHint.vue`
Big `clamp(22px, 2.4vw, 34px)` directional callout + small "scroll up/down" cue. Used at the top of ContactView for `↑ HOME / scroll up`. Was also at the bottom of AboutView before that view became a step deck.

### `FlashlightReveal.vue` — the dim/bright pair
Slot-based. Renders two stacked layers:
- `.dim` (base, no mask) — defaults to `--grey-500`, can be overridden per-instance via `:deep(.layer.dim) { color: ... }`
- `.bright` (white, masked) — `mask-image: radial-gradient(circle var(--radius) at var(--x) var(--y), …)`. `--x` / `--y` are set on `mousemove` via `el.style.setProperty`.

Props:
- `hidden: boolean` — omit the dim base. Content is fully invisible until the flashlight reaches it. Used for the logo.
- `radius: number` — pixel radius of the bright reveal zone (default 220).

**Naming gotcha — `.reveal` is a global directive class.** The reveal directive uses `.reveal` + `.reveal.is-visible` (in `main.css`) which sets `opacity: 0` until visible. `FlashlightReveal`'s wrapper class is intentionally `.fl-root` (was `.reveal` originally, which silently hid all flashlight content). **Never** name any new class `.reveal` in component CSS.

### `LogoMark.vue`
Renders `<img>` of `src/assets/logo.png`. The supplied artwork (`Downloads/Logo.svg`) was a white circle on an OPAQUE black square (RGBA but all-opaque), positioned off-centre — it showed as a black box on the page. Processed with ImageMagick (luminance→alpha, trim, re-centre on a padded transparent square) into `logo.png`, so it drops onto the dark theme cleanly with no blend hacks. `compact` prop kept for API compatibility (NavBar passes it) but the same artwork is used everywhere.

### `GrainOverlay.vue` / `CornerMarks.vue`
Atmospheric chrome. Fixed-position, low-opacity. Don't touch unless you want the page to feel different.

---

## Design system

### CSS custom properties (`base.css`)
```css
--bg: #0a0a0a              /* near-black page background */
--grey-100: #f5f5f5        /* primary text / headings */
--grey-300: #a8a8a8        /* secondary text, italic serif accents */
--grey-500: #555555        /* muted text, labels, section markers */
--grey-700: #2a2a2a        /* hairlines, corner marks */
--hairline: rgba(255,255,255,0.08)
--font-serif: 'Instrument Serif', Georgia, serif
--font-sans:  'Geist', system-ui, sans-serif
--font-mono:  'Geist Mono', ui-monospace, …  /* squared/geometric — Home title, mono labels */
```

### Global utilities (`main.css`)
- `.label` — 10px sans, 0.28em tracking, uppercase, `--grey-500`
- `.label--lg` — 11px, 0.32em tracking
- `.serif` — `font-family: var(--font-serif)`, weight 400
- `.reveal` / `.reveal--from-{up,left,right}` / `.reveal.is-visible` — directive transition classes

### Layout
- **Nav:** fixed, `padding: 32px 48px`, `mix-blend-mode: difference`
- **Page padding:** `padding: 140px 48px ...` (top clears fixed nav)
- **Max width:** `max-width: 1200px; margin: 0 auto` on view containers
- **Breakpoint:** `880px` (mobile)
- **`cursor: none`** applies site-wide on fine-pointer devices — never add `cursor: pointer` in component CSS (it resurrects the native pointer over that element)
- **Viewport units:** full-viewport pages (`.home`, `.process-page`) use `min-height: 100svh` with a `100vh` fallback — plain `100vh` pushes bottom UI under the mobile URL bar
- **Safe areas:** `PageProgressBar` bottom offset includes `env(safe-area-inset-bottom)`; viewport meta has `viewport-fit=cover`

---

## Conventions
- All styles **scoped per component** (`<style scoped>`) except `.label`, `.label--lg`, `.serif`, `.reveal*`
- `<script setup>` for everything — Composition API, plain JS, no TypeScript
- Props via `defineProps()` with type + default
- **No emojis** in code or comments unless explicitly requested
- Comments: explain **why**, not what. One-liner over multi-line where possible.
- `<em>` inside serif headings = italic + `--grey-300` (consistent pattern)

---

## Known traps (read before changing useScrollNav)

1. **Step host must register synchronously in setup, NOT onMounted.**
   The first wheel event after page-swap can fire before `onMounted` runs. If the host isn't registered yet, intent falls through to `'page'` and triggers an immediate (unwanted) page swap. ProcessView calls `registerStepHost(...)` at the top level of `<script setup>`.

2. **Pass `getCurrentStep: () => currentStep.value` — NOT `currentStep` directly.**
   We used to pass the ref. Vue's proxy/auto-unwrap behaviour through plain-object property access caused inconsistent reads from inside `useScrollNav` (a non-component context). The getter is explicit and bulletproof.

3. **The `.reveal` class is reserved** (see FlashlightReveal section). Use `.fl-root` or another distinct name.

4. **Hover detection must use `mousemove`, not `mouseover/mouseout`.**
   Those events bubble from descendant boundary crosses, which flickers the cursor's hover state off when moving between children of a link. The fix in `CustomCursor.vue` samples `e.target.closest(INTERACTIVE_SELECTOR)` on every `mousemove`.

5. **`scrollCharge` only fills during `'page'` intent.** Don't fill it during step charging or the PageProgressBar will look like it's about to swap pages when it's actually about to swap steps. Mutator is `setAccum(value, intent)`.

6. **Each step swap fires once per threshold-cross and locks for `LOCK_MS`.** If you want chained swaps, increase the threshold rather than removing the lock — inertial wheel events would chain otherwise.

7. **Home page has `overflow: hidden`** — `atTop()` and `atBottom()` both return true on it. That's intentional: any wheel direction can trigger a page swap from Home (up → Process, down → Contact).

8. **The RouterView Transition must start as `'none'`.** vue-router resolves the initial URL asynchronously, so the first page is inserted AFTER the Transition's first render — with a slide name set, every fresh load / refresh plays a full slide-in from offscreen (this looked like the page "dying" on refresh). `App.vue` sets the real slide names in a `router.afterEach` that skips `from === START_LOCATION`.

9. **On a fresh load, HomeView skips its cascade** — when `bootDone` is false at mount, content goes straight to final state so the BootReveal ripple genuinely uncovers it; the cascade only plays on page-swap entries. The flashlight intro sweep always waits for the reveal. Timing coupling lives in `BootReveal.vue`: `CHARGE_MS` must match the CSS draw/fill/flash delays.

10. **Device gating goes through `useFinePointer()`** (a reactive ref) and the `cc-fine-pointer` class it stamps on `<html>`, which gates `cursor: none` in base.css. The primary-pointer media query only SEEDS the value; a real mouse `pointermove` upgrades touch-primary convertibles (Surface Pro) at runtime. Don't reintroduce `ontouchstart`/`maxTouchPoints` checks, and don't gate CSS on the media query directly — Surface-class devices would lose the flashlight + cursor again. Components that need reactivity must use `useFinePointer()` (ref), not a one-shot `hasFinePointer()` snapshot.

11. **`stepHost` must stay a `shallowRef`.** With a plain `ref()`, Vue deep-wraps the registered host object in a reactive proxy, so unregister's `stepHost.value === host` identity check compares proxy vs raw and never passes — the dead host outlived its page and silently ate scroll-up SITE-WIDE (invisibly stepping its unmounted deck back toward 0) until Process was visited again. This was the "can't keep scrolling back to Home" bug.

12. **Fixed-viewport pages must actually fit the viewport.** `.process-page` is `min-height: 100svh`, so on short windows (<~860px) overflowing content makes the DOCUMENT scrollable and every wheel gesture scrolls that dead overflow instead of charging the swap (worst in EN — longer copy). The `@media (max-height: 860px)` compact block in ProcessView plus `NONSCROLL_SLACK` in useScrollNav guard this; keep them if adding content.

---

## Open / future work

- **i18n**: DONE — custom `useI18n` + `i18n/messages.js`. English is the source of truth; Chinese was generated via the DeepL API (target ZH). To re-translate after editing English, re-run the DeepL pass (the generator lives outside the repo). The three Process emphasis words (用心/整合/协作) and the heading scaffolding were hand-set because single adjectives translate poorly out of context.
- **Contact handles**: the email/WeChat/X/Instagram/LinkedIn handles in `ContactView.vue` are PLACEHOLDERS — need the real ones.
- **Logo**: now `assets/logo.png` (processed from the user's supplied artwork). The artwork is essentially a plain white circle — if a more detailed / centred / transparent export is provided, drop it in and remove the ImageMagick step.
- **Home logo links**: `pastSites` in HomeView is PLACEHOLDER URLs — needs the real past-project links (clicking the logo opens one at random in a new tab).
- **Contact content**: emails, address, social hrefs are placeholder. Need real values.
- **Step content**: copy in `processSteps` is decent draft but not finalised.
- **Subtitle copy**: "Digital practice. Web, brand, marketing." was picked from a 3-option question. Easily swappable.
- **Process page**: currently 3 steps — Brief / Design / Build & Launch. User chose to drop services / case studies / clients / stats. If they want them back, the orphaned components are still in the repo.

---

## Conversation history — design decisions and "why"

These are the choices the user has explicitly made or vetoed. Don't re-litigate without reason.

| Decision | Rationale |
|---|---|
| Mono font for hero title (not serif) | "mono nicer" (early iteration). Serif reserved for body emphasis / italic accents. |
| Removed `BackgroundField` canvas | "doesnt look like it fits in the vibe." Just grain + corner brackets now. |
| Page-line model with scroll-trigger swaps | "each swap triggered by scrolling, but not a gradual thing… plays the full animation… sliding across." |
| Process to the LEFT of Home, Contact to the RIGHT | User's mental model: arrows point those directions on Home's bottom callouts. |
| 3-step deck on Process (not scrollable sections) | "Cut everything except the 3 steps." Process is just the engagement steps now. |
| Step change = conveyor slide (REVERSED earlier slot-swap) | User: the boxes crossing each other "looks clunky with that huge box moving around." Now the whole pair slides out left / in from right, sides alternating per step. |
| Custom cursor: dot + ring (not crosshair arms) | Crosshair arms "looks bad because of the plus." Just a dot with an outer ring. |
| Native cursor hidden | "Hide it entirely" (vs keep visible). |
| `PageProgressBar` (bottom centre, 3 bars) | User wanted a charge indicator + escape hatch (click to jump). "Have charge bars active on every page." |
| Charge fill is linear, ~70ms transition | User: "make the scroll more linear, it feels like at the start it scrolls slowly and then quick at the end." |
| Higher wheel threshold (was 320 → 900 → tuned to 450) | "increase the time to scroll to next/prev page" — give human-error buffer. |
| Removed top-nav PROCESS / CONTACT links | "already at the bottom, redundant at top." |
| Removed Home eyebrow + mission + meta strip | "adds clutter" / "not necessary" / "do not overload area with text or information." |
| EN/中 as sliding switch (not toggle button) | User: "make it like a switch so whichever one is toggled is on the larger part of the switch and is highlighted." |
| ArrowUp/Down + Space = step nav, ArrowLeft/Right = page nav | Logical axis match — horizontal keys for horizontal page-line, vertical keys for vertical step deck. |

When making changes, **preserve these choices** unless the user reverses them in conversation.
