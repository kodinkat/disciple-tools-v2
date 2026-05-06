# Phase 4 — Record detail: tiles, sections, web components

> **Status**: Stub — expand during execution  
> **Parent plan**: [Master roadmap](../plans/master-roadmap.md)

## Objectives

- API: `post_settings`-like payload (fields, tiles, section order, edit flags).
- Map field types → [@disciple.tools/web-components](https://github.com/DiscipleTools/disciple-tools-web-components); Nuxt SSR boundaries (client-only registration / islands).
- **Layers** for optional UI feature packs (theme, field packs) where appropriate — [Extensibility](../plans/extensibility-nuxt-layers-and-hooks.md).
- **Hooks** for extending detail schema or injecting UI metadata (design in server hook registry).

## Deliverables

- [ ] Detail route + renderer.
- [ ] Storybook or kitchen-sink integration for regression on field components.

## Dependencies

- Phase 2 schema; Phase 3 optional for navigational context.

## References

- v1: `dt-assets/js/details.js` patterns (disciple-tools-theme)
