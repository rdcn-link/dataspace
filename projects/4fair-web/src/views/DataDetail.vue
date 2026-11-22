<template>
  <div class="data-detail-page min-h-screen" style="background: #f8fafc;">
    <!-- 顶部导航 -->
    <nav class="glass-nav fixed top-0 w-full z-50">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center space-x-2 group cursor-pointer" @click="router.push('/home')">
          <BrandLogo size="lg" interactive />
          <span class="text-xl font-bold tracking-tight text-slate-900">费尔空间</span>
        </div>
        <div class="hidden md:flex items-center space-x-8 text-base font-bold text-slate-600">
          <a class="hover:text-blue-600 transition-colors cursor-pointer" @click="router.push('/headlines')">头条资讯</a>
          <a class="text-blue-600 border-b-2 border-blue-600 pb-0.5 cursor-pointer" @click="router.push('/assets')">数据目录</a>
          <a class="hover:text-blue-600 transition-colors cursor-pointer" @click="router.push('/spatial-hubs')">空间枢纽</a>
        </div>
        <div class="flex items-center space-x-4">
          <a class="flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors cursor-pointer" @click="router.push('/publish/asset')">
            <iconify-icon class="text-xl" icon="mdi:plus-circle"></iconify-icon>
            <span class="hidden sm:inline">发布数据</span>
          </a>
          <UserCenterNavButton prefer-login-modal @need-login="showLoginModal = true" />
          <!-- 消息通知按钮 -->
          <button 
            @click="showNoticeModal = true" 
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
          <template v-if="!authStore.isLoggedIn">
            <button @click="showLoginModal = true" class="btn-gradient text-white font-bold py-2 px-5 rounded-xl transition-all text-sm">登录</button>
          </template>
          <template v-else>
            <div class="flex items-center gap-2">
              <span class="text-sm text-slate-600">欢迎您，{{ authStore.displayName }}</span>
              <button @click="handleLogout" class="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1">退出</button>
            </div>
          </template>
        </div>
      </div>
    </nav>

    <!-- 加载态 -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen" style="padding-top: 64px;">
      <div class="text-center">
        <iconify-icon class="text-6xl text-blue-500 animate-spin mb-4" icon="mdi:loading"></iconify-icon>
        <p class="text-slate-500">正在加载数据集详情...</p>
      </div>
    </div>

    <!-- 错误态 -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen" style="padding-top: 64px;">
      <div class="text-center">
        <iconify-icon class="text-6xl text-red-300 mb-4" icon="mdi:alert-circle-outline"></iconify-icon>
        <p class="text-slate-500 mb-4">{{ error }}</p>
        <button @click="fetchDetail" class="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">重新加载</button>
      </div>
    </div>

    <!-- 主体内容 -->
    <template v-else>
      <main class="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8" style="padding-top: 88px;">
        <!-- ===== 左侧主体（8列） ===== -->
        <div class="lg:col-span-8 space-y-8">
          <!-- 标题区 -->
          <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex gap-2 mb-4 flex-wrap">
              <span class="px-2 py-0.5 text-[10px] font-bold rounded" :class="getLevelClass(dataset.level)">{{ dataset.level }}</span>
              <span class="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">{{ dataset.subject }}</span>
              <span v-if="dataset.doi" class="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">DOI: {{ dataset.doi }}</span>
              <span v-if="dataset.cstr" class="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">CSTR: {{ dataset.cstr }}</span>
            </div>
            <div class="flex gap-4 items-start justify-between mb-4">
              <h1 class="text-3xl font-bold text-slate-900 flex items-center gap-3 min-w-0 flex-1">
                <span class="min-w-0">{{ dataset.title }}</span>
                <button
                  @click="toggleFavorite"
                  class="flex-shrink-0 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  :title="isFavorited ? '取消收藏' : '收藏'"
                >
                  <iconify-icon
                    :icon="isFavorited ? 'mdi:heart' : 'mdi:heart-outline'"
                    class="text-2xl"
                    :class="isFavorited ? 'text-red-500' : 'text-slate-400 hover:text-red-500'"
                  ></iconify-icon>
                </button>
              </h1>
              <div
                class="apply-qr-box flex-shrink-0 flex flex-col items-center"
              >
                <div class="apply-qr-box__frame qr-container">
                  <img
                    v-if="applyQrDataUrl"
                    :src="applyQrDataUrl"
                    alt="微信扫码申请"
                    class="apply-qr-box__img"
                  />
                  <div v-else-if="applyQrLoading" class="apply-qr-box__placeholder">
                    <iconify-icon class="text-2xl text-blue-500 animate-spin" icon="mdi:loading"></iconify-icon>
                  </div>
                  <div v-else class="apply-qr-box__placeholder apply-qr-box__placeholder--muted">
                    <iconify-icon class="text-3xl text-slate-300" icon="mdi:qrcode"></iconify-icon>
                  </div>
                </div>
                <p class="apply-qr-box__label">微信扫码申请</p>
                <p v-if="!applyQrUrl" class="apply-qr-box__hint">登录后生成</p>
              </div>
            </div>
            <div
              v-if="hasHtmlTags(dataset.fullDescription)"
              class="text-slate-600 leading-relaxed mb-6 rich-text-content"
              v-html="dataset.fullDescription"
            ></div>
            <p v-else class="text-slate-600 leading-relaxed mb-6">{{ dataset.fullDescription }}</p>
            <div class="grid grid-cols-4 gap-4 py-4 border-t border-slate-100">
              <div>
                <p class="text-xs text-slate-400 mb-1">文件大小</p>
                <p class="text-sm font-bold text-slate-800">{{ dataset.fileSize }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 mb-1">文件数量</p>
                <p class="text-sm font-bold text-slate-800">{{ dataset.fileNumber }} 个</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 mb-1">数据格式</p>
                <p class="text-sm font-bold text-slate-800">{{ dataset.format }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 mb-1">发布版本</p>
                <p class="text-sm font-bold text-slate-800">{{ dataset.version }}</p>
              </div>
            </div>
            <div v-if="dataset.keywords" class="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
              <span class="text-xs text-slate-400 font-medium">关键词：</span>
              <span v-for="(kw, idx) in dataset.keywords" :key="idx" class="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">{{ kw }}</span>
            </div>
          </div>

          <!-- 详情选项卡 -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="flex border-b border-slate-100 px-8 overflow-x-auto">
              <button
                v-for="tab in tabs"
                :key="tab.key"
                class="px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors cursor-pointer"
                :class="activeTab === tab.key ? 'border-b-2 border-blue-600 text-blue-600' : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800'"
                @click="activeTab = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>

            <div class="p-8">
              <!-- 样本数据预览 -->
              <div v-if="activeTab === 'preview'">
                <div class="mb-6">
                  <div class="flex items-center gap-2 p-1 bg-slate-50 rounded-lg inline-flex flex-wrap">
                    <button
                      v-for="tool in previewTools"
                      :key="tool.key"
                      class="preview-tool-btn px-4 py-2 text-sm font-medium rounded-md transition-colors"
                      :class="activePreviewTool === tool.key ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'"
                      @click="activePreviewTool = tool.key"
                    >
                      <span class="flex items-center gap-1.5 whitespace-nowrap">
                        <iconify-icon :icon="tool.icon"></iconify-icon>
                        {{ tool.label }}
                      </span>
                    </button>
                  </div>
                </div>

                <div v-if="activePreviewTool === 'list'">
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left">
                      <thead class="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                          <th class="px-4 py-3">Sample ID</th>
                          <th class="px-4 py-3">Tissue Type</th>
                          <th class="px-4 py-3">Cell Count</th>
                          <th class="px-4 py-3">Batch ID</th>
                          <th class="px-4 py-3">Platform</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100 text-slate-700">
                        <tr v-for="(row, idx) in sampleData" :key="idx">
                          <td class="px-4 py-3 font-mono">{{ row.sampleId }}</td>
                          <td class="px-4 py-3">{{ row.tissueType }}</td>
                          <td class="px-4 py-3">{{ row.cellCount }}</td>
                          <td class="px-4 py-3">{{ row.batchId }}</td>
                          <td class="px-4 py-3">{{ row.platform }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div class="mt-6 flex justify-center">
                    <button class="text-xs text-blue-600 flex items-center gap-1 font-medium hover:underline">查看更多 1,200 条记录 <iconify-icon icon="mdi:chevron-down"></iconify-icon></button>
                  </div>
                </div>

                <div v-if="activePreviewTool === 'stats'">
                  <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-lg">
                      <p class="text-xs text-slate-500 mb-1">总样本数</p>
                      <p class="text-2xl font-bold text-blue-600">1,204</p>
                    </div>
                    <div class="p-4 bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-lg">
                      <p class="text-xs text-slate-500 mb-1">总细胞数</p>
                      <p class="text-2xl font-bold text-purple-600">1,204,500</p>
                    </div>
                    <div class="p-4 bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-lg">
                      <p class="text-xs text-slate-500 mb-1">肿瘤类型</p>
                      <p class="text-2xl font-bold text-green-600">20</p>
                    </div>
                    <div class="p-4 bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-lg">
                      <p class="text-xs text-slate-500 mb-1">检测基因数</p>
                      <p class="text-2xl font-bold text-amber-600">23,456</p>
                    </div>
                  </div>
                  <div class="space-y-3">
                    <h4 class="text-sm font-bold text-slate-800">样本分布（按组织类型）</h4>
                    <div class="space-y-2">
                      <div v-for="(dist, idx) in sampleDistribution" :key="idx" class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span class="text-sm text-slate-700">{{ dist.type }}</span>
                        <span class="text-sm font-bold text-slate-800">{{ dist.count }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="activePreviewTool === 'chart'">
                  <div class="mb-4 flex gap-2 flex-wrap">
                    <button
                      v-for="chart in chartTypes"
                      :key="chart.key"
                      class="px-3 py-1.5 text-xs rounded transition-colors"
                      :class="activeChart === chart.key ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'"
                      @click="activeChart = chart.key"
                    >
                      {{ chart.label }}
                    </button>
                  </div>
                  <div class="bg-slate-50 rounded-lg p-12 text-center border border-slate-200">
                    <iconify-icon class="text-6xl text-slate-300 mb-4" icon="mdi:chart-scatter-plot"></iconify-icon>
                    <p class="text-slate-500 mb-2">选择上方图表类型查看可视化结果</p>
                    <p class="text-xs text-slate-400">支持 t-SNE、UMAP 降维图和基因表达热图</p>
                  </div>
                </div>

                <div v-if="activePreviewTool === 'export'">
                  <div class="space-y-4">
                    <div v-for="(fmt, idx) in exportFormats" :key="idx" class="p-4 border border-slate-200 rounded-lg transition-colors" :class="authStore.isLoggedIn ? 'hover:border-blue-300 cursor-pointer' : ''">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="fmt.colorClass">
                            <iconify-icon class="text-xl" :class="fmt.iconColorClass" :icon="fmt.icon"></iconify-icon>
                          </div>
                          <div>
                            <h4 class="font-bold text-slate-800 text-sm">{{ fmt.label }}</h4>
                            <p class="text-xs text-slate-500">{{ fmt.description }}</p>
                          </div>
                        </div>
                        <button
                          :disabled="!authStore.isLoggedIn"
                          @click="handleDownloadBtnClick"
                          :class="authStore.isLoggedIn
                            ? 'px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 cursor-pointer'
                            : 'px-3 py-1.5 bg-slate-200 text-slate-400 text-xs rounded cursor-not-allowed'"
                        >
                          下载
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="activeTab === 'dictionary'">
                <div class="space-y-6">
                  <div class="overflow-x-auto rounded-lg border border-slate-200">
                    <table class="w-full text-sm text-left">
                      <thead class="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                          <th class="px-4 py-3">文件名</th>
                          <th class="px-4 py-3">格式</th>
                          <th class="px-4 py-3">大小</th>
                          <th class="px-4 py-3">操作</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100 text-slate-700">
                        <tr v-for="(file, idx) in dataFiles" :key="idx">
                          <td class="px-4 py-3">
                            <div class="flex items-center gap-2">
                              <iconify-icon
                                :icon="file.isFolder ? 'mdi:folder-outline' : 'mdi:file-outline'"
                                :class="file.isFolder ? 'text-amber-500' : 'text-slate-400'"
                              ></iconify-icon>
                              <span class="font-medium">{{ file.name }}</span>
                            </div>
                          </td>
                          <td class="px-4 py-3">
                            <span class="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">{{ file.type }}</span>
                          </td>
                          <td class="px-4 py-3 text-slate-500">{{ file.size }}</td>
                          <td class="px-4 py-3">
                            <button
                              v-if="!file.isFolder"
                              type="button"
                              class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                              @click="downloadDataFile(file)"
                            >
                              <iconify-icon icon="mdi:download-outline"></iconify-icon>
                              下载
                            </button>
                            <span v-else class="text-slate-400 text-xs">—</span>
                          </td>
                        </tr>
                        <tr v-if="!filesLoading && !dataFiles.length">
                          <td colspan="4" class="px-4 py-8 text-center text-slate-400 text-sm">
                            暂无文件数据
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p v-if="dataFiles.length" class="mt-3 text-xs text-slate-500">
                      <template v-if="authStore.isLoggedIn">较大文件支持后台打包下载。</template>
                      <template v-else>
                        文件下载需
                        <button type="button" class="text-blue-600 hover:underline" @click="goLoginForDownload">登录</button>
                        后使用。
                      </template>
                    </p>
                  </div>
                </div>
              </div>

              <div v-if="activeTab === 'quality'">
                <div class="space-y-6">
                  <h3 class="text-lg font-bold text-slate-800">引用方式</h3>
                  <p class="text-sm text-slate-500">使用本数据集时，请在研究成果中按照以下格式进行引用。</p>

                  <!-- CSTR 引用 -->
                  <div class="bg-slate-900 rounded-xl p-6 text-white">
                    <div class="flex items-center gap-2 mb-4">
                      <iconify-icon class="text-blue-400 text-lg" icon="mdi:identifier"></iconify-icon>
                      <h4 class="font-bold">CSTR 引用</h4>
                    </div>
                    <div class="bg-white/10 rounded-lg p-4 mb-3">
                      <p class="text-sm text-slate-300 leading-relaxed font-mono" id="cstrCitation">
                        {{ dataset.publisher }}. {{ dataset.title }}[DS]. {{ dataset.publisher }}[创建机构], {{ currentYear }}. 国家基础学科公共科学数据中心[发布机构], https://cstr.cn/{{ dataset.cstr }}
                      </p>
                    </div>
                    <button @click="copyCitation('cstrCitation')" class="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium">
                      <iconify-icon icon="mdi:content-copy"></iconify-icon>
                      复制引用
                    </button>
                  </div>

                  <!-- DOI 引用 -->
                  <div v-if="dataset.doi" class="border border-slate-200 rounded-xl p-6">
                    <div class="flex items-center gap-2 mb-4">
                      <iconify-icon class="text-slate-500 text-lg" icon="mdi:link-variant"></iconify-icon>
                      <h4 class="font-bold text-slate-800">DOI 引用</h4>
                    </div>
                    <div class="bg-slate-50 rounded-lg p-4 mb-3">
                      <p class="text-sm text-slate-600 leading-relaxed font-mono" id="doiCitation">
                        {{ dataset.publisher }} ({{ currentYear }}). {{ dataset.title }}. {{ dataset.doi }}
                      </p>
                    </div>
                    <button @click="copyCitation('doiCitation')" class="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
                      <iconify-icon icon="mdi:content-copy"></iconify-icon>
                      复制引用
                    </button>
                  </div>

                </div>
              </div>

              <div v-if="activeTab === 'cases'">
                <div class="space-y-6">
                  <p class="text-sm text-slate-500">您可能还对以下相关数据集感兴趣</p>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div v-for="(res, idx) in recommendedResources" :key="idx" class="p-5 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
                      <div class="flex items-start gap-3 mb-3">
                        <div class="w-10 h-10 rounded-lg bg-gradient-to-br shrink-0 flex items-center justify-center" :class="res.colorClass">
                          <iconify-icon class="text-white" :icon="res.icon"></iconify-icon>
                        </div>
                        <div class="min-w-0">
                          <h4 class="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{{ res.title }}</h4>
                          <p class="text-xs text-slate-400 mt-0.5">{{ res.source }}</p>
                        </div>
                      </div>
                      <p class="text-xs text-slate-500 line-clamp-2 mb-3">{{ res.description }}</p>
                      <div class="flex items-center justify-between">
                        <span class="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">{{ res.subject }}</span>
                        <span class="text-[10px] text-slate-400">{{ res.dataSize }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="SHOW_DATASET_EVALUATION && activeTab === 'comments'">
                <div class="space-y-6">
                  <!-- 总体评价概览 -->
                  <div class="flex items-center gap-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
                    <div class="text-center">
                      <p class="text-4xl font-bold text-slate-800">{{ overallRating }}</p>
                      <div class="flex gap-0.5 text-amber-500 mt-1 justify-center">
                        <iconify-icon v-for="i in 5" :key="i" icon="mdi:star"></iconify-icon>
                      </div>
                      <p class="text-xs text-slate-400 mt-1">{{ evaluations.length }} 条评价</p>
                    </div>
                    <div class="flex-1 space-y-1.5">
                      <div v-for="star in [5,4,3,2,1]" :key="star" class="flex items-center gap-2 text-xs">
                        <span class="text-slate-500 w-6 text-right">{{ star }}星</span>
                        <div class="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div class="h-full bg-amber-500 rounded-full" :style="{ width: ratingDistribution(star) + '%' }"></div>
                        </div>
                        <span class="text-slate-400 w-8">{{ ratingDistribution(star) }}%</span>
                      </div>
                    </div>
                  </div>

                  <!-- 评价列表 -->
                  <div class="space-y-4">
                    <div v-for="(evaluation, idx) in evaluations" :key="idx" class="p-5 border border-slate-200 rounded-lg">
                      <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-3">
                          <div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" :class="evaluation.avatarColor">
                            {{ evaluation.avatarInitial }}
                          </div>
                          <div>
                            <h4 class="font-bold text-slate-700 text-sm">{{ maskDisplayName(evaluation.author) }}</h4>
                            <p class="text-xs text-slate-400">{{ evaluation.affiliation }}</p>
                          </div>
                        </div>
                        <div class="text-right">
                          <div class="flex gap-0.5 text-amber-500 justify-end">
                            <iconify-icon v-for="i in 5" :key="i" :icon="i <= evaluation.rating ? 'mdi:star' : 'mdi:star-outline'"></iconify-icon>
                          </div>
                          <p class="text-xs text-slate-400 mt-1">{{ evaluation.date }}</p>
                        </div>
                      </div>
                      <p class="text-sm text-slate-600 mb-3 leading-relaxed">{{ evaluation.content }}</p>
                      <div class="flex items-center gap-3">
                        <button class="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
                          <iconify-icon icon="mdi:thumb-up-outline"></iconify-icon>
                          <span>{{ evaluation.likes }}</span>
                        </button>
                        <button class="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
                          <iconify-icon icon="mdi:comment-outline"></iconify-icon>
                          <span>回复</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- 发表评价 -->
                  <div class="border border-slate-200 rounded-xl p-6">
                    <h4 class="font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <iconify-icon icon="mdi:star-plus-outline"></iconify-icon>
                      发表评价
                    </h4>
                    <div class="flex items-center gap-2 mb-4">
                      <span class="text-sm text-slate-500">您的评价：</span>
                      <div class="flex gap-1 text-2xl cursor-pointer">
                        <iconify-icon
                          v-for="i in 5"
                          :key="i"
                          :icon="i <= newRating ? 'mdi:star' : 'mdi:star-outline'"
                          :class="i <= newRating ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'"
                          class="transition-colors"
                          @click="newRating = i"
                        ></iconify-icon>
                      </div>
                    </div>
                    <textarea
                      v-model="newComment"
                      class="w-full border border-slate-200 rounded-lg p-3 text-sm mb-3"
                      rows="3"
                      placeholder="分享您对本数据集的质量评价和使用体验..."
                    ></textarea>
                    <div v-if="commentError" class="text-sm text-red-500 mb-3 flex items-center gap-1">
                      <iconify-icon icon="mdi:alert-circle"></iconify-icon>
                      <span>{{ commentError }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <p class="text-xs text-slate-400">您的评价将帮助其他研究者更好地了解本数据集</p>
                      <button
                        @click="submitEvaluation"
                        :disabled="submittingComment"
                        class="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <iconify-icon v-if="submittingComment" class="animate-spin" icon="mdi:loading"></iconify-icon>
                        {{ submittingComment ? '提交中...' : '提交评价' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 使用条款 -->
          <div class="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
            <div class="absolute top-0 right-0 p-8 opacity-10">
              <iconify-icon class="text-8xl" icon="mdi:gavel"></iconify-icon>
            </div>
            <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
              <iconify-icon class="text-blue-400" icon="mdi:file-certificate"></iconify-icon>
              使用条款与限制
            </h3>
            <div class="space-y-4 text-slate-300 text-sm">
              <p v-for="(term, idx) in usageTerms" :key="idx" class="flex items-start gap-2">
                <span class="w-1 h-1 rounded-full bg-blue-500 mt-2 shrink-0"></span>
                {{ term }}
              </p>
            </div>
            <button class="mt-8 text-xs text-blue-400 font-bold hover:underline">下载完整授权协议预览 (PDF)</button>
          </div>
        </div>

        <!-- ===== 右侧边栏（4列） ===== -->
        <div class="lg:col-span-4 space-y-6">
          <!-- 提供方信息 -->
          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                {{ dataset.publisherInitial }}
              </div>
              <div>
                <h4 class="font-bold text-slate-800">{{ dataset.publisher }}</h4>
                <div class="flex items-center gap-1 text-xs text-emerald-600">
                  <iconify-icon icon="mdi:check-decagram"></iconify-icon>
                  <span>认证科研机构</span>
                </div>
              </div>
            </div>
            <div class="space-y-4 mb-6">
              <div class="flex justify-between text-xs">
                <span class="text-slate-500">发布数据集</span>
                <span class="font-bold text-slate-800">{{ dataset.publishedDatasets }}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-slate-500">累计授权次数</span>
                <span class="font-bold text-slate-800">{{ dataset.totalAuthorizations }}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-slate-500">数据质量评分</span>
                <div class="flex gap-0.5 text-amber-500">
                  <iconify-icon v-for="i in 5" :key="i" :icon="i <= Math.floor(dataset.rating) ? 'mdi:star' : i === Math.ceil(dataset.rating) && dataset.rating % 1 !== 0 ? 'mdi:star-half-full' : 'mdi:star-outline'"></iconify-icon>
                </div>
              </div>
            </div>
            <!-- 数据作者 -->
            <div class="border-t border-slate-100 pt-4 mt-4">
              <p class="text-xs text-slate-400 mb-2">数据作者</p>
              <div class="flex flex-wrap gap-2">
                <template v-if="dataset.authors && dataset.authors.length">
                  <span
                    v-for="(author, idx) in dataset.authors"
                    :key="idx"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg text-xs text-slate-700"
                  >
                    <span class="w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center text-white text-[8px] font-bold">{{ author.charAt(0) }}</span>
                    {{ author }}
                  </span>
                </template>
                <span v-else class="text-xs text-slate-400">暂无作者信息</span>
              </div>
            </div>
          </div>

          <!-- 操作卡片 -->
          <div class="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 sticky top-24">
            <h4 class="text-lg font-bold mb-2">申请使用</h4>
            <p class="text-blue-100 text-xs mb-6">当前数据级别为"{{ dataset.level }}"，您需要提交研究计划供提供方审核。</p>
            <div class="space-y-3">
              <button @click="goToApply" class="block w-full bg-white text-blue-600 text-center py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors">
                发起申请
              </button>
              <a class="flex items-center justify-center gap-2 text-sm text-blue-100 font-medium pt-2 hover:underline cursor-pointer" @click="router.push('/workflow')">
                <iconify-icon icon="mdi:robot-confused"></iconify-icon>
                沙箱环境使用数据
              </a>
            </div>
            <div class="mt-6 pt-6 border-t border-white/10">
              <div class="flex items-center gap-3">
                <div class="flex -space-x-2">
                  <div v-for="(avatar, idx) in recentResearchers" :key="idx" class="w-6 h-6 rounded-full border-2 border-blue-600 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-[8px] font-bold">
                    {{ avatar }}
                  </div>
                </div>
                <span class="text-[10px] text-blue-100">最近 3 位研究者获得了授权</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- 下载凭证弹窗 -->
      <div v-if="showDownloadModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" @click="showDownloadModal = false">
        <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl" @click.stop>
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-slate-900">输入下载凭证</h3>
            <button @click="showDownloadModal = false" class="text-slate-400 hover:text-slate-600">
              <iconify-icon icon="mdi:close" class="text-2xl"></iconify-icon>
            </button>
          </div>
          <!-- <p class="text-sm text-slate-500 mb-6">请输入您的下载凭证码以完成数据下载。</p> -->
          <div class="space-y-4">
            <div>
              <!-- <label class="text-sm font-medium text-slate-700 mb-2 block">下载凭证码</label> -->
              <input
                v-model="downloadCode"
                type="text"
                class="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center text-xl font-mono tracking-widest"
                placeholder="请输入凭证码"
                maxlength="20"
              />
            </div>
            <div v-if="downloadError" class="text-sm text-red-500 flex items-center gap-1">
              <iconify-icon icon="mdi:alert-circle"></iconify-icon>
              <span>{{ downloadError }}</span>
            </div>
            <div v-if="downloadSuccess" class="text-sm text-emerald-500 flex items-center gap-1">
              <iconify-icon icon="mdi:check-circle"></iconify-icon>
              <span>{{ downloadSuccess }}</span>
            </div>
            <button
              @click="submitDownloadCode"
              :disabled="!downloadCode.trim() || downloadSubmitting"
              class="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <iconify-icon v-if="downloadSubmitting" class="animate-spin" icon="mdi:loading"></iconify-icon>
              {{ downloadSubmitting ? '验证中...' : '确认下载' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 登录弹窗 -->
      <div v-if="showLoginModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" @click="closeLoginModal">
        <div class="login-modal relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-3xl w-full mx-4 flex" @click.stop>
          <button
            type="button"
            aria-label="关闭"
            class="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100"
            @click="closeLoginModal"
          >
            <iconify-icon class="text-slate-400" icon="mdi:close"></iconify-icon>
          </button>
          <div class="w-1/2 p-8 flex flex-col items-center justify-center">
            <div v-if="qrStatus === 'loading'" class="flex flex-col items-center justify-center w-64 h-64">
              <iconify-icon class="text-4xl text-blue-500 animate-spin" icon="mdi:loading"></iconify-icon>
              <p class="text-sm text-slate-500 mt-4">正在获取二维码...</p>
            </div>
            <div v-else-if="qrStatus === 'waiting'" class="flex flex-col items-center">
              <div class="qr-container border-2 border-slate-200 rounded-xl shadow-lg">
                <img alt="微信登录二维码" class="w-64 h-64 object-contain rounded-xl" :src="qrCodeUrl" />
              </div>
              <div class="flex items-center gap-2 mt-4">
                <span class="text-sm text-slate-400">二维码有效期</span>
                <span class="text-sm font-mono text-slate-600" :class="{ 'text-red-500': remainingSeconds < 30 }">{{ remainingSeconds }}s</span>
              </div>
            </div>
            <div v-else-if="qrStatus === 'confirmed'" class="flex flex-col items-center justify-center w-64 h-64">
              <iconify-icon class="text-7xl text-green-500 mb-4" icon="mdi:check-circle-outline"></iconify-icon>
              <p class="text-lg font-medium text-slate-800">登录成功</p>
              <p class="text-sm text-slate-400 mt-1">即将关闭...</p>
            </div>
            <div v-else-if="qrStatus === 'expired'" class="flex flex-col items-center justify-center w-64 h-64">
              <iconify-icon class="text-6xl text-slate-300 mb-4" icon="mdi:qrcode-scan"></iconify-icon>
              <p class="text-sm text-slate-500 mb-4">二维码已过期</p>
              <button @click="refreshQR" class="btn-gradient text-white font-bold py-2 px-6 rounded-xl transition-all text-sm hover:scale-105 active:scale-95">重新获取</button>
            </div>
            <div v-else-if="qrStatus === 'error'" class="flex flex-col items-center justify-center w-64 h-64">
              <iconify-icon class="text-6xl text-red-300 mb-4" icon="mdi:alert-circle-outline"></iconify-icon>
              <p class="text-sm text-red-500 mb-1 text-center">{{ qrErrorMessage }}</p>
              <button @click="refreshQR" class="btn-gradient text-white font-bold py-2 px-6 rounded-xl transition-all text-sm mt-2 hover:scale-105 active:scale-95">重试</button>
            </div>
            <p class="text-slate-700 font-medium text-center mt-6">请使用微信扫码完成登录/注册</p>
          </div>
          <div class="w-1/2 p-8 flex flex-col justify-between">
            <div>
              <div class="mb-8 flex items-center space-x-2">
                <BrandLogo size="lg" />
                <span class="text-xl font-bold text-slate-900">费尔空间</span>
              </div>
              <h2 class="text-2xl font-bold mb-2">微信扫码登录</h2>
              <p class="text-slate-500 text-sm mb-8">使用微信扫一扫完成登录</p>
              <ul class="text-sm text-slate-500 space-y-4 mb-8">
                <li class="flex items-center gap-3"><iconify-icon class="text-blue-600 text-xl" icon="mdi:account-plus-outline"></iconify-icon><span>首次扫码将引导完成实名注册</span></li>
                <li class="flex items-center gap-3"><iconify-icon class="text-blue-600 text-xl" icon="mdi:bell-outline"></iconify-icon><span>审批、消息通知将通过微信实时推送</span></li>
              </ul>
            </div>
            <div class="pt-6 border-t border-slate-100">
              <p class="text-xs text-slate-400 mb-3">登录即表示同意费尔空间相关的<a class="text-blue-600 hover:underline" href="/auth/agreement">《服务协议》</a> 和 <a class="text-blue-600 hover:underline" href="/auth/agreement">《隐私政策》</a></p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <NoticeDrawer v-model="showNoticeModal" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWechatLogin } from '@/composables/useWechatLogin'
import { useNoticeList } from '@/composables/useNoticeList'
import NoticeDrawer from '@/components/NoticeDrawer.vue'
import BrandLogo from '@/components/BrandLogo.vue'
import UserCenterNavButton from '@/components/UserCenterNavButton.vue'
import { buildIntentApplyUrl, buildIntentApplyQrUrl } from '@/utils/intentApply'
import { generateQRDataURL } from '@/utils/qrcode'
import { datasetOrderPath, evaluationDatasetPath, normalizeCstr } from '@/utils/cstrUrl'
import { saveDatasetEvaluation } from '@/utils/datasetEvaluation'
import { addDatasetDownloadCount } from '@/utils/datasetDownloadCount'
import { maskDisplayName } from '@/utils/maskDisplayName'
import { hasHtmlTags } from '@/utils/richText'
import { resolveApplicantUidFromUser } from '@/utils/resolveApplicantUid'
import { parseAuthors, parseKeywords, parseNameZhLabel, resolveScidbStaticUrl, formatShareModeLabel } from '@/utils/casdcDetailMapper'
import {
  fetchDatasetFileList,
  type DatasetFileItem
} from '@/utils/datasetFileList'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// ----- 状态 -----
const loading = ref(true)
const error = ref('')
const isFavorited = ref(false)
const favoriteLoading = ref(false)

// ===== 收藏功能 =====
const toggleFavorite = async () => {
  if (!authStore.isLoggedIn) {
    showLoginModal.value = true
    return
  }

  const uid = authStore.user?.uid || authStore.user?.openId || ''
  const cstr = dataset.value.cstr

  if (!uid || !cstr) {
    console.error('缺少必要参数')
    return
  }

  favoriteLoading.value = true
  try {
    if (isFavorited.value) {
      const res = await fetch(`/tds-trading/order/favorite.remove?uid=${encodeURIComponent(uid)}&cstr=${encodeURIComponent(cstr)}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      
      if (json.code === 200) {
        isFavorited.value = false
      } else {
        console.error('取消收藏失败:', json.message)
      }
    } else {
      const params = new URLSearchParams()
      params.append('uid', uid)
      params.append('cstr', cstr)
      
      const res = await fetch('/tds-trading/order/favorite.save', {
        method: 'POST',
        body: params
      })
      const json = await res.json()
      
      if (json.code === 200) {
        isFavorited.value = true
      } else {
        console.error('收藏失败:', json.message)
      }
    }
  } catch (e) {
    console.error('收藏操作失败:', e)
  } finally {
    favoriteLoading.value = false
  }
}

const checkFavoriteStatus = async () => {
  if (!authStore.isLoggedIn) {
    isFavorited.value = false
    return
  }

  const uid = authStore.user?.uid || authStore.user?.openId || ''
  // 使用路由参数中的 cstr，确保在 dataset.value 未赋值时也能正常工作
  const cstr = dataset.value.cstr || route.params.id as string

  if (!uid || !cstr) {
    isFavorited.value = false
    return
  }

  try {
    // 使用后端提供的专门检查收藏状态接口
    const url = `/tds-trading/order/favorite.check?uid=${encodeURIComponent(uid)}&cstr=${normalizeCstr(cstr)}`
    const res = await fetch(url)
    const json = await res.json()
    
    if (json.code === 200 && json.data) {
      isFavorited.value = json.data.favorited === true || json.data.favorited === 'true' || json.data.favorited === 1
    } else {
      isFavorited.value = false
    }
  } catch (e) {
    console.error('检查收藏状态失败:', e)
    isFavorited.value = false
  }
}

// ----- 登录弹窗 -----
const showLoginModal = ref(false)
const pendingDownloadFile = ref<DatasetFileItem | null>(null)
const {
  qrCodeUrl,
  status: qrStatus,
  errorMessage: qrErrorMessage,
  remainingSeconds,
  fetchQRCode,
  refresh: refreshQR,
  cleanup: cleanupQR
} = useWechatLogin({
  redirectPath: () => route.fullPath,
  onSuccess: () => {
    showLoginModal.value = false
    handleLoginSuccess()
  }
})

watch(showLoginModal, (val) => {
  if (val) fetchQRCode()
  else cleanupQR()
})

const closeLoginModal = () => { showLoginModal.value = false }
const handleLogout = () => { authStore.logout() }

function goLoginForDownload() {
  showLoginModal.value = true
}

function handleLoginSuccess() {
  authStore.syncFromStorage()
  if (!authStore.isLoggedIn) return
  if (dataset.value.cstr) void checkFavoriteStatus()
  const file = pendingDownloadFile.value
  if (!file || authStore.needsProfileCompletion()) return
  pendingDownloadFile.value = null
  performDownload(file)
}

function performDownload(file: DatasetFileItem) {
  const cstr = dataset.value.cstr
  if (cstr) {
    void addDatasetDownloadCount(cstr)
  }
  window.open(file.downloadUrl, '_blank', 'noopener,noreferrer')
}

function downloadDataFile(file: DatasetFileItem) {
  if (file.isFolder || !file.downloadUrl) return
  authStore.syncFromStorage()
  if (!authStore.isLoggedIn) {
    pendingDownloadFile.value = file
    showLoginModal.value = true
    return
  }
  performDownload(file)
}

// ===== 消息通知（右侧抽屉）=====
const showNoticeModal = ref(false)
const { unreadCount } = useNoticeList()

// 监听登录状态变化，重新检查收藏状态
watch(() => authStore.isLoggedIn, () => {
  if (dataset.value.cstr) {
    checkFavoriteStatus()
  }
})

watch(
  () => authStore.isLoggedIn,
  (loggedIn) => {
    if (!loggedIn || authStore.needsProfileCompletion()) return
    const file = pendingDownloadFile.value
    if (!file) return
    pendingDownloadFile.value = null
    performDownload(file)
  }
)

// ----- 下载凭证弹窗 -----
const showDownloadModal = ref(false)
const downloadCode = ref('')
const downloadSubmitting = ref(false)
const downloadError = ref('')
const downloadSuccess = ref('')

function handleDownloadBtnClick() {
  if (authStore.isLoggedIn) {
    showDownloadModal.value = true
  }
}

async function submitDownloadCode() {
  const code = downloadCode.value.trim()
  if (!code) return

  downloadSubmitting.value = true
  downloadError.value = ''
  downloadSuccess.value = ''

  try {
    const cstr = dataset.value.cstr
    const uid = authStore.user?.uid || ''
    const url = `/tds-trading/order/order.file.download/${normalizeCstr(cstr)}?code=${encodeURIComponent(code)}&uid=${encodeURIComponent(uid)}`
    const res = await fetch(url)

    // 根据 Content-Type 判断响应类型
    const contentType = res.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      // JSON 响应 → 凭证错误情况
      const json = await res.json()
      downloadError.value = json.message || '凭证码无效，请重新输入'
    } else {
      // 非 JSON 响应 → 文件下载，触发浏览器下载
      const blob = await res.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl

      // 使用数据集名称作为下载文件名，免去 URL 解码问题
      let filename = (dataset.value.title || 'download') + '.zip'
      // 移除文件名中不允许的字符（\/:*?"<>|）
      filename = filename.replace(/[\\/:*?"<>|]/g, '_')
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(blobUrl)

      downloadSuccess.value = '凭证验证成功，正在开始下载'
      downloadCode.value = ''
      setTimeout(() => {
        showDownloadModal.value = false
        downloadSuccess.value = ''
      }, 1500)
    }
  } catch {
    downloadError.value = '网络错误，请稍后重试'
  } finally {
    downloadSubmitting.value = false
  }
}

// ----- 联系提供方弹窗 -----

// ----- 选项卡 -----
/** 数据评价暂时关闭 */
const SHOW_DATASET_EVALUATION = false

const tabs = [
  { key: 'preview', label: '数据预览' },
  { key: 'dictionary', label: '数据文件' },
  { key: 'quality', label: '引用方式' },
  { key: 'cases', label: '推荐资源' },
  ...(SHOW_DATASET_EVALUATION ? [{ key: 'comments', label: '数据评价' }] : [])
]
const activeTab = ref('preview')

const previewTools = [
  { key: 'list', label: '列表展示', icon: 'mdi:table' },
  { key: 'stats', label: '分析统计', icon: 'mdi:chart-bar' },
  { key: 'chart', label: '图表预览', icon: 'mdi:chart-scatter-plot' },
  { key: 'export', label: '下载数据', icon: 'mdi:download' }
]
const activePreviewTool = ref('list')

const chartTypes = [
  { key: 'tsne', label: 't-SNE' },
  { key: 'umap', label: 'UMAP' },
  { key: 'heatmap', label: '热图' }
]
const activeChart = ref('tsne')

// ----- 数据集展示数据（API + 默认值） -----
const dataset = ref({
  // 来自 API
  title: '数据详情',
  fullDescription: '',
  level: '开放共享',
  subject: '',
  doi: '',
  cstr: '',
  fileSize: '',
  fileNumber: 0,
  format: '',
  version: '',
  keywords: [] as string[],
  authors: [] as string[],
  publisher: '',
  publisherInitial: '',
  coverUrl: '',
  // 默认值
  publishedDatasets: '128',
  totalAuthorizations: '4.2k',
  rating: 4.5
})

// 示例数据（API 不提供）
const sampleData = ref([
  { sampleId: 'SC_LUNG_001', tissueType: 'Adenocarcinoma', cellCount: '8,421', batchId: 'B2026-A', platform: '10x Chromium' },
  { sampleId: 'SC_LUNG_002', tissueType: 'Normal Lung', cellCount: '6,102', batchId: 'B2026-A', platform: '10x Chromium' },
  { sampleId: 'SC_COLO_015', tissueType: 'Colorectal Tumor', cellCount: '12,056', batchId: 'B2026-C', platform: '10x Chromium' }
])

const sampleDistribution = ref([
  { type: '肺腺癌', count: '245 样本 (20.3%)' },
  { type: '结直肠癌', count: '198 样本 (16.4%)' },
  { type: '乳腺癌', count: '176 样本 (14.6%)' },
  { type: '胃癌', count: '152 样本 (12.6%)' },
  { type: '其他类型', count: '433 样本 (36.1%)' }
])

const exportFormats = ref([
  { label: 'ZIP 压缩包', description: '数据集完整文件，ZIP 格式压缩包', icon: 'mdi:folder-zip-outline', colorClass: 'bg-amber-100', iconColorClass: 'text-amber-600' }
])

// 数据文件列表（dataset.getDownloadUrl）
const dataFiles = ref<DatasetFileItem[]>([])
const filesLoading = ref(false)

// 推荐资源列表
const recommendedResources = ref([
  { title: '杂环聚芳醚树脂基复合材料的摩擦性能', source: '材料科学数据中心', description: '杂环聚芳醚树脂基复合材料在不同工况下的摩擦磨损性能测试数据。', subject: '材料科学', dataSize: '256 MB', colorClass: 'from-blue-500 to-indigo-600', icon: 'mdi:flask' },
  { title: '杂环聚芳醚树脂的玻璃化转变温度', source: '材料科学数据中心', description: '杂环聚芳醚树脂的玻璃化转变温度（Tg）测试数据及分析结果。', subject: '材料科学', dataSize: '128 MB', colorClass: 'from-emerald-500 to-teal-600', icon: 'mdi:thermometer' },
  { title: '混杂连续纤维增强杂环聚芳醚树脂基复合材料的摩擦性能', source: '材料科学数据中心', description: '混杂连续纤维增强杂环聚芳醚树脂基复合材料的摩擦学性能评价数据。', subject: '复合材料', dataSize: '512 MB', colorClass: 'from-purple-500 to-violet-600', icon: 'mdi:layers-triple' },
  { title: '杂环聚芳醚树脂基复合材料高速止推轴承考核评价', source: '材料科学数据中心', description: '杂环聚芳醚树脂基复合材料在高速止推轴承工况下的考核评价数据。', subject: '机械工程', dataSize: '384 MB', colorClass: 'from-red-500 to-pink-600', icon: 'mdi:engine' },
  { title: '杂环聚芳醚树脂基复合材料燃油泵高速止推轴承减重性能', source: '材料科学数据中心', description: '杂环聚芳醚树脂基复合材料在燃油泵高速止推轴承中的减重性能测试数据。', subject: '机械工程', dataSize: '320 MB', colorClass: 'from-amber-500 to-orange-600', icon: 'mdi:fuel' },
  { title: '杂环聚芳醚树脂的热变形温度', source: '材料科学数据中心', description: '杂环聚芳醚树脂的热变形温度（HDT）测试数据及热性能分析结果。', subject: '材料科学', dataSize: '96 MB', colorClass: 'from-cyan-500 to-blue-600', icon: 'mdi:fire' }
])

// 数据评价列表
interface Evaluation {
  author: string
  affiliation: string
  date: string
  rating: number
  content: string
  likes: string
  avatarInitial: string
  avatarColor: string
}

const evaluations = ref<Evaluation[]>([])

// 评价表单状态
const newRating = ref(0)
const newComment = ref('')
const submittingComment = ref(false)
const commentError = ref('')

// 头像颜色列表
const avatarColors = [
  'bg-gradient-to-br from-blue-500 to-indigo-600',
  'bg-gradient-to-br from-emerald-500 to-teal-600',
  'bg-gradient-to-br from-purple-500 to-pink-600',
  'bg-gradient-to-br from-amber-500 to-orange-600',
  'bg-gradient-to-br from-cyan-500 to-blue-600',
  'bg-gradient-to-br from-pink-500 to-rose-600',
  'bg-gradient-to-br from-indigo-500 to-violet-600',
  'bg-gradient-to-br from-teal-500 to-cyan-600'
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

const overallRating = computed(() => {
  if (!evaluations.value.length) return '0.0'
  const sum = evaluations.value.reduce((acc, e) => acc + e.rating, 0)
  return (sum / evaluations.value.length).toFixed(1)
})

function ratingDistribution(star: number) {
  const total = evaluations.value.length
  if (!total) return 0
  const count = evaluations.value.filter(e => e.rating === star).length
  return Math.round((count / total) * 100)
}

const usageTerms = ref([
  '数据仅限用于非商业学术研究，严禁向第三方分发。',
  '成果发表需引用本数据集 DOI 并在致谢中声明平台支持。',
  '需遵守受控分析环境规范，禁止尝试进行个人身份重识别。'
])

const recentResearchers = ['陈', '李', '王']
const currentYear = new Date().getFullYear()

// ----- 辅助函数 -----

function copyCitation(elementId: string) {
  const el = document.getElementById(elementId)
  if (!el) return
  const text = el.textContent || ''
  navigator.clipboard.writeText(text).then(() => {
    // 简单反馈
  }).catch(() => {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  })
}
function formatFileSize(bytes: number | string): string {
  const b = Number(bytes)
  if (!b || b <= 0) return '未知'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let size = b
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

const getLevelClass = (level: string) => {
  const classes: Record<string, string> = {
    '开放共享': 'bg-green-100 text-green-700',
    '开放访问': 'bg-green-100 text-green-700',
    '审核使用': 'bg-blue-100 text-blue-700',
    '受控使用': 'bg-red-100 text-red-700'
  }
  return classes[level] || 'bg-slate-100 text-slate-700'
}

// ----- API 调用 -----
async function fetchDataFiles(cstr: string) {
  filesLoading.value = true
  dataFiles.value = []
  try {
    dataFiles.value = await fetchDatasetFileList(cstr)
    if (dataFiles.value.length) {
      dataset.value.fileNumber = dataFiles.value.length
    }
  } finally {
    filesLoading.value = false
  }
}

async function fetchDetail() {
  const cstr = normalizeCstr(route.params.id as string)
  if (!cstr) {
    error.value = '缺少数据集标识'
    loading.value = false
    return
  }

  loading.value = true
  error.value = ''
  try {
    const res = await fetch(datasetOrderPath(cstr))
    const json = await res.json()
    if (json.code === 200 && json.data?.DataSet) {
      const d = json.data.DataSet

      const keywords = parseKeywords(d.keywordsZh || d.keywords)
      const authors = parseAuthors(d.authors)

      // 取发布者首字作为头像
      const publisher = d.source || '未知来源'
      const publisherInitial = publisher.charAt(0) || '?'

      dataset.value = {
        title: d.titleZh || '无标题',
        fullDescription: d.introductionZh || '暂无描述',
        level: formatShareModeLabel(d.shareMode) || '开放共享',
        subject: parseNameZhLabel(d.subject) || '其他',
        doi: d.doi || '',
        cstr: d.cstr || d.id || cstr || '',
        fileSize: formatFileSize(d.byteSize),
        fileNumber: d.fileNumber || 0,
        format: d.format || '',
        version: d.version || '',
        keywords,
        authors,
        publisher,
        publisherInitial,
        coverUrl: resolveScidbStaticUrl(d.coverUrl || ''),
        publishedDatasets: '128',
        totalAuthorizations: '4.2k',
        rating: 4.5
      }
      await fetchDataFiles(cstr)
    } else {
      throw new Error(json.message || '获取数据集详情失败')
    }
  } catch (e: any) {
    error.value = e.message || '网络错误，请检查连接'
  } finally {
    loading.value = false
    void refreshApplyQr()
  }
}

// 获取数据集评价列表
async function fetchEvaluations() {
  const cstr = route.params.id as string
  if (!cstr) return

  try {
    const res = await fetch(evaluationDatasetPath(cstr))
    const json = await res.json()
    if (json.code === 200 && json.data) {
      // 将后端数据转换为前端格式
      evaluations.value = json.data.map((item: any) => ({
        author: item.username || '匿名用户',
        affiliation: item.affiliation || '',
        date: item.createTime || new Date().toISOString().split('T')[0],
        rating: Number(item.score) || 0,
        content: item.description || '',
        likes: String(item.likeCount || 0),
        avatarInitial: (item.username || '用').charAt((item.username || '用').length - 1),
        avatarColor: getAvatarColor(item.username || '')
      }))
    }
  } catch (e) {
    console.error('获取评价列表失败:', e)
    // 使用默认数据
    evaluations.value = [
      { author: '张教授', affiliation: '北京大学医学院', date: '2026-04-10', rating: 5, content: '数据质量非常高，细胞数量充足，批次效应控制良好。建议增加更多临床信息的关联分析，以支持更深入的转化医学研究。', likes: '12', avatarInitial: '张', avatarColor: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
      { author: '李研究员', affiliation: '上海交通大学生命学院', date: '2026-04-05', rating: 4, content: '样本多样性很好，覆盖了多种肿瘤类型。数据处理流程规范，元数据完整。希望能提供更多关于样本采集和处理的详细信息。', likes: '8', avatarInitial: '李', avatarColor: 'bg-gradient-to-br from-emerald-500 to-teal-600' },
      { author: '王博士', affiliation: '中国科学院生物物理所', date: '2026-03-28', rating: 5, content: '数据下载速度较快，分析工具集成度高，非常适合开展大规模的肿瘤免疫微环境研究。建议增加标准化分析流程的说明文档。', likes: '15', avatarInitial: '王', avatarColor: 'bg-gradient-to-br from-purple-500 to-pink-600' },
      { author: '陈研究员', affiliation: '浙江大学医学院', date: '2026-03-15', rating: 4, content: '数据标注规范，质量控制严格，是可靠的参考数据集。在跨数据集的整合分析中发现本数据集的一致性较好。', likes: '6', avatarInitial: '陈', avatarColor: 'bg-gradient-to-br from-amber-500 to-orange-600' },
      { author: '刘教授', affiliation: '华中科技大学', date: '2026-03-01', rating: 3, content: '数据整体质量不错，但部分样本的测序深度偏低，建议在下个版本中补充更多深度测序的数据。期待后续更新。', likes: '4', avatarInitial: '刘', avatarColor: 'bg-gradient-to-br from-cyan-500 to-blue-600' }
    ]
  }
}

// 提交评价
async function submitEvaluation() {
  if (!authStore.isLoggedIn) {
    commentError.value = '请先登录后再发表评价'
    return
  }

  if (newRating.value === 0) {
    commentError.value = '请选择评分'
    return
  }

  if (!newComment.value.trim()) {
    commentError.value = '请输入评价内容'
    return
  }

  const uid = resolveApplicantUidFromUser(authStore.user) || authStore.user?.uid || authStore.user?.openId || ''
  const cstr = dataset.value.cstr

  if (!uid || !cstr) {
    commentError.value = '缺少必要信息'
    return
  }

  submittingComment.value = true
  commentError.value = ''

  try {
    const result = await saveDatasetEvaluation(uid, cstr, newComment.value, newRating.value)
    if (result.ok) {
      // 提交成功，添加到列表
      const user = authStore.user
      const newEval: Evaluation = {
        author: user?.displayName || '匿名用户',
        affiliation: user?.affiliation || '',
        date: new Date().toISOString().split('T')[0],
        rating: newRating.value,
        content: newComment.value.trim(),
        likes: '0',
        avatarInitial: (user?.displayName || '匿').charAt(0),
        avatarColor: getAvatarColor(user?.displayName || '')
      }
      evaluations.value.unshift(newEval)
      
      // 重置表单
      newRating.value = 0
      newComment.value = ''
    } else {
      commentError.value = result.message || '提交评价失败'
    }
  } catch (e) {
    commentError.value = '网络错误，请稍后重试'
  } finally {
    submittingComment.value = false
  }
}

function goToApply() {
  const cstr = dataset.value.cstr || (route.params.id as string) || ''
  const uid = authStore.user?.uid || authStore.user?.openId || ''
  if (!uid) {
    showLoginModal.value = true
    return
  }
  router.push(
    buildIntentApplyUrl({
      cstr,
      title: dataset.value.title,
      publisher: dataset.value.publisher,
      level: dataset.value.level
    })
  )
}

const applyQrDataUrl = ref('')
const applyQrLoading = ref(false)

const applyQrUid = computed(
  () =>
    authStore.user?.uid ||
    authStore.user?.openId ||
    authStore.user?.id ||
    ''
)

const applyQrUrl = computed(() => {
  const cstr = dataset.value.cstr || (route.params.id as string) || ''
  const uid = applyQrUid.value
  if (!uid || !cstr) return ''
  return buildIntentApplyQrUrl({ uid, cstr })
})

async function refreshApplyQr() {
  const url = applyQrUrl.value
  if (!url) {
    applyQrDataUrl.value = ''
    return
  }
  applyQrLoading.value = true
  try {
    applyQrDataUrl.value = await generateQRDataURL(url, 132, 'L')
  } catch {
    applyQrDataUrl.value = ''
  } finally {
    applyQrLoading.value = false
  }
}

watch(applyQrUrl, () => {
  void refreshApplyQr()
}, { immediate: true })

watch(applyQrUid, () => {
  void refreshApplyQr()
})

watch(
  () => route.params.id,
  () => {
    fetchDetail()
    void refreshApplyQr()
  }
)

watch(loading, (isLoading) => {
  if (!isLoading) void refreshApplyQr()
})

onMounted(() => {
  authStore.syncFromStorage()
  fetchDetail()
  fetchEvaluations()
  checkFavoriteStatus()
})
</script>

<style scoped>
.qr-container {
  position: relative;
  overflow: hidden;
  border-radius: 0.75rem;
}

.apply-qr-box {
  width: 8.25rem;
}

.apply-qr-box__frame {
  width: 8.25rem;
  height: 8.25rem;
  padding: 0.375rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.apply-qr-box__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.apply-qr-box__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 6.25rem;
  background: #f8fafc;
}

.apply-qr-box__placeholder--muted {
  color: #cbd5e1;
}

.apply-qr-box__label {
  margin-top: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #64748b;
  text-align: center;
  line-height: 1.3;
}

.apply-qr-box__hint {
  margin-top: 0.125rem;
  font-size: 0.625rem;
  color: #94a3b8;
  text-align: center;
}

.login-modal {
  position: relative;
  animation: modalSlideIn 0.3s ease-out;
}

.login-modal-close {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 9999px;
  background: transparent;
  color: #94a3b8;
  font-size: 1.25rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.login-modal-close:hover {
  background: #f1f5f9;
  color: #475569;
}

@keyframes modalSlideIn {
  from { opacity: 0; transform: scale(0.95) translateY(-10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.rich-text-content :deep(p) {
  margin: 0 0 0.75em;
}

.rich-text-content :deep(p:last-child) {
  margin-bottom: 0;
}

.rich-text-content :deep(ol),
.rich-text-content :deep(ul) {
  margin: 0.5em 0 0.75em;
  padding-left: 1.5em;
}

.rich-text-content :deep(li) {
  margin-bottom: 0.35em;
}

.rich-text-content :deep(strong) {
  font-weight: 700;
}

</style>
