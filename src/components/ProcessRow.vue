<script setup>
// One row of the Process page, per the sketch layout:
// a SMALL bordered "marker" box (step number + title) on one side, alongside a
// LARGE bordered "body" box (description + duration tag) on the other.
// The parent decides which side the small marker sits on via `side`. The row's
// scroll-reveal direction is also derived from `side` so the motion reads as
// the row arriving from the side the marker lives on.
defineProps({
  number: { type: String, required: true },
  title: { type: String, required: true },
  duration: { type: String, required: true },
  description: { type: String, required: true },
  /** Which side the SMALL marker box sits on: 'left' | 'right' */
  side: { type: String, default: 'left' },
})
</script>

<template>
  <article class="proc-row" :class="`proc-row--marker-${side}`">
    <aside class="proc-row__marker">
      <p class="label proc-row__step">Step {{ number }}</p>
      <h3 class="proc-row__title">{{ title }}</h3>
    </aside>

    <div class="proc-row__body">
      <p class="proc-row__desc">{{ description }}</p>
      <p class="label proc-row__duration">{{ duration }}</p>
    </div>
  </article>
</template>

<style scoped>
/* Two-column grid: small marker + large body. Default puts the marker on the
   LEFT; the --marker-right modifier swaps both the grid template and the
   visual order so the marker ends up on the right. */
.proc-row {
  display: grid;
  grid-template-columns: minmax(0, 0.55fr) minmax(0, 1.45fr);
  gap: 48px;
  align-items: stretch;
}

.proc-row--marker-right {
  grid-template-columns: minmax(0, 1.45fr) minmax(0, 0.55fr);
}

.proc-row--marker-right .proc-row__marker { order: 1; }
.proc-row--marker-right .proc-row__body   { order: 0; }

/* Small marker box: step number on top, step title beneath. Bordered like the
   sketch's hand-drawn rectangle. */
.proc-row__marker {
  border: 1px solid var(--hairline);
  padding: 36px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: rgba(255, 255, 255, 0.012);
}

.proc-row__step {
  letter-spacing: 0.32em;
  color: var(--grey-500);
  margin: 0;
}

.proc-row__title {
  margin: 0;
  font-family: var(--font-serif);
  font-size: clamp(28px, 3vw, 44px);
  line-height: 1.05;
  letter-spacing: -0.015em;
  color: var(--grey-100);
}

/* Large body box: description + duration tag pinned to the bottom edge. */
.proc-row__body {
  border: 1px solid var(--hairline);
  padding: 40px 44px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  background: rgba(255, 255, 255, 0.012);
  min-height: 220px; /* keeps the box rectangular when desc is short */
}

.proc-row__desc {
  font-size: 15px;
  line-height: 1.75;
  color: var(--grey-300);
  max-width: 56ch;
  margin: 0;
}

.proc-row__duration {
  color: var(--grey-500);
  margin: auto 0 0; /* push to bottom-left of the body box */
}

@media (max-width: 880px) {
  .proc-row,
  .proc-row--marker-right {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  /* Always show marker first on mobile, regardless of side. */
  .proc-row__marker { order: 0; }
  .proc-row__body   { order: 1; }

  .proc-row__marker { padding: 24px; }
  .proc-row__body {
    padding: 28px;
    min-height: 0;
  }

  .proc-row__desc {
    font-size: 14px;
  }
}
</style>
