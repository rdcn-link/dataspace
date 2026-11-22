<template>
  <div class="index-page">
    <div class="scroll-progress" :style="{ transform: `scaleX(${scrollProgress})` }" aria-hidden="true"></div>
    <div class="home-mesh" aria-hidden="true"></div>
    <div class="home-particles" aria-hidden="true">
      <span v-for="n in 12" :key="n" class="home-particle" :style="{ '--i': n }"></span>
    </div>
    <div class="bg-blob blob-1"></div>
    <div class="bg-blob blob-2"></div>

    <!-- 固定导航栏 -->
    <nav class="glass-nav fixed top-0 w-full z-50 hidden md:block" :class="{ 'glass-nav--scrolled': navScrolled }">
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        <div class="flex items-center space-x-2 group cursor-pointer shrink-0 z-10" @click="router.push('/home')">
          <BrandLogo size="md" interactive />
          <span class="text-lg sm:text-xl font-bold tracking-tight text-slate-900">费尔空间</span>
        </div>
        <SiteTopNavLinks />
        <div class="flex items-center space-x-2 sm:space-x-4 shrink-0 z-10">
          <UserCenterNavButton />
          <!-- 未登录 → 显示登录按钮 -->
          <template v-if="!authStore.isLoggedIn">
            <button @click="goToLogin" class="btn-gradient text-white font-bold py-2 px-4 sm:px-5 rounded-xl transition-all text-sm">
              登录
            </button>
          </template>
          <!-- 已登录 → 显示用户欢迎信息 -->
          <template v-else>
            <!-- 消息通知按钮 -->
            <button 
              @click="openNoticeModal"
              class="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="消息通知"
            >
              <iconify-icon icon="mdi:bell-outline" class="text-lg text-slate-600"></iconify-icon>
              <span 
                v-if="unreadCount > 0" 
                class="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
              >
                {{ unreadCount > 99 ? '99+' : unreadCount }}
              </span>
            </button>
            <span class="hidden sm:inline text-sm text-slate-600">欢迎您，{{ authStore.displayName }}</span>
            <button @click="handleLogout" class="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1">
              退出
            </button>
          </template>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <section class="hero-cine" @mousemove="onHeroMouseMove" @mouseleave="resetHeroParallax">
      <div class="hero-cine__bg" :style="heroParallaxStyle"></div>
      <div class="hero-cine__scanline" aria-hidden="true"></div>
      <div class="hero-cine__shell home-page-width w-full">
        <div class="hero-cine__content text-center">
          <h1 class="hero-cine__title anim-rise" style="--d: 0.12s">
            连接科研数据
            <span class="hero-cine__shimmer">加速科学发现</span>
        </h1>
          <p class="hero-cine__lead anim-rise" style="--d: 0.2s">
            构建安全可信数据底座，融通基础学科数据，赋能科研协同创新
          </p>
          <form class="hero-cine__search anim-rise" style="--d: 0.28s" @submit.prevent="handleSearch">
            <iconify-icon icon="mdi:magnify" class="hero-cine__search-icon"></iconify-icon>
          <input
            v-model="searchQuery"
              type="search"
              class="hero-cine__search-input"
              placeholder=""
              aria-label="搜索数据集"
            />
            <button type="submit" class="hero-cine__search-btn">
              立即搜索
              <iconify-icon icon="mdi:arrow-right"></iconify-icon>
            </button>
          </form>
          <div class="tag-marquee anim-rise" style="--d: 0.36s">
            <div class="tag-marquee__track">
              <button
                v-for="(tag, i) in marqueeTags"
                :key="`${tag}-${i}`"
                type="button"
                class="tag-marquee__item"
                @click="searchByTag(tag)"
              >
                {{ tag.replace('# ', '') }}
              </button>
        </div>
        </div>
      </div>

        <section
          v-if="heroNewsLoading || heroNewsItems.length"
          class="hero-news anim-rise"
          style="--d: 0.42s"
          aria-label="头条资讯"
          @mouseenter="pauseHeroNews = true"
          @mouseleave="pauseHeroNews = false"
        >
          <header class="hero-news__head">
            <h2 class="hero-news__title">头条资讯</h2>
            <div class="hero-news__actions">
              <button
                v-if="heroNewsPageCount > 1"
                type="button"
                class="hero-news__nav"
                aria-label="上一组"
                @click="prevHeroNews"
              >
                <iconify-icon icon="mdi:chevron-left"></iconify-icon>
              </button>
              <button
                v-if="heroNewsPageCount > 1"
                type="button"
                class="hero-news__nav"
                aria-label="下一组"
                @click="nextHeroNews"
              >
                <iconify-icon icon="mdi:chevron-right"></iconify-icon>
              </button>
              <button type="button" class="hero-news__more" @click="router.push('/headlines')">
                查看更多
                <iconify-icon icon="mdi:arrow-right"></iconify-icon>
              </button>
          </div>
          </header>

          <div v-if="heroNewsLoading && !heroNewsItems.length" class="hero-news__grid">
            <article
              v-for="n in HERO_NEWS_PAGE_SIZE"
              :key="`hero-news-skeleton-${n}`"
              class="hero-news__card hero-news__card--skeleton tech-card"
              aria-hidden="true"
            >
              <div class="hero-news__cover"></div>
              <div class="hero-news__body">
                <span></span>
                <span></span>
        </div>
            </article>
          </div>
          <Transition v-else name="hero-news-fade" mode="out-in">
            <div :key="heroNewsPageIndex" class="hero-news__grid">
              <button
                v-for="item in heroNewsPage"
                :key="item.id"
                type="button"
                class="hero-news__card tech-card"
                :title="item.name"
                @click="openHeroNews(item)"
              >
                <div class="hero-news__cover">
                  <img
                    v-if="item.thumbUrl && !heroNewsCoverFailed.has(item.id)"
                    :src="item.thumbUrl"
                    :alt="item.name"
                    loading="lazy"
                    @error="onHeroNewsCoverError(item.id)"
                  />
                  <div v-else class="hero-news__cover-fallback">
                    <iconify-icon icon="mdi:newspaper-variant-outline"></iconify-icon>
        </div>
          </div>
                <div class="hero-news__body">
                  <h3>{{ item.name }}</h3>
                  <p>
                    <span>{{ item.source || '资讯' }}</span>
                    <time>{{ item.publishedAt }}</time>
                  </p>
        </div>
              </button>
          </div>
          </Transition>

          <div v-if="heroNewsPageCount > 1" class="hero-news__dots">
            <button
              v-for="n in heroNewsPageCount"
              :key="n"
              type="button"
              class="hero-news__dot"
              :class="{ 'hero-news__dot--active': n - 1 === heroNewsPageIndex }"
              :aria-label="`第 ${n} 组资讯`"
              @click="heroNewsPageIndex = n - 1"
            />
          </div>
        </section>

        <div ref="statsSectionRef" class="stats-dock">
          <div
            v-for="(stat, i) in platformStats"
            :key="stat.label"
            class="stats-dock__item tech-card"
            :class="[`stats-dock__item--${stat.tone}`, { 'is-in': statsVisible }]"
            :style="{ '--d': `${i * 0.09}s` }"
          >
            <div class="stats-dock__ring" aria-hidden="true"></div>
            <iconify-icon :icon="stat.icon" class="stats-dock__icon"></iconify-icon>
            <div class="stats-dock__meta">
              <p class="stats-dock__value font-num tabular-nums">{{ animatedStatValues[i] }}</p>
              <p class="stats-dock__label">{{ stat.label }}</p>
          </div>
        </div>
        </div>
      </div>
    </section>

    <!-- 探索中枢 -->
    <section ref="hubSectionRef" class="hub-section home-block home-page-width" :class="{ 'is-in': hubVisible }">
      <div class="hub-section__shell tech-card">
        <header class="hub-section__head hub-rise" style="--d: 0s">
          <div class="hub-section__titles">
  
            <h2 class="hub-section__title">探索科研资源中枢</h2>
        </div>
         
        </header>

        <div class="hub-portals">
          <button
            v-for="(item, i) in quickLinks"
            :key="item.title"
            type="button"
            class="hub-portal hub-rise tech-card"
            :class="item.portalClass"
            :style="{ '--d': `${0.06 + i * 0.07}s` }"
            @click="router.push(item.path)"
          >
            <iconify-icon :icon="item.icon" class="hub-portal__watermark" aria-hidden="true"></iconify-icon>
            <div :class="['hub-portal__icon', item.iconClass]">
              <iconify-icon :icon="item.icon"></iconify-icon>
      </div>
            <div class="hub-portal__body">
              <h3>{{ item.title }}</h3>
              <p>{{ item.desc }}</p>
          </div>
            <iconify-icon icon="mdi:arrow-top-right" class="hub-portal__arrow"></iconify-icon>
          </button>
        </div>

        <div
          class="hub-spotlight hub-rise"
          style="--d: 0.18s"
          @mouseenter="pauseSpotlight = true"
          @mouseleave="pauseSpotlight = false"
        >
          <div class="hub-spotlight__bar">
            <h3 class="hub-spotlight__label">
              <iconify-icon icon="mdi:star-four-points"></iconify-icon>
              热门数据集
            </h3>
            <div v-if="hotDatasets.length > 1" class="hub-spotlight__controls">
              <button type="button" class="hub-spotlight__btn" aria-label="上一个" @click="prevSpotlight">
                <iconify-icon icon="mdi:chevron-left"></iconify-icon>
              </button>
              <span class="hub-spotlight__counter">{{ activeSpotlight + 1 }} / {{ hotDatasets.length }}</span>
              <button type="button" class="hub-spotlight__btn" aria-label="下一个" @click="nextSpotlight">
                <iconify-icon icon="mdi:chevron-right"></iconify-icon>
              </button>
            </div>
              </div>

          <div v-if="hotLoading" class="spotlight-skeleton" aria-hidden="true">
            <div class="spotlight-skeleton__media"></div>
            <div class="spotlight-skeleton__body">
              <div class="spotlight-skeleton__tags">
                <span></span>
                <span></span>
                </div>
              <span class="spotlight-skeleton__line spotlight-skeleton__line--title"></span>
              <span class="spotlight-skeleton__line"></span>
              <span class="spotlight-skeleton__line"></span>
              <span class="spotlight-skeleton__line spotlight-skeleton__line--short"></span>
              <div class="spotlight-skeleton__foot">
                <span></span>
                <span></span>
                </div>
              </div>
            </div>
          <template v-else-if="spotlightDataset">
            <Transition name="spot-fade" mode="out-in">
              <article
                :key="spotlightDataset.cstr"
                class="spotlight-card cursor-pointer group"
                @click="openDetailInNewTab(spotlightDataset)"
              >
                <div class="spotlight-card__media">
                  <img
                    v-if="spotlightDataset.coverUrl"
                    :src="spotlightDataset.coverUrl"
                    :alt="spotlightDataset.title"
                    @error="spotlightDataset.coverUrl = ''"
                  />
                  <div v-else class="spotlight-card__placeholder">
                    <iconify-icon icon="mdi:database"></iconify-icon>
          </div>
            </div>
                <div class="spotlight-card__body">
                  <div class="ds-meta">
                    <span :class="`ds-tag ${getLevelClass(spotlightDataset.level)}`">{{ spotlightDataset.levelShort }}</span>
                    <span class="ds-subject">{{ spotlightDataset.subject }}</span>
                </div>
                  <h4>{{ spotlightDataset.title }}</h4>
                  <p>{{ spotlightDataset.description }}</p>
                  <div class="ds-foot">
                    <span><iconify-icon icon="mdi:office-building-marker"></iconify-icon>{{ spotlightDataset.source }}</span>
                    <span><iconify-icon icon="mdi:eye-outline"></iconify-icon>{{ spotlightDataset.viewCount }}</span>
                </div>
              </div>
              </article>
            </Transition>
            <div v-if="hotDatasets.length > 1" class="spotlight-dots">
              <button
                v-for="(_, idx) in hotDatasets"
                :key="idx"
                type="button"
                class="spotlight-dots__dot"
                :class="{ 'spotlight-dots__dot--active': idx === activeSpotlight }"
                :aria-label="`切换到第 ${idx + 1} 个数据集`"
                @click="activeSpotlight = idx"
              />
          </div>
        </template>
      </div>

        <div
          class="hub-gallery hub-rise"
          style="--d: 0.26s"
          @mouseenter="pauseGallery = true"
          @mouseleave="pauseGallery = false"
        >
          <div class="hub-gallery__head">
            <h3 class="hub-gallery__title">更多热门数据集</h3>
            <button type="button" class="hub-gallery__link" @click="router.push('/assets')">
              查看目录 <iconify-icon icon="mdi:arrow-right"></iconify-icon>
            </button>
        </div>
          <div v-if="hotLoading" class="hub-gallery__grid hub-gallery__grid--skeleton">
            <article
              v-for="n in HOT_GRID_PAGE_SIZE"
              :key="`gallery-skeleton-${n}`"
              class="hub-gallery__card hub-gallery__card--skeleton tech-card"
              aria-hidden="true"
            >
              <div class="hub-gallery__skeleton-thumb"></div>
              <div class="hub-gallery__skeleton-lines">
                <span></span>
                <span></span>
                <span></span>
      </div>
            </article>
          </div>
          <Transition v-else name="spot-fade" mode="out-in">
            <div v-if="gridDatasets.length" :key="activeGalleryPage" class="hub-gallery__grid">
            <article
              v-for="(item, i) in gridDatasets"
              :key="item.cstr"
              class="hub-gallery__card tech-card cursor-pointer group"
              :style="{ '--d': `${0.32 + i * 0.05}s` }"
              @click="openDetailInNewTab(item)"
            >
              <div class="hub-gallery__thumb">
                <img v-if="item.coverUrl" :src="item.coverUrl" :alt="item.title" @error="item.coverUrl = ''" />
                <iconify-icon v-else icon="mdi:database"></iconify-icon>
              </div>
              <div class="hub-gallery__info">
                <span :class="`ds-tag ${getLevelClass(item.level)}`">{{ item.levelShort }}</span>
                <h4>{{ item.title }}</h4>
                <p>{{ item.description }}</p>
                <div class="ds-foot">
                  <span>{{ item.source }}</span>
                  <span><iconify-icon icon="mdi:eye-outline"></iconify-icon>{{ item.viewCount }}</span>
            </div>
              </div>
            </article>
              </div>
          </Transition>
          <div v-if="!hotLoading && !gridDatasets.length" class="hub-gallery__empty">
            <iconify-icon icon="mdi:database-off-outline"></iconify-icon>
            <p>暂无数据集</p>
            </div>
          <div v-if="galleryPageCount > 1" class="hub-gallery__dots">
            <button
              v-for="page in galleryPageCount"
              :key="page"
              type="button"
              class="hub-gallery__dot"
              :class="{ 'hub-gallery__dot--active': page - 1 === activeGalleryPage }"
              :aria-label="`切换到第 ${page} 页`"
              @click="activeGalleryPage = page - 1"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- 价值时间轴 -->
    <section ref="trustSectionRef" class="home-block home-page-width">
      <header class="block-head block-head--center" :class="{ 'is-in': trustVisible }">
        <h2 class="block-head__title">为什么选择费尔空间</h2>
        <p class="block-head__desc">专为科研场景打造，安全与效率的平衡</p>
      </header>
      <div class="trust-flow" :class="{ 'is-in': trustVisible }">
        <div class="trust-flow__line" aria-hidden="true">
          <span class="trust-flow__line-fill"></span>
        </div>
        <article
          v-for="(pillar, i) in trustPillars"
          :key="pillar.title"
          class="trust-step"
          :style="{ '--d': `${0.12 + i * 0.14}s` }"
        >
          <div class="trust-step__node">
            <div :class="['trust-step__icon', pillar.iconClass]">
              <iconify-icon :icon="pillar.icon"></iconify-icon>
            </div>
          </div>
          <h3>{{ pillar.title }}</h3>
          <p>{{ pillar.description }}</p>
        </article>
            </div>
      <ul class="trust-badges" :class="{ 'is-in': trustVisible }">
        <li v-for="(m, i) in trustMetrics" :key="m.label" :style="{ '--d': `${0.2 + i * 0.08}s` }">
          <strong>{{ m.label }}</strong>
          <span>{{ m.desc }}</span>
        </li>
      </ul>
    </section>

    <div class="index-page__footer">
      <AppFooter />
      </div>

    <!-- 消息通知弹窗 -->
    <div v-if="showNoticeModal" class="notice-modal-overlay" @click="closeNoticeModal">
      <div class="notice-modal bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-lg mx-4" @click.stop>
        <!-- 弹窗头部 -->
        <div class="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 class="font-bold text-slate-800 flex items-center gap-2">
            <iconify-icon icon="mdi:bell-outline" class="text-blue-600"></iconify-icon>
            消息通知
          </h3>
          <button @click="closeNoticeModal" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
            <iconify-icon class="text-slate-400" icon="mdi:close"></iconify-icon>
          </button>
        </div>

        <!-- 消息列表 -->
        <div class="max-h-96 overflow-y-auto p-4">
          <!-- 加载状态 -->
          <div v-if="noticeLoading" class="flex flex-col items-center justify-center py-12">
            <iconify-icon class="text-4xl text-blue-500 animate-spin" icon="mdi:loading"></iconify-icon>
            <p class="text-sm text-slate-500 mt-4">加载中...</p>
          </div>

          <!-- 无消息 -->
          <div v-else-if="notices.length === 0" class="flex flex-col items-center justify-center py-12">
            <iconify-icon class="text-6xl text-slate-300" icon="mdi:bell-off-outline"></iconify-icon>
            <p class="text-sm text-slate-500 mt-4">暂无消息</p>
          </div>

          <!-- 消息列表 -->
          <div v-else class="space-y-3">
            <div 
              v-for="(notice, idx) in notices" 
              :key="idx" 
              class="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              :class="{ 'ring-2 ring-blue-500': notice.unread }"
              @click="markAsRead(idx)"
            >
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <iconify-icon class="text-blue-600" :icon="notice.icon || 'mdi:information-outline'"></iconify-icon>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-medium text-slate-800 text-sm">{{ notice.title }}</span>
                    <span class="text-xs text-slate-400">{{ notice.time }}</span>
                  </div>
                  <p class="text-sm text-slate-600 line-clamp-2">{{ notice.content }}</p>
                </div>
                <span 
                  v-if="notice.unread" 
                  class="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-2"
                ></span>
              </div>
            </div>
          </div>
        </div>


        <!-- 弹窗底部 -->
        <div class="p-4 border-t border-slate-100">
          <button 
            v-if="unreadCount > 0" 
            @click="markAllAsRead" 
            class="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            全部已读
          </button>
        </div>
      </div>
    </div>

    <SiteBottomTabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeMount, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { goLogin } from '@/utils/loginRedirect'
