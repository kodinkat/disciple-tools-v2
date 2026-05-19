# Phase 04 execution checklist — record detail & field rendering

Companion to [Phase 4 playbook](../phases/phase-04-record-detail-and-field-rendering.md) and downstream ADRs/TBD specs for detail layout.

**Completion report (Phase 04)**: [2605121533-phase-04-completion-summary.md](../reports/2605121533-phase-04-completion-summary.md). **Naming for later phases**: `docs/reports/YYMMDDHHMM-phase-04-completion-summary.md`.

---

## A — Contracts & APIs

- [x] Detail/settings payload shape agreed and documented — [phase-04-detail-view-contract.md](phase-04-detail-view-contract.md) (`detail.layout`, `detail.fields` on **`GET /api/records/:typeKey/:id`**).

## B — Server

- [x] **`GET /api/records/:typeKey/:id`** returns **`detail`** built from **`record_type_fields`** + `record.data` ([buildRecordDetailPayload](../../app/server/utils/record-detail-payload.ts)).

## C — Client

- [x] **Interim detail** uses **`RecordDetailFields`** (`dt-text`, `dt-single-select`, fallback JSON) + plugin **`dt-web-components.client`**.
- [x] **Tiles / sections** UI (`detail.layout` → `UCard` per section) + **`PATCH`** saving for **`text`** / **`key_select`** (`RecordDetail`; `pickScalarFieldPatch` in [`app/utils/record-field-patch.ts`](../../app/app/utils/record-field-patch.ts)).

## D — QA

- [x] Manual / automated regression — [Phase 04 playbook § QA](../phases/phase-04-record-detail-and-field-rendering.md#qa-phase-04) (Firefox / Safari); Vitest **`record-detail-payload`**, **`record-field-patch`**, **`record-mutations`** in **`app/`**.

## E — Completion report

- [x] Executive / engineering summary — [2605121533-phase-04-completion-summary.md](../reports/2605121533-phase-04-completion-summary.md) (see Phase 03: [2605121430-phase-03-completion-summary.md](../reports/2605121430-phase-03-completion-summary.md)).

---

## Build notes (Nuxt + `@disciple.tools/web-components`)

- **Theme CSS:** the published package includes `src/styles/light.css` (and dark/dim) but not the monorepo aggregate `components.css`. The app loads **`light.css`** via **`nuxt.config` `css`** so global `dt-*` variables apply on `html`.
- **`element-internals-polyfill`:** list this as a **direct** app dependency; the library’s source imports it but npm does not install it transitively.
- **`__LIB_VERSION__`:** the published library entry **`index.js`** reads **`export const version = __LIB_VERSION__`** (normally injected when *building* the library). **`nuxt.config`** **`vite.define`** maps this from **`node_modules/@disciple.tools/web-components/package.json`** `version` so **`nuxt dev`** / **`nuxt build`** do not throw **`ReferenceError`**.

---

## Links

- [Master roadmap — Phase 4](master-roadmap.md)
