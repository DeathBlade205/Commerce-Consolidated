// Single source of truth for "is this session driven by a hover-capable fine
// pointer?" — now a reactive ref, not a one-shot check.
//
// Why not just the media query: `(hover: hover) and (pointer: fine)` tracks
// the PRIMARY input device, and Windows convertibles (Surface Pro et al.) are
// commonly classified touch-primary even with a Type Cover trackpad or mouse
// attached — which silently disabled the flashlight + custom cursor there.
// So the media query only seeds the initial value; the first REAL mouse
// pointermove upgrades the session to fine-pointer mode. We never downgrade
// mid-session (a Surface user alternating touch and trackpad shouldn't have
// the cursor flicker in and out of existence).
//
// CSS agreement: `cursor: none` in base.css is gated on the `cc-fine-pointer`
// class this module stamps on <html> — the exact same state components read —
// so the native cursor can never be hidden while CustomCursor refuses to
// render (or vice versa).
import { ref } from 'vue'

const finePointer = ref(false)

function applyHtmlClass(on) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('cc-fine-pointer', on)
}

function upgrade() {
  if (finePointer.value) return
  finePointer.value = true
  applyHtmlClass(true)
}

if (typeof window !== 'undefined') {
  const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
  if (mq.matches) upgrade()
  else {
    // Docking a mouse can flip the primary-pointer media query live.
    mq.addEventListener?.('change', (e) => { if (e.matches) upgrade() })
    // Touch-primary device: watch for evidence of a real mouse. Synthetic
    // mousemove (the Home intro sweep) is NOT a PointerEvent, and touch/pen
    // report their own pointerType, so only genuine mouse input matches.
    const onPointerMove = (e) => {
      if (e.pointerType === 'mouse') {
        upgrade()
        window.removeEventListener('pointermove', onPointerMove, true)
      }
    }
    window.addEventListener('pointermove', onPointerMove, true)
  }
}

/** Reactive: true once a hover-capable fine pointer is (or becomes) present. */
export function useFinePointer() {
  return finePointer
}

/** Snapshot read — prefer useFinePointer() + reactivity where possible. */
export function hasFinePointer() {
  return finePointer.value
}
