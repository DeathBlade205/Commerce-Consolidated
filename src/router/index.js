import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProcessView from '../views/ProcessView.vue'
import ContactView from '../views/ContactView.vue'

// `meta.x` is the conceptual horizontal position of each page. Process sits to
// the LEFT of Home; Contact sits to the RIGHT. The router-view transition
// compares the from/to `x` values to decide whether the slide plays left or
// right, so the motion always matches the spatial mental model.
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomeView, meta: { x: 0 } },
    { path: '/process', component: ProcessView, meta: { x: -1 } },
    { path: '/contact', component: ContactView, meta: { x: 1 } },
    // Old path + anything unknown resolve instead of dying — a refreshed or
    // mistyped deep link always lands somewhere real.
    { path: '/about', redirect: '/process' },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
