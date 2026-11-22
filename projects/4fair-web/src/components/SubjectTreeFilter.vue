<template>
  <div class="subject-tree">
    <label class="subject-tree__row subject-tree__row--all">
      <input
        type="checkbox"
        class="rounded text-blue-600 shrink-0"
        :checked="modelValue === 'none'"
        @change="onAllChange"
      />
      <span class="truncate flex-1">全部</span>
    </label>

    <SubjectTreeNodeItem
      v-for="node in nodes"
      :key="node.path"
      :node="node"
      :model-value="modelValue"
      :expanded-paths="expandedPaths"
      @pick="onPick"
      @toggle="emit('toggle-expand', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { SubjectTreeNode } from '@/utils/subjectTree'
import SubjectTreeNodeItem from '@/components/SubjectTreeNodeItem.vue'

defineProps<{
  nodes: SubjectTreeNode[]
  modelValue: 'none' | string
  expandedPaths: Set<string>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: 'none' | string]
  'toggle-expand': [path: string]
}>()

function onAllChange(ev: Event) {
  const el = ev.target as HTMLInputElement
  if (el.checked) {
    emit('update:modelValue', 'none')
  }
}

function onPick(path: string) {
  emit('update:modelValue', path)
}
</script>

<style scoped>
.subject-tree {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.subject-tree__row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #475569;
  cursor: pointer;
  padding: 0.25rem 0;
  border-radius: 0.25rem;
}

.subject-tree__row:hover {
  color: #2563eb;
}

.subject-tree__row--all {
  margin-bottom: 0.25rem;
}
</style>
