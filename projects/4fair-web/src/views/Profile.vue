<template>
  <div class="user-center-page">
    <div class="bg-blob blob-1" aria-hidden="true" />
    <div class="bg-blob blob-2" aria-hidden="true" />

    <nav class="glass-nav fixed top-0 w-full z-50 hidden md:block">
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        <div class="flex items-center space-x-2 group cursor-pointer shrink-0 z-10" @click="router.push('/home')">
          <BrandLogo size="md" interactive />
          <span class="text-lg sm:text-xl font-bold tracking-tight text-slate-900">费尔空间</span>
        </div>
        <SiteTopNavLinks />
        <div class="flex items-center space-x-2 sm:space-x-4 shrink-0 z-10">
          <UserCenterNavButton active />
          <span class="hidden sm:inline text-sm text-slate-600">欢迎您，{{ authStore.displayName }}</span>
          <button
            type="button"
            class="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1"
            @click="handleLogout"
          >
            退出
          </button>
      </div>
      </div>
    </nav>

    <main class="user-center-main max-w-7xl mx-auto px-6">
      <h1 class="user-center-title">用户中心</h1>

      <div class="user-center-layout">
        <aside class="user-center-side">
          <button
            v-for="item in menuItems"
            :key="item.key"
            type="button"
            class="user-center-side__item"
            :class="{ 'is-active': activeTab === item.key }"
            @click="switchTab(item.key)"
          >
            <iconify-icon :icon="item.icon" />
            <span>{{ item.label }}</span>
          </button>
        </aside>

        <section class="user-center-panel tech-card">
          <!-- 我的账号 -->
          <div v-if="activeTab === 'account'">
            <div class="panel-head">
              <h2>用户详细信息</h2>
              <button
                v-if="!editing"
                type="button"
                class="panel-head__btn"
                @click="startEdit"
              >
                <iconify-icon icon="mdi:pencil-outline" />
                编辑资料
              </button>
            </div>

            <div v-if="profileLoading" class="panel-state">
              <iconify-icon icon="mdi:loading" class="animate-spin text-2xl" />
              <p>正在加载用户信息…</p>
            </div>

            <div v-else-if="profileError" class="panel-state panel-state--error">
              <p>{{ profileError }}</p>
              <button type="button" class="panel-head__btn" @click="loadProfile">重新加载</button>
            </div>

            <template v-else-if="profile">
              <div v-if="!editing" class="account-view">
                <div class="account-photo">
                  <span class="account-photo__avatar">{{ avatarInitial }}</span>
                  <div class="account-photo__meta">
                    <p class="account-photo__label">用户照片</p>
                    <p class="account-photo__hint">账号头像</p>
                    <p v-if="profile.role" class="account-photo__role">
                      <iconify-icon icon="mdi:shield-account-outline" />
                      {{ profile.role }}
                    </p>
                  </div>
                </div>

                <div class="account-grid">
                  <div v-for="row in accountDisplayRows" :key="row.label" class="account-field">
                    <span class="account-field__label">{{ row.label }}</span>
                    <span class="account-field__value">{{ row.value || '—' }}</span>
                  </div>
                </div>
              </div>

              <form v-else class="account-form" novalidate @submit.prevent="saveProfile">
                <div class="account-photo account-photo--edit">
                  <span class="account-photo__avatar">{{ avatarInitial }}</span>
                  <div class="account-photo__meta">
                    <p class="account-photo__label">用户照片</p>
                    <p class="account-photo__hint">头像暂不支持修改</p>
                    <p v-if="profile.role" class="account-photo__role">
                      <iconify-icon icon="mdi:shield-account-outline" />
                      {{ profile.role }}
                    </p>
                  </div>
                </div>

                <div class="account-form__grid">
                <AuthFormField
                  v-model="editForm.username"
                  icon="mdi:account-outline"
                  placeholder="账号"
                  type="email"
                  required
                  :error="fieldErrors.username"
                  @blur="touchField('username')"
                />
                <AuthFormField
                  v-model="editForm.email"
                  icon="mdi:email-outline"
                  placeholder="用户邮箱"
                  type="email"
                  :error="fieldErrors.email"
                  @blur="touchField('email')"
                />
                <AuthFormField
                  v-model="editForm.nickName"
                  icon="mdi:account-circle-outline"
                  placeholder="用户名称"
                  :error="fieldErrors.nickName"
                  @blur="touchField('nickName')"
                />
                <AuthFormField
                  v-model="editForm.name"
                  icon="mdi:card-account-details-outline"
                  placeholder="真实姓名"
                  required
                  :error="fieldErrors.name"
                  @blur="touchField('name')"
                />
                <AuthFormField
                  v-model="editForm.country"
                  icon="mdi:earth"
                  placeholder="国家地区"
                  :error="fieldErrors.country"
                  @blur="touchField('country')"
                />
                <AuthFormField
                  v-model="editForm.phone"
                  icon="mdi:cellphone"
                  placeholder="联系电话"
                  type="tel"
                  maxlength="11"
                  required
                  :error="fieldErrors.phone"
                  @blur="touchField('phone')"
                />
                <AuthSelectField
                  v-model="editForm.organization"
                  icon="mdi:office-building-outline"
                  placeholder="组织"
                  :options="orgTypeOptions"
                  required
                  :error="fieldErrors.organization"
                  @blur="touchField('organization')"
                />
                <AuthFormField
                  v-model="editForm.occupation"
                  icon="mdi:briefcase-outline"
                  placeholder="职业"
                  :error="fieldErrors.occupation"
                  @blur="touchField('occupation')"
                />
                <AuthFormField
                  v-model="editForm.title"
                  icon="mdi:badge-account-outline"
                  placeholder="职称"
                  :error="fieldErrors.title"
                  @blur="touchField('title')"
                />
                <AuthFormField
                  v-model="editForm.education"
                  icon="mdi:school-outline"
                  placeholder="学历"
                  :error="fieldErrors.education"
                  @blur="touchField('education')"
                />
                <AuthFormField
                  v-model="editForm.field"
                  icon="mdi:compass-outline"
                  placeholder="关注领域"
                  :error="fieldErrors.field"
                  @blur="touchField('field')"
                />
                <AuthFormField
                  v-model="editForm.orgName"
                  icon="mdi:bank-outline"
                  placeholder="所在单位"
                  required
                  :error="fieldErrors.orgName"
                  @blur="touchField('orgName')"
                />
                <AuthFormField
                  v-model="editForm.address"
                  icon="mdi:map-marker-outline"
                  placeholder="通讯地址"
                  required
                  :error="fieldErrors.address"
                  @blur="touchField('address')"
                />
                </div>

                <div class="account-form__actions">
                  <button type="button" class="account-form__btn account-form__btn--cancel" @click="cancelEdit">
                    取消
                  </button>
                  <button
                    type="submit"
                    class="account-form__btn account-form__btn--save"
                    :disabled="saving"
                  >
                    <iconify-icon v-if="saving" class="animate-spin" icon="mdi:loading" />
                    {{ saving ? '保存中…' : '保存修改' }}
                  </button>
                </div>
              </form>
            </template>
          </div>

          <!-- 数据集总览 -->
          <div v-else-if="activeTab === 'overview'">
            <div class="panel-head">
            <div>
                <h2>统计</h2>
                <p class="overview-sub">
                  {{ centerDisplayName }} · 浏览、下载、收藏汇总与评论
                </p>
              </div>
              <button
                type="button"
                class="panel-head__btn"
                :disabled="overviewLoading"
                @click="loadOverview(true)"
              >
                <iconify-icon :class="{ 'animate-spin': overviewLoading }" icon="mdi:refresh" />
                刷新
              </button>
            </div>

            <div v-if="overviewLoading" class="panel-state">
              <iconify-icon icon="mdi:loading" class="animate-spin text-2xl" />
              <p>正在加载统计数据…</p>
          </div>

            <div v-else-if="overviewError" class="panel-state panel-state--error">
              <p>{{ overviewError }}</p>
              <button type="button" class="panel-head__btn" @click="loadOverview(true)">重新加载</button>
        </div>

            <template v-else-if="overviewSummary">
              <div class="overview-kpis">
                <article
                  v-for="card in overviewKpiCards"
                  :key="card.key"
                  class="overview-kpi"
                  :class="`overview-kpi--${card.tone}`"
                >
                  <iconify-icon :icon="card.icon" class="overview-kpi__icon" />
                  <div>
                    <p class="overview-kpi__value font-num tabular-nums">{{ card.value }}</p>
                    <p class="overview-kpi__label">{{ card.label }}</p>
          </div>
                </article>
          </div>

              <div class="overview-comments-head">
                <h3>评论</h3>
                <span class="overview-comments-head__count">共 {{ institutionCommentsTotal }} 条</span>
          </div>

              <div v-if="institutionCommentsLoading && !institutionComments.length" class="panel-state panel-state--compact">
                <iconify-icon icon="mdi:loading" class="animate-spin text-xl" />
                <p>正在加载评论…</p>
          </div>

              <div
                v-else-if="institutionCommentsError && !institutionComments.length"
                class="panel-state panel-state--error panel-state--compact"
              >
                <p>{{ institutionCommentsError }}</p>
                <button type="button" class="panel-head__btn" @click="loadInstitutionComments(1)">
                  重新加载
                </button>
        </div>

              <div v-else-if="!institutionComments.length" class="panel-state panel-state--compact">
                <iconify-icon icon="mdi:comment-text-outline" class="text-3xl text-slate-300" />
                <p>暂无评论</p>
              </div>

              <div
                v-else
                ref="commentListRef"
                class="comment-list-wrap"
                @scroll="onCommentListScroll"
              >
                <div class="comment-list">
                  <article v-for="item in institutionComments" :key="item.id" class="comment-card">
                    <div class="comment-card__top">
                      <div v-if="item.score > 0" class="eval-stars" aria-label="评分">
                        <iconify-icon
                          v-for="i in 5"
                          :key="i"
                          :icon="i <= item.score ? 'mdi:star' : 'mdi:star-outline'"
                        />
              </div>
                      <time class="comment-card__time">{{ item.createdAt }}</time>
              </div>
                    <p class="comment-card__content">{{ item.content || '（无评论内容）' }}</p>
                    <div class="comment-card__meta">
                      <span
                        v-if="item.userName && item.userName !== item.datasetTitle"
                        class="comment-card__user"
                      >{{ item.userName }}</span>
                      <button
                        v-if="item.cstr"
                        type="button"
                        class="comment-card__dataset"
                        @click="openDataset(item.cstr)"
                      >
                        {{ item.datasetTitle }}
                      </button>
                      <span v-else class="comment-card__dataset-text">{{ item.datasetTitle }}</span>
              </div>
                  </article>
            </div>
                <div v-if="institutionCommentsLoadingMore" class="comment-list__footer">
                  <iconify-icon icon="mdi:loading" class="animate-spin" />
                  <span>加载更多…</span>
                </div>
                <div v-else-if="!institutionCommentsHasMore" class="comment-list__footer comment-list__footer--muted">
                  已加载全部评论
                </div>
              </div>
            </template>

            <div v-else class="panel-state">
              <iconify-icon icon="mdi:chart-box-outline" class="text-3xl text-slate-300" />
              <p>暂无统计数据</p>
            </div>
          </div>

          <!-- 我的收藏 -->
          <div v-else-if="activeTab === 'favorites'">
            <div class="panel-head">
              <h2>我的收藏</h2>
              <span class="panel-head__count">共 {{ favoritesTotal }} 条</span>
        </div>
            <ListState
              :loading="favoritesLoading"
              :error="favoritesError"
              :empty="!favorites.length"
              empty-text="暂无收藏的数据集"
            >
              <div class="dataset-grid">
                <article
                  v-for="item in favorites"
                  :key="item.id || item.cstr"
                  class="dataset-card"
                  @click="openDataset(item.cstr)"
                >
                  <div class="dataset-card__cover">
                    <img
                      v-if="item.coverUrl"
                      :src="item.coverUrl"
                      :alt="item.title"
                      @error="onFavoriteCoverError(item)"
                    />
                    <iconify-icon v-if="!item.coverUrl" icon="mdi:database" class="text-3xl text-slate-300" />
                  </div>
                  <div class="dataset-card__body">
                    <h3>{{ item.title }}</h3>
                    <p>{{ item.description }}</p>
                    <div class="dataset-card__foot">
                      <span>更新于 {{ item.updatedAt }}</span>
                      <button
                        type="button"
                        class="link-btn"
                        @click.stop="removeFavorite(item.cstr)"
                      >
                        取消收藏
                      </button>
                    </div>
                  </div>
                </article>
              </div>
              <PaginationBar
                :page="favoritesPage"
                :total-pages="favoritesTotalPages"
                @change="loadFavorites"
              />
            </ListState>
          </div>

          <!-- 我的评价 -->
          <div v-else-if="activeTab === 'evaluations'">
            <div class="panel-head">
              <h2>我的评价</h2>
              <span class="panel-head__count">共 {{ evaluationsTotal }} 条</span>
            </div>
            <ListState
              :loading="evaluationsLoading"
              :error="evaluationsError"
              :empty="!evaluations.length"
              empty-text="暂无评价记录"
            >
              <div class="record-list">
                <article v-for="item in evaluations" :key="item.id" class="record-card">
                  <div class="record-card__head">
                    <h3>{{ item.title }}</h3>
                    <div class="eval-stars">
                      <iconify-icon
                        v-for="i in 5"
                        :key="i"
                        :icon="i <= item.score ? 'mdi:star' : 'mdi:star-outline'"
                      />
                    </div>
                  </div>
                  <p class="record-card__desc">{{ item.content || '—' }}</p>
                  <div class="record-card__meta">
                    <span>CSTR：{{ item.cstr || '—' }}</span>
                    <span>评价时间：{{ item.createdAt }}</span>
                  </div>
                  <button
                    v-if="item.cstr"
                    type="button"
                    class="link-btn"
                    @click="openDataset(item.cstr)"
                  >
                    查看数据集
                  </button>
                </article>
              </div>
              <PaginationBar
                :page="evaluationsPage"
                :total-pages="evaluationsTotalPages"
                @change="loadEvaluations"
              />
            </ListState>
          </div>

          <!-- 我的申请 -->
          <div v-else-if="activeTab === 'myApply'">
            <div class="panel-head">
              <h2>我的申请</h2>
              <span class="panel-head__count">共 {{ myApplyTotal }} 条</span>
            </div>
            <ListState
              :loading="myApplyLoading"
              :error="myApplyError"
              :empty="!myApplyRecords.length"
              empty-text="暂无数据申请记录"
            >
              <div class="apply-table-wrap">
                <table class="apply-table">
                  <thead>
                    <tr>
                      <th>序号</th>
                      <th>数据集名称</th>
                      <th>申请人</th>
                      <th>开始时间</th>
                      <th>结束时间</th>
                      <th>状态</th>
                      <th>创建时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in myApplyRecords" :key="item.id">
                      <td>{{ (myApplyPage - 1) * PAGE_SIZE + idx + 1 }}</td>
                      <td class="apply-table__title">{{ item.dataSetTitle || '—' }}</td>
                      <td>{{ item.username || '—' }}</td>
                      <td>{{ item.startTime || '—' }}</td>
                      <td>{{ item.endTime || '—' }}</td>
                      <td>
                        <span class="apply-status" :class="`apply-status--${item.status.key}`">{{ item.status.label }}</span>
                      </td>
                      <td>{{ item.applyTime }}</td>
                      <td class="apply-table__ops">
                        <button type="button" class="apply-op-btn" @click="applyDetailItem = item">详情</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <PaginationBar
                :page="myApplyPage"
                :total-pages="myApplyTotalPages"
                :total="myApplyTotal"
                @change="loadMyApply"
              />
            </ListState>
          </div>

          <!-- 我的审批 -->
          <div v-else-if="activeTab === 'myAudit'">
            <div class="panel-head">
              <h2>我的审批</h2>
              <span class="panel-head__count">共 {{ myAuditTotal }} 条</span>
            </div>
            <ListState
              :loading="myAuditLoading"
              :error="myAuditError"
              :empty="!myAuditRecords.length"
              empty-text="暂无审批记录"
            >
              <div class="apply-table-wrap">
                <table class="apply-table">
                  <thead>
                    <tr>
                      <th>序号</th>
                      <th>数据集名称</th>
                      <th>申请人</th>
                      <th>开始时间</th>
                      <th>结束时间</th>
                      <th>状态</th>
                      <th>创建时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in myAuditRecords" :key="item.id">
                      <td>{{ (myAuditPage - 1) * PAGE_SIZE + idx + 1 }}</td>
                      <td class="apply-table__title">{{ item.dataSetTitle || '—' }}</td>
                      <td>{{ item.username || '—' }}</td>
                      <td>{{ item.startTime || '—' }}</td>
                      <td>{{ item.endTime || '—' }}</td>
                      <td>
                        <span class="apply-status" :class="`apply-status--${item.status.key}`">{{ item.status.label }}</span>
                      </td>
                      <td>{{ item.applyTime }}</td>
                      <td class="apply-table__ops">
                        <button v-if="item.status.key !== 'pending'" type="button" class="apply-op-btn" @click="applyDetailItem = item">详情</button>
                        <button v-else type="button" class="apply-op-btn apply-op-btn--pass" @click="openAuditModal(item)">审批</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <PaginationBar
                :page="myAuditPage"
                :total-pages="myAuditTotalPages"
                :total="myAuditTotal"
                @change="loadMyAudit"
              />
            </ListState>
          </div>


          <!-- 总数据中心节点 / 机构数据分析 -->
          <div v-else-if="activeTab === 'centers' && dataCenterAccess.canAccess">
            <DataCentersTablePanel
              ref="centersPanelRef"
              :access="dataCenterAccess"
              :institution-fallback-name="institutionFallbackName"
            />
          </div>

          <!-- 机构数据集配置（TPDC） -->
          <div v-else-if="activeTab === 'datasets' && canManageTpdcDatasets">
            <TpdcDatasetConfigPanel
              ref="tpdcPanelRef"
              @toast="(message, type) => showProfileToast(message, type)"
            />
          </div>

          <!-- 数据集在线分析统计 -->
          <div v-else-if="activeTab === 'toolStats'">
            <AnalysisToolStatsPanel ref="toolStatsPanelRef" />
          </div>
        </section>
      </div>
    </main>

    <Teleport to="body">
      <div v-if="applyDetailItem" class="apply-modal-overlay" @click.self="applyDetailItem = null">
        <div class="apply-modal">
          <div class="apply-modal__head">
            <h3>申请详情</h3>
            <button type="button" class="apply-modal__close" @click="applyDetailItem = null">&times;</button>
          </div>
          <div class="apply-modal__body">
            <div class="apply-modal__row"><span class="label">数据集名称</span><span class="value">{{ applyDetailItem.dataSetTitle || '—' }}</span></div>
            <div class="apply-modal__row"><span class="label">数据集ID</span><span class="value">{{ applyDetailItem.dataSetId || '—' }}</span></div>
            <div class="apply-modal__row"><span class="label">数据来源</span><span class="value">{{ applyDetailItem.dataSetSource || '—' }}</span></div>
            <div class="apply-modal__row"><span class="label">申请人</span><span class="value">{{ applyDetailItem.username || '—' }}</span></div>
            <div class="apply-modal__row"><span class="label">研究项目</span><span class="value">{{ applyDetailItem.researchProject || '—' }}</span></div>
            <div class="apply-modal__row"><span class="label">使用说明</span><span class="value">{{ applyDetailItem.instructions || '—' }}</span></div>
            <div class="apply-modal__row"><span class="label">使用承诺</span><span class="value">{{ applyDetailItem.commitment || '—' }}</span></div>
            <div class="apply-modal__row"><span class="label">开始时间</span><span class="value">{{ applyDetailItem.startTime || '—' }}</span></div>
            <div class="apply-modal__row"><span class="label">结束时间</span><span class="value">{{ applyDetailItem.endTime || '—' }}</span></div>
            <div class="apply-modal__row"><span class="label">创建时间</span><span class="value">{{ applyDetailItem.applyTime }}</span></div>
            <div class="apply-modal__row">
              <span class="label">状态</span>
              <span class="value"><span class="apply-status" :class="`apply-status--${applyDetailItem.status.key}`">{{ applyDetailItem.status.label }}</span></span>
            </div>
            <div class="apply-modal__row"><span class="label">审批意见</span><span class="value">{{ applyDetailItem.auditOpinion || '—' }}</span></div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="auditItem" class="apply-modal-overlay" @click.self="closeAuditModal">
        <div class="apply-modal apply-modal--audit">
          <div class="apply-modal__head">
            <h3>审批</h3>
            <button type="button" class="apply-modal__close" @click="closeAuditModal">&times;</button>
          </div>
          <div class="apply-modal__body">
            <div class="apply-modal__row"><span class="label">数据集名称</span><span class="value">{{ auditItem.dataSetTitle || '—' }}</span></div>
            <div class="apply-modal__row"><span class="label">数据集ID</span><span class="value">{{ auditItem.dataSetId || '—' }}</span></div>
            <div class="apply-modal__row"><span class="label">数据来源</span><span class="value">{{ auditItem.dataSetSource || '—' }}</span></div>
            <div class="apply-modal__row"><span class="label">申请人</span><span class="value">{{ auditItem.username || '—' }}</span></div>
            <div class="apply-modal__row"><span class="label">研究项目</span><span class="value">{{ auditItem.researchProject || '—' }}</span></div>
            <div class="apply-modal__row"><span class="label">使用说明</span><span class="value">{{ auditItem.instructions || '—' }}</span></div>
            <div class="apply-modal__row"><span class="label">使用承诺</span><span class="value">{{ auditItem.commitment || '—' }}</span></div>
            <div class="apply-modal__row"><span class="label">开始时间</span><span class="value">{{ auditItem.startTime || '—' }}</span></div>
            <div class="apply-modal__row"><span class="label">结束时间</span><span class="value">{{ auditItem.endTime || '—' }}</span></div>
            <div class="apply-modal__row"><span class="label">创建时间</span><span class="value">{{ auditItem.applyTime }}</span></div>
            <div class="audit-form">
              <div class="audit-form__row">
                <span class="audit-form__label">审批状态</span>
                <div class="audit-form__radios">
                  <label class="audit-radio">
                    <input type="radio" value="approved" v-model="auditStatus" />
                    <span>通过</span>
                  </label>
                  <label class="audit-radio">
                    <input type="radio" value="rejected" v-model="auditStatus" />
                    <span>拒绝</span>
                  </label>
                </div>
              </div>
              <div class="audit-form__row">
                <span class="audit-form__label">审批意见</span>
                <textarea
                  v-model="auditOpinion"
                  class="audit-form__textarea"
                  maxlength="500"
                  rows="4"
                  placeholder="请输入审批意见（不超过500字）"
                ></textarea>
              </div>
            </div>
          </div>
          <div class="apply-modal__foot">
            <button type="button" class="apply-modal__btn apply-modal__btn--cancel" @click="closeAuditModal">取消</button>
            <button type="button" class="apply-modal__btn apply-modal__btn--pass" :disabled="auditSubmitting" @click="submitAudit">
              <iconify-icon v-if="auditSubmitting" class="animate-spin" icon="mdi:loading" />
              {{ auditSubmitting ? '提交中…' : '提交' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Transition name="profile-toast">
      <div
        v-if="profileToast.visible"
        class="profile-toast"
        :class="profileToast.type === 'success' ? 'profile-toast--success' : 'profile-toast--error'"
        role="status"
        aria-live="polite"
      >
        <iconify-icon
          :icon="profileToast.type === 'success' ? 'mdi:check-circle-outline' : 'mdi:alert-circle-outline'"
        />
        <span>{{ profileToast.message }}</span>
      </div>
    </Transition>

    <AppFooter />
    <SiteBottomTabBar />
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BrandLogo from '@/components/BrandLogo.vue'
import AppFooter from '@/components/AppFooter.vue'
import SiteBottomTabBar from '@/components/SiteBottomTabBar.vue'
import SiteTopNavLinks from '@/components/SiteTopNavLinks.vue'
import UserCenterNavButton from '@/components/UserCenterNavButton.vue'
import AuthFormField from '@/components/AuthFormField.vue'
import AuthSelectField from '@/components/AuthSelectField.vue'
import TpdcDatasetConfigPanel from '@/components/TpdcDatasetConfigPanel.vue'
import DataCentersTablePanel from '@/components/DataCentersTablePanel.vue'
import AnalysisToolStatsPanel from '@/components/AnalysisToolStatsPanel.vue'
import { useAuthStore } from '@/stores/auth'
import { updateUserProfile, type OrgType } from '@/utils/accountAuth'
import { assetDetailPath, normalizeCstr } from '@/utils/cstrUrl'
import { resolveApplicantUidFromUser } from '@/utils/resolveApplicantUid'
import { isTpdcInstitution } from '@/utils/tpdcDataConfigApi'
import { resolveDataCenterAccess } from '@/utils/dataCenterAccess'
import {
  fetchInstitutionComments,
  fetchInstitutionCountStatistics,
  fetchDatasetApplyList,

  auditDatasetApply,
  fetchDatasetAuditList,
  fetchFavoriteDatasets,
  fetchUserEvaluations,
  fetchUserProfileDetail,
  profileToEditForm,
  type DatasetApplyRecord,
  type DatasetCardItem,
  type DatasetOverviewSummary,
  type EvaluationItem,
  type InstitutionCommentItem,
  type UserProfileDetail
} from '@/utils/userCenterApi'

type TabKey =
  | 'account'
  | 'overview'
  | 'favorites'
  | 'evaluations'
  | 'datasets'
  | 'centers'
  | 'toolStats'
  | 'myApply'
  | 'myAudit'
type MenuItem = { key: TabKey; label: string; icon: string }
type FormField =
  | 'username'
  | 'email'
  | 'nickName'
  | 'name'
  | 'country'
  | 'organization'
  | 'occupation'
  | 'phone'
  | 'title'
  | 'education'
  | 'field'
  | 'orgName'
  | 'address'

const formFields: FormField[] = [
  'username',
  'email',
  'nickName',
  'name',
  'country',
  'phone',
  'organization',
  'occupation',
  'title',
  'education',
  'field',
  'orgName',
  'address'
]

const PAGE_SIZE = 10

const baseMenuItems: MenuItem[] = [
  { key: 'overview', label: '统计', icon: 'mdi:chart-box-outline' },
  { key: 'account', label: '我的账号', icon: 'mdi:account-outline' },
  { key: 'favorites', label: '我的收藏', icon: 'mdi:heart-outline' },
  { key: 'evaluations', label: '我的评价', icon: 'mdi:star-outline' }
]

const orgTypes: OrgType[] = ['科研院所', '高校', '政府机构', '企业', '其他']
const orgTypeOptions = orgTypes.map((item) => ({ label: item, value: item }))

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const activeTab = ref<TabKey>('account')
const ownerUid = computed(() => resolveApplicantUidFromUser(authStore.user))
const ownerOpenId = computed(() => authStore.user?.openId || '')

const profile = ref<UserProfileDetail | null>(null)
const profileLoading = ref(false)
const profileError = ref('')
const editing = ref(false)
const saving = ref(false)

const canManageTpdcDatasets = computed(() => isTpdcInstitution(profile.value))
const canAudit = computed(() => /管理员|审批/.test(String(profile.value?.role || '').trim()))
const dataCenterAccess = computed(() => resolveDataCenterAccess(profile.value))
const institutionFallbackName = computed(
  () =>
    profile.value?.institution?.trim() ||
    profile.value?.orgName?.trim() ||
    profile.value?.affiliation?.trim() ||
    '当前机构'
)
const menuItems = computed(() => {
  const items: MenuItem[] = [...baseMenuItems]
  if (dataCenterAccess.value.canAccess) {
    items.push({
      key: 'centers',
      label: dataCenterAccess.value.menuLabel,
      icon: dataCenterAccess.value.mode === 'all' ? 'mdi:sitemap' : 'mdi:chart-timeline-variant'
    })
  }
  if (canManageTpdcDatasets.value) {
    items.push({
      key: 'datasets',
      label: '数据集列表',
      icon: 'mdi:database-outline'
    })
  }
  items.push({
    key: 'toolStats',
    label: '数据集在线分析统计',
    icon: 'mdi:chart-line'
  })
  items.push({
    key: 'myApply',
    label: '我的申请',
    icon: 'mdi:file-document-multiple-outline'
  })
  if (canAudit.value) {
    items.push({
      key: 'myAudit',
      label: '我的审批',
      icon: 'mdi:clipboard-check-outline'
    })
  }
  return items
})
const tpdcPanelRef = ref<{ reload: () => Promise<void> } | null>(null)
const centersPanelRef = ref<{ reload: () => Promise<void> } | null>(null)
const toolStatsPanelRef = ref<{ reload: () => void } | null>(null)

const profileToast = reactive({
  visible: false,
  message: '',
  type: 'success' as 'success' | 'error'
})

let profileToastTimer: ReturnType<typeof setTimeout> | null = null

function showProfileToast(message: string, type: 'success' | 'error' = 'success') {
  if (profileToastTimer) {
    clearTimeout(profileToastTimer)
    profileToastTimer = null
  }
  profileToast.message = message
  profileToast.type = type
  profileToast.visible = true
  profileToastTimer = setTimeout(() => {
    profileToast.visible = false
    profileToastTimer = null
  }, type === 'success' ? 3000 : 4500)
}

const editForm = reactive({
  username: '',
  email: '',
  nickName: '',
  name: '',
  country: '',
  organization: '' as OrgType | '',
  occupation: '',
  phone: '',
  title: '',
  education: '',
  field: '',
  orgName: '',
  address: ''
})

const fieldErrors = reactive<Record<FormField, string>>({
  username: '',
  email: '',
  nickName: '',
  name: '',
  country: '',
  organization: '',
  occupation: '',
  phone: '',
  title: '',
  education: '',
  field: '',
  orgName: '',
  address: ''
})

const touched = reactive<Record<FormField, boolean>>(
  Object.fromEntries(formFields.map((f) => [f, false])) as Record<FormField, boolean>
)

const favorites = ref<DatasetCardItem[]>([])
const favoritesPage = ref(1)
const favoritesTotal = ref(0)
const favoritesLoading = ref(false)
const favoritesError = ref('')

const evaluations = ref<EvaluationItem[]>([])
const evaluationsPage = ref(1)
const evaluationsTotal = ref(0)
const evaluationsLoading = ref(false)
const evaluationsError = ref('')

const myApplyRecords = ref<DatasetApplyRecord[]>([])
const myApplyPage = ref(1)
const myApplyTotal = ref(0)
const myApplyLoading = ref(false)
const myApplyError = ref('')

const myAuditRecords = ref<DatasetApplyRecord[]>([])
const myAuditPage = ref(1)
const myAuditTotal = ref(0)
const myAuditLoading = ref(false)
const myAuditError = ref('')
const applyDetailItem = ref<DatasetApplyRecord | null>(null)
const auditItem = ref<DatasetApplyRecord | null>(null)
const auditStatus = ref<'approved' | 'rejected'>('approved')
const auditOpinion = ref('')
const auditSubmitting = ref(false)

const overviewSummary = ref<DatasetOverviewSummary | null>(null)
const institutionComments = ref<InstitutionCommentItem[]>([])
const institutionCommentsPage = ref(1)
const institutionCommentsTotal = ref(0)
const institutionCommentsLoading = ref(false)
const institutionCommentsLoadingMore = ref(false)
const institutionCommentsError = ref('')
const commentListRef = ref<HTMLElement | null>(null)
const overviewLoading = ref(false)
const overviewError = ref('')
const overviewLoaded = ref(false)

const centerDisplayName = computed(
  () => profile.value?.institution || profile.value?.orgName || profile.value?.affiliation || '机构信息'
)

const institutionCommentsHasMore = computed(
  () => institutionComments.value.length < institutionCommentsTotal.value
)

function resolveInstitutionName(): string {
  return (
    profile.value?.institution?.trim() ||
    profile.value?.orgName?.trim() ||
    profile.value?.affiliation?.trim() ||
    ''
  )
}

const overviewKpiCards = computed(() => {
  const s = overviewSummary.value
  if (!s) return []
  return [
    { key: 'visit', label: '总浏览量', value: formatOverviewNum(s.visitTotal), icon: 'mdi:eye-outline', tone: 'cyan' },
    { key: 'download', label: '总下载量', value: formatOverviewNum(s.downloadTotal), icon: 'mdi:download-outline', tone: 'indigo' },
    { key: 'favorite', label: '总收藏量', value: formatOverviewNum(s.favoriteTotal), icon: 'mdi:heart-outline', tone: 'rose' },
    {
      key: 'comment',
      label: '总评论数',
      value: formatOverviewNum(institutionCommentsTotal.value),
      icon: 'mdi:comment-text-outline',
      tone: 'amber'
    }
  ]
})

function formatOverviewNum(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return value.toLocaleString('en-US')
}

const avatarInitial = computed(() => {
  const name = profile.value?.name || authStore.displayName || '?'
  return name.charAt(0).toUpperCase()
})

const accountDisplayRows = computed(() => {
  if (!profile.value) return []
  const p = profile.value
  return [
    { label: '账号', value: p.username },
    { label: '用户邮箱', value: p.email },
    { label: '用户名称', value: p.nickName },
    { label: '真实姓名', value: p.name },

    { label: '国家地区', value: p.country },
    { label: '联系电话', value: p.phone },
    { label: '组织', value: p.organization },
    { label: '职业', value: p.occupation },
    { label: '职称', value: p.title },
    { label: '学历', value: p.education },
    { label: '关注领域', value: p.field },
    { label: '所在单位', value: p.orgName },
    { label: '通讯地址', value: p.address }
  ]
})

const favoritesTotalPages = computed(() => Math.max(1, Math.ceil(favoritesTotal.value / PAGE_SIZE)))
const evaluationsTotalPages = computed(() => Math.max(1, Math.ceil(evaluationsTotal.value / PAGE_SIZE)))
const myApplyTotalPages = computed(() => Math.max(1, Math.ceil(myApplyTotal.value / PAGE_SIZE)))
const myAuditTotalPages = computed(() => Math.max(1, Math.ceil(myAuditTotal.value / PAGE_SIZE)))

const ListState = defineComponent({
  name: 'ListState',
  props: {
    loading: { type: Boolean, default: false },
    error: { type: String, default: '' },
    empty: { type: Boolean, default: false },
    emptyText: { type: String, default: '暂无数据' }
  },
  setup(props, { slots }) {
    return () => {
      if (props.loading) {
        return h('div', { class: 'panel-state' }, [
          h('iconify-icon', { icon: 'mdi:loading', class: 'animate-spin text-2xl' }),
          h('p', '加载中…')
        ])
      }
      if (props.error) {
        return h('div', { class: 'panel-state panel-state--error' }, [h('p', props.error)])
      }
      if (props.empty) {
        return h('div', { class: 'panel-state' }, [h('p', props.emptyText)])
      }
      return slots.default?.()
    }
  }
})

const PaginationBar = defineComponent({
  name: 'PaginationBar',
  props: {
    page: { type: Number, required: true },
    totalPages: { type: Number, required: true },
    total: { type: Number, default: -1 }
  },
  emits: ['change'],
  setup(props, { emit }) {
    return () => {
      const showFull = props.total >= 0
      if (props.totalPages <= 1 && !showFull) return null

      const children: ReturnType<typeof h>[] = []

      if (showFull) {
        children.push(h('span', { class: 'pagination__total' }, `共 ${props.total} 条`))
      }

      children.push(
        h(
          'button',
          {
            type: 'button',
            disabled: props.page <= 1,
            onClick: () => emit('change', props.page - 1)
          },
          '上一页'
        )
      )

      if (showFull) {
        const tp = props.totalPages
        const cp = props.page
        const pages: number[] = []
        if (tp <= 7) {
          for (let i = 1; i <= tp; i++) pages.push(i)
        } else {
          pages.push(1)
          if (cp > 3) pages.push(-1)
          for (let i = Math.max(2, cp - 1); i <= Math.min(tp - 1, cp + 1); i++) pages.push(i)
          if (cp < tp - 2) pages.push(-1)
          pages.push(tp)
        }
        for (const p of pages) {
          if (p === -1) {
            children.push(h('span', { class: 'pagination__ellipsis' }, '…'))
          } else {
            children.push(
              h(
                'button',
                {
                  type: 'button',
                  class: ['pagination__page', p === cp ? 'pagination__page--active' : ''],
                  onClick: () => emit('change', p)
                },
                String(p)
              )
            )
          }
        }
      } else {
        children.push(h('span', `${props.page} / ${props.totalPages}`))
      }

      children.push(
        h(
          'button',
          {
            type: 'button',
            disabled: props.page >= props.totalPages,
            onClick: () => emit('change', props.page + 1)
          },
          '下一页'
        )
      )

      return h('div', { class: 'pagination' }, children)
    }
  }
})

function switchTab(key: TabKey) {
  activeTab.value = key
  router.replace({ query: { ...route.query, tab: key } })
  loadTabData(key)
}

function openDataset(cstr: string) {
  const href = assetDetailPath(cstr)
  if (!href) return
  window.open(href, '_blank', 'noopener,noreferrer')
}

function onFavoriteCoverError(item: DatasetCardItem) {
  item.coverUrl = ''
}

function handleLogout() {
  profile.value = null
  profileError.value = ''
  editing.value = false
  overviewSummary.value = null
  institutionComments.value = []
  institutionCommentsTotal.value = 0
  institutionCommentsPage.value = 1
  institutionCommentsError.value = ''
  institutionCommentsLoadingMore.value = false
  overviewLoaded.value = false
  favorites.value = []
  evaluations.value = []
  authStore.logout()
}

function touchField(field: FormField) {
  touched[field] = true
  fieldErrors[field] = validateField(field)
}

function validateField(field: FormField): string {
  if (field === 'username') {
    if (!editForm.username.trim()) return '请输入账号'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.username.trim())) return '账号邮箱格式不正确'
  }
  if (field === 'email') {
    const email = editForm.email.trim()
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '邮箱格式不正确'
  }
  if (field === 'name' && !editForm.name.trim()) return '请输入真实姓名'
  if (field === 'organization' && !editForm.organization) return '请选择组织'
  if (field === 'phone') {
    if (!editForm.phone.trim()) return '请输入联系电话'
    if (!/^1\d{10}$/.test(editForm.phone.trim())) return '请输入11位手机号'
  }
  if (field === 'orgName' && !editForm.orgName.trim()) return '请输入所在单位'
  if (field === 'address' && !editForm.address.trim()) return '请输入通讯地址'
  return ''
}

