<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasRef = ref(null)

// Density is set per device class. Counts kept low and link distance modest so
// the background reads as quiet texture rather than a busy network diagram.
function pickDensity() {
  if (typeof window === 'undefined') return { particles: 30, waves: 2, maxLink: 0.12 }
  const small = window.matchMedia('(max-width: 880px)').matches
  const touch = 'ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0
  if (small || touch) return { particles: 16, waves: 1, maxLink: 0.16 }
  return { particles: 30, waves: 2, maxLink: 0.12 }
}

let rafId = 0
let cleanup = null

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const { particles: PARTICLES, waves: WAVES, maxLink: MAX_LINK_DIST } = pickDensity()

  let w = 0
  let h = 0
  const dpr = Math.min(window.devicePixelRatio || 1, 2)

  function resize() {
    const parent = canvas.parentElement
    w = parent?.clientWidth || window.innerWidth
    h = parent?.clientHeight || window.innerHeight
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resize()
  window.addEventListener('resize', resize)

  // Drifting particle constellation
  const particles = Array.from({ length: PARTICLES }, () => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.00018,
    vy: (Math.random() - 0.5) * 0.00018,
    flare: 0, // 0..1 amplification, decays each frame
  }))

  // Horizontal sine waves. No more "heartbeat" pulse — kept simple/uniform.
  const waves = Array.from({ length: WAVES }, (_, i) => ({
    yBase: (i + 0.5) / WAVES,
    freq: 1.4 + Math.random() * 1.6,
    amp: 0.018 + Math.random() * 0.04,
    speed: 0.00006 + Math.random() * 0.00012,
    phase: Math.random() * Math.PI * 2,
    opacity: 0.05,
  }))

  // Single geometric anchor — the breathing circle sits behind where the logo
  // reveals, doubling as a halo target for the flashlight. All other anchors
  // removed to keep the scene calm.
  const anchors = [
    { x: 0.74, y: 0.5, type: 'circle', size: 240, breathing: true },
  ]

  // Click ripples: expanding circles that fade out
  const ripples = []
  function onClick(e) {
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / w
    const y = (e.clientY - rect.top) / h
    if (x < 0 || x > 1 || y < 0 || y > 1) return
    ripples.push({ x, y, age: 0, maxAge: 1100 })
  }
  window.addEventListener('click', onClick)

  function drawAnchors(t) {
    ctx.save()
    ctx.lineWidth = 1
    anchors.forEach((a) => {
      const cx = a.x * w
      const cy = a.y * h
      if (a.type === 'circle') {
        const breath = a.breathing ? Math.sin(t * 0.0009) : 0
        const r = a.size * (1 + breath * 0.05)
        const alpha = 0.06 + Math.abs(breath) * 0.06
        ctx.strokeStyle = `rgba(168, 168, 168, ${alpha})`
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.stroke()
      } else if (a.type === 'square') {
        ctx.strokeStyle = 'rgba(168, 168, 168, 0.08)'
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(a.rot)
        ctx.strokeRect(-a.size / 2, -a.size / 2, a.size, a.size)
        ctx.restore()
      } else if (a.type === 'cross') {
        ctx.strokeStyle = 'rgba(168, 168, 168, 0.08)'
        ctx.beginPath()
        ctx.moveTo(cx - a.size / 2, cy)
        ctx.lineTo(cx + a.size / 2, cy)
        ctx.moveTo(cx, cy - a.size / 2)
        ctx.lineTo(cx, cy + a.size / 2)
        ctx.stroke()
      }
    })
    ctx.restore()
  }

  function drawWaves(t) {
    ctx.save()
    waves.forEach((wv) => {
      ctx.strokeStyle = `rgba(245, 245, 245, ${wv.opacity})`
      ctx.lineWidth = 0.6
      ctx.beginPath()
      const steps = 80
      for (let i = 0; i <= steps; i++) {
        const nx = i / steps
        const y = wv.yBase + Math.sin(nx * wv.freq * Math.PI * 2 + t * wv.speed + wv.phase) * wv.amp
        const px = nx * w
        const py = y * h
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
    })
    ctx.restore()
  }

  function drawConstellation() {
    // Connection lines
    for (let i = 0; i < PARTICLES; i++) {
      for (let j = i + 1; j < PARTICLES; j++) {
        const a = particles[i]
        const b = particles[j]
        const dx = a.x - b.x
        const dy = a.y - b.y
        const d = Math.hypot(dx, dy)
        if (d < MAX_LINK_DIST) {
          const proximity = 1 - d / MAX_LINK_DIST
          const flareBoost = (a.flare + b.flare) * 0.4
          const alpha = proximity * 0.07 + flareBoost * proximity
          ctx.strokeStyle = `rgba(245, 245, 245, ${Math.min(0.6, alpha)})`
          ctx.lineWidth = 0.5 + flareBoost * 0.8
          ctx.beginPath()
          ctx.moveTo(a.x * w, a.y * h)
          ctx.lineTo(b.x * w, b.y * h)
          ctx.stroke()
        }
      }
    }
    // Dots
    particles.forEach((p) => {
      const baseAlpha = 0.22 + p.flare * 0.6
      const radius = 0.9 + p.flare * 2.4
      ctx.fillStyle = `rgba(245, 245, 245, ${Math.min(1, baseAlpha)})`
      ctx.beginPath()
      ctx.arc(p.x * w, p.y * h, radius, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  function drawRipples(dt) {
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i]
      r.age += dt
      if (r.age >= r.maxAge) {
        ripples.splice(i, 1)
        continue
      }
      const progress = r.age / r.maxAge
      const eased = 1 - Math.pow(1 - progress, 3)
      const radius = eased * Math.max(w, h) * 0.55
      const alpha = (1 - progress) * 0.32
      ctx.strokeStyle = `rgba(245, 245, 245, ${alpha})`
      ctx.lineWidth = 0.6 + (1 - progress) * 1.4
      ctx.beginPath()
      ctx.arc(r.x * w, r.y * h, radius, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  function step(dt) {
    if (reduceMotion) return
    particles.forEach((p) => {
      p.x += p.vx
      p.y += p.vy
      if (p.x < 0 || p.x > 1) p.vx *= -1
      if (p.y < 0 || p.y > 1) p.vy *= -1
      if (p.flare > 0) p.flare = Math.max(0, p.flare - dt / 1400)
    })
  }

  let prevT = 0
  function tick(t) {
    const dt = prevT ? t - prevT : 16
    prevT = t
    ctx.clearRect(0, 0, w, h)
    drawAnchors(t)
    drawWaves(t)
    drawConstellation()
    drawRipples(dt)
    step(dt)
    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)

  cleanup = () => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('resize', resize)
    window.removeEventListener('click', onClick)
  }
})

onBeforeUnmount(() => {
  cleanup?.()
})
</script>

<template>
  <canvas ref="canvasRef" class="bg-field" aria-hidden="true" />
</template>

<style scoped>
.bg-field {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
</style>
