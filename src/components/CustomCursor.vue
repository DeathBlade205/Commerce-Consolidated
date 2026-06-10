<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { hasFinePointer } from '../composables/useFinePointer.js'

// Two-layer cursor:
//   • Dot snapped to the exact pointer position — this IS the cursor.
//     Native `cursor: none` is set in base.css so the system pointer is
//     hidden site-wide.
//   • Trailing ring eased toward the pointer with a critically-damped lerp.
//     Gives motion a sense of weight + reads as the flashlight zone.
//
// On hover (links / buttons / inputs): the dot scales up to signal "click
// target", and the ring shrinks tight around it. On touch devices we render
// nothing — no pointer to indicate.

const ringX = ref(-200)
const ringY = ref(-200)
const dotX = ref(-200)
const dotY = ref(-200)
const visible = ref(false)
const hovering = ref(false)

// Render only for hover-capable fine pointers — matches the media query that
// hides the native cursor in base.css, so we never hide one without the other.
const isTouch = !hasFinePointer()

let targetX = -200
let targetY = -200
let rafId = 0

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, textarea, select, label'

function onMove(e) {
  targetX = e.clientX
  targetY = e.clientY
  // Dot snaps to exact pointer position — no easing, this IS the cursor.
  dotX.value = targetX
  dotY.value = targetY
  if (!visible.value) visible.value = true
  // Hover detection on every mousemove. Using mouseover/mouseout fires for
  // every descendant boundary cross, which flickers the hover state off when
  // moving between children of an interactive element (e.g. across the
  // spans inside a link). Sampling on mousemove gives a stable read.
  hovering.value = !!e.target?.closest?.(INTERACTIVE_SELECTOR)
}

function onLeave() {
  visible.value = false
  hovering.value = false
}

function tick() {
  // Critically damped lerp — k controls trail length (higher = snappier).
  const k = 0.22
  ringX.value += (targetX - ringX.value) * k
  ringY.value += (targetY - ringY.value) * k
  rafId = requestAnimationFrame(tick)
}

onMounted(() => {
  if (isTouch) return
  window.addEventListener('mousemove', onMove)
  document.documentElement.addEventListener('mouseleave', onLeave)
  rafId = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  window.removeEventListener('mousemove', onMove)
  document.documentElement.removeEventListener('mouseleave', onLeave)
})
</script>

<template>
  <template v-if="!isTouch">
    <!-- Outer trailing ring — eased lerp from the pointer. -->
    <div
      class="cursor-ring"
      :class="{ 'is-visible': visible, 'is-hovering': hovering }"
      :style="{ transform: `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)` }"
      aria-hidden="true"
    />

    <!-- Inner dot — snaps to exact pointer position. Scales up on hover. -->
    <div
      class="cursor-dot"
      :class="{ 'is-visible': visible, 'is-hovering': hovering }"
      :style="{ transform: `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)` }"
      aria-hidden="true"
    />
  </template>
</template>

<style scoped>
/* Trailing ring — eased lerp behind the dot. */
.cursor-ring {
  position: fixed;
  top: 0;
  left: 0;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 50%;
  pointer-events: none;
  z-index: 9998;
  mix-blend-mode: difference;
  opacity: 0;
  transition:
    opacity 240ms ease,
    width 220ms cubic-bezier(0.2, 0.7, 0.2, 1),
    height 220ms cubic-bezier(0.2, 0.7, 0.2, 1),
    border-color 200ms ease;
  will-change: transform, opacity, width, height;
}

.cursor-ring.is-visible {
  opacity: 1;
}

/* Hover: ring tightens around the (now bigger) dot + brightens. */
.cursor-ring.is-hovering {
  width: 28px;
  height: 28px;
  border-color: rgba(255, 255, 255, 0.9);
}

/* Inner dot — fixed to exact pointer. No transform transition (would lag the
   real position). Only scales via width/height on hover. */
.cursor-dot {
  position: fixed;
  top: 0;
  left: 0;
  width: 6px;
  height: 6px;
  background: #fff;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  mix-blend-mode: difference;
  opacity: 0;
  transition:
    opacity 240ms ease,
    width 220ms cubic-bezier(0.2, 0.7, 0.2, 1),
    height 220ms cubic-bezier(0.2, 0.7, 0.2, 1);
  will-change: transform, opacity, width, height;
}

.cursor-dot.is-visible {
  opacity: 1;
}

/* Hover: dot grows. Signals "this is clickable". */
.cursor-dot.is-hovering {
  width: 12px;
  height: 12px;
}
</style>
