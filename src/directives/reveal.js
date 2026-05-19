// v-reveal — fade up an element when it scrolls into view.
//
// Usage:
//   <div v-reveal>                          // basic
//   <div v-reveal="{ delay: 200 }">         // delayed in ms
//   <div v-reveal="{ delay: i * 80 }">      // per-item stagger inside a v-for
//
// Pairs with .reveal / .reveal.is-visible global styles in main.css.

const OBSERVED = new WeakMap()

const observer = typeof window !== 'undefined' && 'IntersectionObserver' in window
  ? new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
    )
  : null

export const vReveal = {
  mounted(el, binding) {
    el.classList.add('reveal')
    const delay = Number(binding.value?.delay) || 0
    if (delay) el.style.setProperty('--reveal-delay', `${delay}ms`)

    if (!observer) {
      // No IntersectionObserver — fall back to immediately visible
      el.classList.add('is-visible')
      return
    }
    observer.observe(el)
    OBSERVED.set(el, true)
  },
  unmounted(el) {
    if (observer && OBSERVED.get(el)) {
      observer.unobserve(el)
      OBSERVED.delete(el)
    }
  },
}
