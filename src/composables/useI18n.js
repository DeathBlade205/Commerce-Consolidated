// Lightweight i18n — no dependency, fits the project's "no library" ethos.
// A module-level reactive `locale` drives a `t(path)` lookup over the messages
// tree. NavBar flips the locale; every component reads via `t()` / `tm()`.
//
// zh falls back to en per-key, so a missing/partial Chinese string shows the
// English rather than a blank — safe while the DeepL pass is being filled in.
import { ref, computed } from 'vue'
import { messages } from '../i18n/messages.js'

const STORAGE_KEY = 'cc-locale'
const SUPPORTED = ['en', 'zh']

function initialLocale() {
  if (typeof window === 'undefined') return 'en'
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && SUPPORTED.includes(saved)) return saved
  // Honour a Chinese browser on first visit, else English.
  return (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

const locale = ref(initialLocale())

function applyHtmlLang(l) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en'
  }
}
applyHtmlLang(locale.value)

export function setLocale(l) {
  if (!SUPPORTED.includes(l)) return
  locale.value = l
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, l)
  applyHtmlLang(l)
}

// Resolve a dot-path against an object; returns undefined if any hop misses.
function dig(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

// Look up `path` in the active locale, falling back to en, then to the path
// itself (so a typo'd key is visible rather than silently blank).
function resolve(l, path) {
  const hit = dig(messages[l], path)
  if (hit !== undefined) return hit
  const fallback = dig(messages.en, path)
  return fallback !== undefined ? fallback : path
}

export function useI18n() {
  const t = (path) => resolve(locale.value, path)
  // tm: same lookup but for arrays/objects (e.g. the process steps list).
  const tm = (path) => resolve(locale.value, path)
  return { locale, t, tm, setLocale, isZh: computed(() => locale.value === 'zh') }
}
