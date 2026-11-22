<template>
  <div class="tpdc-panel">
    <div class="panel-head">
      <div>
        <h2>数据集列表</h2>
        <p class="tpdc-panel__hint">
          <span class="tpdc-panel__url-wrap">
            发布链接：
            <a
              class="tpdc-panel__url"
              :href="analysisDatasetsUrl"
              target="_blank"
              rel="noopener noreferrer"
              @click.stop
            >{{ analysisDatasetsUrl }}</a>
          </span>
        </p>
      </div>
      <div class="tpdc-panel__actions">
        <span class="panel-head__count">共 {{ filteredList.length }} 条</span>
        <button type="button" class="panel-head__btn" @click="openCreate">
          <iconify-icon icon="mdi:plus" />
          新增数据集
        </button>
      </div>
    </div>

    <div class="tpdc-toolbar">
      <input
        v-model.trim="keyword"
        type="search"
        class="tpdc-toolbar__search"
        placeholder="搜索名称 / UUID…"
      />
      <button type="button" class="tpdc-toolbar__refresh" :disabled="loading" @click="reload">
        <iconify-icon :icon="loading ? 'mdi:loading' : 'mdi:refresh'" :class="{ 'animate-spin': loading }" />
        刷新
      </button>
    </div>

    <div v-if="loading && !(list || []).length" class="panel-state">
      <iconify-icon icon="mdi:loading" class="animate-spin text-2xl" />
      <p>正在加载数据集配置…</p>
    </div>
    <div v-else-if="error" class="panel-state panel-state--error">
      <p>{{ error }}</p>
      <button type="button" class="panel-head__btn" @click="reload">重新加载</button>
    </div>
    <div v-else-if="!filteredList.length" class="panel-state">
      <iconify-icon icon="mdi:database-off-outline" class="text-3xl text-slate-300" />
      <p>{{ keyword ? '未找到匹配的数据集' : '暂无数据集配置' }}</p>
    </div>

    <div v-else class="tpdc-list">
      <article v-for="item in filteredList" :key="item.external_id" class="tpdc-card">
        <div class="tpdc-card__cover">
          <img
            v-if="item.dataSetPicture"
            :src="item.dataSetPicture"
            :alt="item.name"
            @error="onCoverError(item)"
          />
          <iconify-icon v-else icon="mdi:database" class="text-3xl text-slate-300" />
        </div>
        <div class="tpdc-card__body">
          <h3>{{ item.name }}</h3>
          <p class="tpdc-card__uuid">{{ item.external_id }}</p>
          <p class="tpdc-card__intro">{{ item.summary || '暂无简介' }}</p>
          <div class="tpdc-card__meta">
            <span>更新：{{ item.updateAt || '—' }}</span>
            <span>大小：{{ formatByteSize(item.byteSize) }}</span>
            <span>时间尺度：{{ Object.keys(item.时间尺度 || {}).length }}</span>
            <span>指标：{{ Object.keys(item.指标类型 || {}).length }}</span>
            <span>工具：{{ (item.tools || []).length }}</span>
          </div>
          <div class="tpdc-card__ops">
            <button type="button" class="tpdc-card__btn" @click="openEdit(item)">编辑</button>
            <button type="button" class="tpdc-card__btn tpdc-card__btn--danger" @click="confirmDelete(item)">
              删除
            </button>
            <button type="button" class="tpdc-card__btn tpdc-card__btn--tools" @click="openToolPicker(item)">
              勾选工具
            </button>
          </div>
          <div class="tpdc-card__tools">
            <template v-if="toolsOf(item).length">
              <span
                v-for="tool in toolsOf(item)"
                :key="tool.id"
                class="tpdc-card__tool-tag"
                :title="tool.desc"
              >
                <iconify-icon :icon="tool.icon" />
                {{ tool.label }}
              </span>
            </template>
            <span v-else class="tpdc-card__tools-empty">暂未勾选工具</span>
          </div>
        </div>
      </article>
    </div>

    <Teleport to="body">
      <div v-if="editorOpen" class="tpdc-modal" @click.self="closeEditor">
        <div class="tpdc-modal__dialog" role="dialog" aria-modal="true" :aria-label="editingUuid ? '编辑数据集' : '新增数据集'">
          <header class="tpdc-modal__head">
            <h3>{{ editingUuid ? '编辑数据集' : '新增数据集' }}</h3>
            <button type="button" class="tpdc-modal__close" aria-label="关闭" @click="closeEditor">
              <iconify-icon icon="mdi:close" />
            </button>
          </header>

          <div class="tpdc-modal__body">
            <label class="tpdc-field">
              <span>UUID <em>*</em></span>
              <input v-model.trim="form.external_id" type="text" :disabled="!!editingUuid" placeholder="external_id" />
            </label>
            <label class="tpdc-field">
              <span>名称 <em>*</em></span>
              <input v-model.trim="form.name" type="text" placeholder="name" />
            </label>
            <label class="tpdc-field">
              <span>封面图 URL</span>
              <input v-model.trim="form.dataSetPicture" type="text" placeholder="dataSetPicture" />
            </label>
            <label class="tpdc-field">
              <span>更新时间</span>
              <input v-model.trim="form.updateAt" type="text" placeholder="YYYY-MM-DD" />
            </label>
            <label class="tpdc-field">
              <span>字节大小</span>
              <input v-model.trim="form.byteSize" type="text" placeholder="byteSize" />
            </label>
            <label class="tpdc-field">
              <span>其他信息</span>
              <input v-model.trim="form.dataSetOther" type="text" placeholder="dataSetOther" />
            </label>
            <label class="tpdc-field">
              <span>关键词</span>
              <input v-model.trim="form.keywords" type="text" placeholder="keywords" />
            </label>
            <label class="tpdc-field">
              <span>存储目录</span>
              <input v-model.trim="form.storage_directory" type="text" placeholder="storage_directory" />
            </label>
            <label class="tpdc-field tpdc-field--full">
              <span>简介</span>
              <textarea v-model="form.summary" rows="5" placeholder="summary" />
            </label>

            <div class="tpdc-kv tpdc-field--full">
              <div class="tpdc-kv__head">
                <span>时间尺度</span>
                <button type="button" class="link-btn" @click="addKv('时间尺度')">+ 添加</button>
              </div>
              <div v-for="(row, idx) in scaleRows" :key="`scale-${idx}`" class="tpdc-kv__row">
                <input v-model.trim="row.key" type="text" placeholder="名称，如 年" />
                <input v-model.trim="row.value" type="text" placeholder="值，如 01yr" />
                <button type="button" class="tpdc-kv__remove" @click="scaleRows.splice(idx, 1)">
                  <iconify-icon icon="mdi:close" />
                </button>
              </div>
            </div>

            <div class="tpdc-kv tpdc-field--full">
              <div class="tpdc-kv__head">
                <span>指标类型</span>
                <button type="button" class="link-btn" @click="addKv('指标类型')">+ 添加</button>
              </div>
              <div v-for="(row, idx) in metricRows" :key="`metric-${idx}`" class="tpdc-kv__row">
                <input v-model.trim="row.key" type="text" placeholder="名称，如 降水率" />
                <input v-model.trim="row.value" type="text" placeholder="值，如 prec" />
                <button type="button" class="tpdc-kv__remove" @click="metricRows.splice(idx, 1)">
                  <iconify-icon icon="mdi:close" />
                </button>
              </div>
            </div>
          </div>

          <footer class="tpdc-modal__foot">
            <p v-if="formError" class="tpdc-modal__error">{{ formError }}</p>
            <button type="button" class="account-form__btn account-form__btn--cancel" @click="closeEditor">
              取消
            </button>
            <button
              type="button"
              class="account-form__btn account-form__btn--save"
              :disabled="saving"
              @click="saveForm"
            >
              {{ saving ? '保存中…' : '保存' }}
            </button>
          </footer>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="toolPickerOpen" class="tpdc-modal" @click.self="closeToolPicker">
        <div
          class="tpdc-modal__dialog tpdc-modal__dialog--tools"
          role="dialog"
          aria-modal="true"
          aria-label="勾选工具"
        >
          <header class="tpdc-modal__head">
            <div>
              <h3>勾选工具</h3>
              <p class="tpdc-modal__sub">{{ toolPickerTarget?.name }}</p>
            </div>
            <button type="button" class="tpdc-modal__close" aria-label="关闭" @click="closeToolPicker">
              <iconify-icon icon="mdi:close" />
            </button>
          </header>

          <div class="tpdc-tools-toolbar">
            <span>已选 {{ selectedToolIds.length }} / {{ ANALYSIS_TOOL_CATALOG.length }}</span>
            <div class="tpdc-tools-toolbar__acts">
              <button type="button" class="link-btn" @click="selectAllTools">全选</button>
              <button type="button" class="link-btn" @click="clearAllTools">清空</button>
            </div>
          </div>

          <div class="tpdc-modal__body tpdc-modal__body--tools">
            <label
              v-for="tool in ANALYSIS_TOOL_CATALOG"
              :key="tool.id"
              class="tpdc-tool-card"
              :class="{ 'is-checked': selectedToolIds.includes(tool.id) }"
            >
              <input
                type="checkbox"
                class="tpdc-tool-card__check"
                :checked="selectedToolIds.includes(tool.id)"
                @change="toggleTool(tool.id)"
              />
              <span class="tpdc-tool-card__icon" :data-kind="tool.kind">
                <iconify-icon :icon="tool.icon" />
              </span>
              <span class="tpdc-tool-card__text">
                <span class="tpdc-tool-card__label">{{ tool.label }}</span>
                <span class="tpdc-tool-card__desc">{{ tool.desc }}</span>
              </span>
            </label>
          </div>

          <footer class="tpdc-modal__foot">
            <p v-if="toolPickerError" class="tpdc-modal__error">{{ toolPickerError }}</p>
            <button type="button" class="account-form__btn account-form__btn--cancel" @click="closeToolPicker">
              取消
            </button>
            <button
              type="button"
              class="account-form__btn account-form__btn--save"
              :disabled="toolPickerSaving"
              @click="saveTools"
            >
              {{ toolPickerSaving ? '保存中…' : '保存勾选' }}
            </button>
          </footer>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ANALYSIS_TOOL_CATALOG, resolveAnalysisTools } from '@/utils/analysisToolCatalog'
