<script setup>
// One row of the Process page: a slide block on one side, a text block on the
// other. Used inside AboutView to render the 3 staged steps. The parent decides
// which side the slide sits on via `side`, and which direction the row reveals
// from via `reveal` (`left` | `right`).
defineProps({
  number: { type: String, required: true },
  title: { type: String, required: true },
  duration: { type: String, required: true },
  description: { type: String, required: true },
  /** Which side the slide / visual block sits on: 'left' | 'right' */
  side: { type: String, default: 'right' },
  /** Image src — if omitted, a typographic placeholder is rendered. */
  image: { type: String, default: '' },
  /** Optional alt text for the slide. */
  alt: { type: String, default: '' },
})
</script>

<template>
  <article class="proc-row" :class="`proc-row--slide-${side}`">
    <div class="proc-row__text">
      <p class="label proc-row__step">Step {{ number }}</p>
      <h3 class="proc-row__title">{{ title }}</h3>
      <p class="label proc-row__duration">{{ duration }}</p>
      <p class="proc-row__desc">{{ description }}</p>
    </div>

    <figure class="proc-row__slide">
      <img v-if="image" :src="image" :alt="alt" class="proc-row__img" />
      <!-- Typographic placeholder until real assets land -->
      <div v-else class="proc-row__placeholder" aria-hidden="true">
        <span class="proc-row__placeholder-num">{{ number }}</span>
        <span class="proc-row__placeholder-label">{{ title }}</span>
      </div>
    </figure>
  </article>
</template>

<style scoped>
.proc-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
  gap: 80px;
  align-items: center;
}

/* When the slide is on the LEFT, swap visual order so text sits on the right. */
.proc-row--slide-left .proc-row__slide { order: 0; }
.proc-row--slide-left .proc-row__text  { order: 1; }
.proc-row--slide-left {
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
}

.proc-row__text {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.proc-row__step {
  letter-spacing: 0.32em;
}

.proc-row__title {
  font-family: var(--font-serif);
  font-size: clamp(32px, 4vw, 56px);
  line-height: 1.05;
  letter-spacing: -0.015em;
  color: var(--grey-100);
  margin: 0;
}

.proc-row__duration {
  color: var(--grey-500);
  margin-top: 4px;
}

.proc-row__desc {
  font-size: 15px;
  line-height: 1.75;
  color: var(--grey-300);
  max-width: 46ch;
  margin: 0;
}

.proc-row__slide {
  margin: 0;
  position: relative;
  border: 1px solid var(--hairline);
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.015);
}

.proc-row__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Placeholder: oversized step number ghosted in the slide area + a small
   wordmark in the corner. Sits in for real imagery without looking broken. */
.proc-row__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  padding: 32px;
  font-family: var(--font-mono);
}

.proc-row__placeholder-num {
  font-family: var(--font-serif);
  font-size: clamp(96px, 18vw, 220px);
  line-height: 0.85;
  color: var(--grey-700);
  align-self: flex-end;
  margin-top: auto;
  letter-spacing: -0.04em;
}

.proc-row__placeholder-label {
  font-size: 11px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--grey-500);
}

@media (max-width: 880px) {
  .proc-row,
  .proc-row--slide-left {
    grid-template-columns: 1fr;
    gap: 28px;
  }
  /* Always show text first on mobile, regardless of slide side. */
  .proc-row__text { order: 0; }
  .proc-row__slide { order: 1; }

  .proc-row__desc {
    font-size: 14px;
  }

  .proc-row__placeholder {
    padding: 22px;
  }
}
</style>
