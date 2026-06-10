<script setup>
// Process page is a 3-step slide deck. Scrolling fires step transitions via
// useScrollNav's step-host registration. At step 2 (last), one more scroll
// down falls through to the page-swap → Home. The Process page sits to the
// LEFT of Home on the page-line, so "scroll down at the end" continues
// rightward into Home.
//
// Step animation: the marker box (small) and body box (large) are persistent
// slots that animate their horizontal positions on step change. When a step
// flips the layout (marker side: left → right), both boxes slide across each
// other simultaneously, visually swapping sides. Content inside each box
// cross-fades in place.
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { registerStepHost } from '../composables/useScrollNav.js'

const processSteps = [
  {
    number: '01',
    title: 'Brief',
    duration: 'Week 1',
    description:
      'We meet, we listen, we write back what we heard. No proposal goes out until both sides have read the same problem.',
    side: 'left',
  },
  {
    number: '02',
    title: 'Design',
    duration: 'Weeks 2–5',
    description:
      'Direction, refinement, decisions. Fewer rounds, longer ones. The system is set in this phase, not painted on later.',
    side: 'right',
  },
  {
    number: '03',
    title: 'Build & Launch',
    duration: 'Weeks 4–12',
    description:
      'Production happens in parallel with late-stage design. Handover, documentation, and training fold into the last two weeks.',
    side: 'left',
  },
]

const currentStep = ref(0)
const previousStep = ref(0)

const currentSide = computed(() => processSteps[currentStep.value].side)
const currentData = computed(() => processSteps[currentStep.value])

function setStep(n) {
  previousStep.value = currentStep.value
  currentStep.value = n
}

const unregister = registerStepHost({
  count: processSteps.length,
  getCurrentStep: () => currentStep.value,
  setStep,
})

// Keyboard nav: ArrowDown / Space = next step, ArrowUp = previous step.
// Mirrors the scroll-trigger step swap so the deck is keyboard-accessible.
function onKey(e) {
  // Leave Space/arrows alone when a control is focused (e.g. the progress
  // bar buttons) or the user is typing — native activation wins there.
  const tag = e.target?.tagName
  if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'TEXTAREA') return
  if (e.target?.isContentEditable) return

  if (e.key === 'ArrowDown' || e.key === ' ') {
    e.preventDefault()
    const next = Math.min(currentStep.value + 1, processSteps.length - 1)
    if (next !== currentStep.value) setStep(next)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    const next = Math.max(currentStep.value - 1, 0)
    if (next !== currentStep.value) setStep(next)
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  unregister?.()
})
</script>

<template>
  <main class="process-page">
    <h1 class="process-heading">
      A studio for <em>considered</em> commerce.
    </h1>

    <!-- Two persistent slots. `step-row--marker-{side}` swaps their absolute
         `left` values; the CSS transition on `left` does the actual slide.
         Content inside each slot cross-fades when the step number changes. -->
    <div class="step-row" :class="`step-row--marker-${currentSide}`">
      <div class="step-slot step-slot--marker">
        <Transition name="step-fade">
          <article :key="currentStep" class="step-card step-card--marker">
            <p class="label step-card__label">Step {{ currentData.number }}</p>
            <h3 class="step-card__title">{{ currentData.title }}</h3>
          </article>
        </Transition>
      </div>

      <div class="step-slot step-slot--body">
        <Transition name="step-fade">
          <article :key="currentStep" class="step-card step-card--body">
            <p class="step-card__desc">{{ currentData.description }}</p>
            <p class="label step-card__duration">{{ currentData.duration }}</p>
          </article>
        </Transition>
      </div>
    </div>
  </main>
</template>

<style scoped>
.process-page {
  /* svh, not vh — see HomeView. The deck must fit the visible viewport. */
  min-height: 100vh;
  min-height: 100svh;
  padding: 140px 48px 120px;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 80px;
  /* No document scroll — the wheel is consumed by step swaps via useScrollNav. */
  overflow: hidden;
}

