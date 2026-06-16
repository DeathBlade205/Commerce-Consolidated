<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import FlashlightReveal from '../components/FlashlightReveal.vue'
import LogoMark from '../components/LogoMark.vue'
import { hasFinePointer } from '../composables/useFinePointer.js'
import { useBootReveal } from '../composables/useBootReveal.js'
import { useI18n } from '../composables/useI18n.js'

const { bootDone } = useBootReveal()
const { t } = useI18n()

// `entered` flips from false → true on the next animation frame after mount.
// Elements have their final visible state by default; while `entered` is false
// the wrapper adds an `is-pre-enter` class that hides them. Transitioning from
// hidden → visible avoids the `animation: forwards` failure mode where a missed
// animation leaves the element stuck at opacity 0.
const entered = ref(false)
const logoFlourish = ref(false)
const logoBreath = ref(false)
let sweepRaf = 0
let sweepCancelled = false

// No hover-capable pointer → no flashlight sweep (content is already fully
// visible via FlashlightReveal's touch fallback).
const isTouch = !hasFinePointer()

function dispatchMove(x, y) {
  const ev = new MouseEvent('mousemove', {
    clientX: x,
    clientY: y,
    bubbles: true,
    cancelable: true,
    view: window,
  })
  window.dispatchEvent(ev)
}

// Auto-flashlight intro: trace a path across title -> logo -> hint so the page
// reveals itself once before handing control back to the real cursor.
// Skipped on touch devices (no hover semantics — the sweep just flickers content
// that's already fully visible via FlashlightReveal's touch fallback).
function runIntroSweep() {
  if (isTouch) return
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const w = window.innerWidth
  const h = window.innerHeight
  const waypoints = [
    { x: w * 0.30, y: h * 0.40, hold: 0 },    // title start
    { x: w * 0.60, y: h * 0.46, hold: 0 },    // mid title
    { x: w * 0.78, y: h * 0.50, hold: 240 },  // logo (linger)
    { x: w * 0.50, y: h * 0.58, hold: 120 },  // hint
    { x: -9999, y: -9999, hold: 0 },          // off-screen, release
  ]
  const segMs = 620
  let segIdx = 0
  let segStart = performance.now()
  let prev = waypoints[0]
  // Trigger the logo flourish slightly before the sweep arrives there.
  // Once the flourish finishes (~1.4s), switch the logo into its ongoing breath.
  setTimeout(() => { logoFlourish.value = true }, segMs * 1.6)
  setTimeout(() => { logoBreath.value = true }, segMs * 1.6 + 1400)

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  function frame(now) {
    if (sweepCancelled) return
    const target = waypoints[segIdx + 1] || waypoints[waypoints.length - 1]
    const t = Math.min(1, (now - segStart) / segMs)
    const e = easeInOutCubic(t)
    const x = prev.x + (target.x - prev.x) * e
    const y = prev.y + (target.y - prev.y) * e
    dispatchMove(x, y)
    if (t >= 1) {
      segIdx++
      if (segIdx >= waypoints.length - 1) return // done
      prev = waypoints[segIdx]
      segStart = now + target.hold
      if (target.hold > 0) {
        setTimeout(() => { sweepRaf = requestAnimationFrame(frame) }, target.hold)
        return
      }
    }
    sweepRaf = requestAnimationFrame(frame)
  }
  sweepRaf = requestAnimationFrame(frame)
}

function cancelSweepOnUserMove(e) {
  // Cancel only on a real (trusted) mouse move from the user
  if (e.isTrusted) {
    sweepCancelled = true
    cancelAnimationFrame(sweepRaf)
  }
}

// Entry choreography. `cascade: true` is the normal page-swap entry (staggered
// fade-up). On a fresh page load the BootReveal ripple IS the entry — content
// must already sit in its final state under the shroud so the wavefront
// genuinely uncovers it — and the sweep/breath follow the reveal instead.
function beginEntry(cascade) {
  if (!isTouch) {
    window.addEventListener('mousemove', cancelSweepOnUserMove, { capture: true })
  }
  if (cascade) {
    // Flip `entered` on next paint so the CSS transitions kick in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { entered.value = true })
    })
  } else {
    entered.value = true
  }
  if (isTouch) {
    // No flourish path on touch — drop the logo straight into ambient breath
    // after the entry settles.
    setTimeout(() => { logoBreath.value = true }, cascade ? 1600 : 900)
  } else {
    setTimeout(runIntroSweep, cascade ? 500 : 300)
  }
}

