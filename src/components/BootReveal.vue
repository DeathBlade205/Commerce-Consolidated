<script setup>
// Page-load animation: a line-drawn bulb sketches itself in, charges with
// light from the bottom up, flashes — then throws a wave outward that
// uncovers the page (the black shroud is erased behind the wavefront).
//
// Performance contract: the shroud + wave are ONE 2D canvas. Per frame we do
// a handful of fills and strokes — no CSS masks, no SVG filters, no blurs
// (the glow is layered strokes at falling alpha; the organic edge is a
// precomputed noise polygon). This was previously CSS mask + displacement
// filters and it was unfixably janky on real GPUs — don't go back.
//
// Phases: charge (CSS-driven bulb choreography over a black canvas) → burst
// (rAF canvas wave) → finish (marks bootDone; App.vue unmounts us via v-if).
// A click skips ahead.
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useScrollState } from '../composables/useScrollNav.js'
import { markBootRevealDone } from '../composables/useBootReveal.js'

// Keep CHARGE_MS in sync with the CSS delays below (draw → fill → flash).
const CHARGE_MS = 1950
const BURST_MS = 1900
const FEATHER = 240 // soft width of the reveal edge, px
const TAU = Math.PI * 2
const BG = '#0a0a0a' // shroud colour — must match --bg

const phase = ref('charge')
const canvasRef = ref(null)
const { scrollLocked } = useScrollState()

let ctx = null
let vw = 0
let vh = 0
let dpr = 1
let rafId = 0
let timeouts = []
const later = (fn, ms) => timeouts.push(setTimeout(fn, ms))

// Smooth periodic radius noise (summed sines, random phases) — gives the
// wavefront its lumpy coastline. Computed once; wraps seamlessly.
const NOISE_N = 192
const noise = new Float32Array(NOISE_N)
{
  const p1 = Math.random() * TAU
  const p2 = Math.random() * TAU
  const p3 = Math.random() * TAU
  for (let i = 0; i < NOISE_N; i++) {
    const a = (i / NOISE_N) * TAU
    noise[i] =
      Math.sin(3 * a + p1) * 0.5 +
      Math.sin(5 * a + p2) * 0.32 +
      Math.sin(8 * a + p3) * 0.18
  }
}

// Sine ease-in-out: the swell gathers, travels at near-constant speed, and
// settles — reads as a wave crossing the page, not a burst that dies early.
function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

function sizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  vw = window.innerWidth
  vh = window.innerHeight
  // Cap the backing resolution — the shroud is soft gradients and glow, so
  // hidpi fidelity buys nothing and costs fill-rate.
  dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  canvas.width = Math.round(vw * dpr)
  canvas.height = Math.round(vh * dpr)
  ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function drawShroud() {
  if (!ctx) return
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, vw, vh)
}

// Lumpy ring path around radius r. Amplitude grows with r — the wave gains
// wavelength as it travels.
function wavePath(cx, cy, r) {
  const amp = 10 + r * 0.05
  const path = new Path2D()
  for (let i = 0; i <= NOISE_N; i++) {
    const idx = i % NOISE_N
    const a = (idx / NOISE_N) * TAU
    const rad = Math.max(1, r + noise[idx] * amp)
    const x = cx + Math.cos(a) * rad
    const y = cy + Math.sin(a) * rad
    if (i === 0) path.moveTo(x, y)
    else path.lineTo(x, y)
  }
  path.closePath()
  return path
}

