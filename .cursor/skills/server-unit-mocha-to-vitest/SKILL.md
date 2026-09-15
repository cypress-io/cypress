---
name: server-unit-mocha-to-vitest
description: >-
  Migrates @packages/server unit tests from Mocha (_mocha + run.js) to Vitest using
  disjoint file naming, Vitest-only APIs (expect, vi), and env stubs via vi.stubEnv.
  Use when migrating test/unit specs, adding *.spec.ts/js tests, or when the user
  mentions server unit tests, Mocha to Vitest, or spec_helper for unit tests.
---

# Server unit tests: Mocha → Vitest migration

Applies to **[`packages/server`](packages/server)**. Integration tests (`test/integration`) and performance tests stay on Mocha until separately migrated.

**Orchestration:** For which sibling skills to apply and in what order, read [`server-unit-vitest-migration-guide`](../server-unit-vitest-migration-guide/SKILL.md) first.

## File naming (non-negotiable)

| Runner | Glob under `test/unit/` | Example |
|--------|-------------------------|---------|
| Mocha | `**/*_spec.js`, `**/*_spec.ts` | `cache_spec.ts` |
| Vitest | `**/*.spec.js`, `**/*.spec.ts` | `append_electron_switches.spec.ts` |

Patterns must **not overlap**. Migrate by renaming `foo_spec.ts` → `foo.spec.ts` and editing in one change.

- Mocha’s unit glob is narrowed in [`test/scripts/run.js`](packages/server/test/scripts/run.js) so only `*_spec` files run.
- Vitest picks up only `*.spec.*` via [`vitest.config.ts`](packages/server/vitest.config.ts).
- `yarn test-unit` runs Mocha (legacy unit globs) **then** `vitest run`.

## Use Vitest APIs only in migrated files

Do **not** add `sinon`, `chai`, `@cypress/sinon-chai`, or `mocked-env` to new Vitest specs unless there is an exceptional, documented reason.

| Need | Use |
|------|-----|
| Assertions | `import { expect } from 'vitest'` (or rely on `globals: true` + explicit import for clarity) |
| Function mocks | `vi.fn()` |
| Module / object spies | `vi.spyOn(obj, 'method').mockReturnValue(...)` |
| Restore spies / mocks | `vi.restoreAllMocks()` in `afterEach` |
| `process.env` | `vi.stubEnv('KEY', 'value')` in the test (or `beforeEach`); `vi.unstubAllEnvs()` in `afterEach` |
| Mocha `context` | `describe` (Vitest has no `context` alias) |
| Mocha `this.timeout(n)` | `it(..., { timeout: n })` or `test.setTimeout(n)` inside the test |
| Mocha `this.skip()` | `it.skip(...)` or conditional skip |

## Environment variables

Prefer **`vi.stubEnv` / `vi.unstubAllEnvs()`** over `mocked-env`. The legacy package may remain in `package.json` for unmigrated Mocha specs.

## Order of migration (lowest friction first)

1. **Self-contained specs** — already import their own deps or only need `vi`; no [`spec_helper.js`](packages/server/test/spec_helper.js).
2. **spec_helper consumers** — audit what the file actually needs (nock, data-context, cache) and **inline** per file; do **not** recreate a global `spec_helper` for Vitest. See [server-unit-migrate-from-spec-helper](../server-unit-migrate-from-spec-helper/SKILL.md).
3. **snap-shot-it**, heavy `this.timeout` / `this.skip` — last; often need snapshot or API rewrites.
4. **mockery / deep stubs** — replace with **`vi.mock` + `vi.hoisted` + `importOriginal`** (see [server-unit-deep-mocks-vitest](../server-unit-deep-mocks-vitest/SKILL.md)); legacy **`put_protocol_artifact_spec`** is migrated to **`put_protocol_artifact.spec.ts`**.

## Verification

```bash
yarn workspace @packages/server test-unit-vitest
yarn workspace @packages/server test-unit-vitest -- test/unit/<name>.spec.ts
```

Run full `test-unit` before merging so both Mocha and Vitest pass.

## Project docs

See [`packages/server/AGENTS.md`](packages/server/AGENTS.md) and [`packages/server/CLAUDE.md`](packages/server/CLAUDE.md) for the same rules in repo context.

## Related

- [Primary migration guide (skill index & order)](../server-unit-vitest-migration-guide/SKILL.md)
- [Nock + Vitest](../server-unit-nock-vitest/SKILL.md)
- [Deep mocks (mockery → Vitest)](../server-unit-deep-mocks-vitest/SKILL.md)
- [JS `*_spec.js` → TypeScript `*.spec.ts`](../server-unit-js-spec-to-ts-vitest/SKILL.md)
- [Migrating off `spec_helper`](../server-unit-migrate-from-spec-helper/SKILL.md)
- [Sinon mocks → Vitest `vi`](../server-unit-sinon-to-vitest-mocks/SKILL.md)