function validateForm(): boolean {
  let ok = true
  formFields.forEach((f) => {
    touched[f] = true
    const err = validateField(f)
    fieldErrors[f] = err
    if (err) ok = false
  })
  return ok
}

watch(
  editForm,
  () => {
    if (editForm.phone && !/^\d*$/.test(editForm.phone)) {
      editForm.phone = editForm.phone.replace(/\D/g, '').slice(0, 11)
    }
    formFields.forEach((field) => {
      if (touched[field]) {
        fieldErrors[field] = validateField(field)
      }
    })
  },
  { deep: true }
)

async function loadProfile() {
  if (!ownerUid.value) {
    profileError.value = '未获取到用户标识，请重新登录'
    return
  }

  profileLoading.value = true
  profileError.value = ''
  try {
    const data = await fetchUserProfileDetail(ownerUid.value, ownerOpenId.value)
    if (!data) throw new Error('未查询到用户信息')
    profile.value = data
    const requested = String(route.query.tab || '')
    const access = resolveDataCenterAccess(data)
    if (requested === 'centers' && access.canAccess && activeTab.value !== 'centers') {
      activeTab.value = 'centers'
    } else if (activeTab.value === 'centers' && !access.canAccess) {
      activeTab.value = 'account'
      router.replace({ query: { ...route.query, tab: 'account' } })
    } else if (requested === 'datasets' && isTpdcInstitution(data) && activeTab.value !== 'datasets') {
      activeTab.value = 'datasets'
    } else if (activeTab.value === 'datasets' && !isTpdcInstitution(data)) {
      activeTab.value = 'account'
      router.replace({ query: { ...route.query, tab: 'account' } })
    }
  } catch (e: unknown) {
    profile.value = null
    profileError.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    profileLoading.value = false
  }
}

