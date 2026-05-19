<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <nav class="nav">
    <RouterLink to="/" class="logo">
      Commerce <em>Consolidated</em>
    </RouterLink>
    <div class="links">
      <RouterLink to="/" class="nav-link">Index</RouterLink>
      <RouterLink to="/about" class="nav-link">Practice</RouterLink>
      <RouterLink to="/contact" class="nav-link">Contact</RouterLink>
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
  font-family: var(--font-serif);
  font-size: 22px;
  color: var(--grey-100);
  letter-spacing: -0.01em;
}

.logo em {
  font-style: italic;
  color: var(--grey-300);
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

@media (max-width: 880px) {
  .nav {
    padding: 24px;
  }
  .links {
    gap: 20px;
  }
}
</style>
