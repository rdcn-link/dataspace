<template>
  <section v-if="card" class="source-org-card">
    <header class="source-org-card__head">
      <h2 class="source-org-card__title">{{ title }}</h2>
    </header>
    <slot />
    <a
      v-if="card.homeUrl"
      :href="card.homeUrl"
      class="source-org-card__link"
      target="_blank"
      rel="noopener noreferrer"
      :title="`访问${card.name}官网`"
    >
      <InformationSourceLogo :name="card.name" :logo-url="card.logoUrl" />
      <span class="source-org-card__body">
        <span class="source-org-card__name">{{ card.name }}</span>
        <span class="source-org-card__action">
          访问官网
          <iconify-icon icon="mdi:open-in-new" aria-hidden="true"></iconify-icon>
        </span>
      </span>
    </a>
    <div v-else class="source-org-card__static">
      <InformationSourceLogo :name="card.name" :logo-url="card.logoUrl" />
      <span class="source-org-card__name">{{ card.name }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import InformationSourceLogo from '@/components/InformationSourceLogo.vue'
import type { InformationSourceCard } from '@/utils/informationSourceSites'

defineProps<{
  title: string
  card: InformationSourceCard | null
}>()
</script>

<style scoped>
.source-org-card {
  width: 100%;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 0.75rem;
  padding: 1rem 1.1rem;
  box-shadow:
    0 4px 6px rgba(15, 23, 42, 0.04),
    0 12px 28px rgba(15, 23, 42, 0.08);
}

.source-org-card__head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid #e2e8f0;
}

.source-org-card :slotted(.data-seek-btn) {
  margin-bottom: 0.75rem;
}

.source-org-card__head::before {
  content: '';
  flex-shrink: 0;
  width: 3px;
  height: 0.9rem;
  border-radius: 2px;
  background: linear-gradient(180deg, #10b981, #0ea5e9);
}

.source-org-card__title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 800;
  color: #0f172a;
}

.source-org-card__link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 0.9rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: #fff;
  color: #334155;
  text-decoration: none;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
}

.source-org-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;
  flex: 1;
}

.source-org-card__link:hover {
  background: rgba(16, 185, 129, 0.06);
  border-color: rgba(14, 165, 233, 0.35);
  box-shadow: 0 4px 14px rgba(14, 165, 233, 0.08);
}

.source-org-card__link:hover .source-org-card__name {
  color: #0f766e;
}

.source-org-card__link:hover .source-org-card__action {
  color: #0284c7;
}

.source-org-card__name {
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.5;
  color: #0f172a;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.source-org-card__action {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.source-org-card__action iconify-icon {
  font-size: 0.875rem;
}

.source-org-card__static {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 0.9rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: rgba(248, 250, 252, 0.9);
}

.source-org-card__static .source-org-card__name {
  flex: 1;
  min-width: 0;
}
</style>