import { formatShareModeLabel, parseNameZhLabel, resolveScidbStaticUrl } from '@/utils/casdcDetailMapper'
import { openAssetDetailInNewTab } from '@/utils/openAssetDetail'
import { stripHtml } from '@/utils/richText'
import BrandLogo from '@/components/BrandLogo.vue'
import SiteBottomTabBar from '@/components/SiteBottomTabBar.vue'
import SiteTopNavLinks from '@/components/SiteTopNavLinks.vue'
import UserCenterNavButton from '@/components/UserCenterNavButton.vue'
import AppFooter from '@/components/AppFooter.vue'
import { openInformationArticleWindow } from '@/utils/openInformationArticle'
import {
  fetchInformationPage,
  formatInformationDate,
  getInformationThumbUrl,
  type InformationRecord
} from '@/utils/informationApi'

const router = useRouter()
const authStore = useAuthStore()
const searchQuery = ref('')

function goToLogin() {
  void goLogin(router, router.currentRoute.value.fullPath)
}

const handleLogout = () => {
  authStore.logout()
}

// ===== 消息通知功能 =====
const showNoticeModal = ref(false)
const noticeLoading = ref(false)
const notices = ref<any[]>([])

// 计算未读消息数量
const unreadCount = computed(() => {
  return notices.value.filter(n => n.unread).length
})

