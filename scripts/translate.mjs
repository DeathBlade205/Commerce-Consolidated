// Regenerate the Chinese (zh) strings in src/i18n/messages.js from the English
// source of truth via the DeepL API.
//
//   DEEPL_API_KEY=xxxx node scripts/translate.mjs
//
// English (messages.en) is authoritative. This translates every en leaf to ZH
// and overwrites messages.zh — EXCEPT keys listed in KEEP_EN below and any
// hand-tuned overrides in OVERRIDE_ZH (e.g. the Process emphasis words, which
// translate poorly as bare adjectives out of context).
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { messages } from '../src/i18n/messages.js'

const KEY = process.env.DEEPL_API_KEY
if (!KEY) {
  console.error('Set DEEPL_API_KEY (…:fx for the free tier).')
  process.exit(1)
}
const API = KEY.endsWith(':fx') ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate'

// Paths that must NOT be auto-translated (structure/scaffolding is hand-set).
const KEEP_EN = new Set([])
// Hand-tuned Chinese that beats DeepL's out-of-context output.
const OVERRIDE_ZH = {
  'process.headingPre': '一间为',
  'process.headingPost': '商业而设的工作室。',
  'process.stepsAria': '流程步骤',
  'process.goToStep': '前往步骤',
  'process.steps.0.word': '协作',
  'process.steps.1.word': '用心',
  'process.steps.2.word': '整合',
  'contact.headingPost': '。',
}

function flatten(obj, prefix, out) {
  for (const k of Object.keys(obj)) {
    const v = obj[k]
    const p = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'string') out.push([p, v])
    else if (v && typeof v === 'object') flatten(v, p, out)
  }
  return out
}
function setPath(obj, path, val) {
  const parts = path.split('.')
  let o = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i]
    const nextIsIndex = /^\d+$/.test(parts[i + 1])
    if (o[k] === undefined) o[k] = nextIsIndex ? [] : {}
    o = o[k]
  }
  o[parts[parts.length - 1]] = val
}

const leaves = flatten(messages.en, '', []).filter(([p]) => !KEEP_EN.has(p) && !(p in OVERRIDE_ZH))
const body = new URLSearchParams()
leaves.forEach(([, s]) => body.append('text', s))
body.append('target_lang', 'ZH')
body.append('source_lang', 'EN')

const res = await fetch(API, {
  method: 'POST',
  headers: { Authorization: `DeepL-Auth-Key ${KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
  body,
})
const json = await res.json()
if (!json.translations) { console.error('DeepL error:', JSON.stringify(json)); process.exit(1) }

const zh = {}
leaves.forEach(([path], i) => setPath(zh, path, json.translations[i].text))
for (const [path, val] of Object.entries(OVERRIDE_ZH)) setPath(zh, path, val)

const header = `// AUTO-GENERATED i18n strings. English is the source of truth; Chinese was
// produced via the DeepL API (target ZH) by scripts/translate.mjs. To revise:
// edit en below and re-run the script, or hand-tune zh strings directly.
//
// Brand terms (Commerce Consolidated, MMXXVI), social proper nouns (X,
// Instagram, LinkedIn, WeChat) and contact handles are NOT here — they stay
// literal in their components.
`
const file = resolve(dirname(fileURLToPath(import.meta.url)), '../src/i18n/messages.js')
writeFileSync(file, `${header}export const messages = ${JSON.stringify({ en: messages.en, zh }, null, 2)}\n`)
console.log('Updated src/i18n/messages.js')
