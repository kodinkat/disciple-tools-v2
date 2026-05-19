# Phase 4 — Record detail: tiles, sections, web components

> **Status**: **Implemented** — primary checklist deliverables complete ([completion report](../reports/2605121533-phase-04-completion-summary.md)); run [manual QA §](#qa-phase-04) before browser release sign-off; **Storybook/kitchen-sink** remains optional (deliverable below).  
> **Parent plan**: [Master roadmap](../plans/master-roadmap.md)  
> **Execution checklist**: [phase-04 execution checklist](../plans/phase-04-execution-checklist.md) · **completion report**: [2605121533-phase-04-completion-summary.md](../reports/2605121533-phase-04-completion-summary.md)  
> **Detail contract**: [phase-04-detail-view-contract.md](../plans/phase-04-detail-view-contract.md)

## Objectives

- API: `post_settings`-like payload (fields, tiles, section order, edit flags).
- Map field types → [@disciple.tools/web-components](https://github.com/DiscipleTools/disciple-tools-web-components); Nuxt SSR boundaries (client-only registration / islands).
- **Layers** for optional UI feature packs (theme, field packs) where appropriate — [Extensibility](../plans/extensibility-nuxt-layers-and-hooks.md).
- **Hooks** for extending detail schema or injecting UI metadata (design in server hook registry).

## Deliverables

- [x] Detail route + renderer (**API `detail`**, `RecordDetail` + `RecordDetailFields`, **`GET` + `PATCH`** for scalar fields; section layout from `detail.layout`).
- [x] Contacts / Groups detail: manual QA playbook ([§ QA](#qa-phase-04)); automated regression covered by Vitest **`record-detail-payload`**, **`record-field-patch`**, **`record-mutations`** (server field rules).
- [ ] Storybook or kitchen-sink integration for regression on field components.
- [x] **Completion report** — [2605121533-phase-04-completion-summary.md](../reports/2605121533-phase-04-completion-summary.md); checklist [§ E](../plans/phase-04-execution-checklist.md).

## QA (Phase 04)

Execute in **local dev** (`nuxt dev` + database migrated and seeded per **`005_seed_contacts_and_groups`**). **Firefox** establishes baseline behaviour; repeat the same flows in **Safari** (macOS/iOS). Note quirks (Lit shadow boundaries, native `<select>` styling, focus rings) alongside pass/fail.

### Preconditions

1. Signed-in user with **`records.contacts.read`** / **`records.groups.read`** (required to reach **`/contacts/[id]`** and **`/groups/[id]`** — same middleware as hubs).
2. To exercise **save**, the user must also have **`records.contacts.write`** / **`records.groups.write`** (see role definitions).
3. Seeded schema exposes representative kinds: contacts **`text`** (**name**, **nickname**) + **`key_select`** (**overall_status**); groups **`text`** (**name**) + **`key_select`** (**group_status**, **group_type**).

### Detail payload & layout

1. From **`/contacts`** or **`/groups`**, open a row → detail route loads without hard error.
2. Confirm **Timeline** **`UCard`** (created / updated / created by) and at least one section **`UCard`** whose header matches **`detail.layout`** (v1 ships a single **`primary`** section titled **Details**).
3. **Network (optional):** **`GET /api/records/:typeKey/:id`** returns **`detail.fields`** ordered by **`field_order`**; each entry includes **`kind`**, **`label`**, **`value`**, and for **`key_select`** a **`select_options`** array suited to **`dt-single-select`**.
4. **Contacts:** verify **Name**, **Nickname**, **Contact status** render as **`dt-text`** / **`dt-single-select`** (not the JSON fallback block). **Groups:** verify **Group name**, **Group status**, **Group type** similarly.

### Edit, discard, save (**has write**)

1. Badge should read **Editable** (not **Read-only**); **Discard** and **Save** appear.
2. Change **Nickname** (contacts): after the control commits (**blur** / **`change`** on **`dt-text`**), badge should flip to **Edited**; **Discard** restores the prior value and clears **Edited** when nothing else changed.
3. Change **Name**, click **Save**: expect success feedback (**toast** title “Record saved” when Nuxt UI toaster is enabled); **Updated** in Timeline advances; page headline reflects new name after **`refresh`**.
4. Change **Contact status** (**`overall_status`**) via **`dt-single-select`**, **Save**, reload detail — selected option persists.
5. **Clear-only regression:** clearing optional **Nickname** (empty string), **Save**, reload — empty nickname should persist without violating **`name`** required rules.

### Read-only (**missing write**)

1. Use a role (or temporary user) that has **`records.*.read`** but **not** **`records.*.write`** for that type.
2. Open detail: badge **Read-only**; **`dt-*`** controls **disabled**; **Discard** / **Save** **must not** appear.
3. **API (optional):** **`PATCH /api/records/:typeKey/:id`** with valid **`{ data: { … } }`** body should return **403** for that session.

### Forbidden (**missing read**)

Same pattern as [Phase 03 QA — Forbidden](../phases/phase-03-listing-and-queries.md#forbidden-missing-read): without **`records.contacts.read`**, **`/contacts/[id]`** should redirect (middleware → **`/dashboard`**). Optionally confirm **`GET`** detail returns **403**.

### Safari vs Firefox baseline

Repeat **layout**, **edit → discard**, **edit → save** (**text** + **key_select**), and **back** link to hub. Record Safari-only issues (e.g. **`dt-single-select`** arrow overlap, disabled field contrast) for follow-up.

### Automated regression (CI)

These Vitest suites cover schema/detail shaping and PATCH-side rules without driving the browser:

- **`tests/unit/record-detail-payload.spec.ts`** — `buildRecordDetailPayload` ordering and **`key_select`** option mapping.
- **`tests/unit/record-field-patch.spec.ts`** — scalar diff used before **`PATCH`**.
- **`tests/unit/record-mutations.spec.ts`** — required fields / UUID assertions used by **`PATCH`** handler.

Run **`npm run test`** in **`app/`**.

## Dependencies

- Phase 2 schema; Phase 3 optional for navigational context.

## References

- v1: `dt-assets/js/details.js` patterns (disciple-tools-theme)
