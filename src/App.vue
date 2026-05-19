<script setup>
import NavBar from './components/NavBar.vue'
import CustomCursor from './components/CustomCursor.vue'
import GrainOverlay from './components/GrainOverlay.vue'
import CornerMarks from './components/CornerMarks.vue'
import { RouterView } from 'vue-router'
</script>

<template>
  <CustomCursor />
  <GrainOverlay />
  <CornerMarks />
  <NavBar />
  <RouterView v-slot="{ Component }">
    <Transition name="fade" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
