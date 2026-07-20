<script setup>
// The brand mark — the supplied artwork (assets/logo.svg, cc_logo_bbg) used
// as-is: black rounded-D on its white tile. No colour inversion (client call).
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
}
</style>
