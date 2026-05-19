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
let sweepRaf = 0
let sweepCancelled = false

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
function runIntroSweep() {
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
  // Trigger the logo flourish slightly before the sweep arrives there
  setTimeout(() => { logoFlourish.value = true }, segMs * 1.6)

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
  window.addEventListener('mousemove', cancelSweepOnUserMove, { capture: true })
  // Flip `entered` on next paint so the CSS transitions kick in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { entered.value = true })
  })
  setTimeout(runIntroSweep, 500)
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
      <!-- Step 1: title (top-left, smaller squared mono) -->
      <h1 class="title enter enter--2">
        <FlashlightReveal :radius="240">
          <span class="title-text">
            <span class="title-line">Commerce,</span>
            <span class="title-line">Consolidated.</span>
          </span>
        </FlashlightReveal>
      </h1>

      <!-- Step 2: logo (stepped right & down, fully hidden until flashlight reveal) -->
      <div class="logo enter enter--3" :class="{ 'logo--flourish': logoFlourish }">
        <FlashlightReveal hidden :radius="180">
          <LogoMark :size="160" />
        </FlashlightReveal>
      </div>

      <!-- Step 3: mission statement (stepped further right & down) -->
      <div class="mission enter enter--4">
        <FlashlightReveal :radius="260">
          <span class="mission-text">
            A digital agency for brands that would rather be understood than seen.
            Web, identity, and marketing — built quietly, finished well.
          </span>
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

/* Stepped staircase: title top-left, logo middle-right, mission bottom-centre-right. */
.stage {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.4fr) minmax(0, 1fr);
  grid-template-rows: auto auto auto;
  row-gap: 56px;
  column-gap: 48px;
  align-items: start;
  position: relative;
  z-index: 1;
}

.title {
  grid-column: 1 / span 2;
  grid-row: 1;
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

.logo {
  grid-column: 3;
  grid-row: 1 / span 2;
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

.mission {
  grid-column: 2 / span 2;
  grid-row: 3;
  margin: 0;
  padding-left: 4%;
}

.mission-text {
  display: block;
  font-family: var(--font-mono);
  font-size: clamp(13px, 1.05vw, 15px);
  line-height: 1.75;
  letter-spacing: 0.01em;
  max-width: 560px;
  font-weight: 400;
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
    padding: 120px 24px 60px;
    gap: 56px;
  }

  .stage {
    grid-template-columns: 1fr;
    row-gap: 40px;
  }

  .title,
  .logo,
  .mission {
    grid-column: 1;
    grid-row: auto;
    padding-left: 0;
    justify-self: start;
  }

  .title-text {
    font-size: clamp(34px, 11vw, 64px);
  }

  .meta-strip {
    left: 24px;
    right: 24px;
    bottom: 32px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
