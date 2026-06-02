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
    type: 'icons',
    icons: [
      { id: 'wechat',    label: 'WeChat',    href: '#' },
      { id: 'x',         label: 'X',         href: '#' },
      { id: 'instagram', label: 'Instagram', href: '#' },
      { id: 'linkedin',  label: 'LinkedIn',  href: '#' },
      { id: 'email',     label: 'Email',     href: 'mailto:hello@commerceconsolidated.com' },
    ],
  },
]
</script>

<template>
  <main class="contact">

    <p v-reveal class="label label--lg section-label">— Contact</p>

    <h1 v-reveal="{ delay: 100 }" class="heading">
      Tell us how you'll <em>change</em> the world.
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

          <template v-else-if="b.type === 'icons'">
            <div class="icon-links">
              <a
                v-for="ic in b.icons"
                :key="ic.id"
                :href="ic.href"
                class="icon-link"
                :aria-label="ic.label"
                :title="ic.label"
              >
                <!-- WeChat: rounded square with two smile/dots stylised -->
                <svg v-if="ic.id === 'wechat'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M8.5 4C5.46 4 3 6.13 3 8.75c0 1.5.77 2.84 1.99 3.71L4.4 14l2.2-1.16c.6.13 1.24.2 1.9.2.34 0 .68-.02 1-.06" />
                  <path d="M21 14.3c0-2.32-2.18-4.2-4.87-4.2s-4.88 1.88-4.88 4.2c0 2.33 2.19 4.2 4.88 4.2.5 0 .98-.06 1.42-.17l1.99 1.07-.56-1.7c1.2-.78 2.02-1.96 2.02-3.4Z" />
                  <circle cx="6.6" cy="8.4" r="0.6" fill="currentColor" />
                  <circle cx="10.3" cy="8.4" r="0.6" fill="currentColor" />
                  <circle cx="14.5" cy="13.7" r="0.5" fill="currentColor" />
                  <circle cx="17.7" cy="13.7" r="0.5" fill="currentColor" />
                </svg>
                <!-- X (Twitter) -->
                <svg v-else-if="ic.id === 'x'" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.53 3H20.5l-6.51 7.44L21.5 21h-6.05l-4.73-6.18L5.3 21H2.32l6.96-7.95L2 3h6.2l4.28 5.66L17.53 3Zm-1.06 16.2h1.64L7.6 4.7H5.84l10.63 14.5Z" />
                </svg>
                <!-- Instagram -->
                <svg v-else-if="ic.id === 'instagram'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.7" fill="currentColor" stroke="none" />
                </svg>
                <!-- LinkedIn -->
                <svg v-else-if="ic.id === 'linkedin'" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.84v1.64h.05c.53-.95 1.84-1.95 3.79-1.95 4.05 0 4.8 2.55 4.8 5.87V21h-4v-5.45c0-1.3-.03-2.97-1.86-2.97-1.87 0-2.15 1.4-2.15 2.87V21h-4V9Z" />
                </svg>
                <!-- Email -->
                <svg v-else-if="ic.id === 'email'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 7 9-7" />
                </svg>
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

.icon-links {
  display: flex;
  gap: 18px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.icon-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: var(--grey-300);
  border: 1px solid var(--hairline);
  border-radius: 999px;
  transition: color 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
}

.icon-link svg {
  width: 20px;
  height: 20px;
}

.icon-link:hover {
  color: var(--grey-100);
  border-color: rgba(255, 255, 255, 0.32);
  transform: translateY(-1px);
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