.process-heading {
  font-family: var(--font-serif);
  font-size: clamp(40px, 5vw, 72px);
  line-height: 1.05;
  letter-spacing: -0.015em;
  color: var(--grey-100);
  text-align: center;
  margin: 0;
}

.process-heading em {
  font-style: italic;
  color: var(--grey-300);
}

/* Two slots, absolutely positioned. Their `left` value depends on the row
   class (marker-left vs marker-right). CSS transition on `left` animates
   the swap — both slots slide across each other in opposite directions. */
.step-row {
  position: relative;
  flex: 1;
  min-height: 420px;
  margin: 0 auto;
  width: 100%;
}

.step-slot {
  position: absolute;
  top: 0;
  bottom: 0;
  transition: left 700ms cubic-bezier(0.4, 0, 0.6, 1);
}

.step-slot--marker {
  width: 30%;
}

.step-slot--body {
  width: 66%;
}

/* Marker-on-LEFT layout */
.step-row--marker-left  .step-slot--marker { left: 0; }
.step-row--marker-left  .step-slot--body   { left: 34%; }

/* Marker-on-RIGHT layout (Step 2). Both slots animate to new lefts. */
.step-row--marker-right .step-slot--marker { left: 70%; }
.step-row--marker-right .step-slot--body   { left: 0; }

/* Cards inside slots — bordered boxes, with content that cross-fades on
   step change via the step-fade Transition. */
.step-card {
  position: absolute;
  inset: 0;
  border: 1px solid var(--hairline);
  background: rgba(255, 255, 255, 0.012);
  display: flex;
  flex-direction: column;
}

.step-card--marker {
  padding: 36px 32px;
  gap: 20px;
}

.step-card--body {
  padding: 40px 44px;
  gap: 28px;
}

.step-card__label {
  letter-spacing: 0.32em;
  color: var(--grey-500);
  margin: 0;
}

.step-card__title {
  margin: 0;
  font-family: var(--font-serif);
  font-size: clamp(28px, 3vw, 44px);
  line-height: 1.05;
  letter-spacing: -0.015em;
  color: var(--grey-100);
}

.step-card__desc {
  font-size: 15px;
  line-height: 1.75;
  color: var(--grey-300);
  max-width: 56ch;
  margin: 0;
}

.step-card__duration {
  color: var(--grey-500);
  margin: auto 0 0;
}

/* Content cross-fade — old card fades out, new fades in. Both stacked inside
   the same slot via absolute positioning, so they overlay during the swap. */
.step-fade-enter-active,
.step-fade-leave-active {
  transition: opacity 500ms ease, transform 500ms cubic-bezier(0.4, 0, 0.6, 1);
}

.step-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.step-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (prefers-reduced-motion: reduce) {
  .step-slot {
    transition: none;
  }
  .step-fade-enter-active,
  .step-fade-leave-active {
    transition: opacity 200ms ease;
  }
  .step-fade-enter-from,
  .step-fade-leave-to {
    transform: none;
  }
}

@media (max-width: 880px) {
  .process-page {
    padding: 110px 22px 110px;
    gap: 40px;
  }

  /* Mobile: stack slots vertically — marker on top regardless of side,
     body below. No horizontal slide on small viewports (too cramped). */
  .step-row {
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .step-slot {
    position: relative;
    width: 100%;
    top: auto;
    bottom: auto;
    transition: none;
  }

  .step-row--marker-left  .step-slot--marker,
  .step-row--marker-right .step-slot--marker { left: auto; order: 0; }
  .step-row--marker-left  .step-slot--body,
  .step-row--marker-right .step-slot--body   { left: auto; order: 1; }

  .step-card {
    position: relative;
    inset: auto;
  }

  /* Cards are static in the stacked layout, so during the cross-fade the
     leaving card would briefly double the column height. Take it out of
     flow for the transition so the entering card lands in place. */
  .step-fade-leave-active {
    position: absolute;
    inset: 0;
  }

  .step-card--marker { padding: 24px; }
  .step-card--body   { padding: 28px; min-height: 220px; }
  .step-card__desc   { font-size: 14px; }
}
</style>
