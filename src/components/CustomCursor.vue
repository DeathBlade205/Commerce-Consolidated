<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

// `targetX/Y` are the live mouse position; `x/y` are eased toward them every
// frame so the circle has a soft trailing feel instead of teleporting with the
// cursor. Native system cursor stays visible (no more `cursor: none` globally)
// so users can always see what they're pointing at.

const x = ref(-200)
const y = ref(-200)
const visible = ref(false)
const hovering = ref(false)

const isTouch = 'ontouchstart' in window || (navigator?.maxTouchPoints ?? 0) > 0

let targetX = -200
let targetY = -200
let rafId = 0

function onMove(e) {
  targetX = e.clientX
  targetY = e.clientY
  if (!visible.value) visible.value = true
}

function onLeave() {
  visible.value = false
}

function onOver(e) {
  if (e.target.closest?.('a, button, [role="button"]')) hovering.value = true
}
function onOut(e) {
  if (e.target.closest?.('a, button, [role="button"]')) hovering.value = false
}

function tick() {
  // Critically damped lerp — k controls trail length (higher = snappier).
  const k = 0.22
  x.value += (targetX - x.value) * k
  y.value += (targetY - y.value) * k
  rafId = requestAnimationFrame(tick)
}

onMounted(() => {
  if (isTouch) return
  window.addEventListener('mousemove', onMove)
  document.body.addEventListener('mouseover', onOver)
  document.body.addEventListener('mouseout', onOut)
  document.documentElement.addEventListener('mouseleave', onLeave)
  rafId = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  window.removeEventListener('mousemove', onMove)
  document.body.removeEventListener('mouseover', onOver)
  document.body.removeEventListener('mouseout', onOut)
  document.documentElement.removeEventListener('mouseleave', onLeave)
})
</script>

<template>
  <div
    v-if="!isTouch"
    class="cursor-ring"
    :class="{ 'is-visible': visible, 'is-hovering': hovering }"
    :style="{ transform: `translate(${x}px, ${y}px) translate(-50%, -50%)` }"
    aria-hidden="true"
  />
</template>

<style scoped>
/* Soft circle outline that follows the cursor as a visual indicator of the
   flashlight zone. The native system cursor remains visible — this is purely
   an additive ambient indicator. `mix-blend-mode: difference` keeps the ring
   readable on any background. */
.cursor-ring {
  position: fixed;
  top: 0;
  left: 0;
  width: 72px;
  height: 72px;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  mix-blend-mode: difference;
  opacity: 0;
  transition:
    opacity 240ms ease,
    width 200ms cubic-bezier(0.2, 0.7, 0.2, 1),
    height 200ms cubic-bezier(0.2, 0.7, 0.2, 1),
    border-color 200ms ease;
  will-change: transform, opacity, width, height;
}

.cursor-ring.is-visible {
  opacity: 1;
}

/* On interactive elements: shrink + brighten so it feels like a "click target"
   indicator rather than a flashlight zone. */
.cursor-ring.is-hovering {
  width: 28px;
  height: 28px;
  border-color: rgba(255, 255, 255, 0.95);
}
</style>
