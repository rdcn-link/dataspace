<template>
  <footer class="site-footer" role="contentinfo">
    <div class="site-footer__inner max-w-7xl mx-auto px-6">
      <p class="site-footer__line">
        <span>&copy; {{ year }} 费尔空间·可信科学数据空间</span>
        <span class="site-footer__sep" aria-hidden="true">|</span>
        <a class="site-footer__email" href="mailto:qbliu@cnic.cn">qbliu@cnic.cn</a>
        <span class="site-footer__sep" aria-hidden="true">|</span>
        <span class="site-footer__beian">
          京ICP备2021012700号-4
        </span>
      </p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'


const year = computed(() => new Date().getFullYear())
</script>

<style scoped>
.site-footer {
  background: #fff;
  border-top: 1px solid #f1f5f9;
  padding: 3rem 0 1.5rem;
  width: 100%;
}

.site-footer__inner {
  padding-top: 1.5rem;
  border-top: 1px solid #f1f5f9;
  text-align: center;
}

.site-footer__line {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin: 0;
  font-size: 0.875rem;
  color: #0f172a;
  line-height: 1.6;
  max-width: 100%;
}

.site-footer__email {
  color: inherit;
  text-decoration: none;
}

.site-footer__email:hover {
  color: #1d4ed8;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.site-footer__sep {
  color: #0f172a;
}

.site-footer__beian {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: #64748b;
  font-size: 0.8125rem;
}

.site-footer__beian-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

@media (max-width: 767px) {
  .site-footer__line {
    flex-wrap: wrap;
    white-space: normal;
    font-size: 0.8125rem;
  }
}
</style>