// 获取消息列表
const fetchNotices = async () => {
  if (!authStore.user?.uid && !authStore.user?.openId) return
  
  noticeLoading.value = true
  try {
    const uid = authStore.user?.uid || authStore.user?.openId || ''
    const res = await fetch(`/tds-trading/order/order.noticeByUid?uid=${encodeURIComponent(uid)}`)
    const json = await res.json()
    
    if (json.code === 200 && json.data) {
      // 将后端数据转换为前端格式
      notices.value = json.data.map((item: any) => ({
        title: item.name || item.title || '系统通知',
        content: item.content || item.description || '',
        time: item.createTime ? formatTime(item.createTime) : new Date().toLocaleDateString(),
        unread: item.readStatus === 0 || item.unread,
        icon: getNoticeIcon(item.type)
      }))
    } else {
      // 使用模拟数据
      notices.value = getMockNotices()
    }
  } catch (e) {
    console.error('获取消息列表失败:', e)
    // 使用模拟数据
    notices.value = getMockNotices()
  } finally {
    noticeLoading.value = false
  }
}

// 格式化时间
const formatTime = (timeStr: string) => {
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return date.toLocaleDateString('zh-CN')
}

// 根据消息类型获取图标
const getNoticeIcon = (type?: string | number) => {
  const iconMap: Record<string, string> = {
    'approve': 'mdi:check-circle-outline',
    'reject': 'mdi:alert-circle-outline',
    'system': 'mdi:information-outline',
    'message': 'mdi:message-outline',
    '1': 'mdi:check-circle-outline',   // 假设类型1是审批通过
    '2': 'mdi:alert-circle-outline'    // 假设类型2是审批拒绝
  }
  return iconMap[String(type)] || 'mdi:bell-outline'
}

// 模拟消息数据
const getMockNotices = () => [
  { title: '数据申请通过', content: '您申请的「单细胞RNA测序数据集（GSE123456）」已通过审核，现在可以下载使用。', time: '2小时前', unread: true, icon: 'mdi:check-circle-outline' },
  { title: '授权即将到期', content: '您的「泛癌基因组数据」授权将在3天后到期，请及时续期以继续使用。', time: '1天前', unread: true, icon: 'mdi:alert-circle-outline' },
  { title: '数据更新通知', content: '您关注的「阿尔兹海默症研究数据集」已更新至v2.0版本，新增了200个样本数据。', time: '2天前', unread: false, icon: 'mdi:database' },
  { title: '系统公告', content: '平台将于本周末进行系统维护升级，届时将暂停服务4小时。', time: '3天前', unread: false, icon: 'mdi:information-outline' },
  { title: '合作邀请', content: '清华大学李教授邀请您合作研究「肿瘤免疫微环境」相关课题。', time: '1周前', unread: false, icon: 'mdi:handshake-outline' }
]

// 打开消息弹窗
const openNoticeModal = () => {
  showNoticeModal.value = true
  fetchNotices()
}

// 关闭消息弹窗
const closeNoticeModal = () => {
  showNoticeModal.value = false
}

// 标记单条消息为已读
const markAsRead = (index: number) => {
  notices.value[index].unread = false
}

// 标记所有消息为已读
const markAllAsRead = () => {
  notices.value.forEach(n => n.unread = false)
}

// 监听弹窗打开事件，自动获取消息
watch(showNoticeModal, (val) => {
  if (val) {
    fetchNotices()
  }
})

const handleSearch = () => {
  const kw = searchQuery.value.trim()
  router.push(kw ? { path: '/assets', query: { keyword: kw } } : { path: '/assets' })
}

const searchByTag = (tag: string) => {
  searchQuery.value = tag.replace('# ', '')
  handleSearch()
}

// ----- 主页统计 -----
const openDatasetTotal = ref<number | null>(null)

function formatStatNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return value.toLocaleString('en-US')
}

async function fetchOpenDatasetTotal() {
  try {
    const params = new URLSearchParams({
      page: '1',
      pageSize: '1',
      shareMode: 'PUBLIC'
    })
    const res = await fetch(`/tds-trading/order/dataset.page?${params}`)
    const json = await res.json()
    if (json.code === 200 && json.data) {
      const total = Number(json.data.total)
      openDatasetTotal.value = Number.isFinite(total) ? total : null
    }
  } catch {
    // 静默失败，保留占位
  }
}

// ----- 热门数据集（与数据速递默认排序一致：sort=updateAt） -----
/** 画廊轮播池：前 N 条，每次展示 6 条 */
const HOT_GALLERY_POOL_SIZE = 36
const HOT_GRID_PAGE_SIZE = 6
/** 焦点轮播使用前 6 条 */
const HOT_SPOTLIGHT_COUNT = 6
const DATASET_LIST_SORT = 'updateAt'

