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
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

// Layout-only meta — the marker number + which side the small card sits on.
// All copy (title, emphasis word, duration, body) comes from i18n so it
// localises. The heading's emphasis word changes per step (the signature).
const stepMeta = [
  { number: '01', side: 'left' },
  { number: '02', side: 'right' },
  { number: '03', side: 'left' },
]

const currentStep = ref(0)
// +1 = advancing (slide right→left), -1 = stepping back (mirrored).
const stepDir = ref(1)

// Reactive to both currentStep and locale (t reads the locale ref).
const currentData = computed(() => {
  const i = currentStep.value
  const m = stepMeta[i]
  return {
    number: m.number,
    side: m.side,
    title: t(`process.steps.${i}.title`),
    word: t(`process.steps.${i}.word`),
    duration: t(`process.steps.${i}.duration`),
    body: t(`process.steps.${i}.body`),
  }
})

function setStep(n) {
  stepDir.value = n >= currentStep.value ? 1 : -1
  currentStep.value = n
}

const unregister = registerStepHost({
  count: stepMeta.length,
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
    const next = Math.min(currentStep.value + 1, stepMeta.length - 1)
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
    <!-- The emphasis word changes per step (considered → consolidated →
         collaborative) and cross-fades on step change. -->
    <h1 class="process-heading">
      {{ t('process.headingPre') }}
      <Transition name="word-fade" mode="out-in">
        <em :key="currentStep">{{ currentData.word }}</em>
      </Transition>
      {{ t('process.headingPost') }}
    </h1>

    <!-- Deck = stage + step indicator, centred as one unit between the heading
         and the bottom bar. -->
    <div class="step-deck">
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
              <p class="label step-card__label">{{ t('process.stepWord') }} {{ currentData.number }}</p>
              <h3 class="step-card__title">{{ currentData.title }}</h3>
            </article>
            <article class="step-card step-card--body">
              <p class="step-card__desc">{{ currentData.body }}</p>
              <p class="label step-card__duration">{{ currentData.duration }}</p>
            </article>
          </div>
        </Transition>
      </div>

      <!-- Step indicator: shows there's a deck to move through, and taps jump
           directly. On touch this is the swipe affordance. -->
      <nav class="step-dots" :aria-label="t('process.stepsAria')">
        <button
          v-for="(s, i) in stepMeta"
          :key="s.number"
          type="button"
          class="step-dot"
          :class="{ 'is-active': i === currentStep }"
          :aria-label="`${t('process.goToStep')} ${s.number}`"
          :aria-current="i === currentStep ? 'step' : undefined"
          @click="setStep(i)"
        />
      </nav>
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
  font-family: var(--font-sans);
  font-weight: 500;
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

/* The emphasis word cross-fades when the step changes (opacity only — keeps
   the inline flow intact, no layout shift). */
.word-fade-enter-active,
.word-fade-leave-active {
  transition: opacity 260ms ease;
}
.word-fade-enter-from,
.word-fade-leave-to {
  opacity: 0;
}

/* Deck floats to the vertical centre of the gap between the heading and the
   bottom bar (margin:auto in the flex column), carrying the stage + dots as
   one unit. */
.step-deck {
  margin: auto 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: clamp(22px, 3.5vh, 40px);
}

/* Conveyor stage. Pairs slide horizontally through it; overflow clips the one
   that's leaving. The boxes are a restrained fixed height — flex:1 used to
   stretch them full-height, which read as oversized. */
.step-stage {
  position: relative;
  width: 100%;
  height: clamp(260px, 42vh, 360px);
  overflow: hidden;
}

/* Step indicator — small dots, current one lit. Buttons carry a generous
   transparent hit area (touch) around a small visual dot drawn via ::before. */
.step-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.step-dot {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  padding: 0;
}

.step-dot::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--grey-500);
  transition: background 280ms ease, transform 280ms ease;
}

.step-dot.is-active::before {
  background: var(--grey-100);
  transform: scale(1.35);
}

.step-dot:hover::before {
  background: var(--grey-300);
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
  font-family: var(--font-sans);
  font-weight: 500;
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

/* Short desktop windows: heading + deck + full-size padding used to overflow
   100svh by ~100px (worst in EN, whose heading wraps wider), leaving the
   document scrollable — each wheel gesture then scrolled that dead overflow
   instead of charging the swap to Home. Compact the chrome so the deck always
   fits inside the viewport and atBottom() is true immediately. */
@media (min-width: 881px) and (max-height: 860px) {
  .process-page {
    padding: 110px 48px 72px;
    gap: 40px;
  }

  .process-heading {
    font-size: clamp(32px, 4.2vw, 56px);
  }

  .step-stage {
    height: clamp(230px, 40vh, 320px);
  }

  .step-card--body {
    padding: 28px 36px;
    gap: 18px;
  }

  .step-card--marker {
    padding: 26px 28px;
    gap: 14px;
  }
}

@media (max-width: 880px) {
  .process-page {
    padding: 110px 22px 110px;
    gap: 40px;
  }

  /* Mobile: the pair stacks vertically — marker on top regardless of side —
     but the conveyor slide stays; the pair still moves as one unit. Stage
     sizes to the stacked cards; the deck's margin:auto still centres it. */
  .step-stage {
    height: auto;
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