function startEdit() {
  if (!profile.value) return
  const form = profileToEditForm(profile.value)
  Object.assign(editForm, form)
  formFields.forEach((f) => {
    touched[f] = false
    fieldErrors[f] = ''
  })
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

async function saveProfile() {
  if (!validateForm() || !profile.value) {
    showProfileToast('请检查并完善表单信息', 'error')
    return
  }

  saving.value = true

  try {
    const result = await updateUserProfile({
      openId: ownerOpenId.value,
      uid: ownerUid.value,
      username: editForm.username.trim(),
      email: editForm.email.trim() || editForm.username.trim(),
      nickName: editForm.nickName.trim(),
      name: editForm.name.trim(),
      organization: editForm.organization as OrgType,
      occupation: editForm.occupation.trim(),
      country: editForm.country.trim(),
      phone: editForm.phone.trim(),
      title: editForm.title.trim(),
      education: editForm.education.trim(),
      field: editForm.field.trim(),
      orgName: editForm.orgName.trim(),
      address: editForm.address.trim()
    })

    authStore.setUser({
      ...authStore.user!,
      nickname: result.name || editForm.nickName.trim() || result.username,
      displayName: result.name || editForm.nickName.trim() || result.username,
      loginName: result.username,
      affiliation: result.affiliation || editForm.orgName.trim(),
      phone: result.phone,
      source: result.source || editForm.organization || '',
      uid: result.uid || ownerUid.value
    })

    await loadProfile()
    editing.value = false
    showProfileToast('资料保存成功', 'success')
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '保存失败，请稍后重试'
    showProfileToast(message, 'error')
  } finally {
    saving.value = false
  }
}

async function loadInstitutionComments(page = 1, append = false) {
  const institution = resolveInstitutionName()
  if (!institution) {
    if (!append) institutionCommentsError.value = '未获取到机构信息'
    return
  }

  if (append) {
    if (institutionCommentsLoadingMore.value || institutionCommentsLoading.value) return
    if (!institutionCommentsHasMore.value) return
    institutionCommentsLoadingMore.value = true
  } else {
    institutionCommentsLoading.value = true
    institutionCommentsError.value = ''
  }

  try {
    const res = await fetchInstitutionComments(institution, page, PAGE_SIZE)
    institutionCommentsTotal.value = res.total
    institutionCommentsPage.value = page
    if (append) {
      const existingIds = new Set(institutionComments.value.map((item) => item.id))
      institutionComments.value.push(...res.rows.filter((item) => !existingIds.has(item.id)))
    } else {
      institutionComments.value = res.rows
    }
  } catch (e: unknown) {
    if (!append) {
      institutionComments.value = []
      institutionCommentsError.value = e instanceof Error ? e.message : '加载评论失败'
    }
  } finally {
    if (append) {
      institutionCommentsLoadingMore.value = false
    } else {
      institutionCommentsLoading.value = false
    }
  }
}

function onCommentListScroll(event: Event) {
  const el = event.target as HTMLElement
  if (!institutionCommentsHasMore.value) return
  if (institutionCommentsLoadingMore.value || institutionCommentsLoading.value) return

  const threshold = 48
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
    void loadInstitutionComments(institutionCommentsPage.value + 1, true)
  }
}

