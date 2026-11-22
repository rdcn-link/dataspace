<template>
  <div class="hub-detail">
    <div class="hub-card__top">
      <div class="hub-card__brand">
        <img
          class="hub-card__logo"
          :src="hub.logoUrl"
          :alt="hub.name"
          @error="onLogoError"
        />
        <div class="hub-card__titles">
          <a
            v-if="hub.dataCenterId"
            class="hub-card__name hub-card__name--link"
            :href="analysisHref(hub.dataCenterId)"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ hub.name }}
          </a>
          <a
            v-else
            class="hub-card__name"
            :href="hub.homePage"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ hub.name }}
          </a>
          <a
            v-if="hub.nameEn && hub.dataCenterId"
            class="hub-card__name-en hub-card__name-en--link"
            :href="analysisHref(hub.dataCenterId)"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ hub.nameEn }}
          </a>
          <p v-else-if="hub.nameEn" class="hub-card__name-en">{{ hub.nameEn }}</p>
          <p class="hub-card__org">{{ hub.orgName }}</p>
          <a class="hub-card__email" :href="`mailto:${hub.contactEmail}`">{{ hub.contactEmail }}</a>
        </div>
      </div>
    </div>

    <p class="hub-card__desc">{{ hub.description }}</p>

    <div class="hub-card__rows">
      <div class="hub-card__row">
        <span class="hub-card__label">学科领域</span>
        <div class="hub-card__tags">
          <span v-for="s in hub.subjects" :key="s" class="hub-tag">{{ s }}</span>
        </div>
      </div>
      <div class="hub-card__row">
        <span class="hub-card__label">数据类型</span>
        <div class="hub-card__tags">
          <span v-for="t in hub.dataTypes" :key="t" class="hub-tag hub-tag--muted">{{ t }}</span>
        </div>
      </div>
    </div>

    <div class="hub-card__metrics">
      <a
        v-if="hub.dataCenterId"
        class="hub-metric hub-metric--link"
        :href="analysisHref(hub.dataCenterId)"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span class="hub-metric__label">数据集</span>
        <strong class="hub-metric__value">{{ hub.datasetsLabel }}</strong>
      </a>
      <div v-else class="hub-metric">
        <span class="hub-metric__label">数据集</span>
        <strong class="hub-metric__value">{{ hub.datasetsLabel }}</strong>
      </div>
      <div class="hub-metric">
        <span class="hub-metric__label">数据分析次数</span>
        <strong class="hub-metric__value">{{ formatCount(hub.serviceCount) }}</strong>
      </div>
      <div class="hub-metric">
        <span class="hub-metric__label">更新日期</span>
        <strong class="hub-metric__value">{{ hub.resolvedUpdatedAt }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { EnrichedHub } from '@/data/spaceHubs'

defineProps<{ hub: EnrichedHub }>()

const router = useRouter()

function formatCount(n: number): string {
  return n.toLocaleString('zh-CN')
}

function onLogoError(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.visibility = 'hidden'
}

function analysisHref(centerId: string) {
  return router.resolve({ path: '/analysis-datasets', query: { center: centerId } }).href
}
</script>

<style scoped>
.hub-detail {
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 1rem;
  padding: 1.35rem 1.4rem 1.25rem;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.hub-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.hub-card__brand {
  display: flex;
  gap: 1rem;
  min-width: 0;
}

.hub-card__logo {
  width: 4.25rem;
  height: 4.25rem;
  object-fit: contain;
  border-radius: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.hub-card__titles {
  min-width: 0;
}

.hub-card__name {
  display: inline-block;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  text-decoration: none;
  line-height: 1.35;
  text-align: left;
  font-family: inherit;
}

.hub-card__name--link {
  cursor: pointer;
}

.hub-card__name--link:hover,
.hub-card__name:hover {
  color: #1d4ed8;
}

.hub-card__name-en {
  margin: 0.2rem 0 0;
  padding: 0;
  border: 0;
  background: transparent;
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  text-align: left;
  font-family: inherit;
}

.hub-card__name-en--link {
  cursor: pointer;
}

.hub-card__name-en--link:hover {
  color: #64748b;
  text-decoration: underline;
}

.hub-card__org {
  margin: 0.45rem 0 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}

.hub-card__email {
  display: inline-block;
  margin-top: 0.2rem;
  font-size: 0.8125rem;
  color: #2563eb;
  text-decoration: none;
}

.hub-card__desc {
  margin: 1rem 0 0;
  font-size: 0.875rem;
  line-height: 1.75;
  color: #475569;
}

.hub-card__rows {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin-top: 1.1rem;
  padding-top: 1.1rem;
  border-top: 1px solid #f1f5f9;
}

.hub-card__row {
  display: grid;
  grid-template-columns: 7.5rem 1fr;
  gap: 0.75rem;
  align-items: start;
}

@media (max-width: 640px) {
  .hub-card__row {
    grid-template-columns: 1fr;
    gap: 0.35rem;
  }

  .hub-card__top {
    flex-direction: column;
  }
}

.hub-card__label {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #64748b;
  padding-top: 0.15rem;
}

.hub-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.hub-tag {
  display: inline-flex;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0369a1;
  font-size: 0.75rem;
  font-weight: 600;
}

.hub-tag--muted {
  background: #f8fafc;
  border-color: #e2e8f0;
  color: #475569;
}

.hub-card__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1.15rem;
}

@media (max-width: 900px) {
  .hub-card__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .hub-card__metrics {
    grid-template-columns: 1fr;
  }
}

.hub-metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.75rem 0.85rem;
  border-radius: 0.75rem;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  min-width: 0;
}

.hub-metric--link {
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
}

.hub-metric--link:hover {
  border-color: #93c5fd;
  background: linear-gradient(180deg, #eff6ff 0%, #e0f2fe 100%);
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.12);
}

.hub-metric--link:hover .hub-metric__label,
.hub-metric--link:hover .hub-metric__value {
  color: #1d4ed8;
}

.hub-metric__label {
  flex-shrink: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #64748b;
  line-height: 1.2;
}

.hub-metric__value {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.3;
  text-align: right;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>