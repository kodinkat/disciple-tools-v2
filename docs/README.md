# Disciple Tools v2 — Documentation

Entry point for planning, architecture, phased delivery, and recorded decisions.

## Where to start

| Audience | Start here |
|----------|------------|
| Roadmap and scope | [plans/master-roadmap.md](plans/master-roadmap.md) |
| **Testing (Vitest, CI, v1 parity)** | [testing-strategy.md](testing-strategy.md) |
| Roles & permissions | [plans/roles-and-permissions-matrix.md](plans/roles-and-permissions-matrix.md) |
| Phase 02 checklist | [plans/phase-02-execution-checklist.md](plans/phase-02-execution-checklist.md) |
| **v1 → v2 hook catalogue** | [plans/phase-02-v1-hook-catalogue.md](plans/phase-02-v1-hook-catalogue.md) |
| Local Postgres (Docker) | [plans/local-postgresql-docker.md](plans/local-postgresql-docker.md) |
| Extensibility (layers + hooks) | [plans/extensibility-nuxt-layers-and-hooks.md](plans/extensibility-nuxt-layers-and-hooks.md) |
| Phase execution playbooks | [phases/](phases/) |
| Executive / milestone snapshots | [reports/](reports/) — e.g. [Phase 02 completion](reports/2605061430-phase-02-completion-summary.md), [Phase 03 completion](reports/2605121430-phase-03-completion-summary.md) |
| Architecture decisions | [adr/](adr/) |
| System context (when expanded) | [architecture.md](architecture.md) |

## Diagrams

Where flows, boundaries, or pipelines help understanding, prefer **[Mermaid](https://mermaid.js.org)** diagrams in Markdown (rendered on GitHub and most doc tools). Conventions:

- Use **camelCase or underscores** in node IDs (avoid spaces in IDs).
- Prefer **flowchart**, **sequenceDiagram**, or **C4-style** narrative blocks for request lifecycles, hook pipelines, and layer stacking.

## Structure

```
docs/
├── README.md                 # This file
├── architecture.md           # System context (stub → expand post-scaffold)
├── plans/                    # Roadmaps and deep-dive plans
├── phases/                   # Phase playbooks (stubs → expand during execution)
├── reports/                  # Time-stamped management snapshots (YYMMDDHHMM-*.md)
└── adr/                      # Architecture Decision Records
```