async function loadOverview(force = false) {
  if (!ownerUid.value) {
    overviewError.value = '未获取到用户标识，请重新登录'
    return
  }
  if (overviewLoading.value) return
  if (overviewLoaded.value && !force) return

  overviewLoading.value = true
  overviewError.value = ''
  try {
    if (!profile.value) await loadProfile()

    const institution = resolveInstitutionName()
    if (!institution) {
      throw new Error('未获取到机构信息，无法加载统计')
    }

    const [summary] = await Promise.all([
      fetchInstitutionCountStatistics(institution),
      loadInstitutionComments(1)
    ])
    overviewSummary.value = summary
    overviewLoaded.value = true
  } catch (e: unknown) {
    overviewSummary.value = null
    overviewError.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    overviewLoading.value = false
  }
}

async function loadFavorites(page = favoritesPage.value) {
  if (!ownerUid.value) return
  favoritesLoading.value = true
  favoritesError.value = ''
  try {
    const res = await fetchFavoriteDatasets(ownerUid.value, page, PAGE_SIZE)
    favorites.value = res.rows
    favoritesTotal.value = res.total
    favoritesPage.value = page
  } catch (e: unknown) {
    favorites.value = []
    favoritesError.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    favoritesLoading.value = false
  }
}

async function removeFavorite(cstr: string) {
  if (!ownerUid.value || !cstr) return
  try {
    const res = await fetch(
      `/tds-trading/order/favorite.remove?uid=${encodeURIComponent(ownerUid.value)}&cstr=${encodeURIComponent(normalizeCstr(cstr))}`,
      { method: 'DELETE' },
    )
    const json = await res.json()
    if (json.code === 200) {
      await loadFavorites(favoritesPage.value)
    }
  } catch {
    /* ignore */
  }
}