const galleryPool = ref<any[]>([])
const hotLoading = ref(false)

function openDetailInNewTab(item: { cstr?: string; id?: string }) {
  openAssetDetailInNewTab(router, item)
}

function shortShareLabel(shareMode: string): string {
  return formatShareModeLabel(shareMode) || '开放访问'
}

function getLevelClass(level: string): string {
  const mode = level || ''
  if (mode.includes('开放')) return 'bg-green-100 text-green-700'
  if (mode.includes('部分')) return 'bg-amber-100 text-amber-700'
  if (mode.includes('审核')) return 'bg-blue-100 text-blue-700'
  if (mode.includes('受控') || mode.includes('协议')) return 'bg-red-100 text-red-700'
  if (mode.includes('暂不')) return 'bg-slate-100 text-slate-600'
  return 'bg-slate-100 text-slate-700'
}

function formatViewCount(count: number): string {
  if (!count && count !== 0) return '0'
  if (count >= 10000) return (count / 10000).toFixed(1) + 'w'
  if (count >= 1000) return (count / 1000).toFixed(1) + 'k'
  return String(count)
}

function mapHotDataset(item: any) {
  const level = formatShareModeLabel(item.shareMode) || '开放访问'
  const source = item.source || '未知来源'
  return {
    id: item.id,
    cstr: item.cstr || item.id,
    title: item.titleZh || '无标题',
    description: stripHtml(item.introductionZh || '') || '暂无描述',
    level,
    levelShort: shortShareLabel(level),
    subject: parseNameZhLabel(item.subject) || '其他',
    source,
    publisherInitial: source.charAt(0) || '?',
    viewCount: formatViewCount(item.viewCount),
    coverUrl: resolveScidbStaticUrl(item.coverUrl || '')
  }
}

async function fetchHotDatasets() {
  hotLoading.value = true
  try {
    const res = await fetch(
      `/tds-trading/order/dataset.page?page=1&pageSize=${HOT_GALLERY_POOL_SIZE}&sort=${DATASET_LIST_SORT}`
    )
    const json = await res.json()
    if (json.code === 200 && json.data) {
      galleryPool.value = (json.data.rows || []).map(mapHotDataset)
      activeGalleryPage.value = 0
      activeSpotlight.value = 0
    }
  } catch {
    // 静默失败，保持空状态
  } finally {
    hotLoading.value = false
  }
}

function resetHomeScroll() {
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

onBeforeMount(() => {
  resetHomeScroll()
})

onMounted(async () => {
  resetHomeScroll()
  fetchOpenDatasetTotal()
  fetchHotDatasets()
  fetchHeroNews()
  await nextTick()
  resetHomeScroll()
  requestAnimationFrame(() => {
    resetHomeScroll()
  })
  setupRevealObserver()
  startSpotlightCarousel()
  startGalleryCarousel()
  window.addEventListener('scroll', onPageScroll, { passive: true })
  
})

onUnmounted(() => {
  revealObserver?.disconnect()
  stopSpotlightCarousel()
  stopGalleryCarousel()
  stopHeroNewsCarousel()
  window.removeEventListener('scroll', onPageScroll)
})

const hotTags = ['# 粉蝶标本', '# 土地', '# 松散沉积物', '# 雅鲁藏布江', '# 全球植被']
const marqueeTags = computed(() => [...hotTags, ...hotTags, ...hotTags])

const quickLinks = [
  { title: '数据目录', desc: '开放数据集检索与学科筛选', path: '/assets', icon: 'mdi:database-search', iconClass: 'hub-icon--blue', portalClass: 'hub-portal--data' },
  { title: '空间枢纽', desc: '国家科学数据中心枢纽节点', path: '/spatial-hubs', icon: 'mdi:hub-outline', iconClass: 'hub-icon--teal', portalClass: 'hub-portal--service' },
  { title: '头条资讯', desc: '各数据中心动态与资讯', path: '/headlines', icon: 'mdi:newspaper-variant-outline', iconClass: 'hub-icon--amber', portalClass: 'hub-portal--news' }
]

const trustMetrics = [
  { label: 'WCAG AA', desc: '可访问性标准' },
  { label: '全程审计', desc: '数据使用留痕' },
  { label: '分级授权', desc: '合规数据共享' }
]

const statsSectionRef = ref<HTMLElement | null>(null)
const hubSectionRef = ref<HTMLElement | null>(null)
const trustSectionRef = ref<HTMLElement | null>(null)

const statsVisible = ref(false)
const hubVisible = ref(false)
const trustVisible = ref(false)

const scrollProgress = ref(0)
const navScrolled = ref(false)
const heroTiltX = ref(0)
const heroTiltY = ref(0)
const activeSpotlight = ref(0)
const pauseSpotlight = ref(false)
const activeGalleryPage = ref(0)
const pauseGallery = ref(false)

const hotDatasets = computed(() => galleryPool.value.slice(0, HOT_SPOTLIGHT_COUNT))

const galleryPageCount = computed(() =>
  Math.max(1, Math.ceil(galleryPool.value.length / HOT_GRID_PAGE_SIZE))
)

const gridDatasets = computed(() => {
  const start = activeGalleryPage.value * HOT_GRID_PAGE_SIZE
  return galleryPool.value.slice(start, start + HOT_GRID_PAGE_SIZE)
})

const heroParallaxStyle = computed(() => ({
  transform: `translate3d(${heroTiltX.value}px, ${heroTiltY.value}px, 0) scale(1.08)`
}))

const spotlightDataset = computed(() => hotDatasets.value[activeSpotlight.value] ?? null)

function prevSpotlight() {
  if (hotDatasets.value.length < 2) return
  activeSpotlight.value = (activeSpotlight.value - 1 + hotDatasets.value.length) % hotDatasets.value.length
}

function nextSpotlight() {
  if (hotDatasets.value.length < 2) return
  activeSpotlight.value = (activeSpotlight.value + 1) % hotDatasets.value.length
}

let spotlightTimer: ReturnType<typeof setInterval> | null = null

function startSpotlightCarousel() {
  stopSpotlightCarousel()
  spotlightTimer = setInterval(() => {
    if (pauseSpotlight.value || hotDatasets.value.length < 2) return
    activeSpotlight.value = (activeSpotlight.value + 1) % hotDatasets.value.length
  }, 7800)
}

function stopSpotlightCarousel() {
  if (spotlightTimer) {
    clearInterval(spotlightTimer)
    spotlightTimer = null
  }
}

let galleryTimer: ReturnType<typeof setInterval> | null = null

function startGalleryCarousel() {
  stopGalleryCarousel()
  galleryTimer = setInterval(() => {
    if (pauseGallery.value || galleryPageCount.value < 2) return
    activeGalleryPage.value = (activeGalleryPage.value + 1) % galleryPageCount.value
  }, 7800)
}

function stopGalleryCarousel() {
  if (galleryTimer) {
    clearInterval(galleryTimer)
    galleryTimer = null
  }
}

function onPageScroll() {
  const doc = document.documentElement
  const max = doc.scrollHeight - doc.clientHeight
  scrollProgress.value = max > 0 ? window.scrollY / max : 0
  navScrolled.value = window.scrollY > 20
}

function onHeroMouseMove(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width - 0.5
  const y = (e.clientY - rect.top) / rect.height - 0.5
  heroTiltX.value = x * 22
  heroTiltY.value = y * 16
}

function resetHeroParallax() {
  heroTiltX.value = 0
  heroTiltY.value = 0
}

watch(hotDatasets, (list) => {
  if (activeSpotlight.value >= list.length) activeSpotlight.value = 0
  if (list.length > 1) startSpotlightCarousel()
})

watch(galleryPool, (list) => {
  if (activeGalleryPage.value >= galleryPageCount.value) activeGalleryPage.value = 0
  if (list.length > HOT_GRID_PAGE_SIZE) startGalleryCarousel()
})

const HERO_NEWS_PAGE_SIZE = 4
const HERO_NEWS_FETCH_SIZE = 12

type HeroNewsCard = InformationRecord & {
  publishedAt: string
  thumbUrl: string
}

const heroNewsItems = ref<HeroNewsCard[]>([])
const heroNewsLoading = ref(true)
const heroNewsPageIndex = ref(0)
const pauseHeroNews = ref(false)
const heroNewsCoverFailed = ref(new Set<string>())

const heroNewsPageCount = computed(() =>
  Math.max(1, Math.ceil(heroNewsItems.value.length / HERO_NEWS_PAGE_SIZE))
)

const heroNewsPage = computed(() => {
  const start = heroNewsPageIndex.value * HERO_NEWS_PAGE_SIZE
  return heroNewsItems.value.slice(start, start + HERO_NEWS_PAGE_SIZE)
})

function openHeroNews(item: HeroNewsCard) {
  openInformationArticleWindow(router, item.id, item)
}

function onHeroNewsCoverError(id: string) {
  const next = new Set(heroNewsCoverFailed.value)
  next.add(id)
  heroNewsCoverFailed.value = next
}

function prevHeroNews() {
  if (heroNewsPageCount.value < 2) return
  heroNewsPageIndex.value =
    (heroNewsPageIndex.value - 1 + heroNewsPageCount.value) % heroNewsPageCount.value
}

function nextHeroNews() {
  if (heroNewsPageCount.value < 2) return
  heroNewsPageIndex.value = (heroNewsPageIndex.value + 1) % heroNewsPageCount.value
}

let heroNewsTimer: ReturnType<typeof setInterval> | null = null

function startHeroNewsCarousel() {
  stopHeroNewsCarousel()
  heroNewsTimer = setInterval(() => {
    if (pauseHeroNews.value || heroNewsPageCount.value < 2) return
    heroNewsPageIndex.value = (heroNewsPageIndex.value + 1) % heroNewsPageCount.value
  }, 6500)
}

function stopHeroNewsCarousel() {
  if (heroNewsTimer) {
    clearInterval(heroNewsTimer)
    heroNewsTimer = null
  }
}

async function fetchHeroNews() {
  heroNewsLoading.value = true
  try {
    const { rows } = await fetchInformationPage({ page: 1, pageSize: HERO_NEWS_FETCH_SIZE })
    heroNewsItems.value = rows.map((row) => ({
      ...row,
      publishedAt: formatInformationDate(row.updateAt),
      thumbUrl: getInformationThumbUrl(row)
    }))
    heroNewsPageIndex.value = 0
    if (heroNewsPageCount.value > 1) startHeroNewsCarousel()
  } catch {
    heroNewsItems.value = []
  } finally {
    heroNewsLoading.value = false
  }
}

watch(heroNewsItems, (list) => {
  const pages = Math.max(1, Math.ceil(list.length / HERO_NEWS_PAGE_SIZE))
  if (heroNewsPageIndex.value >= pages) heroNewsPageIndex.value = 0
  if (list.length > HERO_NEWS_PAGE_SIZE) startHeroNewsCarousel()
})

const animatedStatValues = ref(['—', '0', '0', '0'])
let revealObserver: IntersectionObserver | null = null
let statsAnimated = false

function parseStatTarget(value: string): number | null {
  const normalized = value.replace(/,/g, '')
  if (!/^\d+$/.test(normalized)) return null
  return Number(normalized)
}

function runCountUp(index: number, target: number, duration = 1200) {
  const start = performance.now()
  const tick = (now: number) => {
    const progress = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    animatedStatValues.value[index] = Math.round(target * eased).toLocaleString('en-US')
    if (progress < 1) {
      window.requestAnimationFrame(tick)
    }
  }
  window.requestAnimationFrame(tick)
}

function animateStats() {
  if (statsAnimated) return
  statsAnimated = true
  platformStats.value.forEach((stat, index) => {
    const target = parseStatTarget(stat.value)
    if (target === null) {
      animatedStatValues.value[index] = stat.value
      return
    }
    runCountUp(index, target)
  })
}

function setupRevealObserver() {
  if (typeof IntersectionObserver === 'undefined') {
    statsVisible.value = true
    hubVisible.value = true
    trustVisible.value = true
    animateStats()
    return
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const el = entry.target as HTMLElement
        if (el === statsSectionRef.value) {
          statsVisible.value = true
          animateStats()
        }
        if (el === hubSectionRef.value) hubVisible.value = true
        if (el === trustSectionRef.value) trustVisible.value = true
        revealObserver?.unobserve(el)
      })
    },
    { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
  )

  ;[statsSectionRef, hubSectionRef, trustSectionRef].forEach((sectionRef) => {
    if (sectionRef.value) revealObserver?.observe(sectionRef.value)
  })
}

