<script setup>
// The brand mark — the supplied artwork (assets/logo.svg) used as-is (not
// cropped), only resized. Colours are inverted via CSS (the source is a white
// mark on black; inverted it reads as a dark mark on white).
import logoUrl from '../assets/logo.svg'

defineProps({
  size: { type: Number, default: 140 },
  compact: { type: Boolean, default: false },
})
</script>

<template>
  <img
    class="logo-mark"
    :src="logoUrl"
    :width="size"
    :height="size"
    alt="Commerce Consolidated"
    draggable="false"
  />
</template>

<style scoped>
.logo-mark {
  display: block;
  user-select: none;
  object-fit: contain;
  /* Invert the supplied artwork's colours (white-on-black -> black-on-white). */
  filter: invert(1);
}
</style>