function drawWave(r, t) {
  const cx = vw / 2
  const cy = vh / 2

  drawShroud()

  const path = wavePath(cx, cy, r)

  // Carve the feathered hole: radial alpha ramp erased out of the shroud,
  // bounded by the lumpy path so the reveal edge is organic too. The extra
  // stops shape an S-curve so the falloff never bands.
  const inner = Math.max(0, r - FEATHER)
  const carve = ctx.createRadialGradient(cx, cy, inner, cx, cy, Math.max(1, r))
  carve.addColorStop(0, 'rgba(0,0,0,1)')
  carve.addColorStop(0.35, 'rgba(0,0,0,0.94)')
  carve.addColorStop(0.6, 'rgba(0,0,0,0.74)')
  carve.addColorStop(0.82, 'rgba(0,0,0,0.38)')
  carve.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = carve
  ctx.fill(path)

  // Quick swell-in, slow decay — a wave losing energy, not a flash.
  const energy = Math.min(1, t * 6) * (1 - t * t)
  if (energy <= 0.01) return

  // Tungsten afterglow pooling inside the revealed zone — the page emerges
  // looking lit by the bulb rather than switched on.
  ctx.globalCompositeOperation = 'source-over'
  const agR = Math.max(1, r * 0.9)
  const after = ctx.createRadialGradient(cx, cy, 0, cx, cy, agR)
  after.addColorStop(0, `rgba(255,240,214,${0.07 * energy})`)
  after.addColorStop(0.6, `rgba(255,240,214,${0.028 * energy})`)
  after.addColorStop(1, 'rgba(255,240,214,0)')
  ctx.fillStyle = after
  ctx.beginPath()
  ctx.arc(cx, cy, agR, 0, TAU)
  ctx.fill()

  // The crest: ONE wide stroke painted with a radial gradient, so the glow
  // falls off continuously across the band — no layered-stroke banding.
  // Warm peak on the crest, faint cool spill leading the wave. The gradient
  // is radially perfect while the path is lumpy, so brightness drifts
  // subtly around the lobes — free natural variation.
  const band = 26 + r * 0.1
  const g0 = Math.max(0, r - band * 1.3)
  const g1 = r + band * 1.3
  const span = g1 - g0
  const stopAt = (rad) => Math.min(1, Math.max(0, (rad - g0) / span))
  const crest = ctx.createRadialGradient(cx, cy, g0, cx, cy, g1)
  crest.addColorStop(0, 'rgba(255,240,214,0)')
  crest.addColorStop(stopAt(r - band * 0.3), `rgba(255,244,222,${0.14 * energy})`)
  crest.addColorStop(stopAt(r), `rgba(255,238,208,${0.3 * energy})`)
  crest.addColorStop(stopAt(r + band * 0.35), `rgba(231,237,252,${0.09 * energy})`)
  crest.addColorStop(1, 'rgba(205,214,238,0)')
  ctx.globalCompositeOperation = 'source-over'
  ctx.lineJoin = 'round'
  ctx.lineWidth = band * 2.6
  ctx.strokeStyle = crest
  ctx.stroke(path)
}

function burst() {
  if (phase.value === 'burst') return
  phase.value = 'burst'
  // Radius that clears the farthest viewport corner, plus feather + lumps.
  const maxR = Math.hypot(vw / 2, vh / 2) + FEATHER + 60
  const start = performance.now()

  function frame(now) {
    const t = Math.min(1, (now - start) / BURST_MS)
    drawWave(easeInOutSine(t) * maxR, t)
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

function onResize() {
  // Mid-burst resizes are not worth re-deriving; the wave outruns them.
  if (phase.value !== 'charge') return
  sizeCanvas()
  drawShroud()
}

onMounted(() => {
  // Page swaps must not fire under the shroud; finish() unlocks.
  scrollLocked.value = true
  sizeCanvas()
  drawShroud()
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    phase.value = 'reduced'
    later(finish, 380)
    return
  }
  window.addEventListener('resize', onResize)
  later(burst, CHARGE_MS)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  timeouts.forEach(clearTimeout)
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="boot" :class="`boot--${phase}`" aria-hidden="true" @pointerdown="onSkip">
    <canvas ref="canvasRef" class="boot__canvas" />

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

.boot__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
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
.boot--reduced .boot__halo {
  display: none;
}

.boot--reduced .boot__canvas {
  opacity: 0;
  transition: opacity 300ms ease;
}
</style>
