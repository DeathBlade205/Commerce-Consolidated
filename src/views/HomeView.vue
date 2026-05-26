<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import FlashlightReveal from '../components/FlashlightReveal.vue'
import LogoMark from '../components/LogoMark.vue'
import BackgroundField from '../components/BackgroundField.vue'

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
    <BackgroundField />

    <div class="eyebrow enter enter--1">
      <span class="line" />
      <span class="label eyebrow-text">Digital Practice · Sydney · Est. 2026</span>
    </div>

    <div class="stage">
      <!-- Left column: title stack (staggered lines) + mission indented underneath -->
      <div class="hero-stack">
        <h1 class="title enter enter--2">
          <FlashlightReveal :radius="240">
            <span class="title-text">
              <span class="title-line title-line--1">Commerce</span>
              <span class="title-line title-line--2">Consolidated</span>
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

      <!-- Right column: logo, fully hidden until flashlight reveal -->
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
  padding: 140px 64px 100px;
  display: flex;
  flex-direction: column;
  gap: 80px;
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

/* Two-column stage: left = title + mission (staggered, indented), right = logo. */
.stage {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 0.5fr);
  column-gap: 48px;
  align-items: start;
  position: relative;
  z-index: 1;
}

.hero-stack {
  grid-column: 1;
  display: flex;
  flex-direction: column;
  gap: 36px;
  /* Shared stagger step. Both title line 2 and the mission use multiples of
     this so the staircase reads consistently regardless of each element's own
     font-size (em-based indents would shrink with the smaller mission font). */
  --stagger: clamp(60px, 8.5vw, 130px);
}

.title {
  margin: 0;
  font-weight: 400;
}

.title-text {
  display: block;
  font-family: var(--font-mono);
  font-size: clamp(32px, 5.4vw, 76px);
  line-height: 1.02;
  letter-spacing: -0.04em;
  text-transform: uppercase;
  font-weight: 500;
}

.title-line {
  display: block;
}

/* Stagger: line 2 indented one step. Line 1 stays at the container origin. */
.title-line--2 {
  padding-left: var(--stagger);
}

.logo {
  grid-column: 2;
  align-self: end;
  justify-self: start;
  padding-top: 24px;
  color: var(--grey-100);
  transform-origin: center;
  will-change: transform, filter;
}

/* Flourish: scale up + rotate slightly, then settle. Class is added when the
   intro sweep reaches the logo. */
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
  /* Two steps in — title line 1 (0), title line 2 (1 step), mission (2 steps). */
  padding-left: calc(var(--stagger) * 2);
}

.mission-text {
  display: block;
  font-family: var(--font-mono);
  font-size: clamp(12px, 0.9vw, 14px); /* slightly smaller than before */
  line-height: 1.75;
  letter-spacing: 0.01em;
  max-width: 520px;
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

  .stage {
    grid-template-columns: 1fr;
    row-gap: 28px;
  }

  .hero-stack {
    grid-column: 1;
    gap: 24px;
  }

  .logo {
    grid-column: 1;
    grid-row: auto;
    padding-top: 4px;
    justify-self: start;
  }

  .title-text {
    /* Slightly larger floor so it still reads as a display headline on small screens. */
    font-size: clamp(36px, 12vw, 56px);
    line-height: 1.04;
  }

  .hero-stack {
    /* Tighter stagger on mobile so mission isn't pushed off-screen. */
    --stagger: clamp(20px, 7vw, 36px);
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
