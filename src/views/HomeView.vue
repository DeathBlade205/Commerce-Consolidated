<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import FlashlightReveal from '../components/FlashlightReveal.vue'
import LogoMark from '../components/LogoMark.vue'

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

const isTouch =
  typeof window !== 'undefined' &&
  ('ontouchstart' in window ||
    (typeof navigator !== 'undefined' && (navigator.maxTouchPoints ?? 0) > 0))

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

onMounted(() => {
  if (!isTouch) {
    window.addEventListener('mousemove', cancelSweepOnUserMove, { capture: true })
  }
  // Flip `entered` on next paint so the CSS transitions kick in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { entered.value = true })
  })
  if (isTouch) {
    // No flourish path on touch — drop the logo straight into ambient breath
    // after the cascade entry settles.
    setTimeout(() => { logoBreath.value = true }, 1600)
  } else {
    setTimeout(runIntroSweep, 500)
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
    <div class="eyebrow enter enter--1">
      <FlashlightReveal :radius="220">
        <span class="eyebrow-inner">
          <span class="line" />
          <span class="label eyebrow-text">Digital Practice · Sydney · Est. 2026</span>
          <span class="line" />
        </span>
      </FlashlightReveal>
    </div>

    <div class="stage">
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
            <span class="subtitle-text">Digital practice. Web, brand, marketing.</span>
          </FlashlightReveal>
        </div>

        <div class="hint enter enter--3">
          <FlashlightReveal :radius="220">
            <span class="hint-text">use cursor to look around</span>
          </FlashlightReveal>
        </div>
      </div>
    </div>

    <!-- Logo positioned absolutely so it doesn't pull the centred hero off-axis.
         Hidden behind FlashlightReveal until the cursor passes. -->
    <div class="logo-positioner">
      <div
        class="logo enter enter--3"
        :class="{ 'logo--flourish': logoFlourish, 'logo--breath': logoBreath }"
      >
        <FlashlightReveal hidden :radius="180">
          <LogoMark :size="160" />
        </FlashlightReveal>
      </div>
    </div>

    <!-- Big directional callouts at the bottom corners. Per the sketch:
         "Large text to make it clear that they are directions to go in."
         The page is conceptually a horizontal line: Process sits on the left,
         Contact on the right. Scrolling triggers the swap (see useScrollNav);
         clicking these links also works. -->
    <nav class="hero-nav enter enter--5" aria-label="Other pages">
      <RouterLink to="/about" class="hero-nav__link hero-nav__link--left">
        <FlashlightReveal :radius="220">
          <span class="hero-nav__inner">
            <span class="hero-nav__arrow" aria-hidden="true">←</span>
            <span class="hero-nav__label">Process</span>
          </span>
        </FlashlightReveal>
        <FlashlightReveal :radius="160">
          <span class="hero-nav__cue">scroll up</span>
        </FlashlightReveal>
      </RouterLink>
      <RouterLink to="/contact" class="hero-nav__link hero-nav__link--right">
        <FlashlightReveal :radius="220">
          <span class="hero-nav__inner">
            <span class="hero-nav__label">Contact</span>
            <span class="hero-nav__arrow" aria-hidden="true">→</span>
          </span>
        </FlashlightReveal>
        <FlashlightReveal :radius="160">
          <span class="hero-nav__cue">scroll down</span>
        </FlashlightReveal>
      </RouterLink>
    </nav>

    <div class="meta-strip enter enter--5">
      <FlashlightReveal :radius="200">
        <div class="meta-inner meta-inner--left">
          <span class="pulse" aria-hidden="true" />
          <span class="label">Currently taking briefs for Q3</span>
        </div>
      </FlashlightReveal>
      <FlashlightReveal :radius="200">
        <span class="label meta-inner meta-inner--right">Sydney · 33.86°S, 151.20°E</span>
      </FlashlightReveal>
    </div>
  </main>
</template>

<style scoped>
.home {
  min-height: 100vh;
  position: relative;
  padding: 140px 64px 180px; /* bottom padding leaves room for hero-nav + meta strip */
  display: flex;
  flex-direction: column;
  align-items: center;     /* horizontally centre eyebrow + stage */
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

.eyebrow {
  position: relative;
  z-index: 1;
}

.eyebrow-inner {
  display: flex;
  align-items: center;
  gap: 20px;
}

.eyebrow-text {
  white-space: nowrap;
}

.line {
  width: 40px;
  height: 1px;
  background: currentColor;
  opacity: 0.45;
  flex-shrink: 0;
}

/* Hero layout: title block sits LEFT of centre, logo sits a few pixels RIGHT
   of centre — so the eye reads the composition as a title/logo pair across
   the optical midline rather than a centred stack with a distant logo. */
.stage {
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  justify-content: center;
}

.hero-stack {
  display: flex;
  flex-direction: column;
  /* Left-anchor the stack: the staircase title's first line ("Commerce") sets
     the left edge for the subtitle + hint underneath. */
  align-items: flex-start;
  gap: 32px;
  /* Nudge well left of centre so the logo (parked to the right) has clear
     air between the title block and the mark — no overlap on wide viewports. */
  transform: translateX(-32%);
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

/* Line 2 indent — drops "Consolidated" to the right of "Commerce"'s right
   edge so the two lines form the staircase shown in the Figma mockup. */
.title-line--2 {
  padding-left: 2em;
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

.subtitle :deep(.layer.dim) {
  color: var(--grey-300);
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

/* Positioner: parks the logo clearly right of centre, far enough from the
   title block (which is nudged left) that the two read as distinct elements
   across the optical midline. Uses a viewport-scaled offset so the gap
   tracks with the title's clamp()-based size. Kept separate from the .logo
   node so the entry/flourish/breath animations on `.logo` can freely set
   `transform` without losing position. */
.logo-positioner {
  position: absolute;
  left: calc(50% + 14vw);
  right: auto;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  pointer-events: none;
}

.logo {
  color: var(--grey-100);
  transform-origin: center;
  will-change: transform, filter;
}

/* Flourish: scale up + rotate slightly, then settle. Class is added when the
   intro sweep reaches the logo. Positioning lives on `.logo-positioner`, so
   these transforms only need to handle the animation itself. */
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

.meta-strip {
  position: absolute;
  bottom: 48px;
  left: 64px;
  right: 64px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1;
}

/* Push the meta strip's dim layer one notch quieter than the default
   FlashlightReveal grey-500. Per the "do not overload area with text or
   information" annotation — the strip should sit just barely visible until
   the cursor passes over it. */
.meta-strip :deep(.layer.dim) {
  color: var(--grey-700);
}

.meta-strip .pulse {
  opacity: 0.5;
}

.meta-inner {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.meta-inner--right {
  display: inline-block;
}

.pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
  display: inline-block;
  animation: pulse 2.4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@media (max-width: 880px) {
  .home {
    padding: 110px 22px 200px; /* extra bottom for stacked hero-nav + meta strip */
    gap: 36px;
  }

  .eyebrow-inner {
    gap: 14px;
  }

  .line {
    width: 28px;
  }

  .hero-stack {
    gap: 20px;
    transform: none; /* reset desktop nudge — mobile stacks vertically */
  }

  .logo-positioner {
    position: static;
    left: auto;
    transform: none;
    margin-top: 4px;
    align-self: center;
  }

  .title-text {
    font-size: clamp(28px, 9vw, 44px);
    line-height: 1.08;
    white-space: normal; /* allow wrapping on narrow viewports */
  }

  /* "use cursor to look around" makes no sense on touch — hide. */
  .hint {
    display: none;
  }

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

  .meta-strip {
    left: 22px;
    right: 22px;
    bottom: 24px;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
