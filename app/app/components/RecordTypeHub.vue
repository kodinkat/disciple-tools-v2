<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Permission } from '~~/app/utils/permissions'

const props = defineProps<{
  typeKey: 'contacts' | 'groups'
  title: string
}>()

interface RecordsListResponse {
  type_key: string
  records: Array<{
    id: string
    data: Record<string, unknown>
    updated_at: string
  }>
  pagination: { limit: number, offset: number, total: number }
}

const PAGE_SIZE = 25

const page = ref(1)
const search = ref('')
const searchDebounced = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

watch(search, (val) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    searchDebounced.value = val
    page.value = 1
  }, 250)
})

const listQuery = computed(() => ({
  limit: PAGE_SIZE,
  offset: (page.value - 1) * PAGE_SIZE,
  sort: '-updated_at',
  ...(searchDebounced.value.trim() ? { q: searchDebounced.value.trim() } : {})
}))

const listUrl = `/api/records/${props.typeKey}` as const

const { hasPermission } = usePermissions()

const createPerm = computed((): Permission =>
  props.typeKey === 'contacts' ? 'records.contacts.create' : 'records.groups.create'
)

const canCreate = computed(() => hasPermission(createPerm.value))

const recordNoun = computed(() => (props.typeKey === 'contacts' ? 'contact' : 'group'))
const recordNounCapitalized = computed(
  () => recordNoun.value.charAt(0).toUpperCase() + recordNoun.value.slice(1)
)

const toast = useToast()

const defaultResponse = (): RecordsListResponse => ({
  type_key: props.typeKey,
  records: [],
  pagination: { limit: PAGE_SIZE, offset: 0, total: 0 }
})

const { data, pending, error, refresh } = await useFetch<RecordsListResponse>(listUrl, {
  query: listQuery,
  watch: [listQuery],
  default: defaultResponse
})

interface CreateRecordResponse {
  record: {
    id: string
    type_key: string
  }
}

const createModalOpen = ref(false)
const createName = ref('')
const createNickname = ref('')
const createError = ref('')
const creating = ref(false)

watch(createModalOpen, (open) => {
  if (open) return
  createName.value = ''
  createNickname.value = ''
  createError.value = ''
})

async function submitCreate() {
  const name = createName.value.trim()
  if (!name) {
    createError.value = 'Name is required'
    return
  }
  createError.value = ''
  creating.value = true
  try {
    const body: Record<string, unknown> = { name }
    if (props.typeKey === 'contacts') {
      const nick = createNickname.value.trim()
      if (nick) body.nickname = nick
    }
    const res = await $fetch<CreateRecordResponse>(`/api/records/${props.typeKey}`, {
      method: 'POST',
      body: { data: body }
    })
    toast.add({
      title: `${recordNounCapitalized.value} created`,
      color: 'success'
    })
    createModalOpen.value = false
    await refresh()
    const base = props.typeKey === 'contacts' ? '/contacts' : '/groups'
    await navigateTo(`${base}/${res.record.id}`)
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }, message?: string }
    createError.value
      = err?.data?.statusMessage || err?.message || 'Could not create record'
  } finally {
    creating.value = false
  }
}

