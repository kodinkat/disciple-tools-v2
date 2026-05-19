<script setup lang="ts">
import type { Permission } from '~~/app/utils/permissions'
import type {
  DetailFieldViewModel,
  RecordDetailPayload
} from '~/types/record-detail-payload'
import { pickScalarFieldPatch } from '~~/app/utils/record-field-patch'

const props = defineProps<{
  typeKey: 'contacts' | 'groups'
  recordId: string
  listHref: string
  titleNoun: string
}>()

interface DetailPayload {
  record: {
    id: string
    type_key: string
    created_at: string | Date
    updated_at: string | Date
    created_by: string | null
    data: Record<string, unknown>
  }
  detail: RecordDetailPayload
}

const url = computed(() => `/api/records/${props.typeKey}/${props.recordId}`)

const { data, pending, error, refresh } = await useFetch<DetailPayload>(url, {
  watch: [url]
})

const { hasPermission } = usePermissions()

const writePerm = computed((): Permission =>
  props.typeKey === 'contacts' ? 'records.contacts.write' : 'records.groups.write'
)

const canWrite = computed(() => hasPermission(writePerm.value))

const toast = useToast()

const baselineData = shallowRef<Record<string, unknown>>({})
const draftData = shallowRef<Record<string, unknown>>({})

watch(
  () => data.value?.record?.data,
  (rec) => {
    if (!rec || typeof rec !== 'object' || Array.isArray(rec)) return
    baselineData.value = { ...rec }
    draftData.value = { ...rec }
  },
  { immediate: true }
)

function mergeDraft(next: Record<string, unknown>) {
  draftData.value = next
}

const fieldByKey = computed(() => {
  const detail = data.value?.detail
  if (!detail) return new Map<string, DetailFieldViewModel>()
  return new Map(detail.fields.map(f => [f.field_key, f]))
})

const editableFieldKeys = computed(() =>
  (data.value?.detail?.fields ?? []).filter(
    f => f.kind === 'text' || f.kind === 'key_select'
  ).map(f => f.field_key)
)

function orderedFields(keys: readonly string[]): DetailFieldViewModel[] {
  const map = fieldByKey.value
  const out: DetailFieldViewModel[] = []
  for (const k of keys) {
    const f = map.get(k)
    if (f) out.push({ ...f, value: draftData.value[k] ?? f.value })
  }
  return out
}

const hasUnsavedChanges = computed(() => {
  if (!canWrite.value) return false
  const patch = pickScalarFieldPatch(
    baselineData.value,
    draftData.value,
    editableFieldKeys.value
  )
  return Object.keys(patch).length > 0
})

function discardDraft() {
  draftData.value = { ...baselineData.value }
}

const saving = ref(false)

async function saveRecord() {
  const patch = pickScalarFieldPatch(
    baselineData.value,
    draftData.value,
    editableFieldKeys.value
  )
  if (Object.keys(patch).length === 0) return
  saving.value = true
  try {
    await $fetch(url.value, {
      method: 'PATCH',
      body: { data: patch }
    })
    toast.add({ title: 'Record saved', color: 'success' })
    await refresh()
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }, message?: string }
    toast.add({
      title: err?.data?.statusMessage ?? err?.message ?? 'Could not save record',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

function formatDt(value: string | Date | null | undefined) {
  if (value === null || value === undefined || value === '') return '—'
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

const headline = computed(() => {
  const nm = draftData.value.name
  if (typeof nm === 'string' && nm.trim().length > 0) return nm.trim()
  const id = data.value?.record?.id ?? props.recordId
  return `Record ${id}`
})

const sections = computed(
  () => data.value?.detail.layout.sections.filter(s => s.field_keys.length > 0) ?? []
)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center gap-3">
      <UButton
        :to="listHref"
        variant="ghost"
        icon="i-lucide-arrow-left"
        :label="`Back to ${titleNoun}`"
      />
      <UBadge
        v-if="canWrite"
        color="neutral"
        variant="outline"
      >
        {{ hasUnsavedChanges ? 'Edited' : 'Editable' }}
      </UBadge>
      <UBadge
        v-else
        color="neutral"
        variant="outline"
      >
        Read-only
      </UBadge>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      title="Could not load record"
      :description="error.message || 'Request failed'"
    />

    <template v-if="pending && !data">
      <div class="animate-pulse space-y-4">
        <div class="h-8 w-2/5 max-w-sm rounded-lg bg-(--ui-bg-accented)" />
        <div class="h-40 rounded-lg bg-(--ui-bg-accented)" />
      </div>
    </template>

    <template v-else-if="data?.record">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-1">
          <h1 class="text-3xl font-bold">
            {{ headline }}
          </h1>
          <p class="text-sm text-(--ui-text-muted) font-mono">
            {{ data.record.id }}
          </p>
        </div>
        <div
          v-if="canWrite"
          class="flex shrink-0 flex-wrap gap-2"
        >
          <UButton
            label="Discard"
            variant="outline"
            icon="i-lucide-undo-2"
            :disabled="!hasUnsavedChanges || saving"
            @click="discardDraft"
          />
          <UButton
            label="Save"
            icon="i-lucide-save"
            :loading="saving"
            :disabled="!hasUnsavedChanges || saving"
            @click="saveRecord"
          />
        </div>
      </div>

      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">
            Timeline
          </h2>
        </template>
        <dl class="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(8rem,1fr)_1fr] sm:gap-x-6">
          <dt class="text-(--ui-text-muted) text-sm">
            Created
          </dt>
          <dd>{{ formatDt(data.record.created_at) }}</dd>
          <dt class="text-(--ui-text-muted) text-sm">
            Updated
          </dt>
          <dd>{{ formatDt(data.record.updated_at) }}</dd>
          <dt class="text-(--ui-text-muted) text-sm">
            Created by
          </dt>
          <dd>{{ data.record.created_by ?? '—' }}</dd>
        </dl>
      </UCard>

      <template
        v-if="sections.length > 0"
      >
        <UCard
          v-for="section in sections"
          :key="section.id"
        >
          <template #header>
            <h2 class="text-lg font-semibold">
              {{ section.title || 'Section' }}
            </h2>
          </template>
          <RecordDetailFields
            :editable="canWrite"
            :fields="orderedFields(section.field_keys)"
            :model-value="draftData"
            @update:model-value="mergeDraft"
          />
        </UCard>
      </template>

      <template v-else>
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">
              Fields
            </h2>
          </template>
          <p class="text-(--ui-text-muted) text-sm">
            No field definitions for this record type.
          </p>
        </UCard>
      </template>
    </template>
  </div>
</template>