watch(openDatasetTotal, () => {
  if (statsAnimated) {
    const target = parseStatTarget(formatStatNumber(openDatasetTotal.value))
    if (target !== null) runCountUp(0, target)
    else animatedStatValues.value[0] = formatStatNumber(openDatasetTotal.value)
  }
})

const platformStats = computed(() => [
  { label: '开放数据集', value: formatStatNumber(openDatasetTotal.value), icon: 'mdi:database', tone: 'blue' },
  { label: '合作用户数', value: '8,920', icon: 'mdi:account-group', tone: 'emerald' },
  { label: '本月授权次数', value: '1,542', icon: 'mdi:key-variant', tone: 'navy' },
  { label: '数据使用次数', value: '32,800', icon: 'mdi:link-variant', tone: 'amber' }
])

const trustPillars = [
  {
    title: '安全可信',
    description: '数据分级管理，沙箱分析环境，数据水印与全程审计，保障科研合规与知识产权。',
    icon: 'mdi:shield-check',
    iconClass: 'trust-icon--blue'
  },
  {
    title: '灵活协作',
    description: '支持线下协商与线上留痕，多种授权模式覆盖不同科研合作场景。',
    icon: 'mdi:handshake-outline',
    iconClass: 'trust-icon--emerald'
  },
  {
    title: '科研赋能',
    description: '数据质量评估、科研影响追踪与成果产出记录，让数据价值最大化。',
    icon: 'mdi:chart-timeline-variant',
    iconClass: 'trust-icon--amber'
  }
]

</script>

<style scoped>
.index-page {
  font-family: var(--fs-font-sans);
  background: var(--fs-bg);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  padding-bottom: calc(3.75rem + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 768px) {
  .index-page {
    padding-bottom: 0;
  }
}

.index-page__footer {
  margin-top: auto;
  width: 100%;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}

.scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 60;
  background: linear-gradient(90deg, #1e40af, #2563eb, #0891b2);
  transform-origin: left center;
  transform: scaleX(0);
}

.home-mesh {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 70% 55% at 50% 0%, rgba(30, 64, 175, 0.14), transparent 60%),
    radial-gradient(ellipse 50% 40% at 100% 30%, rgba(8, 145, 178, 0.08), transparent 55%),
    linear-gradient(180deg, #f8fafc 0%, var(--fs-bg) 50%, #e8edf4 100%);
  animation: meshDrift 20s ease-in-out infinite alternate;
}

@keyframes meshDrift {
  0% { filter: brightness(1); }
  100% { filter: brightness(1.04); }
}

.home-particles {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.home-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(37, 99, 235, 0.35);
  left: calc(var(--i) * 8.3%);
  top: calc((var(--i) * 13%) % 90% + 5%);
  animation: particleFloat calc(8s + var(--i) * 0.7s) ease-in-out infinite;
  animation-delay: calc(var(--i) * -0.6s);
}

@keyframes particleFloat {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.35; }
  50% { transform: translateY(-28px) scale(1.3); opacity: 0.75; }
}

.glass-nav {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid transparent;
  transition: background 0.25s var(--fs-ease), box-shadow 0.25s var(--fs-ease), border-color 0.25s var(--fs-ease);
}

.glass-nav--scrolled {
  background: rgba(255, 255, 255, 0.94);
  border-bottom-color: var(--fs-border-subtle);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.tech-card {
  transition: border-color var(--fs-duration) var(--fs-ease), box-shadow var(--fs-duration) var(--fs-ease), transform var(--fs-duration) var(--fs-ease);
  border: 1px solid var(--fs-card-border);
  background: var(--fs-card-bg);
  box-shadow: var(--fs-card-shadow);
}

.tech-card:hover {
  border-color: #93c5fd;
  box-shadow: var(--fs-card-shadow-md);
  transform: translateY(-4px);
}

.btn-gradient {
  background: linear-gradient(135deg, var(--fs-primary) 0%, #2563eb 100%);
  transition: opacity var(--fs-duration) var(--fs-ease), box-shadow var(--fs-duration) var(--fs-ease);
}

.btn-gradient:hover { opacity: 0.92; box-shadow: var(--fs-shadow-md); }

.bg-blob {
  position: fixed;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(30, 64, 175, 0.07) 0%, transparent 70%);
  border-radius: 50%;
  z-index: 0;
  filter: blur(55px);
  pointer-events: none;
}

.blob-1 { top: -80px; right: -40px; animation: blobMove 26s infinite alternate; }
.blob-2 { bottom: -80px; left: -40px; animation: blobMove 32s infinite alternate-reverse; }

@keyframes blobMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(35px, 55px); }
}