onMounted(() => {
  if (bootDone.value) {
    beginEntry(true)
  } else {
    entered.value = true
    watch(bootDone, () => beginEntry(false), { once: true })
  }
})

onBeforeUnmount(() => {
  sweepCancelled = true
  cancelAnimationFrame(sweepRaf)
  window.removeEventListener('mousemove', cancelSweepOnUserMove, { capture: true })
})
</script>

<template>
  <main class="home" :class="{ 'is-pre-enter': !entered }">
    <!-- Hero composition: title block, vertical divider, logo — all in a single
         flex row so align-items:center keeps every element on the same Y axis
         and the gap controls horizontal spacing. No more competing absolute
         positions. -->
    <div class="hero-row">
      <div class="hero-stack">
        <h1 class="title enter enter--2">
          <FlashlightReveal :radius="280">
            <span class="title-text">
              <span class="title-line title-line--1">Commerce</span>
              <span class="title-line title-line--2">Consolidated</span>
            </span>
          </FlashlightReveal>
        </h1>

        <!-- Subtitle directly under the title (per "subtitle text" sketch
             annotation). One short line stating what the studio does. -->
        <div class="subtitle enter" style="--enter-delay: 520ms;">
          <FlashlightReveal :radius="240">
            <span class="subtitle-text">{{ t('home.subtitle') }}</span>
          </FlashlightReveal>
        </div>

        <div class="hint enter enter--3">
          <FlashlightReveal :radius="220">
            <span class="hint-text">{{ t('home.hint') }}</span>
          </FlashlightReveal>
        </div>
      </div>

      <!-- Vertical divider sits between title block and logo via flex gap. -->
      <span class="hero-divider enter enter--3" aria-hidden="true" />

      <div class="hero-logo enter enter--3">
        <div
          class="logo"
          :class="{ 'logo--flourish': logoFlourish, 'logo--breath': logoBreath }"
        >
          <FlashlightReveal hidden :radius="220">
            <LogoMark :size="220" />
          </FlashlightReveal>
        </div>
      </div>
    </div>

    <!-- Big directional callouts at the bottom corners. Per the sketch:
         "Large text to make it clear that they are directions to go in."
         The page is conceptually a horizontal line: Process sits on the left,
         Contact on the right. Scrolling triggers the swap (see useScrollNav);
         clicking these links also works. -->
    <nav class="hero-nav enter enter--5" aria-label="Other pages">
      <RouterLink to="/process" class="hero-nav__link hero-nav__link--left">
        <FlashlightReveal :radius="220">
          <span class="hero-nav__inner">
            <span class="hero-nav__arrow" aria-hidden="true">
              <span class="arrow-h">←</span><span class="arrow-v">↑</span>
            </span>
            <span class="hero-nav__label">{{ t('nav.process') }}</span>
          </span>
        </FlashlightReveal>
        <FlashlightReveal :radius="160">
          <span class="hero-nav__cue">{{ t('common.scrollUp') }}</span>
        </FlashlightReveal>
      </RouterLink>
      <RouterLink to="/contact" class="hero-nav__link hero-nav__link--right">
        <FlashlightReveal :radius="220">
          <span class="hero-nav__inner">
            <span class="hero-nav__label">{{ t('nav.contact') }}</span>
            <span class="hero-nav__arrow" aria-hidden="true">
              <span class="arrow-h">→</span><span class="arrow-v">↓</span>
            </span>
          </span>
        </FlashlightReveal>
        <FlashlightReveal :radius="160">
          <span class="hero-nav__cue">{{ t('common.scrollDown') }}</span>
        </FlashlightReveal>
      </RouterLink>
    </nav>
  </main>
</template>

