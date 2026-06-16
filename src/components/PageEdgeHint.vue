<script setup>
// Inline "scroll [direction] for [target]" hint shown at the edge of a page
// where the scroll-trigger swap is available. Used at the BOTTOM of Process
// (scroll down → Home) and the TOP of Contact (scroll up → Home). Clicking
// the hint jumps directly via the router.
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from '../composables/useI18n.js'

const props = defineProps({
  to: { type: String, required: true },
  label: { type: String, required: true },
  /** 'up' (sits at the top of the page) | 'down' (sits at the bottom) */
  direction: {
    type: String,
    required: true,
    validator: (v) => ['up', 'down'].includes(v),
  },
})

const { t } = useI18n()
const cue = computed(() => t(props.direction === 'up' ? 'common.scrollUp' : 'common.scrollDown'))
</script>

<template>
  <RouterLink :to="to" class="edge-hint" :class="`edge-hint--${direction}`">
    <span class="edge-hint__cue">{{ cue }}</span>
    <span class="edge-hint__inner">
      <span v-if="direction === 'up'" class="edge-hint__arrow" aria-hidden="true">↑</span>
      <span class="edge-hint__label">{{ label }}</span>
      <span v-if="direction === 'down'" class="edge-hint__arrow" aria-hidden="true">↓</span>
    </span>
  </RouterLink>
</template>

<style scoped>
.edge-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 56px 0;
  text-decoration: none;
  color: inherit;
  font-family: var(--font-mono);
  /* Quiet by default — these are wayfinding cues, not headlines. */
  opacity: 0.6;
  transition: opacity 280ms ease;
}

.edge-hint:hover {
  opacity: 1;
}

.edge-hint--up {
  /* When placed at the top of a page, flip the column so the cue sits BELOW
     the arrow+label — matches the visual logic of "look up to go up". */
  flex-direction: column-reverse;
}

.edge-hint__cue {
  font-size: 10px;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--grey-500);
}

.edge-hint__inner {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  font-size: clamp(22px, 2.4vw, 34px);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 500;
  color: var(--grey-100);
}

.edge-hint__arrow {
  font-size: 1.1em;
  line-height: 1;
  transition: transform 280ms cubic-bezier(0.2, 0.7, 0.2, 1);
}

.edge-hint--down:hover .edge-hint__arrow { transform: translateY(4px); }
.edge-hint--up:hover   .edge-hint__arrow { transform: translateY(-4px); }

@media (max-width: 880px) {
  .edge-hint {
    padding: 40px 0;
  }
  .edge-hint__inner {
    font-size: 20px;
    gap: 12px;
  }
}
</style>
