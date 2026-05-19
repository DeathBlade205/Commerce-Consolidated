<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

defineProps({
  hidden: { type: Boolean, default: false },
  radius: { type: Number, default: 220 },
})

const brightRef = ref(null)

// Synchronous detection so initial render avoids a flash of dim content on touch devices.
const isTouch = ref(
  typeof window !== 'undefined' &&
  ('ontouchstart' in window ||
    (typeof navigator !== 'undefined' && (navigator.maxTouchPoints ?? 0) > 0)),
)

function onMouseMove(e) {
  const el = brightRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--x', `${e.clientX - rect.left}px`)
  el.style.setProperty('--y', `${e.clientY - rect.top}px`)
}

onMounted(() => {
  if (!isTouch.value) window.addEventListener('mousemove', onMouseMove)
})

onBeforeUnmount(() => {
  if (!isTouch.value) window.removeEventListener('mousemove', onMouseMove)
})
</script>

<template>
  <div
    class="fl-root"
    :class="{ 'fl-root--touch': isTouch }"
    :style="{ '--radius': `${radius}px` }"
  >
    <div v-if="!hidden && !isTouch" class="layer dim">
      <slot />
    </div>
    <div
      ref="brightRef"
      class="layer bright"
      :class="{
        'bright--solo': hidden || isTouch,
        'bright--no-mask': isTouch,
      }"
      :aria-hidden="!hidden && !isTouch ? 'true' : null"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* `.fl-root` was originally `.reveal` — renamed to avoid colliding with the
   global `.reveal` class used by the scroll-reveal directive in main.css,
   which sets opacity: 0 on anything classed `.reveal` and would silently
   hide everything inside the flashlight wrapper. */
.fl-root {
  position: relative;
  display: block;
  user-select: none;
}

.layer {
  display: block;
}

.dim {
  /* Subtle but readable. The reveal to --grey-100 is a clear brightness step. */
  color: var(--grey-500);
}

.dim :deep(em) {
  font-style: italic;
  color: var(--grey-300);
}

.bright {
  position: absolute;
  inset: 0;
  color: var(--grey-100);
  pointer-events: none;
  -webkit-mask-image: radial-gradient(
    circle var(--radius) at var(--x, -9999px) var(--y, -9999px),
    rgba(0, 0, 0, 1) 0%,
    rgba(0, 0, 0, 0.9) 30%,
    rgba(0, 0, 0, 0.3) 65%,
    rgba(0, 0, 0, 0) 100%
  );
  mask-image: radial-gradient(
    circle var(--radius) at var(--x, -9999px) var(--y, -9999px),
    rgba(0, 0, 0, 1) 0%,
    rgba(0, 0, 0, 0.9) 30%,
    rgba(0, 0, 0, 0.3) 65%,
    rgba(0, 0, 0, 0) 100%
  );
}

.bright :deep(em) {
  font-style: italic;
  color: #fff;
}

/* Solo: bright is the only child (hidden mode OR touch fallback) — size the box itself */
.bright--solo {
  position: relative;
  inset: auto;
}

/* Touch fallback: no mouse, so render content fully visible (no mask) */
.bright--no-mask {
  -webkit-mask-image: none;
  mask-image: none;
}
</style>
