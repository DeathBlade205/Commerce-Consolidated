// useScrollNav: scroll-triggered horizontal navigation.
//
// Two layers of swap:
//   1. PAGE swap — Process (-1) ↔ Home (0) ↔ Contact (1). Each wheel-threshold
//      crossing at a page boundary fires a route change with a slide.
//   2. STEP swap (optional) — a page can register itself as a "step host"
//      (count of internal steps + a current-step ref + a setStep callback).
//      While the host is registered AND the next step is reachable in the
//      direction of scroll, wheel-threshold crossings fire step transitions
//      instead of page swaps. At the deck boundary, scroll falls through to
//      the page-swap behaviour above.
//
// The composable exposes `scrollCharge` (-1..1 reactive) so the
// PageProgressBar can render the user's accumulating intent. Charge is only
// reflected when the next action is a PAGE swap — during step charging,
// scrollCharge stays at 0 (the bottom page bar would otherwise mislead).
//
// Decay: after 240ms of no wheel input the accumulator drains back to 0 so
// an accidental partial-charge doesn't sit there waiting to fire.
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const WHEEL_THRESHOLD = 450
const LOCK_MS = 900
const TOUCH_THRESHOLD = 100
// Gentler than before: charge only starts draining after a longer idle and
// bleeds off slowly, so a deliberate, notch-by-notch scroll still reaches the
// threshold instead of decaying between clicks (the old 200ms/0.08 made
// slow scroll-up feel dead).
const DECAY_IDLE_MS = 320
const DECAY_RATE = 0.06

export const ORDERED_PATHS = [
  { path: '/process', x: -1, label: 'Process' },
  { path: '/',        x: 0,  label: 'Home' },
  { path: '/contact', x: 1,  label: 'Contact' },
]

const scrollCharge = ref(0)
const scrollLocked = ref(false)

// Cached once — a MediaQueryList stays live, so .matches is always current.
// Re-creating it inside every wheel event was wasted work on the hot path.
const reducedMotionMQ =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null

function reducedMotion() {
  return !!reducedMotionMQ?.matches
}

// Registered step host (at most one — only the current page can host steps).
// Shape: { count: number, getCurrentStep: () => number, setStep: (n) => void }
const stepHost = ref(null)

export function useScrollState() {
  return { scrollCharge, scrollLocked }
}

/** Page mounts a step deck. Returns an unregister fn for onBeforeUnmount. */
export function registerStepHost(host) {
  stepHost.value = host
  return () => {
    if (stepHost.value === host) stepHost.value = null
  }
}

function neighborPath(currentX, direction) {
  const targetX = currentX + direction
  return ORDERED_PATHS.find((r) => r.x === targetX)?.path ?? null
}

// Tolerance matters: browsers settle scroll at fractional offsets (0.4px etc.
// under DPR scaling), so strict equality made the scroll-up edge unreachable.
const EDGE_SLACK = 3

function currentScrollTop() {
  return (
    window.scrollY ||
    document.scrollingElement?.scrollTop ||
    document.documentElement.scrollTop ||
    0
  )
}
function atTop() {
  return currentScrollTop() <= EDGE_SLACK
}
function atBottom() {
  const el = document.scrollingElement || document.documentElement
  const docHeight = Math.max(el.scrollHeight, document.body.scrollHeight)
  return currentScrollTop() + window.innerHeight >= docHeight - EDGE_SLACK
}

// Wheel deltas arrive in different units per browser: Chromium reports
// pixels (deltaMode 0), Firefox reports LINES (deltaMode 1, ~3/tick) and
// some setups report pages (2). Without normalising, the px-tuned
// WHEEL_THRESHOLD is near-unreachable on line-mode browsers.
function normalizedDeltaY(e) {
  if (e.deltaMode === 1) return e.deltaY * 16
  if (e.deltaMode === 2) return e.deltaY * window.innerHeight
  return e.deltaY
}

// Returns 'step' when the host can advance/retreat in `direction`, else 'page'.
function intentFor(direction) {
  const host = stepHost.value
  if (!host) return 'page'
  const next = host.getCurrentStep() + direction
  return (next >= 0 && next < host.count) ? 'step' : 'page'
}

