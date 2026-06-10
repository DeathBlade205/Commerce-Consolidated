// Single source of truth for "does this device drive a hover-capable pointer?".
// Touch-presence checks (`ontouchstart` / maxTouchPoints) misclassify
// touchscreen laptops as touch-only, which left them with NO cursor at all:
// base.css hides the native cursor while CustomCursor refused to render.
// `(hover: hover) and (pointer: fine)` tracks the PRIMARY input device, and
// the same media query gates `cursor: none` in base.css so CSS and JS agree.
export function hasFinePointer() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches
  )
}
