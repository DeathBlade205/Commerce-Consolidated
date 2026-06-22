<script setup>
// Contact: a single-viewport page (like Home/Process) — no long document
// scroll, so the details can never be "below the fold and unreachable".
// Contact methods are shown as a logo with the handle underneath; the whole
// tile is a shortcut (mailto / social profile).
//
// Handles below are PLACEHOLDERS — swap in the real ones.
import { computed } from 'vue'
import PageEdgeHint from '../components/PageEdgeHint.vue'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

// `active: false` keeps the method in code (icon + wiring intact) but it isn't
// rendered yet. Instagram/LinkedIn are parked here until those accounts exist —
// flip `active` to true and set a real href to bring them back.
const methods = [
  { id: 'email',     handle: 'diederik.lubbers@gmail.com', href: 'mailto:diederik.lubbers@gmail.com', active: true },
  { id: 'wechat',    handle: 'mrkiredeid',                 href: '#',                                 active: true },
  { id: 'x',         handle: '@mrkiredeid',               href: 'https://x.com/mrkiredeid',          active: true },
  { id: 'instagram', handle: '@commerce.consolidated',    href: 'https://instagram.com/commerce.consolidated', active: false },
  { id: 'linkedin',  handle: 'Commerce Consolidated',     href: 'https://www.linkedin.com/company/commerce-consolidated', active: false },
]

const shownMethods = computed(() => methods.filter((m) => m.active))

// External links open in a new tab; mailto / wechat stay in-page.
const isExternal = (href) => href.startsWith('http')
</script>

<template>
  <main class="contact">
    <!-- Edge hint: from Contact, scrolling up at the top swaps to Home. -->
    <PageEdgeHint :to="'/'" :label="t('edge.home')" direction="up" />

    <div class="contact__body">
      <p class="label label--lg section-label">— {{ t('contact.label') }}</p>

      <h1 class="heading">
        {{ t('contact.headingPre') }} <em>{{ t('contact.headingEm') }}</em>{{ t('contact.headingPost') }}
      </h1>

      <p class="intro">{{ t('contact.intro') }}</p>

      <!-- Each method: logo on top, handle underneath, the whole tile clickable. -->
      <nav class="methods" aria-label="Contact methods">
        <a
          v-for="m in shownMethods"
          :key="m.id"
          :href="m.href"
          class="method"
          :target="isExternal(m.href) ? '_blank' : undefined"
          :rel="isExternal(m.href) ? 'noopener' : undefined"
          :aria-label="m.handle"
        >
          <span class="method__icon">
            <svg v-if="m.id === 'wechat'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M8.5 4C5.46 4 3 6.13 3 8.75c0 1.5.77 2.84 1.99 3.71L4.4 14l2.2-1.16c.6.13 1.24.2 1.9.2.34 0 .68-.02 1-.06" />
              <path d="M21 14.3c0-2.32-2.18-4.2-4.87-4.2s-4.88 1.88-4.88 4.2c0 2.33 2.19 4.2 4.88 4.2.5 0 .98-.06 1.42-.17l1.99 1.07-.56-1.7c1.2-.78 2.02-1.96 2.02-3.4Z" />
              <circle cx="6.6" cy="8.4" r="0.6" fill="currentColor" />
              <circle cx="10.3" cy="8.4" r="0.6" fill="currentColor" />
              <circle cx="14.5" cy="13.7" r="0.5" fill="currentColor" />
              <circle cx="17.7" cy="13.7" r="0.5" fill="currentColor" />
            </svg>
            <svg v-else-if="m.id === 'x'" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.53 3H20.5l-6.51 7.44L21.5 21h-6.05l-4.73-6.18L5.3 21H2.32l6.96-7.95L2 3h6.2l4.28 5.66L17.53 3Zm-1.06 16.2h1.64L7.6 4.7H5.84l10.63 14.5Z" />
            </svg>
            <svg v-else-if="m.id === 'instagram'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.7" fill="currentColor" stroke="none" />
            </svg>
            <svg v-else-if="m.id === 'linkedin'" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.84v1.64h.05c.53-.95 1.84-1.95 3.79-1.95 4.05 0 4.8 2.55 4.8 5.87V21h-4v-5.45c0-1.3-.03-2.97-1.86-2.97-1.87 0-2.15 1.4-2.15 2.87V21h-4V9Z" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 7 9-7" />
            </svg>
          </span>
          <span class="method__handle">{{ m.handle }}</span>
        </a>
      </nav>
    </div>
  </main>
</template>

<style scoped>
.contact {
  /* Fixed viewport height + overflow hidden = the document never scrolls, so
     scroll-up ALWAYS charges the swap-to-Home immediately (atTop is always
     true), consistent with Home/Process. A scrolling Contact created a dead
     zone where scroll-up scrolled the page instead of navigating. Content is
     kept compact below so it fits short laptops without clipping. Mobile
     reverts to a normal scrolling page. */
  height: 100vh;
  height: 100svh;
  overflow: hidden;
  max-width: 1200px;
  margin: 0 auto;
  padding: 88px 48px 56px;
  display: flex;
  flex-direction: column;
}

/* Centred block between the edge hint (top) and footer (bottom). Everything is
   horizontally centred (heading, intro, methods sit in the middle). */
.contact__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.section-label {
  margin-bottom: 24px;
}

.heading {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: clamp(34px, 4.4vw, 62px);
  line-height: 1.05;
  max-width: 20ch;
  color: var(--grey-100);
  letter-spacing: -0.02em;
  margin: 0 0 22px;
}

.heading em {
  font-style: italic;
  color: var(--grey-300);
}

.intro {
  font-size: 14px;
  color: var(--grey-300);
  max-width: 52ch;
  line-height: 1.7;
  margin: 0 0 40px;
}

/* Contact methods: logo tile + handle underneath, the whole thing clickable.
   Centred to line up under the centred heading. */
.methods {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: clamp(24px, 4vw, 56px);
}

.method {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-decoration: none;
  color: inherit;
}

.method__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  color: var(--grey-300);
  border: 1px solid var(--hairline);
  border-radius: 999px;
  transition: color 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
}

.method__icon svg {
  width: 26px;
  height: 26px;
}

.method__handle {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--grey-500);
  transition: color 0.25s ease;
  text-align: center;
  /* Keep each handle on one line (the email used to wrap to two). The methods
     row flex-wraps as a whole on narrow screens, so tiles reflow instead. */
  white-space: nowrap;
}

.method:hover .method__icon {
  color: var(--grey-100);
  border-color: rgba(255, 255, 255, 0.32);
  transform: translateY(-3px);
}

.method:hover .method__handle {
  color: var(--grey-300);
}

@media (max-width: 880px) {
  .contact {
    /* Phones can't fit all five methods + heading in one viewport, so allow a
       normal scrolling page here. Scroll-up-to-Home still works via atTop().
       Details are no longer opacity-gated, so nothing is hidden. */
    height: auto;
    min-height: 100svh;
    overflow: visible;
    padding: 88px 24px 56px;
  }

  .heading {
    font-size: clamp(36px, 11vw, 60px);
    margin-bottom: 24px;
  }

  .intro {
    margin-bottom: 40px;
  }

  .methods {
    gap: 28px 36px;
    justify-content: center;
  }

  .method__icon {
    width: 56px;
    height: 56px;
  }
}
</style>
