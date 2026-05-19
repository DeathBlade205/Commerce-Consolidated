<script setup>
defineProps({
  number: String,
  title: String,
  duration: String,
  description: String,
})
</script>

<template>
  <div class="step">
    <span class="number label">{{ number }}</span>
    <span class="title">{{ title }}</span>
    <span class="duration label">{{ duration }}</span>
    <p class="description">{{ description }}</p>
  </div>
</template>

<style scoped>
.step {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  padding-top: 24px;
  border-top: 1px solid var(--hairline);
}

.number {
  color: var(--grey-500);
}

.title {
  font-family: var(--font-serif);
  font-size: 22px;
  color: var(--grey-100);
  line-height: 1.2;
}

.duration {
  color: var(--grey-500);
}

.description {
  font-size: 13px;
  color: var(--grey-300);
  line-height: 1.6;
  max-width: 24ch;
}

@media (max-width: 880px) {
  .step {
    border-top: 1px solid var(--hairline);
    padding-top: 20px;
  }
}
</style>
