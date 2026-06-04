<script setup>
// Process page is a 3-step slide deck. Scrolling fires step transitions via
// useScrollNav's step-host registration. At step 2 (last), one more scroll
// down falls through to the page-swap → Home. The Process page sits to the
// LEFT of Home on the page-line, so "scroll down at the end" continues
// rightward into Home.
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import ProcessRow from '../components/ProcessRow.vue'
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

// Direction of the step swap drives the slide transition name (mirrors the
// page-swap naming in App.vue): going forward (step+1) reads as a left-slide;
// going backward (step-1) as a right-slide.
const slideName = computed(() =>
  currentStep.value >= previousStep.value ? 'step-slide-left' : 'step-slide-right',
)

function setStep(n) {
  previousStep.value = currentStep.value
  currentStep.value = n
}

// Register the step host SYNCHRONOUSLY during setup so the very first wheel
// event on this page sees a non-null host. (Registering in onMounted left a
// race window where the wheel could fire as 'page' intent and trigger a
// premature page swap before the host appeared.)
const unregister = registerStepHost({
  count: processSteps.length,
  getCurrentStep: () => currentStep.value,
  setStep,
})

// Keyboard nav: ArrowDown / Space = next step, ArrowUp = previous step.
// Mirrors the scroll-trigger step swap so the deck is keyboard-accessible.
function onKey(e) {
  if (e.key === 'ArrowDown' || e.key === ' ') {
    const next = Math.min(currentStep.value + 1, processSteps.length - 1)
    if (next !== currentStep.value) setStep(next)
  } else if (e.key === 'ArrowUp') {
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

    <div class="step-stage">
      <Transition :name="slideName">
        <ProcessRow
          :key="currentStep"
          class="step-stage__row"
          v-bind="processSteps[currentStep]"
        />
      </Transition>
    </div>
  </main>
</template>

<style scoped>
.process-page {
  min-height: 100vh;
  padding: 140px 48px 120px;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 80px;
  /* No document scroll — the wheel is consumed by step swaps via useScrollNav,
     not by overflowing content. */
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

/* Stage that holds one ProcessRow at a time. Position context lets the
   leaving row absolutely position over the entering row so they slide
   together horizontally without vertical layout jumps. */
.step-stage {
  position: relative;
  flex: 1;
  min-height: 420px;
}

.step-stage__row {
  width: 100%;
}

/* Step swap transitions — mirror the page-swap slide style from App.vue.
   "left" = next step sliding in from the right; "right" = previous step
   sliding in from the left. */
.step-slide-left-enter-active,
.step-slide-right-enter-active,
.step-slide-left-leave-active,
.step-slide-right-leave-active {
  transition:
    transform 700ms cubic-bezier(0.4, 0, 0.6, 1),
    opacity 540ms linear;
  will-change: transform, opacity;
}

.step-slide-left-leave-active,
.step-slide-right-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.step-slide-left-enter-from  { transform: translate3d(100%, 0, 0);  opacity: 0.4; }
.step-slide-left-leave-to    { transform: translate3d(-100%, 0, 0); opacity: 0.4; }
.step-slide-right-enter-from { transform: translate3d(-100%, 0, 0); opacity: 0.4; }
.step-slide-right-leave-to   { transform: translate3d(100%, 0, 0);  opacity: 0.4; }

@media (prefers-reduced-motion: reduce) {
  .step-slide-left-enter-active,
  .step-slide-left-leave-active,
  .step-slide-right-enter-active,
  .step-slide-right-leave-active {
    transition: opacity 200ms ease;
  }
  .step-slide-left-enter-from,
  .step-slide-left-leave-to,
  .step-slide-right-enter-from,
  .step-slide-right-leave-to {
    transform: none;
  }
}

@media (max-width: 880px) {
  .process-page {
    padding: 110px 22px 110px;
    gap: 40px;
  }
  .step-stage {
    min-height: 320px;
  }
}
</style>
