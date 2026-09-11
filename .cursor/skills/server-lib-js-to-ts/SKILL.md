---
name: server-lib-js-to-ts
description: >-
  Migrates a @packages/server lib source file from JavaScript to TypeScript
  (foo.js → foo.ts): CJS to typed modules, import style, exports compatible
  with existing require() callers, and verification. Use when a unit test cannot
  move to Vitest/TS because lib code still imports a .ts neighbor from .js, when
  modernizing lib/util (or similar), or when the user asks to convert server lib
  from JS to TS before migrating tests.
---

# Migrate `packages/server/lib/**/*.js` → `*.ts`

**Scope:** [`packages/server/lib`](../../../packages/server/lib) — production code under the server package. This is a **prerequisite** for migrating some **`test/unit`** specs to `*.spec.ts` when the implementation file is still `.js` but already depends on TypeScript modules (extensionless resolution loads `.ts` at runtime via `@packages/ts`, while staying on `.js` blocks clean `import` from tests and type-checking the module in [`packages/server/tsconfig.json`](../../../packages/server/tsconfig.json), which includes **`lib/**/*.ts`** only).

**Style:** Match neighboring files in the same directory (see [`lib/util/proxy.ts`](../../../packages/server/lib/util/proxy.ts), [`lib/util/env.ts`](../../../packages/server/lib/util/env.ts)). Repo conventions: [`AGENTS.md`](../../../AGENTS.md) (quotes, no semicolons, ESLint — no Prettier).

---

## When to do this first

- **`require('./something')`** where `something.ts` exists but **`something.js` does not** — the runtime works, but **type-check** and **Vitest ESM imports** expect a coherent `.ts` source file.
- **`import argsUtils from './util/args'`** from `lib/*.ts` while `args` is still **`args.js`** — completing the chain removes mixed JS/TS friction.
- Before **`foo_spec.js` → `foo.spec.ts`** if the SUT is still **`lib/.../foo.js`** and imports TS-only deps.

After migration, continue with [`server-unit-vitest-migration-guide`](../server-unit-vitest-migration-guide/SKILL.md) / [`server-unit-js-spec-to-ts-vitest`](../server-unit-js-spec-to-ts-vitest/SKILL.md).

---

## 1. Find all importers

Search **without** file extension — Node and bundlers resolve `foo`, `foo.js`, and `foo.ts` inconsistently across call sites.

```bash
# From repo root; adjust the path fragment to your module (e.g. util/args)
rg "lib/util/args|util/args|\\./util/args" packages/server packages --glob "*.{js,ts,mjs,cjs}"
```

Update any **`require('.../args')`**, **`import ... from '.../args'`**, or dynamic loads after the rename so nothing still points at a deleted **`args.js`**. Same-folder **`./args`** continues to resolve once **`args.ts`** exists.

---

## 2. Rename and convert module syntax

1. **`foo.js` → `foo.ts`** (git mv preserves history when your workflow uses it).
2. Replace **`const x = require('…')`** with **`import`** — align with sibling `.ts` files:
   - Node built-ins: `import path from 'path'`, `import fs from 'fs'` (project uses **`esModuleInterop`** / **`allowSyntheticDefaultImports`** in [`packages/ts/tsconfig.json`](../../../packages/ts/tsconfig.json)).
   - **`debug`:** `import debugModule from 'debug'` then `const debug = debugModule('cypress:server:…')` (see [`proxy.ts`](../../../packages/server/lib/util/proxy.ts)).
   - **`lodash`:** `import _ from 'lodash'` or named imports from `lodash` where it reads clearer.
   - Workspace packages: `import { … } from '@packages/config'` etc.
   - Relative TS/JS: `import { … } from './proxy'` — **no `.ts` extension** (matches the rest of `lib/`).
3. **`import type`** for type-only uses (required when imports are type-only — **`importsNotUsedAsValues`: `"error"`** in base tsconfig).

---

## 3. `module.exports` → TypeScript exports (keep CJS consumers working)

[`packages/server`](../../../packages/server) compiles with **`"module": "commonjs"`** — TypeScript emits `require`/`exports` compatible output.

| Legacy pattern | TypeScript pattern |
| -------------- | ------------------ |
| `module.exports = api` (one object with methods) | **`export = api`** — emits `module.exports = …` so **`require('./foo').toArray`** works (no `.default`). Many `lib/` files use this (e.g. [`util/commit-info.ts`](../../../packages/server/lib/util/commit-info.ts)). Still works with **`import argsUtils from './foo'`** when **`esModuleInterop`** is on. |
| `module.exports = { a, b }` | `export = { a, b }` or named **`export`**s if the module has no `require()` callers expecting a single object |
| `exports.foo =` | `export function foo` / `export const foo` |

If both default and named shapes are needed for different callers, follow an existing file in `lib/` that already bridged this (see **CJS** note in [`server-unit-js-spec-to-ts-vitest`](../server-unit-js-spec-to-ts-vitest/SKILL.md)).

**Avoid** `export default` alone when callers use **`require('./mod').method`** — without `export =`, emitted CJS often puts the API on **`.default`** and breaks those calls.

**Avoid** leaving duplicate **`module.exports`** assignments in `.ts` — prefer **`export =`** or **`export`** so `tsc` and Vitest agree.

---

## 4. Types (incremental, pragmatic)

- Base config: **`strict`: true**, **`noImplicitAny`: false** ([`packages/ts/tsconfig.json`](../../../packages/ts/tsconfig.json)) — you do not need to fully annotate every inner helper on the first pass.
- Prefer types on **exported** functions and objects and on values that cross package boundaries (`@packages/*`).
- Use **`any`** or **`@ts-expect-error`** / **`@ts-ignore`** sparingly and only where legacy code is ambiguous; prefer **`unknown`** + narrowing when you touch the code anyway.
- **`catch (err)`** — repo sets **`useUnknownInCatchVariables`: false**; existing **`catch (err)`** patterns may stay unless you are tightening behavior.
- For untyped third-party modules, **`// @types/...`** in package.json if available; otherwise a minimal **local `declare module`** or precise **`import type`** from DefinitelyTyped.

---

## 5. Lint and type-check

```bash
yarn workspace @packages/server lint
yarn workspace @packages/server check-ts
```

Fix ESLint issues (single quotes, no semicolons, `no-console`, etc.) per [`AGENTS.md`](../../../AGENTS.md).

---

## 6. Verify behavior

- Run **unit tests** that cover the module (legacy **`test-unit`** path and/or Vitest **`test-unit-vitest`** for already-migrated specs).
- If the file is exercised in **integration** tests, run the relevant **`test-integration`** target.

```bash
yarn workspace @packages/server test-unit -- test/unit/path/to/related_spec.js
yarn workspace @packages/server test-unit-vitest -- test/unit/path/to/file.spec.ts
```

---

## Related

- [`server-unit-vitest-migration-guide`](../server-unit-vitest-migration-guide/SKILL.md) — when this unblocks **`*.spec.ts`** migration.
- [`server-unit-js-spec-to-ts-vitest`](../server-unit-js-spec-to-ts-vitest/SKILL.md) — spec-side **`import`** and CJS interop notes.
- [`packages/server/AGENTS.md`](../../../packages/server/AGENTS.md) — commands and layout.
