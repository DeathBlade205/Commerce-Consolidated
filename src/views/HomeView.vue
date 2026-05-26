<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
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
    { x: w * 0.12, y: h * 0.36, hold: 0 },    // title start
    { x: w * 0.42, y: h * 0.40, hold: 0 },    // mid title
    { x: w * 0.78, y: h * 0.46, hold: 220 },  // logo (linger)
    { x: w * 0.52, y: h * 0.78, hold: 120 },  // mission
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
      <span class="line" />
      <span class="label eyebrow-text">Digital Practice · Sydney · Est. 2026</span>
      <span class="line" />
    </div>

    <div class="stage">
      <!-- Title (centred) above an indented mission that staggers off to the side. -->
      <div class="hero-stack">
        <h1 class="title enter enter--2">
          <FlashlightReveal :radius="240">
            <span class="title-text">
              <span class="title-line">Commerce</span>
              <span class="title-line">Consolidated</span>
            </span>
          </FlashlightReveal>
        </h1>

        <div class="mission enter enter--4">
          <FlashlightReveal :radius="260">
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

    <div class="meta-strip enter enter--5">
      <div class="meta-left">
        <span class="pulse" aria-hidden="true" />
        <span class="label">Currently taking briefs for Q3</span>
      </div>
      <span class="label">Sydney · 33.86°S, 151.20°E</span>
    </div>
  </main>
</template>

<style scoped>
.home {
  min-height: 100vh;
  position: relative;
  padding: 140px 64px 140px;
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
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
  z-index: 1;
}

.eyebrow-text {
  color: var(--grey-500);
  white-space: nowrap;
}

.line {
  width: 40px;
  height: 1px;
  background: var(--grey-700);
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
  gap: 56px;
  /* Stagger drives how far the mission slides right of the centred title. */
  --stagger: clamp(80px, 13vw, 200px);
}

.title {
  margin: 0;
  font-weight: 400;
  text-align: center;       /* both title lines centre on the same axis */
}

.title-text {
  display: block;
  font-family: var(--font-mono);
  font-size: clamp(34px, 5.2vw, 76px);
  line-height: 1.06;
  letter-spacing: -0.02em;  /* less tight than before — lets the mono breathe */
  text-transform: uppercase;
  font-weight: 500;
}

.title-line {
  display: block;
}

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

.mission {
  margin: 0;
  /* Mission steps off to the right of the centred title — one stagger step.
     `align-self: end` lifts the indent off the centred parent so the mission
     can sit to the right of the centre axis instead of inheriting centring. */
  align-self: center;
  padding-left: var(--stagger);
  max-width: 520px;
}

.mission-text {
  display: block;
  font-family: var(--font-mono);
  font-size: clamp(13px, 0.95vw, 14px);
  line-height: 1.75;
  letter-spacing: 0.01em;
  font-weight: 400;
}

/* Mission's dim layer renders one step brighter than the title (which uses
   FlashlightReveal's default --grey-500). `:deep()` reaches into the slotted
   FlashlightReveal layers. The bright reveal still lifts to --grey-100. */
.mission :deep(.layer.dim) {
  color: var(--grey-300);
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

.meta-left {
  display: flex;
  align-items: center;
  gap: 10px;
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
    padding: 110px 22px 140px; /* extra bottom for the stacked meta strip */
    gap: 44px;
  }

  .eyebrow {
    gap: 14px;
  }

  .line {
    width: 28px;
  }

  .hero-stack {
    gap: 28px;
  }

  .logo-positioner {
    /* Drop the absolute side-positioning on mobile — let the logo flow inline
       under the mission for the stacked column layout. */
    position: static;
    transform: none;
    margin-top: 8px;
    align-self: start;
  }

  .title-text {
    /* Slightly larger floor so it still reads as a display headline on small screens. */
    font-size: clamp(36px, 12vw, 56px);
    line-height: 1.04;
  }

  .hero-stack {
    /* Tighter stagger on mobile so mission isn't pushed off-screen. */
    --stagger: clamp(20px, 6vw, 36px);
    gap: 32px;
  }

  .mission {
    align-self: stretch; /* let the wrap fill on mobile rather than stay pinned right */
    padding-left: var(--stagger);
  }

  .mission-text {
    font-size: 13px;
    line-height: 1.7;
  }

  .meta-strip {
    left: 22px;
    right: 22px;
    bottom: 28px;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
