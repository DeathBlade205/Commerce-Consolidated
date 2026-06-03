// useScrollNav: scroll-triggered horizontal page navigation + charge state.
//
// Pages live on a number line (router meta.x): process=-1, home=0, contact=1.
// When the user scrolls past a threshold AND the page is at the relevant scroll
// edge (top for "go left", bottom for "go right"), we navigate to the neighbor.
// The slide transition lives in App.vue.
//
// The composable also exposes `scrollCharge` (a signed reactive ratio, -1..1)
// so the PageProgressBar can render the user's "charge" toward the next page
// in real time. Charge decays back to 0 if the user stops scrolling — gives
// human-error buffer so an accidental flick doesn't commit a swap.
//
// Rules of engagement:
//   • Trigger fires once per intent, then locks until the transition completes.
//   • Internal page scrolling still works: we only "consume" wheel deltas when
//     the page is at its edge AND the user is pushing past that edge.
//   • Touch: same idea via touchstart/touchend deltas.
//   • Disabled on prefers-reduced-motion.
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// How much wheel-delta (px-ish) needs to accumulate at the edge before we
// commit a swap. Bumped from 320 → 900 now that the progress bar gives the
// user visual feedback — a higher bar means accidental flicks won't trigger.
const WHEEL_THRESHOLD = 900
// How long we lock out further triggers after firing — covers the 760ms
// transition with a small buffer.
const LOCK_MS = 1000
// Touch swipe threshold (pixels of finger travel).
const TOUCH_THRESHOLD = 140
// If the user stops scrolling for this long, the charge starts draining back
// to 0 so an accidental partial-charge doesn't sit there waiting to fire.
const DECAY_IDLE_MS = 240
// Fraction of remaining charge drained per animation frame after the idle
// timeout. ~6% per frame ≈ full drain in ~25 frames (~400ms at 60Hz).
const DECAY_RATE = 0.06

// Route order along the number line. Single source of truth for the swap
// logic AND for the progress bar UI. Labels are used by the bar.
export const ORDERED_PATHS = [
  { path: '/about',   x: -1, label: 'Process' },
  { path: '/',        x: 0,  label: 'Home' },
  { path: '/contact', x: 1,  label: 'Contact' },
]

// Module-level reactive state. Exposed via useScrollState() so any component
// (e.g. PageProgressBar) can subscribe without having to be the host that
// mounts the wheel listeners.
const scrollCharge = ref(0)   // -1..1 signed; sign = direction (-1 left, +1 right)
const scrollLocked = ref(false)

export function useScrollState() {
  return { scrollCharge, scrollLocked }
}

function neighborPath(currentX, direction /* -1 or +1 */) {
  const targetX = currentX + direction
  return ORDERED_PATHS.find((r) => r.x === targetX)?.path ?? null
}

function atTop() {
  return (window.scrollY || document.documentElement.scrollTop || 0) <= 0
}
function atBottom() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0
  const viewport = window.innerHeight
  const docHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
  )
  return scrollTop + viewport >= docHeight - 2
}

export function useScrollNav() {
  const route = useRoute()
  const router = useRouter()

  let accum = 0
  let lastDir = 0
  let lastWheelTs = 0
  let decayRaf = 0
  let touchStartY = 0
  let touchStartX = 0

  function reducedMotion() {
    return matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  // Single mutator for accum so the reactive charge ratio stays in sync.
  function setAccum(value) {
    accum = value
    const ratio = Math.max(-1, Math.min(1, accum / WHEEL_THRESHOLD))
    scrollCharge.value = ratio
  }

  function trigger(direction) {
    if (scrollLocked.value) return
    const currentX = route.meta?.x ?? 0
    const target = neighborPath(currentX, direction)
    if (!target) return // edge of the line — let normal scroll continue
    scrollLocked.value = true
    setAccum(0)
    cancelAnimationFrame(decayRaf)
    router.push(target)
    setTimeout(() => { scrollLocked.value = false }, LOCK_MS)
  }

  // After the user stops scrolling for DECAY_IDLE_MS, drain the charge back
  // to 0 by DECAY_RATE per frame. New wheel input resets lastWheelTs, which
  // pauses the drain.
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
    if (scrollLocked.value || reducedMotion()) return

    const dy = e.deltaY
    if (Math.abs(dy) < 1) return

    const wantsRight = dy > 0
    const wantsLeft = dy < 0

    // Only intercept at the relevant edge. Otherwise let the browser scroll
    // normally and reset any pending charge.
    const edgeReady =
      (wantsRight && atBottom()) || (wantsLeft && atTop())
    if (!edgeReady) {
      if (accum !== 0) setAccum(0)
      lastDir = 0
      return
    }

    // Reverse direction resets the accumulator — no leftover charge from a
    // change of mind.
    const dir = wantsRight ? 1 : -1
    if (dir !== lastDir) {
      setAccum(0)
      lastDir = dir
    }

    setAccum(accum + dy)
    lastWheelTs = performance.now()
    scheduleDecay()

    if (Math.abs(accum) >= WHEEL_THRESHOLD) {
      e.preventDefault()
      trigger(dir)
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
    if ((wantsRight && atBottom()) || (!wantsRight && atTop())) {
      trigger(wantsRight ? 1 : -1)
    }
  }

  onMounted(() => {
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchend', onTouchEnd)
    cancelAnimationFrame(decayRaf)
  })
}
