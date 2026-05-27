<script setup lang="ts">
import type { DetailFieldViewModel } from '~/types/record-detail-payload'
import {
  DETAIL_SCALAR_EDITOR_KINDS,
  booleanChecked,
  configOptions,
  connectionChipItems,
  dateIsoString,
  multiSelectChipValues,
  payloadsToMultiTextRows,
  usersConnectionObjects
} from '~/utils/record-detail-field-wc'

const props = defineProps<{
  fields: DetailFieldViewModel[]
  editable?: boolean
  modelValue: Record<string, unknown>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
}>()

function fieldInteractive(field: DetailFieldViewModel): boolean {
  return !!props.editable && DETAIL_SCALAR_EDITOR_KINDS.has(field.kind)
}

/** Resolved value for widgets: editable scalars (`text`, `key_select`) read draft; others use server-provided field value. */
function displayRaw(field: DetailFieldViewModel): unknown {
  if (DETAIL_SCALAR_EDITOR_KINDS.has(field.kind)) return props.modelValue[field.field_key]
  return field.value
}

function textFromRaw(raw: unknown): string {
  if (raw === null || raw === undefined) return ''
  return String(raw)
}

function mergeTyped(key: string, next: unknown) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: next
  })
}

function onStringScalarChange(field: DetailFieldViewModel, ev: Event) {
  if (!fieldInteractive(field)) return
  const ce = ev as CustomEvent<{ newValue?: string }>
  mergeTyped(field.field_key, ce.detail?.newValue ?? '')
}

function onNumberScalarChange(field: DetailFieldViewModel, ev: Event) {
  if (!fieldInteractive(field)) return
  const ce = ev as CustomEvent<{ newValue?: string }>
  const raw = ce.detail?.newValue
  const n = Number(raw)
  mergeTyped(field.field_key, Number.isFinite(n) ? n : raw ?? '')
}

function onToggleChange(field: DetailFieldViewModel, ev: Event) {
  if (!fieldInteractive(field)) return
  const ce = ev as CustomEvent<{ newValue?: boolean }>
  mergeTyped(field.field_key, !!ce.detail?.newValue)
}

function onDateChange(field: DetailFieldViewModel, ev: Event) {
  if (!fieldInteractive(field)) return
  const ce = ev as CustomEvent<{ newValue?: number }>
  const sec = ce.detail?.newValue
  if (sec === undefined || sec === null || sec === 0) {
    mergeTyped(field.field_key, '')
    return
  }
  const iso = new Date(sec * 1000).toISOString().slice(0, 10)
  mergeTyped(field.field_key, iso)
}

function numberAttr(field: DetailFieldViewModel, key: 'min' | 'max'): number | undefined {
  const v = field.config[key]
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

function userSelectSingle(field: DetailFieldViewModel): boolean {
  const c = field.config as { multi?: boolean }
  return c?.multi !== true
}

/** Prefer admin-config label for connection target ids when present. */
function connectionDisplayObjects(raw: unknown, field: DetailFieldViewModel): Array<{ id: string, label: string }> {
  const opts = configOptions(field)
  const base = connectionChipItems(raw)
  return base.map((o) => {
    const fromConfig = opts.find(op => op.id === o.id)
    return fromConfig ?? o
  })
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
        :disabled="!fieldInteractive(field)"
        :name="field.field_key"
        :label="field.label"
        :value="textFromRaw(displayRaw(field))"
        @change="onStringScalarChange(field, $event)"
      />
      <dt-textarea
        v-else-if="field.kind === 'textarea'"
        :disabled="!fieldInteractive(field)"
        :name="field.field_key"
        :label="field.label"
        :value="textFromRaw(displayRaw(field))"
        @change="onStringScalarChange(field, $event)"
      />
      <dt-number
        v-else-if="field.kind === 'number'"
        :disabled="!fieldInteractive(field)"
        :name="field.field_key"
        :label="field.label"
        :value="textFromRaw(displayRaw(field))"
        :min="numberAttr(field, 'min')"
        :max="numberAttr(field, 'max')"
        @change="onNumberScalarChange(field, $event)"
      />
      <dt-toggle
        v-else-if="field.kind === 'boolean'"
        :id="`${field.field_key}-toggle`"
        :disabled="!fieldInteractive(field)"
        :name="field.field_key"
        :label="field.label"
        :checked="booleanChecked(displayRaw(field))"
        @change="onToggleChange(field, $event)"
      />
      <dt-date
        v-else-if="field.kind === 'date'"
        :disabled="!fieldInteractive(field)"
        :name="field.field_key"
        :label="field.label"
        :value="dateIsoString(displayRaw(field))"
        @change="onDateChange(field, $event)"
      />
      <dt-single-select
        v-else-if="field.kind === 'key_select'"
        :disabled="!fieldInteractive(field)"
        :name="field.field_key"
        :label="field.label"
        :value="textFromRaw(displayRaw(field))"
        :options="field.select_options ?? []"
        @change="onStringScalarChange(field, $event)"
      />
      <dt-multi-select
        v-else-if="field.kind === 'multi_select'"
        :disabled="!fieldInteractive(field)"
        :name="field.field_key"
        :label="field.label"
        :options="configOptions(field)"
        :value="multiSelectChipValues(displayRaw(field))"
      />
      <dt-tags
        v-else-if="field.kind === 'tags'"
        :disabled="!fieldInteractive(field)"
        :name="field.field_key"
        :label="field.label"
        :options="configOptions(field)"
        :allow-add="false"
        :value="multiSelectChipValues(displayRaw(field))"
      />
      <dt-users-connection
        v-else-if="field.kind === 'user_select'"
        :disabled="!fieldInteractive(field)"
        :name="field.field_key"
        :label="field.label"
        :single="userSelectSingle(field)"
        :options="[]"
        :value="usersConnectionObjects(displayRaw(field))"
      />
      <dt-connection
        v-else-if="field.kind === 'connection'"
        :disabled="!fieldInteractive(field)"
        :name="field.field_key"
        :label="field.label"
        :options="configOptions(field)"
        :value="connectionDisplayObjects(displayRaw(field), field)"
      />
      <dt-multi-text
        v-else-if="
          field.kind === 'communication_channel'
            || field.kind === 'link'
            || field.kind === 'location'
            || field.kind === 'location_meta'
        "
        :disabled="!fieldInteractive(field)"
        :name="field.field_key"
        :label="field.label"
        :value="payloadsToMultiTextRows(displayRaw(field), field.kind)"
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
