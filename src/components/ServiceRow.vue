<script setup>
defineProps({
  number: String,
  title: String,
  description: String,
  deliverables: Array,
})
</script>

<template>
  <div class="service-row">
    <span class="number">{{ number }}</span>
    <span class="title">{{ title }}</span>
    <p class="description">{{ description }}</p>
    <ul class="deliverables">
      <li v-for="d in deliverables" :key="d">{{ d }}</li>
    </ul>
  </div>
</template>

<style scoped>
.service-row {
  display: grid;
  grid-template-columns: 64px 200px 1fr 160px;
  gap: 48px;
  align-items: start;
  padding: 48px 0;
  border-top: 1px solid var(--hairline);
}

.number {
  font-family: var(--font-serif);
  font-size: 32px;
  color: var(--grey-500);
  line-height: 1;
  padding-top: 4px;
}

.title {
  font-family: var(--font-serif);
  font-size: 28px;
  color: var(--grey-100);
  line-height: 1.1;
}

.description {
  font-size: 14px;
  color: var(--grey-300);
  line-height: 1.6;
  max-width: 36ch;
}

.deliverables {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.deliverables li {
  font-family: var(--font-sans);
  font-weight: 400;
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--grey-500);
  line-height: 2;
}

@media (max-width: 880px) {
  .service-row {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 32px 0;
  }

  .number {
    font-size: 24px;
  }

  .title {
    font-size: 22px;
  }
}
</style>