<style scoped>
.home {
  /* svh = small viewport height: the page never scrolls, so the mobile URL
     bar never collapses — plain 100vh would push the bottom nav under it. */
  min-height: 100vh;
  min-height: 100svh;
  position: relative;
  padding: 140px 64px 180px; /* bottom padding leaves room for hero-nav + meta strip */
  display: flex;
  flex-direction: column;
  align-items: center;     /* horizontally centre the hero stage */
  justify-content: center; /* vertically centre the hero composition */
  gap: 72px;
  isolation: isolate;
  overflow: hidden;
}

/* ---- Staggered entry ----
   Default state is VISIBLE. The .is-pre-enter modifier (toggled off by `entered`
   on mount) holds the hidden state, and removing it triggers a transition into
   place. This avoids `animation: forwards` getting stuck if the animation is
   ever skipped (HMR, tab visibility, etc.). */
.enter {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 900ms cubic-bezier(0.2, 0.7, 0.2, 1) var(--enter-delay, 0ms),
    transform 900ms cubic-bezier(0.2, 0.7, 0.2, 1) var(--enter-delay, 0ms);
}
.home.is-pre-enter .enter {
  opacity: 0;
  transform: translateY(18px);
}
.enter--1 { --enter-delay: 100ms; }
.enter--2 { --enter-delay: 350ms; }
.enter--3 { --enter-delay: 700ms; }
.enter--4 { --enter-delay: 1000ms; }
.enter--5 { --enter-delay: 1350ms; }

@media (prefers-reduced-motion: reduce) {
  .enter {
    transition: none;
  }
  .home.is-pre-enter .enter {
    opacity: 1;
    transform: none;
  }
}

/* Hero layout: title block, divider, logo — sit in a single flex row so they
   share one Y axis (align-items: center) and one gap-based spacing rhythm.
   No competing absolute positions, no manual translateX hacks. */
.hero-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(48px, 7vw, 110px);
}

.hero-stack {
  display: flex;
  flex-direction: column;
  /* Left-anchor the column so the subtitle + hint align with the title's
     left edge. */
  align-items: flex-start;
  gap: 32px;
}

.title {
  margin: 0;
  font-weight: 400;
  text-align: left;
}

/* Staircase title: "Commerce" on top-left, "Consolidated" indented below.
   Each line is its own block so the indent on line 2 doesn't affect line 1. */
.title-text {
  display: flex;
  flex-direction: column;
  font-family: var(--font-mono);
  font-size: clamp(32px, 4.6vw, 68px);
  line-height: 1.05;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  font-weight: 500;
}

.title-line {
  display: block;
}

/* Subtitle: one short factual line directly under the title. Brighter than
   the hint (it's content, not a UI instruction) but smaller than the title.
   Left-aligned to "Commerce"'s left edge (matches the title block). */
.subtitle {
  text-align: left;
}

.subtitle-text {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: clamp(12px, 1vw, 15px);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 400;
}

/* Subtitle dim level matched to the hint below — they sit as a paired block
   of secondary text, both barely-visible until the flashlight passes. */
.subtitle :deep(.layer.dim) {
  color: rgba(255, 255, 255, 0.08);
}

/* Hint sits under the subtitle — a faint instruction about the flashlight
   interaction. Almost invisible by default; only readable when the cursor
   (flashlight) is right on top of it. */
.hint {
  text-align: left;
}

.hint-text {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: clamp(11px, 0.85vw, 13px);
  letter-spacing: 0.16em;
  text-transform: lowercase;
  font-weight: 400;
}

/* Crush the hint's dim layer: barely above background. Only fully readable
   when the flashlight passes over it. */
.hint :deep(.layer.dim) {
  color: rgba(255, 255, 255, 0.08);
}

/* Bottom Process / Contact navigation hints — sit above the meta strip. */
.hero-nav {
  position: absolute;
  bottom: 104px;
  left: 64px;
  right: 64px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1;
  font-family: var(--font-mono);
  pointer-events: none; /* let the FlashlightReveal child handle pointer events */
}

.hero-nav__link {
  pointer-events: auto;
  text-decoration: none;
  color: inherit;
}

/* Each link is a two-line block: big directional label on top, small "scroll"
   cue underneath so the swipe affordance is discoverable. */
.hero-nav__link {
  display: inline-flex;
  flex-direction: column;
  gap: 8px;
}