import {
  createTpdcDatasetConfig,
  deleteTpdcDatasetConfig,
  emptyTpdcDatasetForm,
  fetchTpdcDatasetConfigs,
  formatByteSize,
  updateTpdcDatasetConfig,
  type TpdcDatasetConfig
} from '@/utils/tpdcDataConfigApi'

const emit = defineEmits<{
  toast: [message: string, type: 'success' | 'error']
}>()

const router = useRouter()

const analysisDatasetsUrl = computed(() => {
  const path = router.resolve({ name: 'AnalysisDatasets' }).href
  if (typeof window === 'undefined') return path
  return `${window.location.origin}${path}`
})

type KvRow = { key: string; value: string }

const list = ref<TpdcDatasetConfig[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const keyword = ref('')
const editorOpen = ref(false)
const editingUuid = ref('')
const formError = ref('')
const form = reactive<TpdcDatasetConfig>(emptyTpdcDatasetForm())
const scaleRows = ref<KvRow[]>([])
const metricRows = ref<KvRow[]>([])
const preservedTools = ref<string[]>([])

const toolPickerOpen = ref(false)
const toolPickerTarget = ref<TpdcDatasetConfig | null>(null)
const selectedToolIds = ref<string[]>([])
const toolPickerSaving = ref(false)
const toolPickerError = ref('')

const filteredList = computed(() => {
  const rows = Array.isArray(list.value) ? list.value : []
  const q = keyword.value.toLowerCase()
  if (!q) return rows
  return rows.filter(
    (item) =>
      String(item?.name || '')
        .toLowerCase()
        .includes(q) ||
      String(item?.external_id || '')
        .toLowerCase()
        .includes(q) ||
      String(item?.summary || '')
        .toLowerCase()
        .includes(q) ||
      String(item?.keywords || '')
        .toLowerCase()
        .includes(q)
  )
})

function mapToRows(map?: Record<string, string>): KvRow[] {
  return Object.entries(map || {}).map(([key, value]) => ({ key, value: String(value ?? '') }))
}

function rowsToMap(rows: KvRow[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const row of rows) {
    const key = row.key.trim()
    if (!key) continue
    map[key] = row.value.trim()
  }
  return map
}

function onCoverError(item: TpdcDatasetConfig) {
  item.dataSetPicture = ''
}

function toolsOf(item: TpdcDatasetConfig) {
  return resolveAnalysisTools(item.tools)
}

async function reload() {
  loading.value = true
  error.value = ''
  try {
    const rows = await fetchTpdcDatasetConfigs()
    list.value = Array.isArray(rows) ? rows : []
  } catch (e: unknown) {
    list.value = []
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingUuid.value = ''
  formError.value = ''
  preservedTools.value = []
  Object.assign(form, emptyTpdcDatasetForm())
  scaleRows.value = []
  metricRows.value = []
  editorOpen.value = true
}

function openEdit(item: TpdcDatasetConfig) {
  editingUuid.value = item.external_id
  formError.value = ''
  preservedTools.value = [...(item.tools || [])]
  Object.assign(form, emptyTpdcDatasetForm(), {
    ...item,
    external_id: item.external_id || '',
    name: item.name || '',
    summary: item.summary || '',
    keywords: item.keywords || '',
    storage_directory: item.storage_directory || '',
    dataSetPicture: item.dataSetPicture || '',
    byteSize: item.byteSize || '',
    updateAt: item.updateAt || '',
    dataSetOther: item.dataSetOther || ''
  })
  scaleRows.value = mapToRows(item.时间尺度)
  metricRows.value = mapToRows(item.指标类型)
  editorOpen.value = true
}

function closeEditor() {
  if (saving.value) return
  editorOpen.value = false
}

function openToolPicker(item: TpdcDatasetConfig) {
  toolPickerTarget.value = item
  selectedToolIds.value = [...(item.tools || [])]
  toolPickerError.value = ''
  toolPickerOpen.value = true
}

function closeToolPicker() {
  if (toolPickerSaving.value) return
  toolPickerOpen.value = false
  toolPickerTarget.value = null
}

function toggleTool(id: string) {
  const idx = selectedToolIds.value.indexOf(id)
  if (idx >= 0) selectedToolIds.value.splice(idx, 1)
  else selectedToolIds.value.push(id)
}

function selectAllTools() {
  selectedToolIds.value = ANALYSIS_TOOL_CATALOG.map((t) => t.id)
}

function clearAllTools() {
  selectedToolIds.value = []
}

async function saveTools() {
  const target = toolPickerTarget.value
  if (!target) return
  toolPickerSaving.value = true
  toolPickerError.value = ''
  try {
    const payload: TpdcDatasetConfig = {
      ...target,
      tools: [...selectedToolIds.value]
    }
    await updateTpdcDatasetConfig(target.external_id, payload)
    emit('toast', `已保存 ${selectedToolIds.value.length} 个工具`, 'success')
    toolPickerOpen.value = false
    toolPickerTarget.value = null
    await reload()
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '保存失败'
    toolPickerError.value = message
    emit('toast', message, 'error')
  } finally {
    toolPickerSaving.value = false
  }
}

function addKv(kind: '时间尺度' | '指标类型') {
  if (kind === '时间尺度') scaleRows.value.push({ key: '', value: '' })
  else metricRows.value.push({ key: '', value: '' })
}

function buildPayload(): TpdcDatasetConfig {
  return {
    external_id: form.external_id.trim(),
    name: form.name.trim(),
    dataSetPicture: form.dataSetPicture?.trim() || undefined,
    summary: form.summary?.trim() || undefined,
    byteSize: form.byteSize?.trim() || undefined,
    updateAt: form.updateAt?.trim() || undefined,
    keywords: form.keywords?.trim() || undefined,
    storage_directory: form.storage_directory?.trim() || undefined,
    dataSetOther: form.dataSetOther?.trim() || undefined,
    时间尺度: rowsToMap(scaleRows.value),
    指标类型: rowsToMap(metricRows.value),
    tools: [...preservedTools.value]
  }
}

async function saveForm() {
  formError.value = ''
  const payload = buildPayload()
  if (!payload.external_id) {
    formError.value = '请填写 UUID'
    return
  }
  if (!payload.name) {
    formError.value = '请填写名称'
    return
  }

  saving.value = true
  try {
    if (editingUuid.value) {
      await updateTpdcDatasetConfig(editingUuid.value, payload)
      emit('toast', '数据集已更新', 'success')
    } else {
      await createTpdcDatasetConfig(payload)
      emit('toast', '数据集已新增', 'success')
    }
    editorOpen.value = false
    await reload()
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '保存失败'
    formError.value = message
    emit('toast', message, 'error')
  } finally {
    saving.value = false
  }
}

async function confirmDelete(item: TpdcDatasetConfig) {
  const ok = window.confirm(`确认删除数据集「${item.name}」？\n此操作会写入 tpdc_data_config.json。`)
  if (!ok) return
  try {
    await deleteTpdcDatasetConfig(item.external_id)
    emit('toast', '已删除', 'success')
    await reload()
  } catch (e: unknown) {
    emit('toast', e instanceof Error ? e.message : '删除失败', 'error')
  }
}

onMounted(() => {
  void reload()
})

defineExpose({ reload })
</script>

<style scoped>
.tpdc-panel__hint {
  margin-top: 0.2rem;
  font-size: 0.75rem;
  color: #94a3b8;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.75rem;
}

.tpdc-panel__url-wrap {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.15rem;
  color: #64748b;
}

.tpdc-panel__url {
  font-size: 16px;
  color: #2563eb;
  font-weight: 600;
  word-break: break-all;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.tpdc-panel__url:hover {
  color: #1d4ed8;
}

.tpdc-panel__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.tpdc-toolbar {
  display: flex;
  gap: 0.65rem;
  margin-bottom: 1rem;
}

.tpdc-toolbar__search {
  flex: 1;
  min-width: 0;
  height: 2.25rem;
  padding: 0 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.65rem;
  font-size: 0.875rem;
  outline: none;
}

.tpdc-toolbar__search:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.tpdc-toolbar__refresh {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  height: 2.25rem;
  padding: 0 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.65rem;
  background: #fff;
  color: #475569;
  font-size: 0.8125rem;
  font-weight: 600;
}

.tpdc-toolbar__refresh:disabled {
  opacity: 0.6;
}

.tpdc-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.tpdc-card {
  display: grid;
  grid-template-columns: 7.5rem 1fr;
  gap: 0.9rem;
  padding: 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.875rem;
  background: #fff;
}

.tpdc-card__cover {
  width: 7.5rem;
  height: 7.5rem;
  border-radius: 0.65rem;
  overflow: hidden;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tpdc-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tpdc-card__body h3 {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.4;
}

.tpdc-card__uuid {
  margin-top: 0.2rem;
  font-size: 0.6875rem;
  color: #94a3b8;
  word-break: break-all;
}

.tpdc-card__intro {
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tpdc-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem 0.85rem;
  margin-top: 0.55rem;
  font-size: 0.6875rem;
  color: #94a3b8;
}

.tpdc-card__ops {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.7rem;
  flex-wrap: wrap;
}

.tpdc-card__tools {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.7rem;
}

.tpdc-card__tool-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  max-width: 100%;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1.3;
}

.tpdc-card__tool-tag iconify-icon {
  font-size: 0.85rem;
  flex-shrink: 0;
}

.tpdc-card__tools-empty {
  font-size: 0.6875rem;
  color: #94a3b8;
}

.tpdc-card__btn {
  padding: 0.3rem 0.7rem;
  border-radius: 0.5rem;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 600;
}

.tpdc-card__btn--danger {
  border-color: #fecaca;
  background: #fef2f2;
  color: #dc2626;
}

.tpdc-card__btn--tools {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
}

.tpdc-modal {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.45);
}

.tpdc-modal__dialog {
  width: min(720px, 100%);
  max-height: min(90vh, 920px);
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
  overflow: hidden;
}

.tpdc-modal__dialog--tools {
  width: min(860px, 100%);
}

.tpdc-modal__sub {
  margin-top: 0.15rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #94a3b8;
  max-width: 36rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tpdc-tools-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 1.1rem;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.8125rem;
  color: #64748b;
}

.tpdc-tools-toolbar__acts {
  display: flex;
  gap: 0.75rem;
}

.tpdc-modal__body--tools {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.65rem;
}

.tpdc-tool-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.45rem;
  padding: 0.85rem 0.55rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  min-width: 0;
}

.tpdc-tool-card:hover {
  border-color: #93c5fd;
}

.tpdc-tool-card.is-checked {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
}

.tpdc-tool-card__check {
  position: absolute;
  top: 0.55rem;
  right: 0.55rem;
  margin: 0;
  width: 1rem;
  height: 1rem;
  accent-color: #2563eb;
}

.tpdc-tool-card__icon {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 0.55rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  color: #2563eb;
  background: #eff6ff;
}

.tpdc-tool-card__icon[data-kind='excel'],
.tpdc-tool-card__icon[data-kind='csv'] {
  color: #ea580c;
  background: #fff7ed;
}

.tpdc-tool-card__icon[data-kind='xml'] {
  color: #7c3aed;
  background: #f5f3ff;
}

.tpdc-tool-card__icon[data-kind='txt'] {
  color: #0369a1;
  background: #e0f2fe;
}

.tpdc-tool-card__icon[data-kind='json'] {
  color: #a16207;
  background: #fef9c3;
}

.tpdc-tool-card__text {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  width: 100%;
}

.tpdc-tool-card__label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.35;
}