.anim-rise {
  opacity: 0;
  animation: riseIn 0.75s var(--fs-ease) forwards;
  animation-delay: var(--d, 0s);
}

@keyframes riseIn {
  from { opacity: 0; transform: translateY(22px); }
  to { opacity: 1; transform: translateY(0); }
}

.block-head.is-in,
.block-foot.is-in,
.stats-dock__item.is-in,
.hub-section.is-in .hub-rise,
.hub-section.is-in .hub-gallery__card,
.trust-flow.is-in .trust-step,
.trust-badges.is-in li {
  animation: revealIn 0.65s var(--fs-ease) forwards;
  animation-delay: var(--d, 0s);
}

.block-head,
.block-foot,
.stats-dock__item,
.hub-rise,
.hub-section .hub-gallery__card,
.trust-flow .trust-step,
.trust-badges li {
  opacity: 0;
  transform: translateY(18px);
}

.hub-section.is-in .hub-section__shell {
  animation: hubShellIn 0.75s var(--fs-ease) forwards;
}

.hub-section__shell {
  opacity: 0;
  transform: translateY(28px) scale(0.985);
}

@keyframes hubShellIn {
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes revealIn {
  to { opacity: 1; transform: translateY(0); }
}

/* Hero：铺满首屏，标题 / 搜索 / 统计卡片作为一组垂直居中 */
.hero-cine {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem 0 2rem;
  margin-bottom: 2.5rem;
  overflow: hidden;
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .hero-cine {
    padding: 5.5rem 0 3rem;
  }
}

.hero-cine__shell {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.35rem;
  width: 100%;
}

@media (min-width: 1024px) {
  .hero-cine__shell { gap: 1.5rem; }
}

.hero-cine__bg {
  position: absolute;
  inset: -8% -5%;
  opacity: 0.55;
  transition: transform 0.35s var(--fs-ease);
  will-change: transform;
}

.hero-cine__scanline {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(30, 64, 175, 0.015) 3px, rgba(30, 64, 175, 0.015) 4px);
  pointer-events: none;
  animation: scanMove 14s linear infinite;
}

@keyframes scanMove {
  from { background-position: 0 0; }
  to { background-position: 0 120px; }
}

.hero-cine__content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 56rem;
  margin: 0 auto;
}

.hero-cine__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 1rem;
  margin-bottom: 1.25rem;
  border-radius: 999px;
  border: 1px solid #bfdbfe;
  background: rgba(255, 255, 255, 0.82);
  color: var(--fs-primary);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.hero-cine__badge-pulse {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5);
  animation: dotPing 2.2s ease-out infinite;
}