export function useScrollNav() {
  const route = useRoute()
  const router = useRouter()

  let accum = 0
  let lastDir = 0
  let lastIntent = 'page'
  let lastWheelTs = 0
  let decayRaf = 0
  let touchStartY = 0
  let touchStartX = 0

  // Single mutator so charge state always agrees with accum + intent.
  function setAccum(value, intent = lastIntent) {
    accum = value
    const ratio = Math.max(-1, Math.min(1, accum / WHEEL_THRESHOLD))
    // PageProgressBar only cares about page-intent charge — during step
    // charging we keep the page bar dark to avoid misleading feedback.
    scrollCharge.value = intent === 'page' ? ratio : 0
  }

  function triggerPage(direction) {
    if (scrollLocked.value) return
    const currentX = route.meta?.x ?? 0
    const target = neighborPath(currentX, direction)
    if (!target) return
    scrollLocked.value = true
    setAccum(0, 'page')
    cancelAnimationFrame(decayRaf)
    router.push(target)
    setTimeout(() => { scrollLocked.value = false }, LOCK_MS)
  }

  function triggerStep(direction) {
    const host = stepHost.value
    if (!host || scrollLocked.value) return
    const next = host.getCurrentStep() + direction
    if (next < 0 || next >= host.count) return
    scrollLocked.value = true
    setAccum(0, 'step')
    cancelAnimationFrame(decayRaf)
    host.setStep(next)
    setTimeout(() => { scrollLocked.value = false }, LOCK_MS)
  }

  function scheduleDecay() {
    cancelAnimationFrame(decayRaf)
    const tick = () => {
      const idleFor = performance.now() - lastWheelTs
      if (idleFor < DECAY_IDLE_MS) {
        decayRaf = requestAnimationFrame(tick)
        return
      }
      if (Math.abs(accum) <= 1) {
        setAccum(0)
        return
      }
      setAccum(accum * (1 - DECAY_RATE))
      decayRaf = requestAnimationFrame(tick)
    }
    decayRaf = requestAnimationFrame(tick)
  }

  function onWheel(e) {
    if (reducedMotion()) return

    // While a swap animation plays, swallow everything — including the
    // inertial tail of the gesture that triggered it — so it can't queue a
    // second swap or leak into browser history navigation.
    if (scrollLocked.value) {
      e.preventDefault()
      return
    }

    // Horizontal / tilt-wheel is never used here. Eat it so the browser can't
    // turn it into back/forward history navigation (the mb4/mb5 gesture).
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault()
      return
    }

    const dy = normalizedDeltaY(e)
    if (Math.abs(dy) < 1) return

    const dir = dy > 0 ? 1 : -1
    const intent = intentFor(dir)

    // For PAGE intent we only act at the document scroll edge, so a long page
    // (Contact) scrolls normally in its middle. Away from the edge, hand the
    // wheel back to the browser and reset our accumulator. STEP intent applies
    // anywhere — the host page is a deck, not scrolling content.
    if (intent === 'page') {
      const atEdge = (dir > 0 && atBottom()) || (dir < 0 && atTop())
      if (!atEdge) {
        if (accum !== 0) setAccum(0, 'page')
        lastDir = 0
        lastIntent = 'page'
        return
      }
    }

    // We own this gesture now (step nav, or page nav sitting at an edge).
    // Prevent default on EVERY owned event — not just at the threshold — so
    // the browser never bounces, scroll-chains, or navigates history while
    // the user is charging a swap.
    e.preventDefault()

    // Reverse direction OR intent change resets the accumulator.
    if (dir !== lastDir || intent !== lastIntent) {
      setAccum(0, intent)
      lastDir = dir
      lastIntent = intent
    }

    setAccum(accum + dy, intent)
    lastWheelTs = performance.now()
    scheduleDecay()

    if (Math.abs(accum) >= WHEEL_THRESHOLD) {
      if (intent === 'step') triggerStep(dir)
      else triggerPage(dir)
    }
  }

  function onTouchStart(e) {
    if (scrollLocked.value) return
    const t = e.touches[0]
    touchStartY = t.clientY
    touchStartX = t.clientX
  }

  function onTouchEnd(e) {
    if (scrollLocked.value || reducedMotion()) return
    const t = e.changedTouches[0]
    const dy = touchStartY - t.clientY
    const dx = touchStartX - t.clientX

    if (Math.abs(dx) > Math.abs(dy)) return
    if (Math.abs(dy) < TOUCH_THRESHOLD) return

    const wantsRight = dy > 0
    const dir = wantsRight ? 1 : -1
    const intent = intentFor(dir)

    if (intent === 'step') {
      triggerStep(dir)
      return
    }
    if ((wantsRight && atBottom()) || (!wantsRight && atTop())) {
      triggerPage(dir)
    }
  }

  // Arrow keys: Left/Right move between PAGES along the page-line.
  // ArrowUp/ArrowDown are reserved for step hosts (the AboutView deck owns
  // those keys for its internal step nav).
  function onKey(e) {
    if (scrollLocked.value) return
    // Ignore key events when the user is typing in a form control.
    const tag = e.target?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      triggerPage(1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      triggerPage(-1)
    }
  }

  onMounted(() => {
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('keydown', onKey)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchend', onTouchEnd)
    window.removeEventListener('keydown', onKey)
    cancelAnimationFrame(decayRaf)
  })
}