.tpdc-tool-card__desc {
  font-size: 0.68rem;
  color: #64748b;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tpdc-modal__head,
.tpdc-modal__foot {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.9rem 1.1rem;
  border-bottom: 1px solid #f1f5f9;
}

.tpdc-modal__foot {
  justify-content: flex-end;
  border-bottom: none;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
}

.tpdc-modal__head h3 {
  flex: 1;
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}

.tpdc-modal__close {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  color: #64748b;
}

.tpdc-modal__close:hover {
  background: #f1f5f9;
}

.tpdc-modal__body {
  padding: 1rem 1.1rem;
  overflow: auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.tpdc-modal__error {
  flex: 1;
  margin-right: auto;
  font-size: 0.8125rem;
  color: #dc2626;
}

.tpdc-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
}

.tpdc-field em {
  color: #ef4444;
  font-style: normal;
}

.tpdc-field input,
.tpdc-field textarea {
  width: 100%;
  padding: 0.55rem 0.7rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.55rem;
  font-size: 0.8125rem;
  font-weight: 400;
  color: #0f172a;
  outline: none;
  resize: vertical;
}

.tpdc-field input:focus,
.tpdc-field textarea:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.tpdc-field input:disabled {
  background: #f8fafc;
  color: #94a3b8;
}

.tpdc-field--full {
  grid-column: 1 / -1;
}

.tpdc-kv {
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
}

.tpdc-kv__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.55rem;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #334155;
}

