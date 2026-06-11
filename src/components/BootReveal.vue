<script setup>
// Page-load animation: a line-drawn bulb sketches itself in, charges with
// light from the bottom up, flashes — then throws a wave outward. The black
// shroud is masked away behind the wavefront, so the page underneath is
// uncovered by the wave rather than faded in. The wavefront is deliberately
// non-uniform: blurred luminous bands warped by an SVG turbulence
// displacement filter, and the shroud's reveal edge gets the same warp so
// the hole never reads as a perfect circle.
//
// Phases: charge (CSS-driven bulb choreography) → burst (JS rAF wave) →
// finish (marks bootDone; App.vue unmounts us via v-if). A click skips ahead.
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useScrollState } from '../composables/useScrollNav.js'
import { markBootRevealDone } from '../composables/useBootReveal.js'

// Keep CHARGE_MS in sync with the CSS delays below (draw → fill → flash).
const CHARGE_MS = 1950
const BURST_MS = 1900
const FEATHER = 240 // soft width of the reveal edge, px
// The shroud overhangs the viewport so the displacement warp never exposes
// the page at the screen borders. Keep > the filter's max displacement.
const SHROUD_BLEED = 100

const phase = ref('charge')
const shroudRef = ref(null)
const ringRef = ref(null)
const { scrollLocked } = useScrollState()

let rafId = 0
let timeouts = []
const later = (fn, ms) => timeouts.push(setTimeout(fn, ms))

// Sine ease-in-out: the swell gathers, travels at near-constant speed, and
// settles — reads as a wave crossing the page, not a burst that dies early.
function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2
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
    const r = easeInOutSine(t) * maxR
    if (shroud) {
      // transparent inside the wave = hole in the shroud; the page shows
      // through. Mid-stop keeps the occlusion gradual across the feather so
      // the edge reads as a soft swell, not a hard rim.
      const m = `radial-gradient(circle at 50% 50%, transparent ${Math.max(0, r - FEATHER)}px, rgba(0,0,0,0.55) ${Math.max(0, r - FEATHER * 0.45)}px, #000 ${r}px)`
      shroud.style.webkitMaskImage = m
      shroud.style.maskImage = m
    }
    if (ring) {
      ring.style.width = ring.style.height = `${r * 2}px`
      // Quick swell-in, long decay — like a wave losing energy.
      ring.style.opacity = `${Math.min(1, t * 8) * (1 - t) * 0.9}`
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

// Click-to-skip: jump straight to the wave (or straight out, if reduced).
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
    <!-- Turbulence filters that make the wavefront + reveal edge organic. -->
    <svg class="boot__defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <filter id="cc-boot-wave" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.017" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="48" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="cc-boot-wave-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.007 0.012" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="72" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>

    <div ref="shroudRef" class="boot__shroud" />

    <!-- Wavefront: layered blurred bands, warped by the turbulence filter.
         Sized/faded by JS each frame, synced to the mask hole. -->
    <div ref="ringRef" class="boot__ring">
      <span class="boot__band boot__band--core" />
      <span class="boot__band boot__band--haze" />
      <span class="boot__band boot__band--swell" />
    </div>

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
  overflow: hidden;
  touch-action: none;
}

.boot__defs {
  position: absolute;
}

.boot__shroud {
  position: absolute;
  inset: calc(-1 * 100px); /* SHROUD_BLEED — see script constant */
  background: var(--bg);
  /* Warp the masked reveal edge so the hole isn't a perfect circle. */
  filter: url(#cc-boot-wave-soft);
  will-change: mask-image;
}

/* Wavefront wrapper — sized/faded by JS each frame. The displacement filter
   turns the concentric bands into one irregular, watery swell. */
.boot__ring {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 0;
  height: 0;
  opacity: 0;
  filter: url(#cc-boot-wave);
  pointer-events: none;
  will-change: width, height, opacity;
}

.boot__band {
  position: absolute;
  border-radius: 50%;
}

/* Brightest part of the swell — still soft, no crisp line anywhere. */
.boot__band--core {
  inset: -8px;
  border: 4px solid rgba(255, 255, 255, 0.32);
  filter: blur(7px);
}

/* Wide diffuse glow riding on the front. */
.boot__band--haze {
  inset: 0;
  border: 14px solid rgba(255, 255, 255, 0.14);
  filter: blur(18px);
}

/* Faint outer swell leading the wave. */
.boot__band--swell {
  inset: -38px;
  border: 28px solid rgba(255, 255, 255, 0.06);
  filter: blur(30px);
}

.boot__bulb {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: var(--grey-100);
  /* flash starts as the fill completes — see CHARGE_MS coupling note */
  animation: bulb-flash 360ms ease-out 1600ms both;
  pointer-events: none;
}

/* Outline sketches itself in via the pathLength=1 dash trick. */
.bulb-line {
  stroke: currentColor;
  stroke-width: 1.3;
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: bulb-draw 880ms cubic-bezier(0.4, 0, 0.2, 1) 100ms forwards;
}

.bulb-line--fine {
  stroke-width: 1;
  animation-delay: 420ms;
}

/* The "fills up with light" beat: a clip rect rises through the glass. */
.bulb-glow-wrap {
  clip-path: inset(100% 0 0 0);
  animation: bulb-fill 1000ms cubic-bezier(0.45, 0, 0.25, 1) 760ms forwards;
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

/* Burst: the bulb dissolves into the wave it just threw. */
.boot--burst .boot__bulb {
  opacity: 0;
  transform: translate(-50%, -50%) scale(1.08);
  transition: opacity 420ms ease, transform 420ms ease;
}

/* Reduced motion: no theatrics — quick fade, no bulb, no wave. */
.boot--reduced .boot__bulb,
.boot--reduced .boot__ring {
  display: none;
}

.boot--reduced .boot__shroud {
  filter: none;
  opacity: 0;
  transition: opacity 300ms ease;
}
</style>
