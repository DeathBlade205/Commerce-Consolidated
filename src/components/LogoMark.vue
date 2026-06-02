<script setup>
// `compact` strips the dashed midline + EST · MMXXVI caption so the mark stays
// legible at small sizes (e.g. inside the nav bar). At ~40px the caption is
// rendered around 2px tall and reads as noise.
defineProps({
  size: { type: Number, default: 140 },
  compact: { type: Boolean, default: false },
})
</script>

<template>
  <svg
    class="logo-mark"
    :width="size"
    :height="size"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Commerce Consolidated mark"
  >
    <rect x="1" y="1" width="98" height="98" stroke="currentColor" :stroke-width="compact ? 2 : 0.8" />
    <line
      v-if="!compact"
      x1="1" y1="50" x2="99" y2="50"
      stroke="currentColor"
      stroke-width="0.4"
      stroke-dasharray="2 3"
    />
    <text
      x="50"
      :y="compact ? 65 : 48"
      text-anchor="middle"
      dominant-baseline="middle"
      fill="currentColor"
      font-family="'Geist Mono', monospace"
      :font-size="compact ? 44 : 28"
      letter-spacing="-1.2"
      font-weight="500"
    >CC</text>
    <text
      v-if="!compact"
      x="50"
      y="72"
      text-anchor="middle"
      fill="currentColor"
      font-family="'Geist Mono', monospace"
      font-size="5"
      letter-spacing="1.4"
      font-weight="400"
    >EST · MMXXVI</text>
  </svg>
</template>

<style scoped>
.logo-mark {
  display: block;
}
</style>
