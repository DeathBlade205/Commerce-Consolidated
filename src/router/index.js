import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import ContactView from '../views/ContactView.vue'

// `meta.x` is the conceptual horizontal position of each page. Process sits to
// the LEFT of Home; Contact sits to the RIGHT. The router-view transition
// compares the from/to `x` values to decide whether the slide plays left or
// right, so the motion always matches the spatial mental model.
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView, meta: { x: 0 } },
    { path: '/about', component: AboutView, meta: { x: -1 } },
    { path: '/contact', component: ContactView, meta: { x: 1 } },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
