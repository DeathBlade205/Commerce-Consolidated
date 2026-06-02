<script setup>
import ServiceRow from '../components/ServiceRow.vue'
import CaseStudyCard from '../components/CaseStudyCard.vue'
import ProcessRow from '../components/ProcessRow.vue'

const services = [
  {
    number: '01',
    title: 'Web',
    description: 'Sites and product interfaces designed to be read, not decoded.',
    deliverables: ['Discovery', 'Design system', 'Build', 'Handover'],
  },
  {
    number: '02',
    title: 'Brand',
    description: 'Identities built around how a business actually behaves, not how it would like to be described.',
    deliverables: ['Positioning', 'Identity', 'Guidelines', 'Rollout'],
  },
  {
    number: '03',
    title: 'Marketing',
    description: 'Campaigns and ongoing programs run with the same restraint as the rest of the work.',
    deliverables: ['Strategy', 'Content', 'Channels', 'Reporting'],
  },
]

// placeholder case studies — swap with real client content
const caseStudies = [
  {
    client: 'Client One',
    discipline: 'Web & Brand',
    summary: 'Replatformed a multi-region retailer onto a single commerce system, rebuilt the identity to match. Order volume held; returns dropped.',
    year: '2025',
    placeholder: true,
  },
  {
    client: 'Client Two',
    discipline: 'Brand',
    summary: 'Naming, identity, and launch system for a category-defining product in regulated wellness.',
    year: '2024',
    placeholder: true,
  },
  {
    client: 'Client Three',
    discipline: 'Marketing',
    summary: 'A two-year ongoing program of restrained editorial and paid acquisition. Lower spend, higher recall.',
    year: '2024',
    placeholder: true,
  },
  {
    client: 'Client Four',
    discipline: 'Web',
    summary: 'Custom commerce build for a manufacturer moving direct-to-consumer for the first time.',
    year: '2023',
    placeholder: true,
  },
]

// 3 steps (Handover consolidated into Build & Launch per the fig.2 brief).
// Each row alternates which side the slide block sits on; the scroll reveal
// for each row comes in from that same side so the motion reads as the slide
// arriving from off-canvas.
const processSteps = [
  {
    number: '01',
    title: 'Brief',
    duration: 'Week 1',
    description: 'We meet, we listen, we write back what we heard. No proposal goes out until both sides have read the same problem.',
    side: 'right',  // slide on right → reveal from right
  },
  {
    number: '02',
    title: 'Design',
    duration: 'Weeks 2–5',
    description: 'Direction, refinement, decisions. Fewer rounds, longer ones. The system is set in this phase, not painted on later.',
    side: 'left',   // slide on left → reveal from left
  },
  {
    number: '03',
    title: 'Build & Launch',
    duration: 'Weeks 4–12',
    description: 'Production happens in parallel with late-stage design. Handover, documentation, and training fold into the last two weeks.',
    side: 'right',  // back to right
  },
]

// placeholder client names — replace with real client names
const clients = [
  'Northpoint',
  'Vega & Co.',
  'Halverston',
  'Onsite Group',
  'Marlowe Studio',
  'Field Notes',
  'Otis Manufacturing',
  'Quietly Co.',
]

// placeholder stats — replace with accurate figures
const stats = [
  { value: '42', suffix: '+', label: 'Engagements completed' },
  { value: '11', suffix: '', label: 'Sectors served' },
  { value: '06', suffix: '', label: 'Average weeks per project' },
  { value: '01', suffix: '', label: 'Standard' },
]
</script>

