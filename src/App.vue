<script setup>
import { ref } from 'vue'
import { useRouter, RouterView, START_LOCATION } from 'vue-router'
import NavBar from './components/NavBar.vue'
import CustomCursor from './components/CustomCursor.vue'
import GrainOverlay from './components/GrainOverlay.vue'
import CornerMarks from './components/CornerMarks.vue'
import PageProgressBar from './components/PageProgressBar.vue'
import BootReveal from './components/BootReveal.vue'
import { useScrollNav } from './composables/useScrollNav.js'
import { useBootReveal } from './composables/useBootReveal.js'

const router = useRouter()
const { bootDone } = useBootReveal()

// Direction of the upcoming page transition. Pages are laid out on a number
// line via `meta.x` (process=-1, home=0, contact=1):
//   moving to a HIGHER x  → new page slides in from the RIGHT → name "slide-left"
//   moving to a LOWER  x  → new page slides in from the LEFT  → name "slide-right"
// (Named for the direction the OLD page moves, which matches CSS intuition.)
//
// Starts as 'none' (no matching CSS — renders instantly). The router resolves
// the initial URL asynchronously, so the first page is inserted AFTER the
// Transition's first render and would otherwise play a full slide-in from
// offscreen on every fresh load / refresh. afterEach runs before the render
// flush, and `from === START_LOCATION` identifies exactly that first resolve.
const transitionName = ref('none')

router.afterEach((to, from) => {
  if (from === START_LOCATION) return
  const toX = to.meta?.x ?? 0
  const fromX = from.meta?.x ?? 0
  transitionName.value = toX > fromX ? 'slide-left' : 'slide-right'
})

useScrollNav()
</script>

<template>
  <CustomCursor />
  <GrainOverlay />
  <CornerMarks />
  <NavBar />
  <PageProgressBar />
  <!-- Load animation: bulb charges, ripple uncovers the page. Unmounts after. -->
  <BootReveal v-if="!bootDone" />
  <div class="page-stage">
    <RouterView v-slot="{ Component }">
      <Transition :name="transitionName">
        <component :is="Component" :key="$route.fullPath" />
      </Transition>
    </RouterView>
  </div>
</template>

<style>
/* The page stage is the canvas the two pages slide across. We absolutely
   position the leaving page during the transition so the entering page takes
   its place at the same coordinates — no vertical stacking gap, no blank
   moment between pages. The simultaneous slide reads as "the page slid to
   the right and the new one came in from the left". */
.page-stage {
  position: relative;
  min-height: 100vh;
  overflow-x: clip; /* hide pages translated off-canvas without killing y-scroll */
}

.page-stage > * {
  width: 100%;
}

/* While transitioning, the LEAVING page is taken out of flow so the entering
   page can occupy the same space. Both glide in unison. */
.slide-left-leave-active,
.slide-right-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.slide-left-leave-active,
.slide-right-leave-active,
.slide-left-enter-active,
.slide-right-enter-active {
  /* Near-linear easing — was cubic-bezier(0.76, 0, 0.24, 1) which had a heavy
     slow-start / fast-middle profile. (0.4, 0.0, 0.6, 1) reads as "evenly
     paced glide" with only a very soft settle at the end. */
  transition:
    transform 700ms cubic-bezier(0.4, 0.0, 0.6, 1),
    opacity 540ms linear;
  will-change: transform, opacity;
}

/* slide-left: new page comes IN from the right; old page goes OUT to the left. */
.slide-left-enter-from {
  transform: translate3d(100%, 0, 0);
  opacity: 0.4;
}
.slide-left-leave-to {
  transform: translate3d(-100%, 0, 0);
  opacity: 0.4;
}

/* slide-right: new page comes IN from the left; old page goes OUT to the right. */
.slide-right-enter-from {
  transform: translate3d(-100%, 0, 0);
  opacity: 0.4;
}
.slide-right-leave-to {
  transform: translate3d(100%, 0, 0);
  opacity: 0.4;
}

@media (prefers-reduced-motion: reduce) {
  .slide-left-enter-active,
  .slide-left-leave-active,
  .slide-right-enter-active,
  .slide-right-leave-active {
    transition: opacity 200ms ease;
  }
  .slide-left-enter-from,
  .slide-left-leave-to,
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: none;
  }
}
</style>
