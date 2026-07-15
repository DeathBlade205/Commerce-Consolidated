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
import { ref, shallowRef, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const WHEEL_THRESHOLD = 450
const LOCK_MS = 900
const TOUCH_THRESHOLD = 100
// Decay must be slower than the gap between TRACKPAD swipe gestures, not just
// between mouse-wheel notches. A cautious two-finger swipe moves ~150-250px and
// the finger lifts for ~400-600ms between swipes; with the old 320ms/0.06 the
// charge fully drained in that gap, so repeated small swipes NEVER reached the
// 450px threshold ("can't keep scrolling to get to the next page" on laptops).
// 650ms idle spans a normal swipe cadence; an abandoned partial charge still
// drains to zero in about a second once the user actually stops.
const DECAY_IDLE_MS = 650
const DECAY_RATE = 0.035
// Post-swap inertia guard. A hard trackpad flick keeps emitting wheel events
// for 2s+ — well past LOCK_MS — and the leftover tail re-charged a SECOND
// swap (one flick on Contact blew straight through Home onto Process). Time
// caps don't work: a long tail still holds >450px of charge 1.6s in. What
// reliably separates the old gesture from a new one is the DELTA ENVELOPE —
// momentum only ever decays, while fresh human input shows up as a pause in
// the stream, a direction reversal, or a sharply RISING |delta| (a re-flick).
// So after a swap we swallow same-direction events whose |delta| keeps
// shrinking and whose gaps stay tight, and release on any of those three
// signals (plus a generous hard cap as an escape hatch for free-spin wheels).
const FRESH_GAP_MS = 140
const GUARD_MAX_MS = 2500

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
// MUST be a shallowRef: a plain ref() deep-wraps the host object in a reactive
// proxy, so unregister's `stepHost.value === host` identity check compared
// proxy vs raw and NEVER passed — the dead host survived its page and silently
// ate scroll-up everywhere (invisibly stepping its unmounted deck back to 0)
// until the user re-visited Process. shallowRef stores the object as-is.
const stepHost = shallowRef(null)

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

// Home / Process / Contact are designed NOT to scroll (overflow hidden, fixed
// viewport height). Sub-pixel rounding (DPR scaling), a transient scrollbar, or
// minor content shifts can still leave the document a few px scrollable — and
// then sitting at the top satisfies atTop but NOT atBottom, so the page-swap at
// the end of the Process deck (scroll down -> Home) and Contact's scroll-up-to-
// Home both silently failed (neither edge matched). If the document isn't
// MEANINGFULLY scrollable, treat the page as sitting at BOTH edges so the swap
// always fires; a genuinely long page (mobile Contact) still needs the real edge.
const NONSCROLL_SLACK = 24

function maxScrollY() {
  const el = document.scrollingElement || document.documentElement
  const docHeight = Math.max(el.scrollHeight, document.body.scrollHeight)
  return Math.max(0, docHeight - window.innerHeight)
}

function currentScrollTop() {
  return (
    window.scrollY ||
    document.scrollingElement?.scrollTop ||
    document.documentElement.scrollTop ||
    0
  )
}
function atTop() {
  return maxScrollY() <= NONSCROLL_SLACK || currentScrollTop() <= EDGE_SLACK
}
function atBottom() {
  const max = maxScrollY()
  return max <= NONSCROLL_SLACK || currentScrollTop() >= max - EDGE_SLACK
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
  // True from a swap until the wheel stream breaks (see FRESH_GAP_MS).
  let tailGuard = false
  let guardDeadline = 0
  let prevAbsDy = 0

  function armTailGuard() {
    tailGuard = true
    prevAbsDy = Infinity // first tail event after the swap is always swallowed
    guardDeadline = performance.now() + LOCK_MS + GUARD_MAX_MS
  }

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
    armTailGuard()
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
    armTailGuard()
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
    // second swap or leak into browser history navigation. lastWheelTs still
    // updates so the tail guard below can tell "same stream" from "new scroll".
    if (scrollLocked.value) {
      lastWheelTs = performance.now()
      // Track the tail's decaying envelope through the lock so the guard
      // below has a fresh baseline the moment the lock lifts.
      if (tailGuard) prevAbsDy = Math.abs(normalizedDeltaY(e))
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

    // Post-swap tail guard: the flick that fired the swap keeps emitting for
    // longer than the lock. Same direction + tight gaps + decaying |delta| =
    // still the old gesture; eat it. A pause, a reversal, or a rising |delta|
    // (the user re-flicked mid-tail) releases it immediately.
    if (tailGuard) {
      const now = performance.now()
      const absDy = Math.abs(dy)
      const sameStream = now - lastWheelTs < FRESH_GAP_MS
      const decaying = absDy <= prevAbsDy * 1.5 + 8
      if (now < guardDeadline && sameStream && decaying && dir === lastDir) {
        prevAbsDy = absDy
        lastWheelTs = now
        e.preventDefault()
        return
      }
      tailGuard = false
    }

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

    // Dominant axis decides the gesture. Both map to the same page-line
    // direction: swipe UP or swipe LEFT advances (+1), matching the slide
    // animation (the new page/step slides in from the right, as if the user
    // dragged the strip). Horizontal is the natural phone gesture for a
    // horizontal page-line; vertical is kept for continuity.
    const horizontal = Math.abs(dx) > Math.abs(dy)
    const travel = horizontal ? dx : dy
    if (Math.abs(travel) < TOUCH_THRESHOLD) return

    const dir = travel > 0 ? 1 : -1
    const intent = intentFor(dir)

    if (intent === 'step') {
      triggerStep(dir)
      return
    }
    // Horizontal swipes never fight document scroll (there is no x overflow),
    // so they may fire a page swap from anywhere — even mid-scroll on mobile
    // Contact. Vertical swipes still require the scroll edge.
    if (horizontal) {
      triggerPage(dir)
      return
    }
    if ((dir > 0 && atBottom()) || (dir < 0 && atTop())) {
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