<template>
  <main class="about">

    <!-- Section 1: Intro -->
    <section class="section intro-grid">
      <div v-reveal class="intro-left">
        <p class="label label--lg section-label">— Practice</p>
        <h1 class="intro-heading">
          A studio for <em>considered</em> commerce.
        </h1>
      </div>
      <div v-reveal="{ delay: 180 }" class="intro-right">
        <p class="intro-body drop-cap">
          Commerce Consolidated is a small digital agency working across web, brand, and marketing.
          We help businesses present themselves with clarity — and build the systems that let them do it consistently.
        </p>
        <p class="intro-body">
          Our clients tend to share a temperament. They have something real to offer, they're tired of work that
          overstates it, and they want a partner who'll match their standard rather than perform around it.
        </p>
      </div>
    </section>

    <!-- Section 2: Services -->
    <section class="section">
      <p v-reveal class="label label--lg section-label">— Services</p>
      <ServiceRow
        v-for="(s, i) in services"
        :key="s.number"
        v-reveal="{ delay: 120 + i * 120 }"
        v-bind="s"
      />
    </section>

    <!-- Section 3: Selected Work -->
    <section class="section">
      <p v-reveal class="label label--lg section-label">— Selected Work</p>
      <p v-reveal="{ delay: 120 }" class="work-note">A short list. Full case studies on request.</p>
      <div class="case-grid">
        <CaseStudyCard
          v-for="(c, i) in caseStudies"
          :key="c.client"
          v-reveal="{ delay: 200 + i * 120 }"
          v-bind="c"
        />
      </div>
    </section>

    <!-- Section 4: Process -->
    <section class="section">
      <p v-reveal class="label label--lg section-label">— Process</p>
      <h2 v-reveal="{ delay: 120 }" class="process-heading">
        Most engagements run six to twelve <em>weeks</em>.
      </h2>
      <div class="process-rows">
        <ProcessRow
          v-for="(s, i) in processSteps"
          :key="s.number"
          v-reveal="{ from: s.side, delay: 80 + i * 60 }"
          v-bind="s"
        />
      </div>
    </section>

    <!-- Section 5: Past Clients -->
    <section class="section">
      <p v-reveal class="label label--lg section-label">— Clients</p>
      <!-- placeholder client names — replace with real clients -->
      <div class="clients-row">
        <span
          v-for="(name, i) in clients"
          :key="name"
          v-reveal="{ delay: i * 60 }"
          class="client-name"
          :class="{ 'no-border': i === clients.length - 1 }"
        >{{ name }}</span>
      </div>
    </section>

    <!-- Section 6: Stats -->
    <section class="stats-section">
      <!-- placeholder stats — replace with accurate figures -->
      <div class="stats-grid">
        <div
          v-for="(s, i) in stats"
          :key="s.label"
          v-reveal="{ delay: i * 120 }"
          class="stat"
        >
          <span class="stat-value">
            {{ s.value }}<em v-if="s.suffix" class="stat-suffix">{{ s.suffix }}</em>
          </span>
          <span class="label stat-label">{{ s.label }}</span>
        </div>
      </div>
    </section>

  </main>
</template>

<style scoped>
.about {
  padding: 140px 48px 80px;
  max-width: 1200px;
  margin: 0 auto;
}

.section {
  margin-bottom: 120px;
}

.section-label {
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  border-top: 1px solid var(--hairline);
  padding-top: 16px;
}

/* Intro */
.intro-grid {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 120px;
  align-items: start;
}

.intro-heading {
  font-family: var(--font-serif);
  font-size: clamp(40px, 5vw, 72px);
  line-height: 1.05;
  letter-spacing: -0.015em;
  color: var(--grey-100);
  margin-top: 24px;
}

.intro-heading em {
  font-style: italic;
  color: var(--grey-300);
}

.intro-body {
  font-size: 16px;
  color: var(--grey-300);
  line-height: 1.8;
  max-width: 56ch;
  margin-bottom: 24px;
}

.drop-cap::first-letter {
  font-family: var(--font-serif);
  font-size: 56px;
  line-height: 0.9;
  float: left;
  margin: 6px 12px 0 0;
  color: var(--grey-100);
}

/* Selected work */
.work-note {
  font-size: 13px;
  color: var(--grey-500);
  margin-bottom: 32px;
  margin-top: -16px;
}

.case-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

/* Process */
.process-heading {
  font-family: var(--font-serif);
  font-size: clamp(32px, 4vw, 56px);
  line-height: 1.05;
  max-width: 18ch;
  color: var(--grey-100);
  margin-bottom: 64px;
}

.process-heading em {
  font-style: italic;
  color: var(--grey-300);
}

.process-rows {
  display: flex;
  flex-direction: column;
  gap: 120px;
}

@media (max-width: 880px) {
  .process-rows {
    gap: 64px;
  }
}

/* Clients */
.clients-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.client-name {
  font-family: var(--font-serif);
  font-size: 18px;
  color: var(--grey-300);
  padding: 0 24px;
  border-right: 1px solid var(--hairline);
  line-height: 2;
}

.client-name.no-border {
  border-right: none;
}

/* Stats */
.stats-section {
  border-top: 1px solid var(--hairline);
  padding-top: 40px;
  margin-bottom: 80px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-value {
  font-family: var(--font-serif);
  font-size: 48px;
  line-height: 1;
  color: var(--grey-100);
}

.stat-value em {
  font-style: italic;
  font-size: 32px;
  color: var(--grey-500);
  margin-left: 2px;
}

.stat-label {
  color: var(--grey-500);
}

@media (max-width: 880px) {
  .about {
    padding: 120px 24px 60px;
  }

  .section {
    margin-bottom: 80px;
  }

  .intro-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .case-grid {
    grid-template-columns: 1fr;
  }

  /* `.process-rows` mobile gap already set in the rule above the media query */

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .client-name {
    border-right: none;
    padding: 4px 16px;
  }
}
</style>
