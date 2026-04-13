---
name: server-unit-vitest-migration-guide
description: >-
  Primary orchestration guide for @packages/server unit tests: Mocha (*_spec) → Vitest
  (*.spec), which sibling .cursor/skills to apply, and in what order. Use first when
  migrating test/unit specs, planning a batch migration, or choosing between chai,
  sinon, nock, mockery, and vi.mock patterns.
---

# Server unit tests: Mocha → Vitest (primary guide)

**Scope:** [`packages/server/test/unit`](packages/server/test/unit) only. Integration and perf suites are out of scope until separately migrated.

**Read this skill first** when migrating or reviewing a Mocha `*_spec.{js,ts}` file. It does not replace the focused skills below; it tells you **which** to open and **when**, so work stays consistent with repo conventions ([`vitest.config.ts`](packages/server/vitest.config.ts), [`test/scripts/run.js`](packages/server/test/scripts/run.js), [`packages/server/AGENTS.md`](packages/server/AGENTS.md)).

---

## 1. Baseline spine (almost every file)

Apply these **in this order**. Later steps assume naming and runner rules from step 1.

**Prerequisite (sometimes):** If the spec targets **`lib/**/*.js`** that already **`require`s a `.ts` file** (or a `lib/**/*.ts` file `import`s that JS module), migrate **`lib/.../foo.js` → `foo.ts`** first — see [`server-lib-js-to-ts`](../server-lib-js-to-ts/SKILL.md). Example: `args.js` importing `./proxy` while `proxy.ts` exists blocks a clean `args.spec.ts` migration until `args` is TypeScript.

| Order | Skill | Role |
| ----- | ----- | ---- |
| 1 | [`server-unit-mocha-to-vitest`](../server-unit-mocha-to-vitest/SKILL.md) | Disjoint globs (`foo_spec.*` → `foo.spec.*`), Vitest-only APIs, `context` → `describe`, `vi.stubEnv` / `vi.unstubAllEnvs()`, verification commands. |
| 2 | [`server-unit-migrate-from-spec-helper`](../server-unit-migrate-from-spec-helper/SKILL.md) | Remove `require('…/spec_helper')`; audit nock / cache / data-context; **do not** recreate a global Vitest `spec_helper`. |
| 3 | [`server-unit-js-spec-to-ts-vitest`](../server-unit-js-spec-to-ts-vitest/SKILL.md) | Only if the source is **`.js`**: `require` → `import`, add `*.spec.ts`, Chai → Vitest for common matchers, snapshot (`snap-shot-it` → `toMatchSnapshot`) patterns. |

If the file is already `*_spec.ts`, step 3 is still the reference for **snapshots** and JS-era patterns while converting to `foo.spec.ts`.

---

## 2. Add focused skills by signal

Scan the legacy file (and imports) for the **signals** in the left column; open the **skill** on the right.

| Signal in the spec | Skill |
| ------------------- | ----- |
| `sinon` stubs/spies/sandboxes, `sinon-chai` | [`server-unit-sinon-to-vitest-mocks`](../server-unit-sinon-to-vitest-mocks/SKILL.md) |
| `mockery`, light npm-only substitution | [`server-unit-simple-mocks-vitest`](../server-unit-simple-mocks-vitest/SKILL.md) first |
| `proxyquire`, `vi.mock` chains, `importOriginal`, hoisted stubs | [`server-unit-deep-mocks-vitest`](../server-unit-deep-mocks-vitest/SKILL.md) |
| Multi-hop dependency chains (e.g. injected client → connection → leaf) | [`server-unit-two-hop-vi-mock`](../server-unit-two-hop-vi-mock/SKILL.md) |
| `nock`, `disableNetConnect`, HTTP mocking | [`server-unit-nock-vitest`](../server-unit-nock-vitest/SKILL.md) |
| `useFakeTimers`, `clock.tick`, intervals | [`server-unit-fake-timers-vitest`](../server-unit-fake-timers-vitest/SKILL.md) |
| `chai-subset` / `to.include({…})`, `chai-uuid`, `chai-as-promised` / `.eventually` | [`server-vitest-chai-migration`](../server-vitest-chai-migration/SKILL.md) |
| Express routes, `supertest`, GraphQL route tests | [`server-vitest-express`](../server-vitest-express/SKILL.md) |

**Heuristics**

- Prefer **simple mocks** before **deep mocks**; escalate when one stubbed leaf is not enough.
- **Snapshots:** `snap-shot-it` and legacy `__snapshots__/*_spec.js` are covered in the JS→TS skill and [`server-unit-mocha-to-vitest`](../server-unit-mocha-to-vitest/SKILL.md) (“lowest friction first”); treat snapshot rewrites as a dedicated sub-pass after assertions compile.
- **Bluebird:** If production code still chains Bluebird-only APIs on a mocked return value, see the “Bluebird / long-stack” section in [`server-unit-migrate-from-spec-helper`](../server-unit-migrate-from-spec-helper/SKILL.md) and deep-mock patterns as needed.