.hero-nav__link--left  { align-items: flex-start; }
.hero-nav__link--right { align-items: flex-end; }

.hero-nav__inner {
  display: inline-flex;
  align-items: center;
  gap: 18px;
  font-size: clamp(22px, 2.4vw, 34px);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 500;
}

/* Desktop = horizontal page-line (← →). The vertical glyphs are mobile-only,
   where navigation is a vertical swipe (↑ Process / ↓ Contact). */
.arrow-v { display: none; }

.hero-nav__arrow {
  font-family: var(--font-mono);
  font-size: 1.2em;
  line-height: 1;
  transition: transform 280ms cubic-bezier(0.2, 0.7, 0.2, 1);
}

.hero-nav__link--left:hover  .hero-nav__arrow { transform: translateX(-8px); }
.hero-nav__link--right:hover .hero-nav__arrow { transform: translateX(8px); }

/* Tiny secondary cue: "scroll up" / "scroll down". Same dim-by-default
   treatment as everything else on the home page. */
.hero-nav__cue {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.26em;
  text-transform: uppercase;
}

/* Vertical hairline — flex automatically centers it vertically between the
   title block and the logo via align-items: center on .hero-row, and the
   gap on .hero-row decides how far it sits from each side. */
.hero-divider {
  width: 1px;
  height: 240px;
  background: var(--hairline);
  flex-shrink: 0;
}

/* Logo wrapper — flex flow handles vertical centering. The .logo child still
   owns its own entry / flourish / breath transforms independently. */
.hero-logo {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  pointer-events: none;
}

.logo {
  color: var(--grey-100);
  transform-origin: center;
  will-change: transform, filter;
}

/* Flourish: scale up + rotate slightly, then settle. Class is added when the
   intro sweep reaches the logo. Layout positioning lives on the .hero-row
   flex parent, so these transforms only need to handle the animation. */
.logo--flourish {
  animation: flourish 1400ms cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes flourish {
  0%   { transform: scale(0.88) rotate(-6deg); filter: blur(2px); }
  35%  { transform: scale(1.08) rotate(3deg);  filter: blur(0); }
  60%  { transform: scale(0.98) rotate(-1deg); }
  100% { transform: scale(1) rotate(0); }
}

/* Continuous breath after the flourish settles — keeps the logo alive without
   competing with the title. ~7s cycle, very subtle range. */
.logo--breath {
  animation: breath 7s ease-in-out infinite;
}

@keyframes breath {
  0%, 100% { transform: scale(1) rotate(0deg); }
  50%      { transform: scale(1.022) rotate(0.6deg); }
}

@media (prefers-reduced-motion: reduce) {
  .logo--flourish,
  .logo--breath {
    animation: none;
  }
}

@media (max-width: 880px) {
  .home {
    padding: 110px 22px 140px;
    gap: 36px;
  }

  /* Mobile: hero row collapses to a vertical stack — title on top, logo
     beneath — so the divider isn't useful here. */
  .hero-row {
    flex-direction: column;
    gap: 28px;
  }

  .hero-divider {
    display: none;
  }

  .hero-stack {
    gap: 20px;
    align-items: center; /* center text under the title when stacked */
  }

  .title-text {
    font-size: clamp(28px, 9vw, 44px);
    line-height: 1.08;
    white-space: normal; /* allow wrapping on narrow viewports */
  }

  /* Subtitle was running edge-to-edge — drop the size + tracking so it sits
     comfortably within the page padding and wraps if it must. */
  .subtitle-text {
    font-size: 11px;
    letter-spacing: 0.04em;
    line-height: 1.5;
    text-align: center;
  }

  /* "use cursor to look around" makes no sense on touch — hide. */
  .hint {
    display: none;
  }

  /* Swipe is vertical on mobile, so the arrows point up/down, not left/right. */
  .arrow-h { display: none; }
  .arrow-v { display: inline; }

  .hero-nav {
    left: 22px;
    right: 22px;
    bottom: 92px;
  }

  .hero-nav__inner {
    font-size: 18px;
    gap: 10px;
  }

  .hero-nav__cue {
    font-size: 9px;
    letter-spacing: 0.22em;
  }
}
</style>