@keyframes dotPing {
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.45); }
  70% { box-shadow: 0 0 0 9px rgba(34, 197, 94, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

.hero-cine__title {
  font-size: clamp(2.15rem, 4.8vw, 3.35rem);
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -0.03em;
  color: var(--fs-text);
  margin-bottom: 0.85rem;
}

.hero-cine__shimmer {
  display: block;
  margin-top: 0.25rem;
  background: linear-gradient(110deg, #1e40af 0%, #2563eb 35%, #0891b2 55%, #2563eb 75%, #1e40af 100%);
  background-size: 220% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: textShimmer 5s linear infinite;
}

@keyframes textShimmer {
  0% { background-position: 0% center; }
  100% { background-position: 220% center; }
}

.hero-cine__lead {
  font-size: 1.0625rem;
  line-height: 1.7;
  color: var(--fs-text-muted);
  max-width: 44rem;
  margin: 0 auto 1.25rem;
}

.hero-cine__search {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  max-width: 44rem;
  margin: 0 auto;
  padding: 0.45rem 0.45rem 0.45rem 1rem;
  border-radius: 1rem;
  border: 1px solid var(--fs-border-subtle);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12px 40px rgba(30, 64, 175, 0.12);
}

.hero-cine__search:focus-within {
  border-color: #60a5fa;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12), 0 12px 40px rgba(30, 64, 175, 0.12);
}

.hero-cine__search-icon { color: #94a3b8; font-size: 1.25rem; flex-shrink: 0; }

.hero-cine__search-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font-size: 0.9375rem;
  color: var(--fs-text);
  outline: none;
}

.hero-cine__search-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.72rem 1.1rem;
  border: none;
  border-radius: 0.75rem;
  background: var(--fs-primary);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.hero-cine__search-btn:hover { background: var(--fs-primary-hover); transform: translateX(2px); }

.tag-marquee {
  margin-top: 1rem;
  width: min(100%, 30rem);
  margin-inline: auto;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 12%, #000 100%);
  mask-image: linear-gradient(90deg, transparent 0%, #000 12%, #000 100%);
}

.tag-marquee__track {
  display: flex;
  gap: 0.55rem;
  width: max-content;
  padding-right: 0.55rem;
  animation: tagMarqueeSlide 36s linear infinite;
  will-change: transform;
}

.tag-marquee:hover .tag-marquee__track { animation-play-state: paused; }

@keyframes tagMarqueeSlide {
  from { transform: translateX(0); }
  to { transform: translateX(-33.333333%); }
}

.tag-marquee__item {
  flex-shrink: 0;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  border: 1px solid var(--fs-border-subtle);
  background: rgba(255, 255, 255, 0.88);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--fs-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.tag-marquee__item:hover { border-color: #93c5fd; color: var(--fs-primary); background: #eff6ff; }

/* 首屏头条资讯 */
.hero-news {
  position: relative;
  z-index: 2;
  width: 100%;
}

.hero-news__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.7rem;
}

.hero-news__title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 800;
  color: var(--fs-text);
  letter-spacing: 0.02em;
}

.hero-news__actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.hero-news__nav,
.hero-news__more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--fs-border-subtle);
  background: rgba(255, 255, 255, 0.9);
  color: #475569;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.hero-news__nav {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 999px;
  font-size: 1.05rem;
}

.hero-news__more {
  gap: 0.2rem;
  height: 1.75rem;
  padding: 0 0.7rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.hero-news__nav:hover,
.hero-news__more:hover {
  color: var(--fs-primary);
  border-color: #93c5fd;
  background: #eff6ff;
}

.hero-news__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
}

.hero-news__card {
  display: flex;
  flex-direction: column;
  text-align: left;
  padding: 0;
  overflow: hidden;
  border: none;
  background: rgba(255, 255, 255, 0.92);
  cursor: pointer;
}

.hero-news__cover {
  position: relative;
  height: 7.25rem;
  background: #f1f5f9;
  overflow: hidden;
}

.hero-news__cover img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
}

.hero-news__cover-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 1.75rem;
  background: linear-gradient(135deg, #eff6ff, #e0f2fe);
}

.hero-news__body {
  padding: 0.7rem 0.8rem 0.8rem;
}

.hero-news__body h3 {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 700;
  line-height: 1.4;
  color: var(--fs-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.25em;
}

.hero-news__body p {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin: 0.45rem 0 0;
  font-size: 0.6875rem;
  color: #64748b;
}

.hero-news__body span,
.hero-news__body time {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-news__card--skeleton .hero-news__cover {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: heroNewsShimmer 1.4s linear infinite;
}

.hero-news__card--skeleton .hero-news__body span {
  display: block;
  height: 0.7rem;
  border-radius: 999px;
  background: #e2e8f0;
}

.hero-news__card--skeleton .hero-news__body span + span {
  width: 55%;
  margin-top: 0.45rem;
  height: 0.55rem;
}

.hero-news__dots {
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 0.7rem;
}

.hero-news__dot {
  width: 0.4rem;
  height: 0.4rem;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: #cbd5e1;
  cursor: pointer;
}

.hero-news__dot--active {
  width: 1.1rem;
  background: var(--fs-primary);
}

.hero-news-fade-enter-active,
.hero-news-fade-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.hero-news-fade-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.hero-news-fade-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

@keyframes heroNewsShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 1023px) {
  .hero-news__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 639px) {
  .hero-news__grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.65rem;
  }

  .hero-news__cover {
    height: 5.5rem;
  }
}

/* Stats dock */
.stats-dock {
  position: relative;
  z-index: 2;
  width: 100%;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

@media (min-width: 768px) {
  .stats-dock {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
  }
}

.stats-dock__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 1.15rem;
  border-radius: 1rem;
  overflow: hidden;
}

@media (min-width: 1024px) {
  .stats-dock__item { padding: 1.15rem 1.35rem; }
}

.stats-dock__ring {
  position: absolute;
  inset: -50%;
  background: conic-gradient(from 0deg, transparent, rgba(37, 99, 235, 0.08), transparent);
  animation: ringSpin 6s linear infinite;
}

@keyframes ringSpin {
  to { transform: rotate(360deg); }
}

.stats-dock__icon {
  position: relative;
  flex-shrink: 0;
  font-size: 1.5rem;
}

.stats-dock__meta {
  position: relative;
  min-width: 0;
}

.stats-dock__item--blue .stats-dock__icon { color: #1d4ed8; }
.stats-dock__item--emerald .stats-dock__icon { color: #059669; }
.stats-dock__item--navy .stats-dock__icon { color: #3730a3; }
.stats-dock__item--amber .stats-dock__icon { color: #b45309; }

.stats-dock__value {
  position: relative;
  font-size: clamp(1.25rem, 2vw, 1.625rem);
  font-weight: 800;
  color: var(--fs-text);
  line-height: 1.15;
}

.stats-dock__label {
  position: relative;
  margin-top: 0.2rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 767px) {
  .stats-dock__item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .stats-dock__label {
    white-space: normal;
  }
}

/* Blocks */
.home-page-width {
  width: 100%;
  max-width: 90rem;
  margin-inline: auto;
  padding-inline: clamp(1rem, 2.5vw, 1.5rem);
}

.home-block {
  position: relative;
  z-index: 1;
  margin-bottom: 3.5rem;
}

.block-head { margin-bottom: 1.35rem; }
.block-head--center { text-align: center; }

.block-head__eyebrow {
  font-size: 0.6875rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  color: var(--fs-accent);
  margin-bottom: 0.3rem;
}

.block-head__title {
  font-size: 1.625rem;
  font-weight: 800;
  color: var(--fs-text);
  letter-spacing: -0.02em;
  margin-bottom: 0.3rem;
}

.block-head__desc { font-size: 0.875rem; color: var(--fs-text-muted); }

.block-foot { margin-top: 1rem; text-align: right; }

.block-foot__link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: none;
  background: none;
  color: var(--fs-primary);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, color 0.2s;
}

.block-foot__link:hover { color: var(--fs-primary-hover); transform: translateX(3px); }

/* Hub section */
.hub-section {
  position: relative;
  z-index: 1;
  width: 100%;
}

.hub-section__shell {
  width: 100%;
  padding: 1.35rem;
  border-radius: 1.25rem;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  overflow: hidden;
}

@media (min-width: 768px) {
  .hub-section__shell { padding: 1.75rem; }
}

.hub-section__head {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.35rem;
  padding-bottom: 1.15rem;
  border-bottom: 1px solid #e2e8f0;
}

@media (min-width: 768px) {
  .hub-section__head {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
}

.hub-section__eyebrow {
  font-size: 0.6875rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  color: var(--fs-accent);
  margin-bottom: 0.3rem;
}

.hub-section__title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--fs-text);
  letter-spacing: -0.02em;
  margin-bottom: 0.25rem;
}

@media (min-width: 768px) {
  .hub-section__title { font-size: 1.75rem; }
}

.hub-section__desc {
  font-size: 0.875rem;
  color: var(--fs-text-muted);
}

.hub-section__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
  padding: 0.65rem 1rem;
  border: none;
  border-radius: 0.75rem;
  background: var(--fs-primary);
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
}

.hub-section__cta:hover {
  background: var(--fs-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(30, 64, 175, 0.2);
}

.hub-portals {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  margin-bottom: 1.15rem;
}

@media (min-width: 768px) {
  .hub-portals { grid-template-columns: repeat(3, 1fr); }
}

.hub-portal {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 1.1rem;
  border-radius: 1rem;
  text-align: left;
  cursor: pointer;
  width: 100%;
  overflow: hidden;
  min-height: 6.5rem;
}

.hub-portal--data { background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%); border-color: #bfdbfe; }
.hub-portal--service { background: linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%); border-color: #99f6e4; }
.hub-portal--news { background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%); border-color: #fde68a; }

.hub-portal__watermark {
  position: absolute;
  right: -0.25rem;
  bottom: -0.5rem;
  font-size: 4.5rem;
  opacity: 0.06;
  pointer-events: none;
  transition: transform 0.4s var(--fs-ease), opacity 0.4s;
}

.hub-portal:hover .hub-portal__watermark {
  transform: scale(1.08) rotate(-6deg);
  opacity: 0.1;
}

.hub-portal__icon {
  position: relative;
  z-index: 1;
  width: 2.65rem;
  height: 2.65rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.hub-icon--blue { background: #dbeafe; color: #1d4ed8; }
.hub-icon--teal { background: #ccfbf1; color: #0f766e; }
.hub-icon--amber { background: #fef3c7; color: #b45309; }

.hub-portal__body {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
}

.hub-portal__body h3 {
  font-size: 0.975rem;
  font-weight: 800;
  color: var(--fs-text);
  margin-bottom: 0.2rem;
}

.hub-portal__body p {
  font-size: 0.75rem;
  color: var(--fs-text-muted);
  line-height: 1.5;
}

.hub-portal__arrow {
  position: relative;
  z-index: 1;
  margin-left: auto;
  color: #94a3b8;
  font-size: 1.2rem;
  transition: color 0.2s, transform 0.2s;
}

.hub-portal:hover .hub-portal__arrow {
  color: var(--fs-primary);
  transform: translate(3px, -3px);
}

.hub-spotlight {
  width: 100%;
  margin-bottom: 1.15rem;
  padding: 1rem;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.hub-spotlight__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.hub-spotlight__label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.875rem;
  font-weight: 800;
  color: var(--fs-text);
}

.hub-spotlight__controls {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.hub-spotlight__btn {
  width: 2rem;
  height: 2rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: #fff;
  color: var(--fs-text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}

.hub-spotlight__btn:hover {
  border-color: #93c5fd;
  color: var(--fs-primary);
  background: #eff6ff;
}

.hub-spotlight__counter {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--fs-text-muted);
  min-width: 3rem;
  text-align: center;
}

.spotlight-card {
  display: grid;
  grid-template-columns: 1fr;
  width: 100%;
  min-width: 0;
  border-radius: 0.85rem;
  overflow: hidden;
  border: 1px solid #f1f5f9;
}

@media (min-width: 768px) {
  .spotlight-card { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); }
}

.spotlight-card__media {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #f1f5f9;
  overflow: hidden;
  align-self: start;
}

.spotlight-card__media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.55s var(--fs-ease);
}

.group:hover .spotlight-card__media img { transform: scale(1.06); }

.spotlight-card__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.75rem;
  color: #cbd5e1;
}

.spotlight-card__body {
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  background: #fafbfc;
}

.spotlight-card__body h4 {
  font-size: 1.05rem;
  font-weight: 800;
  margin: 0.45rem 0;
  color: var(--fs-text);
  transition: color 0.2s;
}

.group:hover .spotlight-card__body h4 { color: var(--fs-primary); }

.spotlight-card__body p {
  flex: 1;
  font-size: 0.8125rem;
  color: var(--fs-text-muted);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.spotlight-dots {
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.75rem 0 0.15rem;
}

.spotlight-dots__dot {
  width: 1.5rem;
  height: 0.28rem;
  border-radius: 999px;
  border: none;
  background: #e2e8f0;
  cursor: pointer;
  transition: width 0.25s, background 0.25s;
}

.spotlight-dots__dot--active {
  width: 2.25rem;
  background: var(--fs-primary);
}

.spot-fade-enter-active,
.spot-fade-leave-active { transition: opacity 0.35s ease, transform 0.35s ease; }
.spot-fade-enter-from { opacity: 0; transform: translateX(16px); }
.spot-fade-leave-to { opacity: 0; transform: translateX(-16px); }

.hub-gallery {
  width: 100%;
}

.hub-gallery__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.hub-gallery__title {
  font-size: 0.9375rem;
  font-weight: 800;
  color: var(--fs-text);
}

.hub-gallery__link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border: none;
  background: none;
  color: var(--fs-primary);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.hub-gallery__link:hover { transform: translateX(3px); }

.hub-gallery__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  width: 100%;
}

@media (min-width: 640px) {
  .hub-gallery__grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .hub-gallery__grid { grid-template-columns: repeat(3, 1fr); }
}

.hub-gallery__card {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.85rem;
  overflow: hidden;
  width: 100%;
  min-width: 0;
}

.hub-gallery__thumb {
  flex-shrink: 0;
  width: 5.5rem;
  height: 5.5rem;
  border-radius: 0.65rem;
  background: #f1f5f9;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
  font-size: 1.5rem;
}

.hub-gallery__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s var(--fs-ease);
}

.group:hover .hub-gallery__thumb img { transform: scale(1.08); }

.hub-gallery__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.hub-gallery__info h4 {
  font-size: 0.875rem;
  font-weight: 700;
  margin: 0.3rem 0;
  color: var(--fs-text);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s;
}

.group:hover .hub-gallery__info h4 { color: var(--fs-primary); }

.hub-gallery__info p {
  flex: 1;
  font-size: 0.75rem;
  color: var(--fs-text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hub-gallery__info .ds-foot {
  margin-top: 0.45rem;
  padding-top: 0.45rem;
  font-size: 0.6875rem;
}

.hub-gallery__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #94a3b8;
  font-size: 0.875rem;
}

.hub-gallery__empty iconify-icon { font-size: 2rem; }

.hub-gallery__dots {
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 0.85rem;
}

.hub-gallery__dot {
  width: 1.5rem;
  height: 0.25rem;
  border: none;
  border-radius: 999px;
  background: #cbd5e1;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s, width 0.2s;
}

.hub-gallery__dot--active {
  width: 2rem;
  background: var(--fs-primary, #2563eb);
}

.ds-meta { display: flex; flex-wrap: wrap; gap: 0.35rem; align-items: center; }
.ds-tag { padding: 0.15rem 0.45rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: 700; }
.ds-subject { font-size: 0.625rem; padding: 0.15rem 0.45rem; background: #f1f5f9; border-radius: 0.25rem; color: var(--fs-text-muted); }
.ds-foot {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.65rem;
  padding-top: 0.65rem;
  border-top: 1px solid #f1f5f9;
  font-size: 0.75rem;
  color: var(--fs-text-muted);
}
.ds-foot span { display: inline-flex; align-items: center; gap: 0.2rem; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.spotlight-skeleton {
  display: grid;
  grid-template-columns: 1fr;
  width: 100%;
  min-width: 0;
  border-radius: 0.85rem;
  overflow: hidden;
  border: 1px solid #f1f5f9;
}

@media (min-width: 768px) {
  .spotlight-skeleton { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); }
}

.spotlight-skeleton__media {
  width: 100%;
  min-width: 0;
  aspect-ratio: 16 / 9;
  background: #e2e8f0;
  animation: shimmer 1.4s ease-in-out infinite;
  align-self: start;
}

.spotlight-skeleton__body {
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  justify-content: flex-start;
  background: #fafbfc;
  min-width: 0;
  align-self: stretch;
}

.spotlight-skeleton__tags {
  display: flex;
  gap: 0.35rem;
  margin-bottom: 0.1rem;
}

.spotlight-skeleton__tags span {
  width: 3.25rem;
  height: 1.15rem;
  border-radius: 0.35rem;
  background: #e2e8f0;
  animation: shimmer 1.4s ease-in-out infinite;
}

.spotlight-skeleton__line {
  display: block;
  height: 0.7rem;
  border-radius: 0.25rem;
  background: #e2e8f0;
  animation: shimmer 1.4s ease-in-out infinite;
}

.spotlight-skeleton__line--title { width: 88%; height: 0.85rem; }
.spotlight-skeleton__line--short { width: 64%; }

.spotlight-skeleton__line:nth-of-type(2) { width: 95%; }
.spotlight-skeleton__line:nth-of-type(3) { width: 82%; }

.spotlight-skeleton__foot {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.65rem;
  border-top: 1px solid #f1f5f9;
}

.spotlight-skeleton__foot span {
  height: 0.55rem;
  border-radius: 0.25rem;
  background: #e2e8f0;
  animation: shimmer 1.4s ease-in-out infinite;
}

.spotlight-skeleton__foot span:first-child { width: 42%; }
.spotlight-skeleton__foot span:last-child { width: 18%; }

.hub-gallery__card--skeleton {
  pointer-events: none;
  cursor: default;
}

.hub-gallery__skeleton-thumb {
  flex-shrink: 0;
  width: 5.5rem;
  height: 5.5rem;
  border-radius: 0.65rem;
  background: #e2e8f0;
  animation: shimmer 1.4s ease-in-out infinite;
}

.hub-gallery__skeleton-lines {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding-top: 0.15rem;
}

.hub-gallery__skeleton-lines span {
  height: 0.55rem;
  background: #e2e8f0;
  border-radius: 0.25rem;
  animation: shimmer 1.4s ease-in-out infinite;
}

.hub-gallery__skeleton-lines span:nth-child(1) { width: 38%; }
.hub-gallery__skeleton-lines span:nth-child(2) { width: 95%; }
.hub-gallery__skeleton-lines span:nth-child(3) { width: 72%; }

@keyframes shimmer { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }

/* Trust timeline */
.trust-flow {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .trust-flow { grid-template-columns: repeat(3, 1fr); gap: 1rem; }
}

.trust-flow__line { display: none; }

@media (min-width: 768px) {
  .trust-flow__line {
    display: block;
    position: absolute;
    top: 1.65rem;
    left: 12%;
    right: 12%;
    height: 2px;
    background: #e2e8f0;
    z-index: 0;
  }
  .trust-flow__line-fill {
    display: block;
    height: 100%;
    width: 0;
    background: linear-gradient(90deg, #1e40af, #0891b2);
    animation: lineGrow 1.2s var(--fs-ease) forwards;
    animation-delay: 0.3s;
  }
}

@keyframes lineGrow { to { width: 100%; } }

.trust-step {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 0 0.5rem;
}

.trust-step__node { display: flex; justify-content: center; margin-bottom: 0.75rem; }

.trust-step__icon {
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  border: 3px solid #fff;
  box-shadow: var(--fs-card-shadow);
  transition: transform 0.3s;
}

.trust-step:hover .trust-step__icon { transform: scale(1.08) rotate(-3deg); }

.trust-icon--blue { background: #dbeafe; color: #1d4ed8; }
.trust-icon--emerald { background: #d1fae5; color: #059669; }
.trust-icon--amber { background: #fef3c7; color: #b45309; }

.trust-step h3 { font-size: 0.9375rem; font-weight: 700; margin-bottom: 0.35rem; color: var(--fs-text); }
.trust-step p { font-size: 0.8125rem; line-height: 1.6; color: var(--fs-text-muted); }

.trust-badges {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
}

.trust-badges li {
  padding: 0.7rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--fs-border-subtle);
  background: rgba(255, 255, 255, 0.85);
  text-align: center;
  min-width: 7rem;
}

.trust-badges strong { display: block; font-size: 0.875rem; color: var(--fs-primary); }
.trust-badges span { font-size: 0.75rem; color: var(--fs-text-muted); }

@media (prefers-reduced-motion: reduce) {
  .home-mesh, .blob-1, .blob-2, .home-particle, .hero-cine__scanline,
  .hero-cine__shimmer, .tag-marquee__track, .stats-dock__ring, .trust-flow__line-fill,
  .anim-rise, .hero-news__card--skeleton .hero-news__cover {
    animation: none !important;
  }
  .hero-cine__bg { transition: none; }
  .block-head, .block-foot, .stats-dock__item, .hub-rise, .hub-section .hub-gallery__card,
  .hub-section__shell,
  .trust-flow .trust-step, .trust-badges li {
    opacity: 1 !important;
    transform: none !important;
    animation: none !important;
  }
  .tech-card:hover, .trust-step:hover .trust-step__icon { transform: none; }
}

/* 消息通知弹窗样式 */
.notice-modal-overlay {
  display: flex;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 100;
  align-items: center;
  justify-content: center;
}

.notice-modal {
  animation: modalSlideIn 0.3s ease-out;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.notice-modal .line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
