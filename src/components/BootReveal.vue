<script setup>
// Page-load animation: a line-drawn bulb sketches itself in, charges with
// light from the bottom up, flashes — then throws a wave outward. The black
// shroud is masked away behind the wavefront, so the page underneath is
// uncovered by the wave rather than faded in.
//
// Performance contract: everything that changes per-frame is compositor-only.
// The wavefront (blurred bands + turbulence displacement + afterglow) is
// rasterized ONCE at a fixed WAVE_BASE size, then animated purely with
// transform: scale + opacity. The shroud is a plain masked solid — updating
// its radial-gradient mask is the single per-frame paint, with no SVG filter
// attached (the displaced wave band rides the edge and supplies the
// organic look). Never re-attach filters to the shroud or size the wave via
// width/height — that's what made the first version chop.
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
// Raster size of the pre-rendered wavefront. It scales UP from here — the
// extra softness from upscaling suits a wave losing definition as it grows.
const WAVE_BASE = 1000

const phase = ref('charge')
const shroudRef = ref(null)
const waveRef = ref(null)
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
  const wave = waveRef.value
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
    if (wave) {
      wave.style.transform = `translate(-50%, -50%) scale(${(r * 2) / WAVE_BASE})`
      // Quick swell-in, slow decay — a wave losing energy, not a flash.
      wave.style.opacity = `${Math.min(1, t * 6) * (1 - t * t)}`
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
    <!-- Turbulence filter that makes the wavefront organic. Applied to the
         fixed-size band stack only, so it rasterizes once — never per frame. -->
    <svg class="boot__defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <filter id="cc-boot-wave" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.017" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="48" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>

    <div ref="shroudRef" class="boot__shroud" />

    <!-- Wavefront: pre-rendered at WAVE_BASE, then scale/opacity only.
         Colour depth: cool faint swell leads, warm crest rides the edge,
         tungsten afterglow trails inside the revealed zone. -->
    <div ref="waveRef" class="boot__wave">
      <span class="boot__afterglow" />
      <div class="boot__bands">
        <span class="boot__band boot__band--swell" />
        <span class="boot__band boot__band--haze" />
        <span class="boot__band boot__band--core" />
      </div>
    </div>

    <!-- Warm ambient pool that gathers behind the bulb as it charges. -->
    <div class="boot__halo" />

    <div class="boot__bulb">
      <svg viewBox="0 0 64 80" width="72" height="90" fill="none">
        <defs>
          <clipPath id="cc-boot-glass">
            <circle cx="32" cy="32" r="20" />
          </clipPath>
          <radialGradient id="cc-boot-glow" cx="50%" cy="58%" r="62%">
            <stop offset="0%" stop-color="#fff" stop-opacity="1" />
            <stop offset="45%" stop-color="#ffeccb" stop-opacity="0.6" />
            <stop offset="100%" stop-color="#ffdfa8" stop-opacity="0" />
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
  inset: 0;
  background: var(--bg);
  /* Own compositor layer — the per-frame mask update repaints this layer
     alone instead of invalidating everything beneath. */
  transform: translateZ(0);
  will-change: mask-image;
}

/* Wavefront wrapper — fixed raster size; JS animates transform + opacity
   only (both compositor-side). */
.boot__wave {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 1000px; /* WAVE_BASE — see script constant */
  height: 1000px;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  pointer-events: none;
  will-change: transform, opacity;
}

/* Tungsten afterglow pooling inside the revealed zone — fades with the
   wave, leaves the page looking lit rather than switched on. */
.boot__afterglow {
  position: absolute;
  inset: 6%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 240, 214, 0.07) 0%,
    rgba(255, 240, 214, 0.03) 45%,
    rgba(255, 240, 214, 0) 72%
  );
}

/* The band stack carries the displacement filter — content never changes,
   so the filter output is rasterized once and only transformed after. */
.boot__bands {
  position: absolute;
  inset: 0;
  filter: url(#cc-boot-wave);
}

.boot__band {
  position: absolute;
  border-radius: 50%;
}

/* Faint cool swell leading the wave — temperature contrast gives depth. */
.boot__band--swell {
  inset: -42px;
  border: 30px solid rgba(196, 206, 232, 0.07);
  filter: blur(30px);
}

/* Wide diffuse glow riding the front. */
.boot__band--haze {
  inset: -4px;
  border: 16px solid rgba(255, 251, 240, 0.13);
  filter: blur(18px);
}

/* Warm crest — brightest part of the swell, still no crisp line anywhere. */
.boot__band--core {
  inset: 6px;
  border: 6px solid rgba(255, 243, 222, 0.4);
  filter: blur(8px);
}

/* Warm pool gathering behind the bulb while it charges; swallowed by the
   flash. Composite-only animation (opacity + transform). */
.boot__halo {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 420px;
  height: 420px;
  transform: translate(-50%, -50%) scale(0.6);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 236, 203, 0.12) 0%,
    rgba(255, 236, 203, 0.05) 40%,
    rgba(255, 236, 203, 0) 70%
  );
  opacity: 0;
  pointer-events: none;
  animation: halo-rise 1100ms cubic-bezier(0.3, 0, 0.4, 1) 760ms both;
  will-change: transform, opacity;
}

@keyframes halo-rise {
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.boot--burst .boot__halo {
  opacity: 0;
  transform: translate(-50%, -50%) scale(1.5);
  transition: opacity 480ms ease, transform 480ms ease;
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
  0%   { filter: drop-shadow(0 0 0 rgba(255, 240, 210, 0)); }
  45%  { filter: drop-shadow(0 0 32px rgba(255, 240, 210, 0.55)); transform: translate(-50%, -50%) scale(1.05); }
  100% { filter: drop-shadow(0 0 18px rgba(255, 240, 210, 0.32)); transform: translate(-50%, -50%) scale(1); }
}

/* Burst: the bulb dissolves into the wave it just threw. */
.boot--burst .boot__bulb {
  opacity: 0;
  transform: translate(-50%, -50%) scale(1.08);
  transition: opacity 420ms ease, transform 420ms ease;
}

/* Reduced motion: no theatrics — quick fade, no bulb, no wave. */
.boot--reduced .boot__bulb,
.boot--reduced .boot__wave,
.boot--reduced .boot__halo {
  display: none;
}

.boot--reduced .boot__shroud {
  opacity: 0;
  transition: opacity 300ms ease;
}
</style>
