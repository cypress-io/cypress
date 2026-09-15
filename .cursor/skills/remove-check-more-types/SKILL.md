---
name: remove-check-more-types
description: >-
  Replaces CommonJS-only `check-more-types` predicates with lodash or small inline
  checks so Vitest and ESM bundlers do not hang. Prefer lodash when it matches
  behavior and keeps call sites short. Use when a file imports `check-more-types`,
  when Vitest appears to lock up loading a module that uses it, or when removing
  the dependency from a package after migration.
---

# Remove `check-more-types`

## Why

`check-more-types` ships as a **UMD/CommonJS** bundle (`main`: `dist/check-more-types.js`, no ESM entry). Importing it from **TypeScript sources exercised by Vitest** (or other ESM-native runners) can cause **hangs or brittle resolution**. Replace predicates with **lodash** where it is already used in the file or package, or where one `import _ from 'lodash'` (or a targeted `import { … } from 'lodash'`) replaces several verbose conditions — **do not** spell out long `typeof` / `instanceof` chains when `_.isFunction`, `_.includes`, etc. express the same thing. Use inline checks only when lodash would not shorten the code or would skew semantics (e.g. custom URL or semver regex).

Keep **`lazy-ass` (`la`)** assertions if they are already there; only replace the **predicate** passed to `la(...)`.

## Find usages

```bash
rg "check-more-types|from 'check-more-types'|require\\('check-more-types'\\)" --glob '*.{ts,tsx,js,mjs,cjs}'
```

Note every `is.*` / `check.*` method used (e.g. `unemptyString`, `object`, `fn`, `webUrl`, `semver`, `oneOf`).

## Predicate replacements (behavior-matched)

Prefer **lodash** when the package already depends on it (many files use `import _ from 'lodash'`). Fall back to inline checks when lodash does not apply or would misrepresent the library (see notes).

These mirror `node_modules/check-more-types/dist/check-more-types.js` for predicates commonly used in this repo.

| Library API | Prefer (lodash) | Inline (if no lodash) |
|-------------|-------------------|------------------------|
| `unemptyString(x)` | `_.isString(x) && Boolean(x)` | `typeof x === 'string' && Boolean(x)` |
| `defined(x)` | `!_.isUndefined(x)` | `typeof x !== 'undefined'` |
| `fn(x)` | `_.isFunction(x)` | `typeof x === 'function'` |
| `object(x)` | `_.isObjectLike(x) && !_.isArray(x) && !_.isDate(x)` (matches library `isObject`) | `typeof x === 'object' && x !== null && !Array.isArray(x) && !(x instanceof Date)` |
| `webUrl(x)` | — (no lodash equivalent) | `typeof x === 'string' && (x.startsWith('http://') \|\| x.startsWith('https://'))` |
| `semver(x)` | — | `typeof x === 'string' && Boolean(x) && /^\\d+\\.\\d+\\.\\d+$/.test(x)` |
| `oneOf(list)` | Curried: `(x) => _.includes(list, x)` | `(x) => Array.isArray(list) && list.indexOf(x) !== -1` or `(x) => list.includes(x)` |

If you only need “non-null object” and not full parity, a looser check may suffice — confirm against call sites (e.g. `Date` is **not** `object()`-true in `check-more-types`).

## Patterns

**Single-use:** Prefer lodash inside `la(...)` when the module already imports `_`:

```ts
// Before
la(is.unemptyString(name), 'missing name', name)

// After (with lodash)
la(_.isString(name) && Boolean(name), 'missing name', name)
```

**Repeated in one file:** Reuse lodash at call sites, or add small `const` helpers — avoid duplicating six-condition inline blobs.

**`.map(check.unemptyString)`:** e.g. `(s: string) => _.isString(s) && Boolean(s)` or inline without lodash if the file has no lodash import and adding it is not justified.

**Do not** add lodash to a package that does not already list it as a dependency solely for this migration — use the inline column instead.

## Dependency cleanup

After the last import is gone in a package:

- Remove `"check-more-types"` from that package’s `package.json` dependencies.
- Run `yarn` at the repo root if lockfiles are maintained for that workspace.

Do **not** remove it from the root or other packages until nothing in the monorepo imports it (search again).

## Verify

- `yarn workspace @packages/<pkg> test -- <path-to-spec>` (or the relevant Vitest/Mocha target).
- `yarn workspace @packages/<pkg> check-ts` if the package is TypeScript.

## When not to use this skill

If the goal is only to **mock** the module in a test, prefer replacing production code with predicates anyway when the production file is TS + Vitest — mocks hide the ESM/CJS problem on the next import path.
