<script setup>
// Process page is a 3-step slide deck. Scrolling fires step transitions via
// useScrollNav's step-host registration. At step 2 (last), one more scroll
// down falls through to the page-swap → Home. The Process page sits to the
// LEFT of Home on the page-line, so "scroll down at the end" continues
// rightward into Home.
//
// Step animation: a conveyor. Each step renders one PAIR of boxes (small
// marker + large body, arrangement alternating per step via `side`). On
// advance, the whole outgoing pair slides off to the LEFT while the new
// pair slides in from the RIGHT — previous boxes leave, making space for
// the next ones. Stepping back plays the same slide mirrored.
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
// +1 = advancing (slide right→left), -1 = stepping back (mirrored).
const stepDir = ref(1)

const currentData = computed(() => processSteps[currentStep.value])

function setStep(n) {
  stepDir.value = n >= currentStep.value ? 1 : -1
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

    <!-- Conveyor stage: each step is one pair of cards keyed by step index.
         The outgoing pair slides off (absolute during leave so the entering
         pair takes its place), the incoming pair slides in. `--flip` puts
         the marker on the right for alternating steps. -->
    <div class="step-stage">
      <Transition :name="stepDir > 0 ? 'step-next' : 'step-prev'">
        <div
          :key="currentStep"
          class="step-pair"
          :class="{ 'step-pair--flip': currentData.side === 'right' }"
        >
          <article class="step-card step-card--marker">
            <p class="label step-card__label">Step {{ currentData.number }}</p>
            <h3 class="step-card__title">{{ currentData.title }}</h3>
          </article>
          <article class="step-card step-card--body">
            <p class="step-card__desc">{{ currentData.description }}</p>
            <p class="label step-card__duration">{{ currentData.duration }}</p>
          </article>
        </div>
      </Transition>
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

/* Conveyor stage. Pairs slide horizontally through it; overflow clips the
   one that's leaving. The boxes are a restrained fixed height and the stage
   floats to the vertical centre of the gap between the heading and the bottom
   bar (margin:auto in the flex column) — flex:1 used to stretch them
   full-height, which read as oversized. */
.step-stage {
  position: relative;
  width: 100%;
  height: clamp(260px, 42vh, 360px);
  margin: auto 0;
  overflow: hidden;
}

/* One step = one pair of cards in a flex row. `--flip` mirrors the row so
   the small marker alternates sides between steps. Absolute against the
   stage so the cards always fill its height (percentage heights don't
   resolve against the flexed stage) — mobile reverts this to stack. */
.step-pair {
  position: absolute;
  inset: 0;
  display: flex;
  gap: 4%;
  align-items: stretch;
}

.step-pair--flip {
  flex-direction: row-reverse;
}

.step-card {
  border: 1px solid var(--hairline);
  background: rgba(255, 255, 255, 0.012);
  display: flex;
  flex-direction: column;
}

.step-card--marker {
  width: 30%;
}

.step-card--body {
  width: 66%;
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

/* Conveyor slide — same pacing/easing family as the page-line transition in
   App.vue so steps feel like a smaller version of the same mechanic.
   The leaving pair is absolute so the entering pair takes its place. */
.step-next-enter-active,
.step-next-leave-active,
.step-prev-enter-active,
.step-prev-leave-active {
  transition:
    transform 700ms cubic-bezier(0.4, 0, 0.6, 1),
    opacity 540ms linear;
}

.step-next-leave-active,
.step-prev-leave-active {
  position: absolute;
  inset: 0;
}

/* Advancing: new pair in from the RIGHT, old pair out to the LEFT. */
.step-next-enter-from {
  transform: translateX(calc(100% + 64px));
  opacity: 0.3;
}
.step-next-leave-to {
  transform: translateX(calc(-100% - 64px));
  opacity: 0.3;
}

/* Stepping back: mirrored. */
.step-prev-enter-from {
  transform: translateX(calc(-100% - 64px));
  opacity: 0.3;
}
.step-prev-leave-to {
  transform: translateX(calc(100% + 64px));
  opacity: 0.3;
}

@media (prefers-reduced-motion: reduce) {
  .step-next-enter-active,
  .step-next-leave-active,
  .step-prev-enter-active,
  .step-prev-leave-active {
    transition: opacity 200ms ease;
  }
  .step-next-enter-from,
  .step-next-leave-to,
  .step-prev-enter-from,
  .step-prev-leave-to {
    transform: none;
    opacity: 0;
  }
}

@media (max-width: 880px) {
  .process-page {
    padding: 110px 22px 110px;
    gap: 40px;
  }

  /* Mobile: the pair stacks vertically — marker on top regardless of side —
     but the conveyor slide stays; the pair still moves as one unit. Drop the
     fixed height + centring so the stacked cards size to content. */
  .step-stage {
    height: auto;
    margin: 0;
  }

  .step-pair,
  .step-pair--flip {
    position: relative;
    inset: auto;
    flex-direction: column;
    gap: 16px;
  }

  /* The leaving pair still overlays during the slide. */
  .step-next-leave-active,
  .step-prev-leave-active {
    position: absolute;
    inset: 0;
  }

  .step-card--marker,
  .step-card--body {
    width: 100%;
  }

  .step-card--marker { padding: 24px; }
  .step-card--body   { padding: 28px; min-height: 220px; }
  .step-card__desc   { font-size: 14px; }
}
</style>
