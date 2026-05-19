<script setup lang="ts">
import type { DetailFieldViewModel } from '~/types/record-detail-payload'

const props = defineProps<{
  fields: DetailFieldViewModel[]
  editable?: boolean
  modelValue: Record<string, unknown>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
}>()

function textValue(fieldKey: string) {
  const v = props.modelValue[fieldKey]
  if (v === null || v === undefined) return ''
  return String(v)
}

function selectValue(fieldKey: string) {
  const v = props.modelValue[fieldKey]
  return v === null || v === undefined ? '' : String(v)
}

function mergeKey(key: string, nextRaw: unknown) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: typeof nextRaw === 'string' ? nextRaw : String(nextRaw ?? '')
  })
}

function onDtChange(ev: Event, fieldKey: string) {
  if (!props.editable) return
  const ce = ev as CustomEvent<{ newValue?: string }>
  mergeKey(fieldKey, ce.detail?.newValue ?? '')
}
</script>

<template>
  <div class="record-detail-fields dt-theme-light space-y-5">
    <template
      v-for="field in fields"
      :key="field.field_key"
    >
      <dt-text
        v-if="field.kind === 'text'"
        :disabled="!editable"
        :name="field.field_key"
        :label="field.label"
        :value="textValue(field.field_key)"
        @change="onDtChange($event, field.field_key)"
      />
      <dt-single-select
        v-else-if="field.kind === 'key_select'"
        :disabled="!editable"
        :name="field.field_key"
        :label="field.label"
        :value="selectValue(field.field_key)"
        :options="field.select_options ?? []"
        @change="onDtChange($event, field.field_key)"
      />
      <div
        v-else
        class="rounded-md border border-(--ui-border) bg-(--ui-bg-muted) p-3 text-sm"
      >
        <p class="font-medium text-(--ui-text-muted)">
          {{ field.label }}
          <span class="font-normal">({{ field.kind }})</span>
        </p>
        <pre class="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs">{{ JSON.stringify(field.value, null, 2) }}</pre>
      </div>
    </template>
  </div>
</template>
