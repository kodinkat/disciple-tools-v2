# Testing strategy — Disciple Tools v2 (`app`)

**Audience**: Engineers shipping the Nuxt/Nitro app. This document complements v1’s **`tests/`** tree in [DiscipleTools/disciple-tools-theme](https://github.com/DiscipleTools/disciple-tools-theme) (PHPUnit + WordPress test harness).

---

## Relation to Disciple Tools v1

| v1 ([disciple-tools-theme `tests/`](https://github.com/DiscipleTools/disciple-tools-theme/tree/master/tests)) | This app |
|-----------------------------|----------|
| [PHPUnit](https://phpunit.de/) targeting WordPress-loaded code (`tests/unit-test-*.php`, `tests/dt-posts/**/*.php`) | [Vitest](https://vitest.dev/) targeting TypeScript utilities and future component/API tests (`app/tests/**/*.spec.ts`) |
| Depends on `./tests/install-wp-tests.sh` + bootstrap that loads WP | No WordPress dependency; Postgres + migrations for integration tests when added |
| `tests/README.md`: run PHPUnit with optional `--testdox` | `npm run test` (CI-safe), `npm run test:watch` (development) |

v1 organizes **domain-heavy** coverage around post types (`unit-test-create-post.php`, capabilities, duplicates, API). **Parity expectation for v2**: similar *behaviour coverage* via TypeScript layers (validators, RBAC helpers, mutation pipelines), not PHP file parity.

---

## When to evolve this strategy

Introduce or expand automated tests whenever one of these is true:

1. **New domain invariant** — e.g. required fields, RBAC verbs, pagination limits, UUID rules.
2. **Regression-risk change** — shared helpers used by many handlers (`record-mutations`, `rbac`, hooks).
3. **Public contract** — API input/output shape or OAuth/delegation rules.
4. **Before “done” milestones** — phase exit (see [plans/master-roadmap.md](plans/master-roadmap.md)): add smoke tests suited to what shipped that phase.

Defer **full-stack E2E** until flows span multiple authenticated screens and regress without API tests catching them (often mid–late roadmap).

---

## Layers (recommended stack)

### 1. Unit tests — **Vitest**, Node environment

**What**: Pure functions and small modules with no live DB/network (or mocks only).

**Where**: [`app/tests/unit/`](../../app/tests/unit/).

**Examples today**: [`record-mutations`](../../app/server/utils/record-mutations.ts) (defaults, required checks, UUID guard), [`record-hooks`](../../app/server/utils/record-hooks.ts) pass-through with empty registries.

**Run**: From `app/`, `npm run test`.

### 2. Integration tests — Postgres + Nitro handlers (planned)

**What**: Migrate to a disposable DB URL, seed minimal rows, invoke handlers or hit `fetch` locally.

**When**: After API surface stabilizes per phase — start with mutations that currently lack pure-function seams (PATCH/DELETE, admin users).

Use `DATABASE_URL_TEST` or a docker compose service documented next to [local-postgresql-docker.md](plans/local-postgresql-docker.md).

### 3. End-to-end (optional later)

**What**: Browser automation (Playwright or similar) for login flows, admin shell, magic links — only when UI regressions outweigh maintenance cost.

### 4. Static checks — **already enforced**

[`npm run typecheck`](../../app/package.json) and [`eslint`](../../app/eslint.config.mjs); treat failures like test failures for CI gates.

---

## Conventions

- **`*.spec.ts`** next to or under `app/tests/` to avoid build-time inclusion inside `server/` and `app/` trees.
- **Fixtures**: Prefer small factories in the same file until shared fixtures are needed.
- **Listeners / singleton registries**: Do not mutate global hook arrays in unrelated tests unless you isolate or reset modules (prefer testing pure pipelines or extracting registration into injectable collaborators).
- **CI**: Prefer `npm run test && npm run typecheck && npm run lint && npm run build` before merge once the repo has CI wired.

---

## See also

- [Roles & permissions matrix](plans/roles-and-permissions-matrix.md)
- [Phase 02 execution checklist](plans/phase-02-execution-checklist.md)