async function loadEvaluations(page = evaluationsPage.value) {
  if (!ownerUid.value) return
  evaluationsLoading.value = true
  evaluationsError.value = ''
  try {
    const res = await fetchUserEvaluations(ownerUid.value, page, PAGE_SIZE)
    evaluations.value = res.rows
    evaluationsTotal.value = res.total
    evaluationsPage.value = page
  } catch (e: unknown) {
    evaluations.value = []
    evaluationsError.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    evaluationsLoading.value = false
  }
}

async function loadMyApply(page = myApplyPage.value) {
  if (!ownerUid.value) return
  myApplyLoading.value = true
  myApplyError.value = ''
  try {
    const res = await fetchDatasetApplyList(ownerUid.value, page, PAGE_SIZE)
    myApplyRecords.value = res.rows
    myApplyTotal.value = res.total
    myApplyPage.value = page
  } catch (e: unknown) {
    myApplyRecords.value = []
    myApplyError.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    myApplyLoading.value = false
  }
}

async function loadMyAudit(page = myAuditPage.value) {
  if (!ownerUid.value) return
  myAuditLoading.value = true
  myAuditError.value = ''
  try {
    const res = await fetchDatasetAuditList(ownerUid.value, page, PAGE_SIZE)
    myAuditRecords.value = res.rows
    myAuditTotal.value = res.total
    myAuditPage.value = page
  } catch (e: unknown) {
    myAuditRecords.value = []
    myAuditError.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    myAuditLoading.value = false
  }
}

