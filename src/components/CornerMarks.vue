<template>
  <div aria-hidden="true">
    <svg class="corner corner--tl" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M24 0 H0 V24" stroke="var(--grey-700)" stroke-width="1" />
    </svg>
    <svg class="corner corner--tr" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M0 0 H24 V24" stroke="var(--grey-700)" stroke-width="1" />
    </svg>
    <svg class="corner corner--bl" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M24 24 H0 V0" stroke="var(--grey-700)" stroke-width="1" />
    </svg>
    <svg class="corner corner--br" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M0 24 H24 V0" stroke="var(--grey-700)" stroke-width="1" />
    </svg>
  </div>
</template>

<style scoped>
.corner {
  position: fixed;
  pointer-events: none;
  z-index: 200;
}
.corner--tl { top: 24px; left: 24px; }
.corner--tr { top: 24px; right: 24px; }
.corner--bl { bottom: 24px; left: 24px; }
.corner--br { bottom: 24px; right: 24px; }
</style>