---

## 3. Suggested end-to-end order (complex file)

For a single file that hits several signals, a practical sequence is:

1. **Baseline spine** (section 1): naming + drop `spec_helper` + TS/snapshot path if applicable.
2. **Assertions:** common Chai → Vitest via migrate-from-spec-helper / JS→TS skill; **then** [`server-vitest-chai-migration`](../server-vitest-chai-migration/SKILL.md) only for plugin-specific matchers.
3. **Timers** (if any): [`server-unit-fake-timers-vitest`](../server-unit-fake-timers-vitest/SKILL.md) so async tests behave before heavy mocking.
4. **HTTP:** [`server-unit-nock-vitest`](../server-unit-nock-vitest/SKILL.md) with explicit lifecycle (`cleanAll`, restore net).
5. **Mocks:** sinon → [`server-unit-sinon-to-vitest-mocks`](../server-unit-sinon-to-vitest-mocks/SKILL.md); mockery/simple deps → [`server-unit-simple-mocks-vitest`](../server-unit-simple-mocks-vitest/SKILL.md); deeper → [`server-unit-deep-mocks-vitest`](../server-unit-deep-mocks-vitest/SKILL.md) and optionally [`server-unit-two-hop-vi-mock`](../server-unit-two-hop-vi-mock/SKILL.md).
6. **Routes/HTTP handlers:** [`server-vitest-express`](../server-vitest-express/SKILL.md).

Adjust when a file is obviously “mocks-only” or “nock-only”; the spine still comes first.

---

## 4. Full skill index (quick reference)

| Skill | One-line use |
| ----- | ------------ |
| [`server-unit-vitest-migration-guide`](SKILL.md) (this file) | Orchestration and skill selection. |
| [`server-lib-js-to-ts`](../server-lib-js-to-ts/SKILL.md) | **`lib/**/*.js` → `*.ts`** when tests need it (JS importing TS neighbors, mixed imports). |
| [`server-unit-mocha-to-vitest`](../server-unit-mocha-to-vitest/SKILL.md) | Runner contract, naming, core `vi` / env mapping. |
| [`server-unit-migrate-from-spec-helper`](../server-unit-migrate-from-spec-helper/SKILL.md) | Replacing global `spec_helper` side effects per file. |
| [`server-unit-js-spec-to-ts-vitest`](../server-unit-js-spec-to-ts-vitest/SKILL.md) | `*_spec.js` → `*.spec.ts`, imports, snapshots. |
| [`server-vitest-chai-migration`](../server-vitest-chai-migration/SKILL.md) | Chai plugins not covered by basic `expect` mapping. |
| [`server-unit-sinon-to-vitest-mocks`](../server-unit-sinon-to-vitest-mocks/SKILL.md) | Sinon → `vi.fn` / `vi.spyOn` / call matchers. |
| [`server-unit-simple-mocks-vitest`](../server-unit-simple-mocks-vitest/SKILL.md) | Minimal mockery → `vi.mock` for a single dependency. |
| [`server-unit-deep-mocks-vitest`](../server-unit-deep-mocks-vitest/SKILL.md) | `vi.mock`, `vi.hoisted`, `importOriginal`. |
| [`server-unit-two-hop-vi-mock`](../server-unit-two-hop-vi-mock/SKILL.md) | Ordered mocks across a dependency chain. |
| [`server-unit-nock-vitest`](../server-unit-nock-vitest/SKILL.md) | Nock lifecycle with Vitest. |
| [`server-unit-fake-timers-vitest`](../server-unit-fake-timers-vitest/SKILL.md) | Sinon fake timers → `vi.useFakeTimers` / advance APIs. |
| [`server-vitest-express`](../server-vitest-express/SKILL.md) | Express / supertest / route testing patterns. |

---

## 5. Verification

```bash
yarn workspace @packages/server test-unit-vitest -- test/unit/path/to/file.spec.ts
yarn workspace @packages/server test-unit
```

`test-unit` runs legacy Mocha unit globs **and** Vitest; keep both green until all `*_spec` files in the batch are migrated or intentionally left on Mocha.

---

## Related

- [`packages/server/AGENTS.md`](packages/server/AGENTS.md), [`packages/server/CLAUDE.md`](packages/server/CLAUDE.md)
- Batch planning: [`packages/server/test/unit/MIGRATION_BATCHES.md`](packages/server/test/unit/MIGRATION_BATCHES.md) (if present)
