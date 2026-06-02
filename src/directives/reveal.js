// v-reveal — reveal an element when it scrolls into view.
//
// Usage:
//   <div v-reveal>                                       // default: fade + lift up
//   <div v-reveal="{ delay: 200 }">                      // delayed in ms
//   <div v-reveal="{ delay: i * 80 }">                   // per-item stagger inside v-for
//   <div v-reveal="{ from: 'left' }">                    // slide from left
//   <div v-reveal="{ from: 'right', delay: 120 }">       // slide from right + delay
//
// Pairs with the global `.reveal` / `.reveal--from-{up,left,right}` / `.is-visible`
// styles in main.css. The directive adds a base `.reveal` class plus a direction
// modifier so CSS can pick the right transform.

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

const VALID_DIRS = new Set(['up', 'left', 'right'])

export const vReveal = {
  mounted(el, binding) {
    const opts = binding.value || {}
    const delay = Number(opts.delay) || 0
    const from = VALID_DIRS.has(opts.from) ? opts.from : 'up'

    el.classList.add('reveal', `reveal--from-${from}`)
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
