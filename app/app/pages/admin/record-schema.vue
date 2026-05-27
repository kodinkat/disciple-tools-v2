<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

type FieldValueStorage = 'data' | 'entries' | 'connections'

interface RecordTypeRow {
  id: string
  type_key: string
  label: string
  label_plural: string
  description: string
  is_system: boolean
  meta: Record<string, unknown>
}

interface RecordTypeFieldRow {
  id: string
  record_type_id: string
  field_key: string
  kind: string
  label: string
  description: string
  field_order: number
  config: Record<string, unknown>
  value_storage: FieldValueStorage
  is_system: boolean
}

interface SchemaResponse {
  record_types: RecordTypeRow[]
  record_type_fields: RecordTypeFieldRow[]
  allowed_field_kinds: string[]
}

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const toast = useToast()

function defaultConfigJsonForKind(kind: string): string {
  if (kind === 'key_select' || kind === 'multi_select') {
    return `${JSON.stringify(
      {
        options: [
          { key: 'option_a', label: 'Option A' },
          { key: 'option_b', label: 'Option B' }
        ]
      },
      null,
      2
    )}\n`
  }
  return '{}'
}

function parseRecordFieldConfigJson(
  text: string,
  kind: string
): { ok: true, config: Record<string, unknown> } | { ok: false, message: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(text.trim() || '{}')
  } catch {
    return { ok: false, message: 'Config JSON has a syntax error.' }
  }
  if (Array.isArray(parsed)) {
    if (kind === 'key_select' || kind === 'multi_select') {
      return { ok: true, config: { options: parsed } }
    }
    return {
      ok: false,
      message:
        'Config must be a JSON object (or for key_select / multi_select you may paste only the options array).'
    }
  }
  if (parsed === null || typeof parsed !== 'object') {
    return { ok: false, message: 'Config must be a JSON object.' }
  }
  return { ok: true, config: parsed as Record<string, unknown> }
}

function configJsonIsPlaceholder(text: string): boolean {
  const t = text.trim()
  return t === '' || t === '{}'
}

const { data, pending, error, refresh } = await useFetch<SchemaResponse>(
  '/api/admin/record-schema',
  {
    default: () => ({
      record_types: [],
      record_type_fields: [],
      allowed_field_kinds: []
    })
  }
)

const typeModalOpen = ref(false)
const typeSaving = ref(false)
const typeFormError = ref('')
const newType = reactive({
  type_key: '',
  label: '',
  label_plural: '',
  description: ''
})

const fieldModalOpen = ref(false)
const fieldSaving = ref(false)
const fieldFormError = ref('')
const fieldContext = shallowRef<{ id: string, label_plural: string } | null>(null)
const fieldDraft = reactive({
  field_key: '',
  kind: 'text',
  label: '',
  description: '',
  field_order_str: '',
  config_json: '{}'
})

watch(
  () => fieldDraft.kind,
  (kind) => {
    if (!fieldModalOpen.value) return
    if (
      (kind === 'key_select' || kind === 'multi_select')
      && configJsonIsPlaceholder(fieldDraft.config_json)
    ) {
      fieldDraft.config_json = defaultConfigJsonForKind(kind)
    }
  }
)

const addFieldConfigDescription = computed(() =>
  fieldDraft.kind === 'key_select' || fieldDraft.kind === 'multi_select'
    ? 'Include an "options" array of { "key", "label" } objects. You may paste only the options array; the API requires at least one option. Choosing this kind pre-fills an example.'
    : 'JSON object with optional keys for this field kind (required, placeholder, min/max, …).'
)

const editFieldConfigDescription = computed(() => {
  const k = editingField.value?.kind
  return k === 'key_select' || k === 'multi_select'
    ? 'Include an "options" array (or paste only that array); at least one { "key", "label" } entry is required.'
    : 'JSON object with optional keys for this field kind.'
})

const editModalOpen = ref(false)
const editSaving = ref(false)
const editFormError = ref('')
const editingField = shallowRef<RecordTypeFieldRow | null>(null)
const editDraft = reactive({
  label: '',
  description: '',
  field_order: 10,
  config_json: '{}'
})

const deleteModalOpen = ref(false)
const deleteSaving = ref(false)
const deleteFieldTarget = shallowRef<RecordTypeFieldRow | null>(null)

const layoutModalOpen = ref(false)
const layoutSaving = ref(false)
const layoutRt = shallowRef<RecordTypeRow | null>(null)
const layoutJson = ref('')
const layoutError = ref('')