function openAuditModal(item: DatasetApplyRecord) {
  auditItem.value = item
  auditStatus.value = 'approved'
  auditOpinion.value = ''
}

function closeAuditModal() {
  auditItem.value = null
}

async function submitAudit() {
  if (!auditItem.value) return
  auditSubmitting.value = true
  try {
    await auditDatasetApply({
      applyId: auditItem.value.id,
      uid: ownerUid.value,
      reason: auditOpinion.value,
      status: auditStatus.value === 'approved' ? 1 : 2
    })
    closeAuditModal()
    await loadMyAudit(myAuditPage.value)
  } catch (e: unknown) {
    myAuditError.value = e instanceof Error ? e.message : '审批失败'
  } finally {
    auditSubmitting.value = false
  }
}

function loadTabData(tab: TabKey) {
  if (tab === 'account' && !profile.value && !profileLoading.value) loadProfile()
  if (tab === 'overview') void loadOverview()
  if (tab === 'favorites' && !favoritesLoading.value) loadFavorites(1)
  if (tab === 'evaluations' && !evaluationsLoading.value) loadEvaluations(1)
  if (tab === 'centers') void centersPanelRef.value?.reload()
  if (tab === 'datasets') void tpdcPanelRef.value?.reload()
  if (tab === 'toolStats') toolStatsPanelRef.value?.reload()
  if (tab === 'myApply' && !myApplyLoading.value) loadMyApply(1)
  if (tab === 'myAudit' && !myAuditLoading.value) loadMyAudit(1)
}

