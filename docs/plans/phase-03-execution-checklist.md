# Phase 03 — Execution checklist

**Roadmap**: [master-roadmap.md](master-roadmap.md) · **Playbook**: [../phases/phase-03-listing-and-queries.md](../phases/phase-03-listing-and-queries.md)  
**API contract**: [phase-03-list-query-contract.md](phase-03-list-query-contract.md)

Use this checklist while implementing; flip items as PRs merge.

## A — Documentation & contracts

- [x] List query params documented (`limit`, `offset`, `sort`, `q`, `filters`) — see [phase-03-list-query-contract.md](phase-03-list-query-contract.md).
- [x] Mermaid diagram in playbook: request → RBAC → query → JSON response ([phase-03 playbook](../phases/phase-03-listing-and-queries.md#list-request-flow-implemented-path)).
- [x] Note explicitly deferred for this phase: **cross-type unified list** endpoint, **cursor pagination**, dedicated **search index ADR** (same playbook: “Explicitly deferred this phase”).

## B — Server: per-type list API

- [x] Extend `GET /api/records/:typeKey` beyond offset/limit: **sort**, **q** (name search), **`filters`** (JSON whitelist by field schema).
- [x] Regression / unit coverage for URL parsing and filter validation (Vitest).
- [x] Optional: `record-hooks` choke point `beforeList` / `afterList` ([extensibility](./extensibility-nuxt-layers-and-hooks.md)).

## C — Client: hubs

- [x] Contacts and Groups hub pages (`/contacts`, `/groups`): table, pagination, name search wired to API.
- [x] Row click → record detail (**Phase 04**) or interim read-only drawer.
- [x] “New …” wired to **`POST /api/records/:typeKey`** (modal or dedicated page).

## D — QA

- [x] Manual: pagination, empty state, forbidden (role without `read`) — [QA (Phase 03)](../phases/phase-03-listing-and-queries.md#qa-phase-03) (run before milestone sign-off).
- [x] Safari smoke (known dev quirks) vs Firefox baseline — same [QA section](../phases/phase-03-listing-and-queries.md#safari-vs-firefox-baseline).

## E — Completion report

- [x] Summary published under `docs/reports/` using **`YYMMDDHHMM-phase-03-completion-summary.md`** — [2605121430 — Phase 03 completion summary](../reports/2605121430-phase-03-completion-summary.md).
