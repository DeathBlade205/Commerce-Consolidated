<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const x = ref(-100)
const y = ref(-100)
const hovering = ref(false)
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

function onMove(e) {
  x.value = e.clientX
  y.value = e.clientY
}

function onOver(e) {
  if (e.target.closest('a, button')) hovering.value = true
}

function onOut(e) {
  if (e.target.closest('a, button')) hovering.value = false
}

onMounted(() => {
  if (isTouch) return
  window.addEventListener('mousemove', onMove)
  document.body.addEventListener('mouseover', onOver)
  document.body.addEventListener('mouseout', onOut)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMove)
  document.body.removeEventListener('mouseover', onOver)
  document.body.removeEventListener('mouseout', onOut)
})
</script>

<template>
  <div
    v-if="!isTouch"
    class="cursor"
    :class="{ hovering }"
    :style="{ transform: `translate(${x}px, ${y}px)` }"
    aria-hidden="true"
  />
</template>

<style scoped>
.cursor {
  position: fixed;
  top: 0;
  left: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
  mix-blend-mode: difference;
  pointer-events: none;
  z-index: 9999;
  margin-left: -3px;
  margin-top: -3px;
  transition: width 0.2s ease, height 0.2s ease, margin 0.2s ease;
  will-change: transform;
}

.cursor.hovering {
  width: 32px;
  height: 32px;
  margin-left: -16px;
  margin-top: -16px;
}
</style>
