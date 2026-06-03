<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import LogoMark from './LogoMark.vue'

// UI-only language switch for now. Wire to i18n later — flipping `lang` just
// drives the active segment of the switch. Per the sketch annotation
// ("if you're swapping the positions, animate it"), this is a true sliding
// segmented switch: the selected side widens + highlights, the unselected
// side shrinks to a chip.
const lang = ref('EN')
function setLang(value) {
  lang.value = value
}
</script>

<template>
  <nav class="nav">
    <RouterLink to="/" class="logo" aria-label="Commerce Consolidated — home">
      <LogoMark :size="42" compact />
    </RouterLink>

    <div class="lang-switch" role="radiogroup" aria-label="Language">
      <button
        type="button"
        class="lang-switch__option"
        :class="{ 'lang-switch__option--active': lang === 'EN' }"
        role="radio"
        :aria-checked="lang === 'EN'"
        @click="setLang('EN')"
      >EN</button>
      <button
        type="button"
        class="lang-switch__option"
        :class="{ 'lang-switch__option--active': lang === '中' }"
        role="radio"
        :aria-checked="lang === '中'"
        @click="setLang('中')"
      >中</button>
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

/* Segmented language switch. Active segment flex-grows and fills with the
   bright pill background; inactive segment shrinks to a chip width. Animated
   flex-basis + color makes the swap read as a slide rather than a flicker. */
.lang-switch {
  display: inline-flex;
  align-items: stretch;
  padding: 3px;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  background: transparent;
  height: 28px;
  font-family: var(--font-mono);
}

.lang-switch__option {
  /* Inactive default: chip width, dim, no background. */
  flex: 0 0 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border: none;
  background: transparent;
  border-radius: 999px;
  color: var(--grey-500);
  font-family: inherit;
  font-size: 11px;
  letter-spacing: 0.14em;
  cursor: pointer;
  transition:
    flex 420ms cubic-bezier(0.65, 0, 0.35, 1),
    background 240ms cubic-bezier(0.65, 0, 0.35, 1),
    color 240ms ease;
}

.lang-switch__option:hover {
  color: var(--grey-300);
}

.lang-switch__option--active {
  flex: 1 0 auto;
  background: var(--grey-100);
  color: #0a0a0a;
  font-weight: 500;
}

.lang-switch__option--active:hover {
  color: #0a0a0a; /* don't dim the active label on hover */
}

@media (prefers-reduced-motion: reduce) {
  .lang-switch__option {
    transition: background 120ms ease, color 120ms ease;
  }
}

@media (max-width: 880px) {
  .nav {
    padding: 22px 22px;
  }
  .lang-switch {
    height: 24px;
  }
  .lang-switch__option {
    flex-basis: 26px;
    padding: 0 8px;
    font-size: 10px;
  }
}
</style>