function resolveTabFromRoute(): TabKey {
  const tab = String(route.query.tab || '')
  if (menuItems.value.some((m) => m.key === tab)) return tab as TabKey
  return 'account'
}

onMounted(() => {
  authStore.syncFromStorage()
  activeTab.value = resolveTabFromRoute()
  loadProfile()
  if (activeTab.value !== 'account') loadTabData(activeTab.value)
})

onUnmounted(() => {
  if (profileToastTimer) clearTimeout(profileToastTimer)
})

watch(
  () => route.query.tab,
  () => {
    const tab = resolveTabFromRoute()
    if (tab !== activeTab.value) {
      activeTab.value = tab
      loadTabData(tab)
    }
  }
)
</script>

<style scoped>
.user-center-page {
  min-height: 100vh;
  background: var(--fs-bg, #f8fafc);
  padding-top: 1rem;
  padding-bottom: calc(3.75rem + env(safe-area-inset-bottom, 0px));
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: clip;
}

@media (min-width: 768px) {
  .user-center-page {
    padding-top: 4rem;
    padding-bottom: 0;
  }
}

.user-center-main {
  padding: 1rem 0.75rem 3rem;
}

@media (min-width: 768px) {
  .user-center-main {
    padding: 2rem 1.5rem 3rem;
  }
}

.user-center-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 1.25rem;
}

.user-center-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 1.25rem;
  align-items: start;
}

.user-center-side {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-center-side__item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  transition: all 0.2s;
}

.user-center-side__item:hover {
  background: #f1f5f9;
  color: #2563eb;
}

.user-center-side__item.is-active {
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: #fff;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25);
}

.user-center-panel {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1.5rem;
  min-height: 520px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.panel-head h2 {
  font-size: 1.125rem;
  font-weight: 800;
  color: #0f172a;
}

.panel-head__count {
  font-size: 0.75rem;
  color: #94a3b8;
}

.panel-head__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.9rem;
  border-radius: 0.5rem;
  border: 1px solid #cbd5e1;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
  background: #fff;
}

.panel-head__btn:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.panel-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 240px;
  color: #94a3b8;
  font-size: 0.875rem;
}

.panel-state--error {
  color: #ef4444;
}

.panel-state--compact {
  min-height: 140px;
}

.account-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.account-photo {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.75rem;
}

.account-photo__avatar {
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  font-weight: 800;
}

.account-photo__label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #334155;
}

.account-photo__hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.15rem;
}

.account-photo__role {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.55rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 700;
}

.account-photo--edit {
  margin-bottom: 0.25rem;
}

.account-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem 1.5rem;
}

.account-field {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 0.75rem;
  padding: 0.65rem 0;
  border-bottom: 1px dashed #f1f5f9;
  font-size: 0.875rem;
}

.account-field__label {
  color: #64748b;
}

.account-field__value {
  color: #0f172a;
  font-weight: 500;
}

.account-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.account-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem 1.25rem;
}

.account-form__actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.account-form__btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-height: 2.75rem;
  padding: 0.625rem 1.25rem;
  border-radius: 0.625rem;
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
}

.account-form__btn--cancel {
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
}

.account-form__btn--cancel:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
  color: #334155;
}

.account-form__btn--save {
  border: none;
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 10px 22px -8px rgba(37, 99, 235, 0.65);
}

.account-form__btn--save:hover:not(:disabled) {
  background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 12px 26px -8px rgba(37, 99, 235, 0.72);
}

.account-form__btn--save:disabled {
  opacity: 0.68;
  cursor: not-allowed;
  box-shadow: 0 6px 16px -8px rgba(37, 99, 235, 0.45);
}

.form-msg {
  font-size: 0.8125rem;
}

.form-msg--error {
  color: #ef4444;
}

.form-msg--ok {
  color: #059669;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.apply-table-wrap {
  overflow-x: auto;
}

.apply-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.apply-table th {
  text-align: left;
  padding: 0.625rem 0.75rem;
  font-weight: 600;
  color: #475569;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.apply-table td {
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}

.apply-table__title {
  font-weight: 600;
  color: #0f172a;
  max-width: 18rem;
}

.apply-table__ops {
  text-align: center;
  white-space: nowrap;
}

.apply-op-btn + .apply-op-btn {
  margin-left: 0.5rem;
}

.apply-op-btn {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 0.375rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}

.apply-op-btn:hover {
  border-color: #94a3b8;
  background: #f1f5f9;
  color: #1e293b;
}

.apply-op-btn--pass {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
}

.apply-op-btn--pass:hover {
  background: #dcfce7;
  border-color: #86efac;
}

.apply-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.apply-modal {
  background: #fff;
  border-radius: 0.75rem;
  width: 100%;
  max-width: 44rem;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
}

.apply-modal--confirm {
  max-width: 24rem;
}

.apply-modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
}

.apply-modal__head h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}

.apply-modal__close {
  font-size: 1.25rem;
  line-height: 1;
  color: #94a3b8;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
}

.apply-modal__close:hover {
  color: #475569;
}

.apply-modal__body {
  padding: 1rem 1.25rem;
}

.apply-modal__row {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f8fafc;
}

.apply-modal__row .label {
  flex-shrink: 0;
  width: 6rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #1e293b;
  background: #f1f5f9;
  border-left: 3px solid #6366f1;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.apply-modal__row .value {
  font-size: 0.8125rem;
  color: #334155;
  flex: 1;
  word-break: break-all;
}

.apply-confirm-text {
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.6;
}

.apply-modal__foot {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  border-top: 1px solid #f1f5f9;
}

.apply-modal__btn {
  font-size: 0.8125rem;
  padding: 0.4rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s;
}

.apply-modal__btn--cancel {
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
}

.apply-modal__btn--cancel:hover {
  background: #f8fafc;
}