/** Which record type card is shown (avoids a long scroll of stacked tables). */
const selectedRecordTypeId = ref<string | null>(null)

const selectedRecordType = computed((): RecordTypeRow | null =>
  (data.value?.record_types ?? []).find(rt => rt.id === selectedRecordTypeId.value) ?? null
)

watch(
  () => data.value?.record_types,
  (types) => {
    if (!types?.length) {
      selectedRecordTypeId.value = null
      return
    }
    const current = selectedRecordTypeId.value
    if (!current || !types.some(rt => rt.id === current)) {
      selectedRecordTypeId.value = types[0]!.id
    }
  },
  { immediate: true }
)

function sortedFieldRowsForRt(typeId: string): RecordTypeFieldRow[] {
  return [...fieldsForType(typeId)].sort((a, b) => a.field_order - b.field_order)
}

function defaultDetailLayoutDraft(rt: RecordTypeRow) {
  return {
    sections: [
      {
        id: 'primary',
        title: 'Details',
        field_keys: sortedFieldRowsForRt(rt.id).map(f => f.field_key)
      }
    ]
  }
}

function openLayoutModal(rt: RecordTypeRow) {
  layoutRt.value = rt
  layoutError.value = ''
  const raw = rt.meta?.detail_layout
  if (
    raw
    && typeof raw === 'object'
    && !Array.isArray(raw)
    && Array.isArray((raw as { sections?: unknown }).sections)
  ) {
    layoutJson.value = `${JSON.stringify(raw, null, 2)}\n`
  } else {
    layoutJson.value = `${JSON.stringify(defaultDetailLayoutDraft(rt), null, 2)}\n`
  }
  layoutModalOpen.value = true
}

