<script setup>
// Page-load animation: a line-drawn bulb sketches itself in, charges with
// light from the bottom up, flashes — then throws a circular ripple outward.
// The black shroud is masked away just behind the wavefront, so the page
// underneath is uncovered by the ripple rather than faded in.
//
// Phases: charge (CSS-driven bulb choreography) → burst (JS rAF ripple) →
// finish (marks bootDone; App.vue unmounts us via v-if). A click skips ahead.
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useScrollState } from '../composables/useScrollNav.js'
import { markBootRevealDone } from '../composables/useBootReveal.js'

// Keep CHARGE_MS in sync with the CSS delays below (draw → fill → flash).
const CHARGE_MS = 1450
const BURST_MS = 900
const FEATHER = 90 // soft width of the reveal edge, px

const phase = ref('charge')
const shroudRef = ref(null)
const ringRef = ref(null)
const { scrollLocked } = useScrollState()

let rafId = 0
let timeouts = []
const later = (fn, ms) => timeouts.push(setTimeout(fn, ms))

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

function burst() {
  if (phase.value === 'burst') return
  phase.value = 'burst'
  const shroud = shroudRef.value
  const ring = ringRef.value
  // Radius that clears the farthest viewport corner, plus the feather.
  const maxR = Math.hypot(window.innerWidth / 2, window.innerHeight / 2) + FEATHER
  const start = performance.now()

  function frame(now) {
    const t = Math.min(1, (now - start) / BURST_MS)
    const r = easeOutCubic(t) * maxR
    if (shroud) {
      // transparent inside the ripple = hole in the shroud; the page shows
      // through. The gradient edge IS the wavefront's soft trailing edge.
      const m = `radial-gradient(circle at 50% 50%, transparent ${Math.max(0, r - FEATHER)}px, #000 ${r}px)`
      shroud.style.webkitMaskImage = m
      shroud.style.maskImage = m
    }
    if (ring) {
      ring.style.width = ring.style.height = `${r * 2}px`
      ring.style.opacity = `${0.55 * (1 - t)}`
    }
    if (t < 1) rafId = requestAnimationFrame(frame)
    else finish()
  }
  rafId = requestAnimationFrame(frame)
}

function finish() {
  scrollLocked.value = false
  markBootRevealDone()
}

// Click-to-skip: jump straight to the ripple (or straight out, if reduced).
function onSkip() {
  if (phase.value === 'reduced') {
    finish()
    return
  }
  if (phase.value === 'charge') {
    timeouts.forEach(clearTimeout)
    timeouts = []
    burst()
  }
}

onMounted(() => {
  // Page swaps must not fire under the shroud; finish() unlocks.
  scrollLocked.value = true
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    phase.value = 'reduced'
    later(finish, 380)
    return
  }
  later(burst, CHARGE_MS)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  timeouts.forEach(clearTimeout)
})
</script>

<template>
  <div class="boot" :class="`boot--${phase}`" aria-hidden="true" @pointerdown="onSkip">
    <div ref="shroudRef" class="boot__shroud" />
    <div ref="ringRef" class="boot__ring" />

    <div class="boot__bulb">
      <svg viewBox="0 0 64 80" width="72" height="90" fill="none">
        <defs>
          <clipPath id="cc-boot-glass">
            <circle cx="32" cy="32" r="20" />
          </clipPath>
          <radialGradient id="cc-boot-glow" cx="50%" cy="58%" r="62%">
            <stop offset="0%" stop-color="#fff" stop-opacity="1" />
            <stop offset="55%" stop-color="#fff" stop-opacity="0.55" />
            <stop offset="100%" stop-color="#fff" stop-opacity="0" />
          </radialGradient>
        </defs>

        <!-- light, clipped to the glass; the wrapper's clip-path rises -->
        <g class="bulb-glow-wrap" clip-path="url(#cc-boot-glass)">
          <circle cx="32" cy="34" r="19" fill="url(#cc-boot-glow)" />
        </g>

        <!-- glass -->
        <circle class="bulb-line" cx="32" cy="32" r="20" pathLength="1" />
        <!-- filament posts + arc -->
        <path class="bulb-line bulb-line--fine" d="M29 50 V42" pathLength="1" />
        <path class="bulb-line bulb-line--fine" d="M35 50 V42" pathLength="1" />
        <path class="bulb-line bulb-line--fine" d="M29 42 Q32 36 35 42" pathLength="1" />
        <!-- neck -->
        <path class="bulb-line" d="M26 51 V62" pathLength="1" />
        <path class="bulb-line" d="M38 51 V62" pathLength="1" />
        <!-- base threads + tip -->
        <path class="bulb-line" d="M26 62 H38" pathLength="1" />
        <path class="bulb-line" d="M27 66 H37" pathLength="1" />
        <path class="bulb-line" d="M29 70 H35" pathLength="1" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.boot {
  position: fixed;
  inset: 0;
  z-index: 9000; /* above all chrome, below the custom cursor (9998+) */
  touch-action: none;
}

.boot__shroud {
  position: absolute;
  inset: 0;
  background: var(--bg);
  will-change: mask-image;
}

/* Wavefront ring — sized/faded by JS each frame, synced to the mask hole. */
.boot__ring {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 0;
  height: 0;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  box-shadow:
    0 0 24px rgba(255, 255, 255, 0.18),
    inset 0 0 24px rgba(255, 255, 255, 0.12);
  opacity: 0;
  pointer-events: none;
}

.boot__bulb {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: var(--grey-100);
  /* flash starts as the fill completes — see CHARGE_MS coupling note */
  animation: bulb-flash 280ms ease-out 1170ms both;
  pointer-events: none;
}

/* Outline sketches itself in via the pathLength=1 dash trick. */
.bulb-line {
  stroke: currentColor;
  stroke-width: 1.3;
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: bulb-draw 620ms cubic-bezier(0.4, 0, 0.2, 1) 80ms forwards;
}

.bulb-line--fine {
  stroke-width: 1;
  animation-delay: 300ms;
}

/* The "fills up with light" beat: a clip rect rises through the glass. */
.bulb-glow-wrap {
  clip-path: inset(100% 0 0 0);
  animation: bulb-fill 760ms cubic-bezier(0.45, 0, 0.25, 1) 540ms forwards;
}

@keyframes bulb-draw {
  to { stroke-dashoffset: 0; }
}

@keyframes bulb-fill {
  to { clip-path: inset(0 0 0 0); }
}

@keyframes bulb-flash {
  0%   { filter: drop-shadow(0 0 0 rgba(255, 255, 255, 0)); }
  45%  { filter: drop-shadow(0 0 30px rgba(255, 255, 255, 0.55)); transform: translate(-50%, -50%) scale(1.05); }
  100% { filter: drop-shadow(0 0 16px rgba(255, 255, 255, 0.3)); transform: translate(-50%, -50%) scale(1); }
}

/* Burst: the bulb dissolves into the ripple it just threw. */
.boot--burst .boot__bulb {
  opacity: 0;
  transform: translate(-50%, -50%) scale(1.08);
  transition: opacity 340ms ease, transform 340ms ease;
}

/* Reduced motion: no theatrics — quick fade, no bulb, no ripple. */
.boot--reduced .boot__bulb,
.boot--reduced .boot__ring {
  display: none;
}

.boot--reduced .boot__shroud {
  opacity: 0;
  transition: opacity 300ms ease;
}
</style>