.tpdc-kv__row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 0.4rem;
  margin-bottom: 0.4rem;
}

.tpdc-kv__row input {
  height: 2rem;
  padding: 0 0.55rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.45rem;
  background: #fff;
  font-size: 0.75rem;
}

.tpdc-kv__remove {
  width: 2rem;
  height: 2rem;
  border-radius: 0.45rem;
  color: #94a3b8;
}

.tpdc-kv__remove:hover {
  background: #fee2e2;
  color: #dc2626;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.panel-head h2 {
  font-size: 1.125rem;
  font-weight: 800;
  color: #0f172a;
}

.panel-head__count {
  font-size: 0.8125rem;
  color: #94a3b8;
}

.panel-head__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.75rem;
  border-radius: 0.55rem;
  background: #eff6ff;
  color: #2563eb;
  font-size: 0.8125rem;
  font-weight: 600;
}

.panel-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 2.5rem 1rem;
  color: #94a3b8;
  font-size: 0.875rem;
}

.panel-state--error {
  color: #dc2626;
}

.link-btn {
  font-size: 0.75rem;
  font-weight: 600;
  color: #2563eb;
}

.account-form__btn {
  padding: 0.45rem 0.95rem;
  border-radius: 0.55rem;
  font-size: 0.8125rem;
  font-weight: 600;
}

.account-form__btn--cancel {
  background: #f1f5f9;
  color: #64748b;
}

.account-form__btn--save {
  background: #2563eb;
  color: #fff;
}

.account-form__btn--save:disabled {
  opacity: 0.6;
}

@media (max-width: 720px) {
  .tpdc-card {
    grid-template-columns: 1fr;
  }

  .tpdc-card__cover {
    width: 100%;
    height: 9rem;
  }

  .tpdc-modal__body {
    grid-template-columns: 1fr;
  }

  .tpdc-modal__body--tools {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tpdc-kv__row {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 721px) and (max-width: 1100px) {
  .tpdc-modal__body--tools {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