const formatUpdated = (value: string | Date) => {
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

function dataText(row: Record<string, unknown>, key: string): string {
  const v = row[key]
  if (v === null || v === undefined || v === '') return '—'
  return String(v)
}

type HubRow = {
  id: string
  name: string
  col2: string
  col3: string | null
  updated_at: string
}

const tableRows = computed((): HubRow[] => {
  const recs = data.value?.records ?? []
  if (props.typeKey === 'contacts') {
    return recs.map(r => ({
      id: r.id,
      name: dataText(r.data, 'name'),
      col2: dataText(r.data, 'overall_status'),
      col3: null,
      updated_at: formatUpdated(r.updated_at)
    }))
  }
  return recs.map(r => ({
    id: r.id,
    name: dataText(r.data, 'name'),
    col2: dataText(r.data, 'group_status'),
    col3: dataText(r.data, 'group_type'),
    updated_at: formatUpdated(r.updated_at)
  }))
})

const columns = computed((): TableColumn<HubRow>[] => {
  if (props.typeKey === 'contacts') {
    return [
      { id: 'name', accessorKey: 'name', header: 'Name' },
      { id: 'overall_status', accessorKey: 'col2', header: 'Status' },
      { id: 'updated_at', accessorKey: 'updated_at', header: 'Updated' }
    ]
  }
  return [
    { id: 'name', accessorKey: 'name', header: 'Name' },
    { id: 'group_status', accessorKey: 'col2', header: 'Status' },
    {
      id: 'group_type',
      accessorKey: 'col3',
      header: 'Type',
      cell: ({ row }) => h('span', row.original.col3 ?? '—')
    },
    { id: 'updated_at', accessorKey: 'updated_at', header: 'Updated' }
  ]
})

const emptyIcon = computed(() =>
  props.typeKey === 'contacts' ? 'i-lucide-user' : 'i-lucide-users-round'
)

const total = computed(() => data.value?.pagination.total ?? 0)

function handleRowSelect(_e: Event, row: { original: HubRow }) {
  const base = props.typeKey === 'contacts' ? '/contacts' : '/groups'
  return navigateTo(`${base}/${row.original.id}`)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <h1 class="text-3xl font-bold">
        {{ title }}
      </h1>
      <div class="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[12rem] sm:flex-row sm:items-center sm:justify-end">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search by name"
          class="w-full sm:w-72"
          :disabled="pending"
        />
        <UButton
          v-if="canCreate"
          icon="i-lucide-plus"
          color="primary"
          class="justify-center whitespace-nowrap"
          @click="createModalOpen = true"
        >
          New {{ recordNounCapitalized }}
        </UButton>
      </div>
    </div>

    <UModal
      v-model:open="createModalOpen"
      :dismissible="!creating"
    >
      <template #content>
        <form
          class="space-y-5 p-6"
          @submit.prevent="submitCreate"
        >
          <div class="flex items-start gap-3">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--ui-primary)/10">
              <UIcon
                name="i-lucide-file-plus-2"
                class="size-5 text-(--ui-primary)"
              />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-lg font-semibold">
                New {{ recordNounCapitalized }}
              </h3>
              <p class="mt-1 text-sm text-(--ui-text-muted)">
                Defaults apply for status and type fields. Phase 04 will add full-field forms.
              </p>
            </div>
          </div>

          <UAlert
            v-if="createError"
            color="error"
            variant="soft"
            :title="createError"
            :close-button="{ icon: 'i-lucide-x', color: 'neutral', variant: 'ghost' }"
            @close="createError = ''"
          />

          <UFormField
            label="Name"
            required
          >
            <UInput
              v-model="createName"
              type="text"
              placeholder="Display name"
              size="lg"
              :disabled="creating"
              autocomplete="off"
              class="w-full"
            />
          </UFormField>

          <UFormField
            v-if="props.typeKey === 'contacts'"
            label="Nickname"
          >
            <UInput
              v-model="createNickname"
              type="text"
              placeholder="Optional"
              size="lg"
              :disabled="creating"
              autocomplete="off"
              class="w-full"
            />
          </UFormField>

          <div class="flex items-center justify-end gap-3 pt-2">
            <UButton
              type="button"
              variant="ghost"
              color="neutral"
              :disabled="creating"
              @click="createModalOpen = false"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              icon="i-lucide-plus"
              :loading="creating"
              :disabled="creating"
            >
              Create {{ recordNounCapitalized }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      title="Could not load records"
      :description="error.message || 'Request failed'"
    />

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <UTable
        :data="tableRows"
        :columns="columns"
        :loading="pending"
        :empty-state="{ icon: emptyIcon, label: `No ${recordNoun}s found` }"
        :on-select="handleRowSelect"
        :ui="{
          tr: 'cursor-pointer transition-colors hover:bg-(--ui-bg-elevated)/50'
        }"
      />
    </UCard>

    <div class="flex flex-wrap items-center justify-between gap-4">
      <p class="text-sm text-(--ui-text-muted)">
        {{ total }} {{ total === 1 ? recordNoun : `${recordNoun}s` }}
      </p>
      <UPagination
        v-model:page="page"
        :total="total"
        :items-per-page="PAGE_SIZE"
        show-edges
      />
    </div>
  </div>
</template>
