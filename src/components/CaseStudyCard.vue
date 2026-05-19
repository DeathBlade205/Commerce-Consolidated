<script setup>
defineProps({
  client: String,
  discipline: String,
  summary: String,
  year: String,
  placeholder: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <!-- placeholder: swap client, discipline, summary, year with real content -->
  <div class="card" :class="{ 'card--placeholder': placeholder }">
    <div class="card-top">
      <span class="client">{{ client }}</span>
      <span class="year label">{{ year }}</span>
    </div>
    <span class="discipline label">{{ discipline }}</span>
    <p class="summary">{{ summary }}</p>
    <div class="card-footer">
      <div class="divider" />
      <a href="#" class="view-link">
        View case <span class="arrow">→</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
.card {
  padding: 32px;
  border: 1px solid var(--hairline);
  display: flex;
  flex-direction: column;
  gap: 0;
  transition: border-color 0.3s ease;
}

.card:hover {
  border-color: var(--grey-500);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.client {
  font-family: var(--font-serif);
  font-size: 24px;
  color: var(--grey-100);
  line-height: 1.2;
}

.year {
  padding-top: 6px;
  flex-shrink: 0;
}

.discipline {
  display: block;
  margin-bottom: 24px;
}

.summary {
  font-size: 14px;
  color: var(--grey-300);
  line-height: 1.7;
  max-width: 40ch;
  flex: 1;
  margin-bottom: 24px;
}

.card-footer {
  margin-top: auto;
}

.divider {
  height: 1px;
  background: var(--hairline);
  margin-bottom: 16px;
}

.view-link {
  font-family: var(--font-sans);
  font-weight: 400;
  font-size: 12px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--grey-100);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: gap 0.2s ease;
}

.view-link:hover .arrow {
  transform: translateX(4px);
}

.arrow {
  display: inline-block;
  transition: transform 0.2s ease;
}
</style>