.apply-modal__btn--pass {
  border: none;
  background: #16a34a;
  color: #fff;
}

.apply-modal__btn--pass:hover {
  background: #15803d;
}

.apply-modal__btn--pass:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.apply-modal--audit {
  max-width: 44rem;
}

.audit-form {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.audit-form__row {
  padding: 0.5rem 0;
}

.audit-form__label {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  margin-bottom: 0.5rem;
}

.audit-form__radios {
  display: flex;
  gap: 1.5rem;
}

.audit-radio {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  font-size: 0.8125rem;
  color: #334155;
}

.audit-radio input[type='radio'] {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.audit-form__textarea {
  width: 100%;
  font-size: 0.8125rem;
  color: #334155;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s;
  font-family: inherit;
}

.audit-form__textarea:focus {
  border-color: #6366f1;
}

.record-card {
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1rem;
  background: #fff;
}

.record-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.record-card__head h3 {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #0f172a;
}

.apply-status {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  white-space: nowrap;
}

.apply-status--approved {
  background: #dcfce7;
  color: #166534;
}

.apply-status--rejected {
  background: #fee2e2;
  color: #991b1b;
}

.apply-status--pending {
  background: #fef9c3;
  color: #854d0e;
}

.apply-status--unknown {
  background: #f1f5f9;
  color: #64748b;
}

.record-card__desc {
  margin-top: 0.5rem;
  font-size: 0.8125rem;
  color: #64748b;
  line-height: 1.6;
}

.record-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  margin-top: 0.65rem;
  font-size: 0.75rem;
  color: #94a3b8;
}

.status-pill {
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  white-space: nowrap;
}

.status-pill--approved {
  background: #dcfce7;
  color: #15803d;
}

.status-pill--pending {
  background: #fef3c7;
  color: #b45309;
}

.status-pill--rejected {
  background: #fee2e2;
  color: #b91c1c;
}

.status-pill--unknown {
  background: #f1f5f9;
  color: #64748b;
}

.eval-stars {
  display: flex;
  gap: 0.1rem;
  color: #f59e0b;
  font-size: 0.875rem;
}

.link-btn {
  margin-top: 0.65rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #2563eb;
}

.link-btn:hover {
  text-decoration: underline;
}

.dataset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.dataset-card {
  border: 1px solid #e2e8f0;
  border-radius: 0.875rem;
  overflow: hidden;
  background: #fff;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
}

.dataset-card:hover {
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  transform: translateY(-2px);
}

.dataset-card__cover {
  height: 120px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dataset-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dataset-card__body {
  padding: 0.9rem;
}

.dataset-card__body h3 {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.4;
}

.dataset-card__body p {
  margin-top: 0.35rem;
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dataset-card__foot {
  margin-top: 0.65rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.6875rem;
  color: #94a3b8;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.5rem;
}

.tag {
  font-size: 0.6875rem;
  padding: 0.15rem 0.45rem;
  border-radius: 0.25rem;
  background: #f1f5f9;
  color: #64748b;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
  font-size: 0.8125rem;
  color: #64748b;
}

.pagination button {
  padding: 0.4rem 0.85rem;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.pagination button:hover:not(:disabled) {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.pagination button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pagination__total {
  font-size: 0.8125rem;
  color: #64748b;
  white-space: nowrap;
}

.pagination__page {
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.4rem;
  border-radius: 0.375rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}

.pagination__page:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.pagination__page--active {
  background: #6366f1;
  border-color: #6366f1;
  color: #fff;
}

.pagination__page--active:hover {
  background: #4f46e5;
  border-color: #4f46e5;
}

.pagination__ellipsis {
  padding: 0 0.3rem;
  color: #94a3b8;
  line-height: 2rem;
}

.overview-sub {
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  color: #94a3b8;
  font-weight: 500;
}

.overview-kpis {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

@media (min-width: 900px) {
  .overview-kpis {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.overview-kpi {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  border-radius: 0.85rem;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.overview-kpi__icon {
  font-size: 1.35rem;
  flex-shrink: 0;
}

.overview-kpi--blue .overview-kpi__icon { color: #2563eb; }
.overview-kpi--cyan .overview-kpi__icon { color: #0891b2; }
.overview-kpi--indigo .overview-kpi__icon { color: #4f46e5; }
.overview-kpi--rose .overview-kpi__icon { color: #e11d48; }
.overview-kpi--amber .overview-kpi__icon { color: #d97706; }

.overview-kpi__value {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.15;
}

.overview-kpi__label {
  margin-top: 0.15rem;
  font-size: 0.75rem;
  color: #64748b;
}

.overview-comments-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.overview-comments-head h3 {
  font-size: 0.9375rem;
  font-weight: 800;
  color: #0f172a;
}

.overview-comments-head__count {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 600;
}

.comment-list-wrap {
  height: 360px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #fff;
  padding: 0.5rem;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.comment-list-wrap::-webkit-scrollbar {
  width: 6px;
}

.comment-list-wrap::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: #cbd5e1;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.comment-list__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.65rem 0 0.25rem;
  font-size: 0.75rem;
  color: #64748b;
}

.comment-list__footer--muted {
  color: #94a3b8;
}

.comment-card {
  padding: 0.65rem 0.85rem;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.comment-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.comment-card__top .eval-stars {
  font-size: 0.75rem;
}

.comment-card__time {
  flex-shrink: 0;
  font-size: 0.6875rem;
  color: #94a3b8;
}

.comment-card__content {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.45;
  color: #0f172a;
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
  margin-top: 0.45rem;
  padding-top: 0.45rem;
  border-top: 1px dashed #e2e8f0;
  font-size: 0.6875rem;
  color: #64748b;
}

.comment-card__user {
  font-weight: 700;
  color: #334155;
}

.comment-card__dataset {
  border: none;
  background: none;
  padding: 0;
  font-size: inherit;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
  text-align: left;
}

.comment-card__dataset:hover {
  text-decoration: underline;
}

.comment-card__dataset-text {
  color: #64748b;
}

.overview-table-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 0.85rem;
  background: #fff;
}

.overview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.overview-table th,
.overview-table td {
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  vertical-align: top;
}

.overview-table th {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  background: #f8fafc;
  white-space: nowrap;
}

.overview-table th.is-num,
.overview-table td.is-num {
  text-align: right;
}

.overview-table tbody tr:last-child td {
  border-bottom: none;
}

.overview-table tbody tr:hover {
  background: #fafbfc;
}

.overview-table__title {
  display: block;
  max-width: 22rem;
  text-align: left;
  border: none;
  background: none;
  padding: 0;
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
  cursor: pointer;
}

.overview-table__title:hover {
  color: #2563eb;
}

.overview-table__cstr {
  margin-top: 0.2rem;
  font-size: 0.6875rem;
  color: #94a3b8;
  word-break: break-all;
}

@media (max-width: 900px) {
  .user-center-layout {
    grid-template-columns: 1fr;
  }

  .user-center-side {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.35rem;
  }

  .user-center-side__item {
    justify-content: center;
    padding: 0.65rem 0.5rem;
    font-size: 0.8125rem;
  }

  .account-grid {
    grid-template-columns: 1fr;
  }

  .account-form__grid {
    grid-template-columns: 1fr;
  }

  .account-field {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
}

.profile-toast {
  position: fixed;
  top: max(5rem, calc(env(safe-area-inset-top, 0) + 4rem));
  left: 50%;
  transform: translateX(-50%);
  z-index: 80;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: calc(100vw - 2rem);
  padding: 0.75rem 1.1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  border-radius: 0.625rem;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.18);
}

.profile-toast--success {
  background: linear-gradient(135deg, #059669, #10b981);
}

.profile-toast--error {
  background: linear-gradient(135deg, #dc2626, #ef4444);
}

.profile-toast-enter-active,
.profile-toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.profile-toast-enter-from,
.profile-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -0.5rem);
}
</style>
