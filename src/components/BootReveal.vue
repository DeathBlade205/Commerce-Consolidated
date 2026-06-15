<script setup>
// Page-load animation: a single white droplet falls into the centre and its
// impact throws a ripple outward that uncovers the page (the black shroud is
// erased behind the wavefront). Greyscale only — white droplet, white wave.
//
// Performance contract: the shroud + wave are ONE 2D canvas. Per frame we do
// a handful of fills and one gradient stroke — no CSS masks, no SVG filters,
// no blurs (the organic edge is a precomputed noise polygon). CSS-mask +
// filter pipelines were unfixably janky on real GPUs — don't go back.
//
// Robustness: a watchdog forces finish() after MAX_MS no matter what, so a
// stalled rAF (background tab, slow device) can never leave the site locked
// under the shroud with scroll nav disabled.
//
// Phases: drop (CSS droplet fall over a black canvas) → burst (rAF canvas
// ripple) → finish (marks bootDone; App.vue unmounts us via v-if). A click
// skips ahead.
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useScrollState } from '../composables/useScrollNav.js'
import { markBootRevealDone } from '../composables/useBootReveal.js'

// DROP_MS must line up with the droplet's CSS fall (impact at ~85%).
const DROP_MS = 480
const BURST_MS = 1000
const MAX_MS = 3000 // hard watchdog — never lock longer than this
const FEATHER = 200 // soft width of the reveal edge, px
const TAU = Math.PI * 2
const BG = '#0a0a0a' // shroud colour — must match --bg

const phase = ref('drop')
const canvasRef = ref(null)
const { scrollLocked } = useScrollState()

let ctx = null
let vw = 0
let vh = 0
let dpr = 1
let rafId = 0
let done = false
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

// Sine ease-in-out: the wave gathers, travels at near-constant speed, settles.
function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

function sizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  vw = window.innerWidth
  vh = window.innerHeight
  // Cap backing resolution — soft gradients gain nothing from hidpi.
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

  // Carve the feathered hole out of the shroud, bounded by the lumpy path so
  // the reveal edge is organic too. S-curve stops keep the falloff smooth.
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

  // Faint white afterglow pooling inside the revealed zone.
  ctx.globalCompositeOperation = 'source-over'
  const agR = Math.max(1, r * 0.9)
  const after = ctx.createRadialGradient(cx, cy, 0, cx, cy, agR)
  after.addColorStop(0, `rgba(255,255,255,${0.05 * energy})`)
  after.addColorStop(0.6, `rgba(255,255,255,${0.02 * energy})`)
  after.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = after
  ctx.beginPath()
  ctx.arc(cx, cy, agR, 0, TAU)
  ctx.fill()

  // The crest: ONE wide stroke painted with a white radial gradient, so the
  // glow falls off continuously across the band — no layered-stroke banding.
  const band = 24 + r * 0.1
  const g0 = Math.max(0, r - band * 1.3)
  const g1 = r + band * 1.3
  const span = g1 - g0
  const stopAt = (rad) => Math.min(1, Math.max(0, (rad - g0) / span))
  const crest = ctx.createRadialGradient(cx, cy, g0, cx, cy, g1)
  crest.addColorStop(0, 'rgba(255,255,255,0)')
  crest.addColorStop(stopAt(r - band * 0.3), `rgba(255,255,255,${0.14 * energy})`)
  crest.addColorStop(stopAt(r), `rgba(255,255,255,${0.34 * energy})`)
  crest.addColorStop(stopAt(r + band * 0.35), `rgba(255,255,255,${0.1 * energy})`)
  crest.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.lineJoin = 'round'
  ctx.lineWidth = band * 2.6
  ctx.strokeStyle = crest
  ctx.stroke(path)
}

function burst() {
  if (phase.value === 'burst' || done) return
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
  if (done) return
  done = true
  cancelAnimationFrame(rafId)
  timeouts.forEach(clearTimeout)
  scrollLocked.value = false
  markBootRevealDone()
}

// Click-to-skip: jump straight to the ripple (or straight out, if reduced).
function onSkip() {
  if (done) return
  if (phase.value === 'reduced') {
    finish()
    return
  }
  if (phase.value === 'drop') {
    timeouts.forEach(clearTimeout)
    timeouts = []
    burst()
  }
}

function onResize() {
  if (phase.value !== 'drop') return
  sizeCanvas()
  drawShroud()
}

onMounted(() => {
  // Page swaps must not fire under the shroud; finish() unlocks.
  scrollLocked.value = true
  sizeCanvas()
  drawShroud()
  // Watchdog: whatever happens, never stay locked past MAX_MS.
  later(finish, MAX_MS)
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    phase.value = 'reduced'
    later(finish, 320)
    return
  }
  window.addEventListener('resize', onResize)
  later(burst, DROP_MS)
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

    <!-- Single white droplet: falls into the centre, stretches with gravity,
         squashes on impact (which is when the ripple is thrown). -->
    <div v-if="phase === 'drop'" class="boot__drop">
      <span class="boot__bead" />
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

/* Centring anchor; the bead animates relative to this. */
.boot__drop {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.boot__bead {
  display: block;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 16px rgba(255, 255, 255, 0.5);
  will-change: transform, opacity;
  /* Falls from above, accelerating (gravity), squashing on impact. */
  animation: bead-fall 480ms cubic-bezier(0.55, 0, 0.85, 0.45) forwards;
}

@keyframes bead-fall {
  0%   { transform: translateY(-46vh) scaleY(0.9);            opacity: 0; }
  14%  { opacity: 1; }
  74%  { transform: translateY(0)     scaleY(1.7) scaleX(0.7); opacity: 1; }
  88%  { transform: translateY(0)     scaleY(0.4) scaleX(1.5); opacity: 0.9; }
  100% { transform: translateY(0)     scaleY(1)   scaleX(1);   opacity: 0; }
}

/* Reduced motion: no theatrics — quick fade of the shroud, no drop, no wave. */
.boot--reduced .boot__drop {
  display: none;
}

.boot--reduced .boot__canvas {
  opacity: 0;
  transition: opacity 280ms ease;
}
</style>
