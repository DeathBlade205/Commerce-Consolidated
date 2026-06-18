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
  /* Soft white glow (a "light shadow") so the mark lifts off the near-black
     backgrounds instead of sitting flat. drop-shadow follows the alpha shape,
     so it haloes the mark itself. Two layers: a tight core + a wider bloom. */
  filter:
    drop-shadow(0 0 8px rgba(255, 255, 255, 0.35))
    drop-shadow(0 0 26px rgba(255, 255, 255, 0.15));
}
</style>
