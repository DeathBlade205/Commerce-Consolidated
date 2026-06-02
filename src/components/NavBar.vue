<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import LogoMark from './LogoMark.vue'

// UI-only language toggle for now. Wire to i18n later — for now flipping the
// state just swaps the visible glyph so the affordance exists in the layout.
const lang = ref('EN')
function toggleLang() {
  lang.value = lang.value === 'EN' ? '中' : 'EN'
}
</script>

<template>
  <nav class="nav">
    <RouterLink to="/" class="logo" aria-label="Commerce Consolidated — home">
      <LogoMark :size="42" compact />
    </RouterLink>

    <div class="nav-right">
      <!-- No `Home` link — the CC logo on the left handles home navigation. -->
      <div class="links">
        <RouterLink to="/about" class="nav-link">Process</RouterLink>
        <RouterLink to="/contact" class="nav-link">Contact</RouterLink>
      </div>

      <button
        type="button"
        class="lang-toggle"
        :aria-label="`Switch language (currently ${lang})`"
        :aria-pressed="lang === '中'"
        @click="toggleLang"
      >
        <span class="lang-toggle__current">{{ lang }}</span>
        <span class="lang-toggle__sep" aria-hidden="true">/</span>
        <span class="lang-toggle__other">{{ lang === 'EN' ? '中' : 'EN' }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px 48px;
  mix-blend-mode: difference;
}

.logo {
  display: inline-flex;
  align-items: center;
  color: var(--grey-100);
  transition: opacity 0.25s ease;
}

.logo:hover {
  opacity: 0.78;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 28px;
}

.links {
  display: flex;
  gap: 32px;
}

.nav-link {
  font-family: var(--font-sans);
  font-weight: 400;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--grey-300);
  position: relative;
  padding-bottom: 3px;
  transition: color 0.3s ease;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 1px;
  background: var(--grey-100);
  transition: width 0.4s cubic-bezier(0.65, 0, 0.35, 1);
}

.nav-link:hover {
  color: var(--grey-100);
}

.nav-link:hover::after {
  width: 100%;
}

.nav-link.router-link-active {
  color: var(--grey-100);
}

.nav-link.router-link-active::after {
  width: 100%;
}

/* Language toggle: small typographic switch — uses the same letter-spacing as
   the nav links so it reads as a peer affordance, separated by a vertical bar. */
.lang-toggle {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  background: transparent;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  color: var(--grey-300);
  cursor: pointer;
  transition: color 0.3s ease, border-color 0.3s ease;
}

.lang-toggle:hover {
  color: var(--grey-100);
  border-color: rgba(255, 255, 255, 0.25);
}

.lang-toggle__current {
  color: var(--grey-100);
  font-weight: 500;
}

.lang-toggle__sep {
  opacity: 0.45;
}

.lang-toggle__other {
  opacity: 0.7;
}

@media (max-width: 880px) {
  .nav {
    padding: 22px 22px;
  }
  .nav-right {
    gap: 16px;
  }
  .links {
    gap: 16px;
  }
  .nav-link {
    font-size: 10px;
    letter-spacing: 0.14em;
  }
  .lang-toggle {
    padding: 3px 8px;
    font-size: 10px;
  }
}
</style>
