<script setup lang="ts">
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
}

const url = computed(
  () => `/api/records/${props.typeKey}/${props.recordId}`
)

const { data, pending, error } = await useFetch<DetailPayload>(url, {
  watch: [url]
})

function formatDt(value: string | Date | null | undefined) {
  if (value === null || value === undefined || value === '') return '—'
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

function formatFieldValue(v: unknown) {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  const s = String(v)
  return s.length ? s : '—'
}

const sortedKeys = computed(() => {
  const blob = data.value?.record?.data
  if (!blob || typeof blob !== 'object' || Array.isArray(blob)) return []
  return Object.keys(blob).sort((a, b) => a.localeCompare(b))
})

const headline = computed(() => {
  const nm = data.value?.record?.data?.name
  if (typeof nm === 'string' && nm.trim().length > 0) return nm.trim()
  const id = data.value?.record?.id ?? props.recordId
  return `Record ${id}`
})
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
      <div class="space-y-1">
        <h1 class="text-3xl font-bold">
          {{ headline }}
        </h1>
        <p class="text-sm text-(--ui-text-muted) font-mono">
          {{ data.record.id }}
        </p>
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

      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">
            Fields <span class="text-(--ui-text-muted) font-normal text-sm">(interim Phase&nbsp;03)</span>
          </h2>
        </template>
        <p
          v-if="sortedKeys.length === 0"
          class="text-(--ui-text-muted) text-sm"
        >
          No custom field data stored on this record.
        </p>
        <dl
          v-else
          class="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-[minmax(10rem,1fr)_1fr]"
        >
          <template
            v-for="k in sortedKeys"
            :key="k"
          >
            <dt class="break-words text-sm text-(--ui-text-muted)">
              {{ k }}
            </dt>
            <dd class="break-words font-mono text-sm">
              {{ formatFieldValue(data.record.data[k]) }}
            </dd>
          </template>
        </dl>
      </UCard>
    </template>
  </div>
</template>
