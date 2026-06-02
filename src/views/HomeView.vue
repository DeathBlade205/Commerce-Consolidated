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

// Auto-flashlight intro: trace a path across title -> logo -> mission so the page
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
            <span class="title-text">Commerce Consolidated</span>
          </FlashlightReveal>
        </h1>

        <div class="hint enter enter--3">
          <FlashlightReveal :radius="220">
            <span class="hint-text">use cursor to look around</span>
          </FlashlightReveal>
        </div>

        <div class="mission enter enter--4">
          <FlashlightReveal :radius="240">
            <span class="mission-text">
              A digital agency for brands that would rather be understood than seen.
              Web, identity, and marketing — built quietly, finished well.
            </span>
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

    <!-- Secondary nav at the bottom — sits above the meta strip. Faint by
         default, brightens under the flashlight like everything else. -->
    <nav class="hero-nav enter enter--5" aria-label="Other pages">
      <RouterLink to="/about" class="hero-nav__link hero-nav__link--left">
        <FlashlightReveal :radius="200">
          <span class="hero-nav__inner">
            <span class="hero-nav__arrow" aria-hidden="true">←</span>
            <span class="hero-nav__label">Process</span>
          </span>
        </FlashlightReveal>
      </RouterLink>
      <RouterLink to="/contact" class="hero-nav__link hero-nav__link--right">
        <FlashlightReveal :radius="200">
          <span class="hero-nav__inner">
            <span class="hero-nav__label">Contact</span>
            <span class="hero-nav__arrow" aria-hidden="true">→</span>
          </span>
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

/* Centred hero: the hero-stack sits in the middle of the page horizontally;
   the logo is absolutely positioned to one side so it doesn't push the
   composition off-centre. */
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
  align-items: center;
  gap: 32px;
}

.title {
  margin: 0;
  font-weight: 400;
  text-align: center;
}

/* Single-line title. Sizes down on smaller viewports via clamp — mobile rule
   below additionally allows wrapping. */
.title-text {
  display: block;
  font-family: var(--font-mono);
  font-size: clamp(28px, 4.2vw, 60px);
  line-height: 1.1;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  font-weight: 500;
  white-space: nowrap;
}

/* Hint sits between the title and the mission — a faint instruction about the
   flashlight interaction. */
.hint {
  text-align: center;
}

.hint-text {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: clamp(11px, 0.85vw, 13px);
  letter-spacing: 0.16em;
  text-transform: lowercase;
  font-weight: 400;
}

/* Mission statement underneath the centred title. Wrapped in FlashlightReveal
   like everything else so it brightens under the cursor. */
.mission {
  text-align: center;
  max-width: 560px;
}

.mission-text {
  display: block;
  font-family: var(--font-mono);
  font-size: clamp(13px, 0.95vw, 14px);
  line-height: 1.75;
  letter-spacing: 0.01em;
  font-weight: 400;
}

/* Mission's dim layer is one step brighter than the title (which uses
   FlashlightReveal's default --grey-500). */
.mission :deep(.layer.dim) {
  color: var(--grey-300);
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

.hero-nav__inner {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  font-size: clamp(13px, 1vw, 16px);
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero-nav__arrow {
  font-family: var(--font-mono);
  font-size: 1.1em;
  transition: transform 280ms cubic-bezier(0.2, 0.7, 0.2, 1);
}

.hero-nav__link--left:hover  .hero-nav__arrow { transform: translateX(-4px); }
.hero-nav__link--right:hover .hero-nav__arrow { transform: translateX(4px); }

/* Positioner: parks the logo on the right side of the page, vertically
   centred. Kept separate from the .logo node so the entry/flourish/breath
   animations on `.logo` can freely set `transform` without losing position. */
.logo-positioner {
  position: absolute;
  right: 8vw;
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
   competing with the title/mission. ~7s cycle, very subtle range. */
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
  }

  .logo-positioner {
    position: static;
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

  .mission {
    max-width: 100%;
    padding: 0 4px;
  }

  .mission-text {
    font-size: 13px;
    line-height: 1.7;
  }

  .hero-nav {
    left: 22px;
    right: 22px;
    bottom: 92px;
  }

  .hero-nav__inner {
    font-size: 12px;
    gap: 10px;
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
