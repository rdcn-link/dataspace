<template>
  <div class="subject-tree-node">
    <div
      class="subject-tree__row"
      :style="{ paddingLeft: `${node.depth * 12}px` }"
    >
      <button
        v-if="node.children.length"
        type="button"
        class="subject-tree__expand"
        :aria-expanded="expanded"
        @click.stop="emit('toggle', node.path)"
      >
        <iconify-icon
          :icon="expanded ? 'mdi:chevron-down' : 'mdi:chevron-right'"
          class="text-base text-slate-400"
        ></iconify-icon>
      </button>
      <span v-else class="subject-tree__expand subject-tree__expand--placeholder"></span>

      <input
        type="checkbox"
        class="rounded text-blue-600 shrink-0"
        :checked="modelValue === node.path"
        @change="onCheck"
      />
      <span class="truncate flex-1" :title="node.label">{{ node.label }}</span>
      <span class="text-slate-400 tabular-nums shrink-0 font-num">({{ node.datasetNumber }})</span>
    </div>

    <template v-if="expanded && node.children.length">
      <SubjectTreeNodeItem
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :model-value="modelValue"
        :expanded-paths="expandedPaths"
        @pick="emit('pick', $event)"
        @toggle="emit('toggle', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SubjectTreeNode } from '@/utils/subjectTree'

const props = defineProps<{
  node: SubjectTreeNode
  modelValue: 'none' | string
  expandedPaths: Set<string>
}>()

const emit = defineEmits<{
  pick: [path: string]
  toggle: [path: string]
}>()

const expanded = computed(() => props.expandedPaths.has(props.node.path))

function onCheck(ev: Event) {
  const el = ev.target as HTMLInputElement
  if (el.checked) {
    emit('pick', props.node.path)
  } else if (props.modelValue === props.node.path) {
    emit('pick', 'none')
  }
}
</script>

<script lang="ts">
export default {
  name: 'SubjectTreeNodeItem'
}
</script>

<style scoped>
.subject-tree__row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  color: #475569;
  cursor: pointer;
  padding-top: 0.2rem;
  padding-bottom: 0.2rem;
  border-radius: 0.25rem;
}

.subject-tree__row:hover {
  color: #2563eb;
}

.subject-tree__expand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}

.subject-tree__expand--placeholder {
  pointer-events: none;
}
</style>
