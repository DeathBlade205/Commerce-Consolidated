<script setup>
// The brand mark. `size` sets the square px box; `compact` is kept for API
// compatibility (NavBar passes it) but the same artwork is used everywhere.
// The brand mark — a black tile with the white mark centred (assets/logo.png,
// re-centred from the supplied artwork). The black box is intentional; an
// underglow (below) separates it from the near-black page.
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
  /* Underglow: a grey halo around the BOX (box-shadow follows the square), so
     the black tile reads as a distinct logo against the near-black page rather
     than blending in. Grey, not white — white was too bright. */
  box-shadow:
    0 0 0 1px rgba(120, 120, 120, 0.18),
    0 0 22px 2px rgba(110, 110, 110, 0.4),
    0 0 48px 6px rgba(90, 90, 90, 0.22);
}
</style>