async function submitLayoutDraft() {
  if (!layoutRt.value) return
  layoutError.value = ''
  let parsed: unknown
  try {
    parsed = JSON.parse(layoutJson.value || '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Layout must be a JSON object')
    }
  } catch {
    layoutError.value = 'Layout JSON must be an object with `sections` (see admin plan / API).'
    return
  }

  layoutSaving.value = true
  try {
    await $fetch(`/api/admin/record-types/${layoutRt.value.id}`, {
      method: 'PATCH',
      body: { detail_layout: parsed }
    })
    toast.add({ title: 'Detail layout saved', color: 'success' })
    layoutModalOpen.value = false
    await refresh()
  } catch (e: unknown) {
    layoutError.value = e instanceof Error
      ? e.message
      : String((e as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Request failed')
  } finally {
    layoutSaving.value = false
  }
}

async function resetLayoutToAutomatic() {
  if (!layoutRt.value) return
  layoutSaving.value = true
  layoutError.value = ''
  try {
    await $fetch(`/api/admin/record-types/${layoutRt.value.id}`, {
      method: 'PATCH',
      body: { detail_layout: null }
    })
    toast.add({ title: 'Layout reset to default', color: 'success' })
    layoutModalOpen.value = false
    await refresh()
  } catch (e: unknown) {
    layoutError.value = e instanceof Error
      ? e.message
      : String((e as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Request failed')
  } finally {
    layoutSaving.value = false
  }
}

function fieldsForType(typeId: string): RecordTypeFieldRow[] {
  return (data.value?.record_type_fields ?? []).filter(
    f => f.record_type_id === typeId
  )
}

function storageBadge(
  storage: FieldValueStorage
): { label: string, color: 'neutral' | 'info' | 'warning' } {
  switch (storage) {
    case 'data':
      return { label: 'records.data', color: 'neutral' }
    case 'entries':
      return { label: 'field entries', color: 'info' }
    case 'connections':
      return { label: 'connections', color: 'warning' }
  }
}

function openCreateTypeModal() {
  typeFormError.value = ''
  newType.type_key = ''
  newType.label = ''
  newType.label_plural = ''
  newType.description = ''
  typeModalOpen.value = true
}

async function submitNewType() {
  typeSaving.value = true
  typeFormError.value = ''
  try {
    const created = await $fetch<{ record_type: { id: string } }>(
      '/api/admin/record-types',
      {
        method: 'POST',
        body: {
          type_key: newType.type_key.trim(),
          label: newType.label.trim(),
          label_plural: newType.label_plural.trim(),
          description: newType.description.trim()
        }
      }
    )
    toast.add({ title: 'Record type created', color: 'success' })
    typeModalOpen.value = false
    await refresh()
    selectedRecordTypeId.value = created.record_type.id
  } catch (e: unknown) {
    typeFormError.value = e instanceof Error
      ? e.message
      : String((e as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Request failed')
  } finally {
    typeSaving.value = false
  }
}

function openAddField(rt: RecordTypeRow) {
  fieldContext.value = { id: rt.id, label_plural: rt.label_plural }
  fieldFormError.value = ''
  fieldDraft.field_key = ''
  fieldDraft.kind = data.value?.allowed_field_kinds?.[0] ?? 'text'
  fieldDraft.label = ''
  fieldDraft.description = ''
  fieldDraft.field_order_str = ''
  fieldDraft.config_json = defaultConfigJsonForKind(fieldDraft.kind)
  fieldModalOpen.value = true
}

async function submitNewField() {
  if (!fieldContext.value) return
  fieldFormError.value = ''
  const parsedConfig = parseRecordFieldConfigJson(fieldDraft.config_json, fieldDraft.kind)
  if (!parsedConfig.ok) {
    fieldFormError.value = parsedConfig.message
    return
  }
  const config = parsedConfig.config

  const foTrim = fieldDraft.field_order_str.trim()
  let fo: number | undefined
  if (foTrim !== '') {
    const n = Number(foTrim)
    if (!Number.isInteger(n)) {
      fieldFormError.value = '`field_order` must be an integer.'
      return
    }
    fo = n
  }

  fieldSaving.value = true
  try {
    await $fetch('/api/admin/record-type-fields', {
      method: 'POST',
      body: {
        record_type_id: fieldContext.value.id,
        field_key: fieldDraft.field_key.trim(),
        kind: fieldDraft.kind,
        label: fieldDraft.label.trim(),
        description: fieldDraft.description.trim(),
        ...(fo !== undefined ? { field_order: fo } : {}),
        config
      }
    })
    toast.add({ title: 'Field created', color: 'success' })
    fieldModalOpen.value = false
    await refresh()
  } catch (e: unknown) {
    fieldFormError.value = e instanceof Error
      ? e.message
      : String((e as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Request failed')
  } finally {
    fieldSaving.value = false
  }
}

function openEditField(field: RecordTypeFieldRow) {
  editingField.value = field
  editFormError.value = ''
  editDraft.label = field.label
  editDraft.description = field.description ?? ''
  editDraft.field_order = field.field_order
  editDraft.config_json = `${JSON.stringify(field.config ?? {}, null, 2)}\n`
  editModalOpen.value = true
}

async function submitEditField() {
  if (!editingField.value) return
  editFormError.value = ''
  const parsedConfig = parseRecordFieldConfigJson(
    editDraft.config_json,
    editingField.value.kind
  )
  if (!parsedConfig.ok) {
    editFormError.value = parsedConfig.message
    return
  }
  const config = parsedConfig.config

  const ord = Number(editDraft.field_order)
  if (!Number.isInteger(ord)) {
    editFormError.value = '`field_order` must be an integer.'
    return
  }

  editSaving.value = true
  try {
    await $fetch(`/api/admin/record-type-fields/${editingField.value.id}`, {
      method: 'PATCH',
      body: {
        label: editDraft.label.trim(),
        description: editDraft.description.trim(),
        field_order: ord,
        config
      }
    })
    toast.add({ title: 'Field updated', color: 'success' })
    editModalOpen.value = false
    await refresh()
  } catch (e: unknown) {
    editFormError.value = e instanceof Error
      ? e.message
      : String((e as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Request failed')
  } finally {
    editSaving.value = false
  }
}

function openDeleteField(field: RecordTypeFieldRow) {
  deleteFieldTarget.value = field
  deleteModalOpen.value = true
}

async function confirmDeleteField() {
  if (!deleteFieldTarget.value) return
  deleteSaving.value = true
  try {
    await $fetch(`/api/admin/record-type-fields/${deleteFieldTarget.value.id}`, {
      method: 'DELETE'
    })
    toast.add({ title: 'Field deleted', color: 'success' })
    deleteModalOpen.value = false
    await refresh()
  } catch (e: unknown) {
    toast.add({
      title: 'Delete failed',
      description: String((e as { data?: { statusMessage?: string } })?.data?.statusMessage ?? e),
      color: 'error'
    })
  } finally {
    deleteSaving.value = false
  }
}

function actionsCell() {
  return ({ row }: { row: { original: RecordTypeFieldRow } }) => {
    const field = row.original
    if (field.is_system) {
      return h(
        'span',
        {
          class: 'text-xs text-(--ui-text-muted)'
        },
        'Locked'
      )
    }
    return h(
      'div',
      { class: 'flex justify-end gap-1' },
      [
        h(
          UButton,
          {
            'size': 'xs',
            'variant': 'ghost',
            'color': 'neutral',
            'icon': 'i-lucide-pencil',
            'aria-label': `Edit ${field.field_key}`,
            'onClick': (e: Event) => {
              e.stopPropagation()
              openEditField(field)
            }
          }
        ),
        h(
          UButton,
          {
            'size': 'xs',
            'variant': 'ghost',
            'color': 'error',
            'icon': 'i-lucide-trash-2',
            'aria-label': `Delete ${field.field_key}`,
            'onClick': (e: Event) => {
              e.stopPropagation()
              openDeleteField(field)
            }
          }
        )
      ]
    )
  }
}

function fieldTableColumns(): TableColumn<RecordTypeFieldRow>[] {
  return [
    { accessorKey: 'field_key', header: 'Key' },
    {
      id: 'def',
      accessorKey: 'is_system',
      header: '',
      cell: ({ row }) => {
        if (row.original.is_system) {
          return h(
            UBadge,
            { color: 'neutral', variant: 'outline', size: 'xs' },
            () => 'system'
          )
        }
        return h(
          UBadge,
          { color: 'success', variant: 'outline', size: 'xs' },
          () => 'custom'
        )
      }
    },
    { accessorKey: 'kind', header: 'Kind' },
    { accessorKey: 'label', header: 'Label' },
    { accessorKey: 'field_order', header: 'Order' },
    {
      id: 'value_storage',
      header: 'Value storage',
      cell: ({ row }) => {
        const b = storageBadge(row.original.value_storage)
        return h(
          UBadge,
          { color: b.color, variant: 'subtle', size: 'sm' },
          () => b.label
        )
      }
    },
    {
      id: 'actions',
      header: '',
      cell: actionsCell()
    }
  ]
}
</script>

<template>
  <div class="max-w-6xl space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">
          Record types &amp; fields
        </h1>
        <p class="mt-1 text-sm text-(--ui-text-muted)">
          Manage record types and fields. Seeded rows stay read-only ("system"). Satellite field
          values assemble on read; editing them via API is a follow-up. Switch record types with the
          buttons below the header. Use the Detail layout action
          to split the user detail view into sections (stored in
          <code class="font-mono text-xs">record_types.meta.detail_layout</code>).
        </p>
      </div>
      <div class="shrink-0">
        <UButton
          icon="i-lucide-plus"
          color="primary"
          @click="openCreateTypeModal"
        >
          New record type
        </UButton>
      </div>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      title="Could not load schema"
      :description="error.message || 'Request failed'"
    />

    <div
      v-if="pending && !data?.record_types?.length"
      class="animate-pulse space-y-4"
    >
      <div class="h-10 rounded-lg bg-(--ui-bg-accented)" />
      <div class="h-48 rounded-lg bg-(--ui-bg-accented)" />
    </div>

    <template v-else-if="data?.record_types?.length">
      <div
        class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
        role="tablist"
        aria-label="Record types"
      >
        <UButton
          v-for="rt in data.record_types"
          :key="rt.id"
          class="shrink-0"
          size="sm"
          :variant="rt.id === selectedRecordTypeId ? 'solid' : 'outline'"
          :color="rt.id === selectedRecordTypeId ? 'primary' : 'neutral'"
          :aria-selected="rt.id === selectedRecordTypeId"
          role="tab"
          @click="selectedRecordTypeId = rt.id"
        >
          {{ rt.label_plural }}
        </UButton>
      </div>

      <UCard
        v-if="selectedRecordType"
        :key="selectedRecordType.id"
        class="overflow-hidden"
      >
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 class="text-lg font-semibold">
                {{ selectedRecordType.label_plural }}
              </h2>
              <p class="text-sm text-(--ui-text-muted) font-mono">
                {{ selectedRecordType.type_key }}
                <UBadge
                  v-if="selectedRecordType.is_system"
                  class="ml-2 align-middle"
                  color="neutral"
                  variant="outline"
                  size="xs"
                >
                  system type
                </UBadge>
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <UButton
                icon="i-lucide-layout-dashboard"
                variant="outline"
                size="sm"
                @click="openLayoutModal(selectedRecordType)"
              >
                Detail layout
              </UButton>
              <UButton
                icon="i-lucide-list-plus"
                variant="outline"
                size="sm"
                @click="openAddField(selectedRecordType)"
              >
                Add field
              </UButton>
            </div>
          </div>
        </template>

        <UTable
          :data="fieldsForType(selectedRecordType.id)"
          :columns="fieldTableColumns()"
          :empty-state="{
            icon: 'i-lucide-layout-list',
            label: 'No fields',
            description: 'This record type has no field definitions.'
          }"
        />
      </UCard>
    </template>

    <UModal
      v-model:open="layoutModalOpen"
      :dismissible="!layoutSaving"
    >
      <template #content>
        <div class="space-y-4 p-6">
          <h3 class="text-lg font-semibold">
            Detail layout
            <template v-if="layoutRt">
              — {{ layoutRt.label_plural }}
            </template>
          </h3>
          <p class="text-sm text-(--ui-text-muted)">
            JSON with <code class="font-mono text-xs">sections: [{ id, title?, field_keys: string[] }]</code>.
            Keys must match field keys for this type; unknown keys are dropped when saved. Any fields
            not listed get an “Additional fields” section on read unless you reset to automatic.
          </p>
          <UAlert
            v-if="layoutError"
            color="error"
            variant="soft"
            :title="layoutError"
            :close-button="{ icon: 'i-lucide-x', color: 'neutral', variant: 'ghost' }"
            @close="layoutError = ''"
          />
          <UFormField label="detail_layout JSON">
            <UTextarea
              v-model="layoutJson"
              :disabled="layoutSaving"
              rows="14"
              class="w-full font-mono text-xs"
            />
          </UFormField>
          <div class="flex flex-wrap justify-end gap-2 pt-2">
            <UButton
              variant="ghost"
              color="neutral"
              :disabled="layoutSaving"
              @click="layoutModalOpen = false"
            >
              Cancel
            </UButton>
            <UButton
              variant="outline"
              color="neutral"
              icon="i-lucide-rotate-ccw"
              :disabled="layoutSaving"
              @click="resetLayoutToAutomatic"
            >
              Reset automatic
            </UButton>
            <UButton
              color="primary"
              icon="i-lucide-save"
              :loading="layoutSaving"
              @click="submitLayoutDraft"
            >
              Save layout
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="typeModalOpen"
      :dismissible="!typeSaving"
    >
      <template #content>
        <form
          class="space-y-4 p-6"
          @submit.prevent="submitNewType"
        >
          <h3 class="text-lg font-semibold">
            New record type
          </h3>

          <UAlert
            v-if="typeFormError"
            color="error"
            variant="soft"
            :title="typeFormError"
            :close-button="{ icon: 'i-lucide-x', color: 'neutral', variant: 'ghost' }"
            @close="typeFormError = ''"
          />

          <UFormField
            label="Type key"
            required
          >
            <UInput
              v-model="newType.type_key"
              placeholder="e.g. trainings"
              :disabled="typeSaving"
              autocomplete="off"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Singular label"
            required
          >
            <UInput
              v-model="newType.label"
              placeholder="Training"
              :disabled="typeSaving"
              autocomplete="off"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Plural label"
            required
          >
            <UInput
              v-model="newType.label_plural"
              placeholder="Trainings"
              :disabled="typeSaving"
              autocomplete="off"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Description">
            <UTextarea
              v-model="newType.description"
              :disabled="typeSaving"
              class="w-full"
              placeholder="Optional"
            />
          </UFormField>
          <div class="flex justify-end gap-2 pt-2">
            <UButton
              variant="ghost"
              color="neutral"
              type="button"
              :disabled="typeSaving"
              @click="typeModalOpen = false"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              icon="i-lucide-save"
              :loading="typeSaving"
            >
              Create
            </UButton>
          </div>
        </form>
      </template>
    </UModal>

    <UModal
      v-model:open="fieldModalOpen"
      :dismissible="!fieldSaving"
    >
      <template #content>
        <form
          class="space-y-4 p-6"
          @submit.prevent="submitNewField"
        >
          <h3 class="text-lg font-semibold">
            Add field
            <template v-if="fieldContext?.label_plural">
              — {{ fieldContext.label_plural }}
            </template>
          </h3>

          <UAlert
            v-if="fieldFormError"
            color="error"
            variant="soft"
            :title="fieldFormError"
            :close-button="{ icon: 'i-lucide-x', color: 'neutral', variant: 'ghost' }"
            @close="fieldFormError = ''"
          />

          <UFormField
            label="Field key"
            required
          >
            <UInput
              v-model="fieldDraft.field_key"
              placeholder="e.g. cohort_name"
              :disabled="fieldSaving"
              class="w-full font-mono"
            />
          </UFormField>
          <UFormField label="Kind">
            <USelect
              v-model="fieldDraft.kind"
              :items="data?.allowed_field_kinds ?? ['text']"
              :disabled="fieldSaving"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Label"
            required
          >
            <UInput
              v-model="fieldDraft.label"
              :disabled="fieldSaving"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Description">
            <UTextarea
              v-model="fieldDraft.description"
              :disabled="fieldSaving"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Order (optional integer)">
            <UInput
              v-model="fieldDraft.field_order_str"
              type="text"
              inputmode="numeric"
              placeholder="Leave blank for next auto slot"
              :disabled="fieldSaving"
              class="w-full font-mono"
            />
          </UFormField>
          <UFormField
            label="Config (JSON)"
            :description="addFieldConfigDescription"
          >
            <UTextarea
              v-model="fieldDraft.config_json"
              :disabled="fieldSaving"
              rows="8"
              class="w-full font-mono text-sm"
            />
          </UFormField>
          <div class="flex justify-end gap-2 pt-2">
            <UButton
              variant="ghost"
              color="neutral"
              type="button"
              :disabled="fieldSaving"
              @click="fieldModalOpen = false"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              icon="i-lucide-save"
              :loading="fieldSaving"
            >
              Save
            </UButton>
          </div>
        </form>
      </template>
    </UModal>

    <UModal
      v-model:open="editModalOpen"
      :dismissible="!editSaving"
    >
      <template #content>
        <form
          class="space-y-4 p-6"
          @submit.prevent="submitEditField"
        >
          <h3 class="text-lg font-semibold">
            Edit field
          </h3>
          <p
            v-if="editingField"
            class="text-sm font-mono text-(--ui-text-muted)"
          >
            {{ editingField.field_key }} · {{ editingField.kind }}
          </p>

          <UAlert
            v-if="editFormError"
            color="error"
            variant="soft"
            :title="editFormError"
            :close-button="{ icon: 'i-lucide-x', color: 'neutral', variant: 'ghost' }"
            @close="editFormError = ''"
          />

          <UFormField label="Label">
            <UInput
              v-model="editDraft.label"
              :disabled="editSaving"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Description">
            <UTextarea
              v-model="editDraft.description"
              :disabled="editSaving"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Order">
            <UInput
              v-model.number="editDraft.field_order"
              type="number"
              :disabled="editSaving"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Config (JSON)"
            :description="editFieldConfigDescription"
          >
            <UTextarea
              v-model="editDraft.config_json"
              :disabled="editSaving"
              rows="10"
              class="w-full font-mono text-sm"
            />
          </UFormField>
          <div class="flex justify-end gap-2 pt-2">
            <UButton
              variant="ghost"
              color="neutral"
              type="button"
              :disabled="editSaving"
              @click="editModalOpen = false"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              icon="i-lucide-save"
              :loading="editSaving"
            >
              Save
            </UButton>
          </div>
        </form>
      </template>
    </UModal>

    <UModal
      v-model:open="deleteModalOpen"
      :dismissible="!deleteSaving"
    >
      <template #content>
        <div class="space-y-4 p-6">
          <h3 class="text-lg font-semibold">
            Delete field
          </h3>
          <p
            v-if="deleteFieldTarget"
            class="text-sm text-(--ui-text-muted)"
          >
            Remove
            <span class="font-mono">{{ deleteFieldTarget.field_key }}</span>
            permanently? Existing records keep JSON under that key until data is migrated.
          </p>
          <div class="flex justify-end gap-2 pt-2">
            <UButton
              variant="ghost"
              color="neutral"
              :disabled="deleteSaving"
              @click="deleteModalOpen = false"
            >
              Cancel
            </UButton>
            <UButton
              color="error"
              icon="i-lucide-trash-2"
              :loading="deleteSaving"
              @click="confirmDeleteField"
            >
              Delete
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
