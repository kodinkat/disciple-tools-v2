# Phase 04 execution checklist — record detail & field rendering

Companion to [Phase 4 playbook](../phases/phase-04-record-detail-and-field-rendering.md) and downstream ADRs/TBD specs for detail layout.

**Completion report naming** (establish once, reuse each phase close-out): publish under **`docs/reports/YYMMDDHHMM-phase-04-completion-summary.md`** (management-facing narrative; **`YYMMDDHHMM`** aligns with existing reports — see Phase 03 example).

---

## A — Contracts & APIs

- [ ] Detail/settings payload shape agreed and documented (“`post_settings`-like”: fields, sections, tiles, edit flags).

## B — Server

- [ ] Endpoints or aggregations serve **typed field schema + layout metadata** to the detail route (exact paths TBD during execution).

## C — Client

- [ ] Detail route replaces or augments interim read-only JSON view where appropriate.
- [ ] [@disciple.tools/web-components](https://github.com/DiscipleTools/disciple-tools-web-components) integration with **SSR-safe** boundaries (client islands / registration strategy).

## D — QA

- [ ] Manual / automated regression for representative field kinds (mirror [Phase 03 QA](../phases/phase-03-listing-and-queries.md#qa-phase-03) style where useful).

## E — Completion report

- [ ] Executive / engineering summary in **`docs/reports/`** using **`YYMMDDHHMM-phase-04-completion-summary.md`** (see Phase 03: [2605121430-phase-03-completion-summary.md](../reports/2605121430-phase-03-completion-summary.md)).

---

## Links

- [Master roadmap — Phase 4](master-roadmap.md)
