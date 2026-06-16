<script setup>
// Three-segment indicator for Process / Home / Contact. Lives fixed at the
// bottom-centre on every page so the user always knows where they are AND can
// click to jump directly. The current page's segment is wider and filled;
// neighbour segments fill progressively from the side adjacent to the current
// segment as the user accumulates scroll-charge toward them. The fill mirrors
// the threshold logic in useScrollNav — once it reaches the end, the swap
// fires automatically.
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useScrollState, ORDERED_PATHS } from '../composables/useScrollNav.js'
import { useI18n } from '../composables/useI18n.js'

const route = useRoute()
const router = useRouter()
const { scrollCharge } = useScrollState()
const { t } = useI18n()

// Map a page path to its i18n nav label.
const NAV_KEY = { '/process': 'nav.process', '/': 'nav.home', '/contact': 'nav.contact' }
const labelFor = (page) => t(NAV_KEY[page.path] || 'nav.home')

const currentX = computed(() => route.meta?.x ?? 0)

// Fill ratio (0..1) for each segment.
//  - Current page: always 1 (fully lit).
//  - Adjacent neighbour in the direction the user is charging: |scrollCharge|.
//  - Anything else: 0.
function fillFor(page) {
  if (page.x === currentX.value) return 1
  const delta = page.x - currentX.value
  if (Math.abs(delta) !== 1) return 0
  if (Math.sign(delta) !== Math.sign(scrollCharge.value)) return 0
  return Math.abs(scrollCharge.value)
}

// Fill grows from the side closest to the current page so the eye reads it as
// "charging toward you" from the user's current position. Left neighbour
// fills from its right edge; right neighbour fills from its left edge.
function fillOriginFor(page) {
  if (page.x < currentX.value) return 'right'
  return 'left'
}

function navigate(path) {
  if (path !== route.path) router.push(path)
}
</script>

<template>
  <nav class="page-progress" aria-label="Page navigation">
    <button
      v-for="page in ORDERED_PATHS"
      :key="page.path"
      type="button"
      class="page-progress__item"
      :class="{ 'is-current': page.x === currentX }"
      :aria-label="`Go to ${labelFor(page)}`"
      :aria-current="page.x === currentX ? 'page' : undefined"
      @click="navigate(page.path)"
    >
      <span class="page-progress__bar">
        <span
          class="page-progress__fill"
          :style="{
            transform: `scaleX(${fillFor(page)})`,
            transformOrigin: fillOriginFor(page),
          }"
        />
      </span>
      <span class="page-progress__label">{{ labelFor(page) }}</span>
    </button>
  </nav>
</template>

<style scoped>
.page-progress {
  position: fixed;
  /* safe-area inset keeps the bars clear of the iOS home indicator */
  bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  left: 50%;
  transform: translateX(-50%);
  z-index: 95;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  /* Read against any background — same trick as the top nav. */
  mix-blend-mode: difference;
}

.page-progress__item {
  appearance: none;
  border: none;
  background: transparent;
  padding: 10px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  /* No cursor override — base.css hides the native pointer site-wide and a
     `cursor: pointer` here would resurrect it over the bars. */
  font-family: var(--font-mono);
}

.page-progress__bar {
  position: relative;
  width: 56px;
  height: 3px;
  background: rgba(255, 255, 255, 0.35);
  border-radius: 999px;
  overflow: hidden;
  transition:
    width 320ms cubic-bezier(0.65, 0, 0.35, 1),
    background 240ms ease;
}

.is-current .page-progress__bar {
  width: 96px;
  background: rgba(255, 255, 255, 0.55);
}

/* The fill is a full-width child scaled along X. transform-origin (set
   inline) decides which side it grows from. scrollCharge updates every
   frame as the user scrolls, so we just need the lightest smoothing
   between frames — fully linear keeps the bar's growth tracking the
   user's input pace 1:1. */
.page-progress__fill {
  position: absolute;
  inset: 0;
  background: var(--grey-100);
  transform: scaleX(0);
  transition: transform 70ms linear;
}

.page-progress__label {
  font-size: 10px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--grey-300);
  transition: color 240ms ease;
}

.is-current .page-progress__label {
  color: var(--grey-100);
}

.page-progress__item:hover:not(.is-current) .page-progress__label {
  color: var(--grey-100);
}

.page-progress__item:hover:not(.is-current) .page-progress__bar {
  background: rgba(255, 255, 255, 0.55);
}

@media (max-width: 880px) {
  .page-progress {
    bottom: calc(10px + env(safe-area-inset-bottom, 0px));
    gap: 10px;
  }
  .page-progress__bar {
    width: 32px;
  }
  .is-current .page-progress__bar {
    width: 52px;
  }
  .page-progress__label {
    font-size: 8px;
    letter-spacing: 0.2em;
  }
}
</style>
