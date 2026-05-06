# Phase 3 — Listing and queries

> **Status**: Stub — expand during execution  
> **Parent plan**: [Master roadmap](../plans/master-roadmap.md)

## Objectives

- Per-type list API (mental model: `DT_Posts::list_posts(post_type, query)`).
- Cross-type / unified listing surface; filter JSON contract stable for clients.
- Optional search index (ADR) if Postgres-only listing is insufficient.
- **Hook points** (optional): pre/post list query, filter normalization — [Extensibility](../plans/extensibility-nuxt-layers-and-hooks.md).

## Deliverables

- [ ] List endpoints + pagination/sort/filter docs.
- [ ] Mermaid sequence or flow diagrams for list request → policy → query → response (add when implemented).

## Dependencies

- Phase 2 domain model + authz.

## References

- v1: `docs/dt-posts-list-query.md` (disciple-tools-theme)
