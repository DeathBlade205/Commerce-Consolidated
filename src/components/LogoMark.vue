<script setup>
// The brand mark. `size` sets the square px box; `compact` is kept for API
// compatibility (NavBar passes it) but the same artwork is used everywhere.
// Transparent, re-centred mark (processed from the supplied artwork, which was
// a white circle on an opaque black square — see assets/logo.png).
import logoUrl from '../assets/logo.png'

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
  /* Dark-grey halo hugging the mark's shape (drop-shadow follows the alpha),
     so it highlights/separates the logo from the near-black background without
     the harshness of a white glow. Tight ring + a softer outer bloom. */
  filter:
    drop-shadow(0 0 5px rgba(110, 110, 110, 0.6))
    drop-shadow(0 0 18px rgba(80, 80, 80, 0.4));
}
</style>
