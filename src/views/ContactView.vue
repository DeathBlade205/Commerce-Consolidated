<script setup>
const blocks = [
  {
    label: 'New Business',
    content: 'hello@commerceconsolidated.com',
    type: 'email',
    note: 'For project enquiries and proposals.',
  },
  {
    label: 'Studio',
    content: ['Level 3, 24 Bridge Street', 'Sydney NSW 2000'],
    type: 'address',
    note: 'By appointment only.',
  },
  {
    label: 'Press & Speaking',
    content: 'press@commerceconsolidated.com',
    type: 'email',
    note: 'Media inquiries and event requests.',
  },
  {
    label: 'Elsewhere',
    type: 'links',
    links: [
      { label: 'Are.na', href: '#' },
      { label: 'Instagram', href: '#' },
      { label: 'LinkedIn', href: '#' },
    ],
  },
]
</script>

<template>
  <main class="contact">

    <p v-reveal class="label label--lg section-label">— Contact</p>

    <h1 v-reveal="{ delay: 100 }" class="heading">
      Tell us something <em>worth</em> making.
    </h1>

    <p v-reveal="{ delay: 280 }" class="intro">
      New project briefs are reviewed every Friday. We respond to everything
      within two working days, including "no".
    </p>

    <div class="grid-wrap">
      <div class="contact-grid">
        <div
          v-for="(b, i) in blocks"
          :key="b.label"
          v-reveal="{ delay: i * 140 }"
          class="block"
        >
          <p class="label block-label">{{ b.label }}</p>

          <template v-if="b.type === 'email'">
            <a :href="`mailto:${b.content}`" class="contact-serif">{{ b.content }}</a>
            <p class="muted">{{ b.note }}</p>
          </template>

          <template v-else-if="b.type === 'address'">
            <div class="contact-serif address">
              <span v-for="line in b.content" :key="line">{{ line }}</span>
            </div>
            <p class="muted">{{ b.note }}</p>
          </template>

          <template v-else-if="b.type === 'links'">
            <div class="elsewhere-links">
              <a v-for="l in b.links" :key="l.label" :href="l.href" class="elsewhere-link">
                {{ l.label }}
              </a>
            </div>
          </template>
        </div>
      </div>
    </div>

    <footer v-reveal class="footer">
      <span class="label">© Commerce Consolidated MMXXVI</span>
      <span class="label">All rights reserved</span>
    </footer>

  </main>
</template>

<style scoped>
.contact {
  padding: 140px 48px 80px;
  max-width: 1200px;
  margin: 0 auto;
}

.section-label {
  margin-bottom: 32px;
  padding-top: 16px;
  border-top: 1px solid var(--hairline);
}

.heading {
  font-family: var(--font-serif);
  font-size: clamp(56px, 8vw, 120px);
  line-height: 0.95;
  max-width: 14ch;
  color: var(--grey-100);
  letter-spacing: -0.02em;
  margin-bottom: 80px;
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
  margin-bottom: 80px;
}

.grid-wrap {
  border-top: 1px solid var(--hairline);
  padding-top: 48px;
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
}

.block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.block-label {
  letter-spacing: 0.28em;
  margin-bottom: 8px;
}

.contact-serif {
  font-family: var(--font-serif);
  font-size: 28px;
  line-height: 1.4;
  color: var(--grey-100);
  transition: color 0.3s ease;
}

.contact-serif:hover {
  color: var(--grey-300);
}

.address {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.muted {
  font-size: 14px;
  color: var(--grey-500);
  margin-top: 4px;
}

.elsewhere-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.elsewhere-link {
  font-family: var(--font-serif);
  font-size: 28px;
  color: var(--grey-100);
  transition: color 0.3s ease;
}

.elsewhere-link:hover {
  color: var(--grey-300);
}

.footer {
  margin-top: 120px;
  border-top: 1px solid var(--hairline);
  padding-top: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (max-width: 880px) {
  .contact {
    padding: 120px 24px 60px;
  }

  .contact-grid {
    grid-template-columns: 1fr;
    gap: 48px;
  }

  .footer {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>
