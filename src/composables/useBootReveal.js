import { ref } from 'vue'

// Boot-reveal state. The load animation (BootReveal.vue) covers the page
// with a black shroud until its ripple has passed; pages that choreograph
// their own entry (HomeView's cascade + intro sweep) wait on `bootDone` so
// they don't animate invisibly under the shroud.
const bootDone = ref(false)

export function useBootReveal() {
  return { bootDone }
}

export function markBootRevealDone() {
  bootDone.value = true
}
