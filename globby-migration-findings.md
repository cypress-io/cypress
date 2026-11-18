# globby → tinyglobby: behaviour spike findings (T1a)

This branch is a hand-off, not a change. It answers the open behaviour questions so the migration tasks can make each call on evidence rather than on a reading of the docs. The option inventory and the bundle-size baseline belong to T1b and aren’t covered here.

## How this was measured

| | |
| --- | --- |
| globby | 11.1.0 (fast-glob 3.3.3) |
| tinyglobby | 0.2.17, with fdir 6.5.0 and picomatch 4.0.5 pinned to match `yarn.lock` |
| Node | v24.22.1 (`.node-version`) |
| Script | A throwaway comparison script in a scratch directory outside the repo (reproduced in the [appendix](#appendix-reproduction-scripts)). Every case ran through `globby()`, `globby({ suppressErrors: true })`, `globby.sync()`, `tinyglobby.glob()` and `tinyglobby.globSync()` against a temporary fixture tree. |

**The container runs as root, so `chmod 000` doesn’t block reads on its own.** A plain root run listed everything inside the locked directories. For Q1 the script ran under `setpriv --bounding-set -dac_override,-dac_read_search --inh-caps -all`, which drops the two capabilities that let root bypass permission bits. The script checked that the kernel really enforced them: `fs.readdirSync('perm/locked')` failed with `EACCES` in that run. So these are genuine `EACCES` errors from the filesystem, not a mocked `fs`. Every other question gave the same results in both runs.

In the tables, `<F>` is the absolute fixture root. Results are sorted unless the question is about ordering.

---

## Q1. Unreadable directory inside the tree

Fixture `perm/`: `aaa-readable/login.cy.ts`, `locked/` (mode 000) holding `hidden.cy.ts`, `partial/visible.cy.ts` next to `partial/locked-deep/` (000), `zzz-readable/signup.cy.ts`, a mode-000 file `locked-file.cy.ts`, and `noexec/` (mode 644: readable but not traversable).

| Case | globby (default) | globby `suppressErrors: true` | tinyglobby |
| --- | --- | --- | --- |
| `**/*.cy.ts`, `cwd: perm` | **throws** `EACCES: scandir '<F>/perm/locked'` | 5 files: every readable one, plus `noexec/inner.cy.ts` and `locked-file.cy.ts` | **same 5 files, no error** |
| Same with `absolute`, `onlyFiles` and `ignore: ['**/node_modules/**']` (the `getFilesByGlob` shape) | throws `EACCES` | 5 absolute paths | same 5 absolute paths, no error |
| Static pattern inside a locked dir (`locked/hidden.cy.ts`) | throws `EACCES: stat …` | **still throws** `EACCES: stat …` | `[]` |
| Dynamic pattern inside a locked dir (`locked/*.cy.ts`) | throws `EACCES: stat …` | still throws | `[]` |
| `cwd` itself is locked | throws `EACCES: stat …` | still throws | `[]` |
| `cwd` doesn’t exist | `[]` | `[]` | `[]` |
| `cwd` is a file | throws | still throws | `[]` |
| Sync API | `globby.sync` gives the same as async in every row | same | `globSync` gives the same as async in every row |

Two details matter here:

- globby’s `suppressErrors` doesn’t cover every error. The `stat` that `expandDirectories` runs on each pattern happens outside fast-glob, so it still throws. With `expandDirectories: false` and `suppressErrors: true`, globby returns `[]` for the static-in-locked case.
- tinyglobby has no `suppressErrors` option (it isn’t in `GlobOptions`), and nothing reports a skipped directory. The only sign is `debug: true`, which logs `crawling <F>/perm/locked/` and then shows no matches from it.

**Recommendation.** Remove the retry in `FileDataSource.getFilesByGlob` (#24109). With globby, that function returns the 5 readable files after its retry, or `[]` when the retry throws too. tinyglobby gives exactly those results on its first call. Also:

- Drop the `suppressErrors` key from `globOptions` at every call site and type. It’s a type error against `GlobOptions` and does nothing at runtime.
- Keep the `try/catch` returning `[]` as a safety net. fdir can still throw on things these fixtures can’t reproduce, such as `EMFILE`. Rename the debug message, because it will no longer mean “permission problem, retrying.”
- Add a unit test that mocks a locked directory and asserts partial results with no retry. The existing test in `packages/data-context/test/unit/sources/FileDataSource.spec.ts` (“should retry search with `suppressErrors`…”) asserts a second `matchGlobs` call with `suppressErrors: true`, so it has to change.

## Q2. A directory passed as a pattern (`snapshotsScaffold.ts`)

Fixture `scaffold/`: `cypress.config.ts`, plus `cypress/e2e/spec.cy.ts`, `cypress/support/{e2e,commands}.ts`, `cypress/fixtures/example.json` and `cypress/.gitkeep`.

| Case | globby | tinyglobby | Same? |
| --- | --- | --- | --- |
| `'<F>/scaffold/cypress'`, `{ onlyFiles: true }` (exactly what `snapshotsScaffold.ts` does) | 4 **absolute** paths | same 4 files, but **relative to `process.cwd()`**, e.g. `../../tmp/.../scaffold/cypress/e2e/spec.cy.ts` | Files yes, format **no** |
| `'<F>/scaffold/cypress.config.*'`, `{ onlyFiles: true }` | `<F>/scaffold/cypress.config.ts` | relative to `process.cwd()` | Format **no** |
| Same pattern plus `absolute: true` | absolute | absolute | Yes |
| `'cypress'`, `cwd: scaffold` | 4 files | 4 files | Yes |
| `'cypress/'` (trailing slash), `cwd: scaffold` | 4 files | 4 files | Yes |
| `'cypress'`, `expandDirectories: false` | `[]` | `[]` | Yes |
| `'cypress'`, `dot: true` | 5 files, including `.gitkeep` | 5 files | Yes |

So yes: `expandDirectories` (on by default in both) expands a directory pattern to the same set of files, and `.gitkeep` stays hidden unless `dot: true`. The catch is the output format. **globby returns absolute paths for an absolute pattern. tinyglobby returns paths relative to `cwd` (default `process.cwd()`) unless you pass `absolute: true`.** `snapshotsScaffold.ts` then calls `file.replace(cyTmpDirPosix, '')`, which assumes absolute paths, so it would silently produce wrong relative paths.

**Recommendation.** In `snapshotsScaffold.ts`, use `cwd: expectedScaffoldDir` with the relative patterns `'cypress'` and `'cypress.config.*'`, and drop the `replace(...).slice(1)` step. That also keeps a temp directory with glob characters in its name out of the pattern (see Q3). As a general rule for every migration task, **any call that passes an absolute pattern without `cwd` and relies on absolute results needs `absolute: true`.** That covers `system-tests/test/webpack_dev_server_spec.ts`, `npm/webpack-preprocessor/test/e2e/e2e.spec.ts` and `scaffold-config/src/ct-detect-third-party.ts` (`fullPathGlobs`).

## Q3. `cwd` and absolute patterns containing `[ ] ( )`, spaces and `#`

Fixture directory: `special/my [app] (copy) #1/cypress/{e2e/login.cy.ts,support/e2e.ts}`.

| Case | globby | tinyglobby | Same? |
| --- | --- | --- | --- |
| Relative pattern with `cwd: '<F>/special/my [app] (copy) #1'`, `absolute: true` | 1 file, correct absolute path | same | Yes |
| Unescaped absolute pattern `'<F>/special/my [app] (copy) #1/cypress/**/*.cy.ts'` | `[]` | `[]` | Yes, both miss |
| Same, with `cwd` set to that directory | `[]` | `[]` | Yes, both miss |
| Unescaped absolute **static** path `.../my [app] (copy) #1/cypress/support/e2e.ts` | `[]` | `[]` | Yes, both miss |
| Pattern escaped with `fastGlob.escapePath` | 1 file (absolute) | 1 file (relative to `process.cwd()`) | Files yes, format no |
| Pattern escaped with `tinyglobby.escapePath` or `convertPathToPattern` | 1 file | 1 file | Files yes; the escaped output is identical to fast-glob’s |
| Brace pattern `cypress/support/e2e.{js,ts}` with the special `cwd` | `cypress/support/e2e.ts` | same | Yes |

Spaces and `#` are harmless in both libraries. `[…]` and `(…)` are parsed as glob syntax by both, and that breaks even a static path. `cwd` is never parsed as a glob in either one, so the strategy `getFilesByGlob` already uses (strip the `cwd` prefix from the pattern and pass `cwd`) keeps working unchanged.

**Recommendation.** Keep the prefix-stripping in `getFilesByGlob`. Where a call site builds an absolute pattern from a filesystem path, either switch it to `cwd` plus a relative pattern (preferred), or wrap the path part in `escapePath` / `convertPathToPattern`, which tinyglobby exports. Migration tasks shouldn’t expect tinyglobby to “fix” bracketed paths. It behaves exactly like globby here.

## Q4. Dotfiles and dot directories, default options

Fixture `dot/`: `cypress/e2e/visible.cy.ts`, `cypress/e2e/.draft.cy.ts`, `.hidden/secret.cy.ts`, `.github/workflows/ci.yml` and `.env`.

| Pattern (`cwd: dot`) | globby | tinyglobby | Same? |
| --- | --- | --- | --- |
| `**/*.cy.ts` | `cypress/e2e/visible.cy.ts` | same | Yes |
| `**/*` | `cypress/e2e/visible.cy.ts` | same | Yes |
| `.hidden/**` (explicit dot directory) | `.hidden/secret.cy.ts` | same | Yes |
| `cypress/e2e/.*.cy.ts` (explicit dotfile) | `cypress/e2e/.draft.cy.ts` | same | Yes |
| `.env` (static) | `.env` | same | Yes |
| `**/*` with `dot: true` | all 5 | all 5 | Yes |

**Recommendation.** No change needed. Both default to `dot: false`, and both match a dot segment that the pattern names explicitly.

## Q5. Symlinked directories and files

Fixture `symlink/`: `real/a.cy.ts`, `real/nested/b.cy.ts`, `linkdir → real`, `linkfile.cy.ts → real/a.cy.ts`, `broken.cy.ts → missing.cy.ts`, and a cycle `real/nested/loop → ..`.

| Case (`cwd: symlink`) | globby | tinyglobby |
| --- | --- | --- |
| `**/*.cy.ts`, defaults (`followSymbolicLinks: true` in both) | **163 entries**: it follows the `loop` cycle about 80 directories deep (`linkdir/nested/loop/nested/loop/…`) until the OS stops it | **7 entries**: `linkdir/a.cy.ts`, `linkdir/nested/b.cy.ts`, `linkfile.cy.ts`, `real/a.cy.ts`, `real/nested/b.cy.ts`, `real/nested/loop/a.cy.ts`, `real/nested/loop/nested/b.cy.ts` |
| Same, ignoring any path through `loop` | `linkdir/a.cy.ts`, `linkdir/nested/b.cy.ts`, `linkfile.cy.ts`, `real/a.cy.ts`, `real/nested/b.cy.ts` | identical set |
| Duplicates through a symlinked directory | yes: `real/a.cy.ts` and `linkdir/a.cy.ts` both appear | yes, the same pair |
| Symlinked file `linkfile.cy.ts` | listed | listed |
| Broken symlink `broken.cy.ts` | not listed | not listed |
| `followSymbolicLinks: false` | `real/a.cy.ts`, `real/nested/b.cy.ts` | same |
| `onlyDirectories: true`, `**` | 162 entries (the cycle again), no trailing slash | `linkdir/nested/`, `real/`, `real/nested/`, `real/nested/loop/nested/`: **trailing slashes**, and `linkdir/` itself is missing |

tinyglobby (through fdir’s `resolveSymlinks`) detects the cycle and visits each real directory once. globby has no cycle detection. Outside cycles the file results match exactly, including the duplicate entries that come through a symlinked directory.

**Recommendation.** Accept the difference. Bounded traversal is an improvement, and none of our call sites relies on walking a cycle. No call site needs to dedupe for parity, because both libraries return the same duplicates. If any migrated code uses `onlyDirectories`, it has to handle the trailing `/` and must not rely on symlinked directories being listed. None of today’s callers use it, so T1b’s inventory should confirm that.

## Q6. Negated patterns and `ignore`

Fixture `neg/`: `src/app.ts`, `src/app.d.ts`, `src/lib/util{,.d}.ts`, `node_modules/left-pad/index{,.d}.ts`, `packages/web/node_modules/react/index.ts` and `packages/web/src/main.ts`.

| Case (`cwd: neg`) | globby | tinyglobby | Same? |
| --- | --- | --- | --- |
| `['**/*.ts', '!**/*.d.ts']` | 5 files, no `.d.ts` | same 5 | Yes |
| `['!**/*.d.ts', '**/*.ts']` (**negation first**) | **8 files: the negation is ignored**. globby applies a negation only to the positive patterns before it. | **5 files**: negations apply to every pattern, whatever the order | **No** |
| `['**/*.ts', '!src/lib']` | 6 (`src/lib` excluded) | same 6 | Yes |
| `['**/*.ts', '!src/lib/**']` | 6 | same 6 | Yes |
| `ignore: ['**/node_modules/**']` | 5, no `node_modules` at any depth | same 5 | Yes |
| `ignore: ['node_modules']` (bare, as `scaffold-config/src/detect.ts` uses it) | 6: only the **root** `node_modules` is pruned, `packages/web/node_modules/react/index.ts` stays | same 6 | Yes |
| No `ignore` | 8, `node_modules` included | same 8 | Yes, neither ignores `node_modules` by default |
| `'node_modules/**/*.ts'` with `ignore: ['**/node_modules/**']` | `[]` | `[]` | Yes, `ignore` wins over a positive pattern |

**Recommendation.** No change for the usual “positive patterns, then negations” shape. Our call sites pass a user-controlled `specPattern` array, though, and a user array with a leading `!` would start excluding more files after the migration. Call that out in the changelog/PR for the `FileDataSource` migration, or move negations into `ignore` yourself. Keep the explicit `'**/node_modules/**'` ignore that `getFilesByGlob` adds; neither library adds one. In `detect.ts`, `ignore: ['node_modules']` means the root only in both libraries, so leave it as it is or change it to `'**/node_modules/**'` on purpose, as a separate decision.

## Q7. Default `specPattern`, `excludeSpecPattern` and `supportFile` from `@packages/config`

Values from `packages/config/src/options.ts`: e2e `specPattern` `cypress/e2e/**/*.cy.{js,jsx,ts,tsx}`, component `**/*.cy.{js,jsx,ts,tsx}`. e2e `excludeSpecPattern` `*.hot-update.js`, component `['**/__snapshots__/*', '**/__image_snapshots__/*']`. `supportFile` `cypress/support/{e2e,component}.{js,jsx,ts,tsx}`. These run with the options `ProjectDataSource.findSpecs` passes to `getFilesByGlob`: `absolute`, `onlyFiles`, `ignore: [...excludeSpecPattern, '**/node_modules/**']`.

Fixture `config/`: `cypress/e2e/{login.cy.ts,nested/cart.cy.jsx,legacy.cy.js,notes.md,Upper.CY.ts,main.hot-update.js}`, a root-level `main.hot-update.js`, `cypress/support/{e2e.ts,e2e.js,component.tsx}`, `src/Button.cy.tsx`, `src/__snapshots__/Button.cy.tsx`, `src/__image_snapshots__/Header.cy.js`, `src/deep/__snapshots__/inner/Card.cy.ts`, `src/types.d.ts` and `node_modules/some-lib/index.cy.js`.

| Case | globby | tinyglobby | Same? |
| --- | --- | --- | --- |
| e2e `specPattern` with the e2e exclude | `legacy.cy.js`, `login.cy.ts`, `nested/cart.cy.jsx` | same | Yes |
| `**/*.js` with `ignore: ['*.hot-update.js']` | only the root `main.hot-update.js` excluded; `cypress/e2e/main.hot-update.js` kept | same | Yes |
| component `specPattern` with the component exclude | 5, **including `src/deep/__snapshots__/inner/Card.cy.ts`** | **4: `src/deep/__snapshots__/inner/Card.cy.ts` excluded** | **No** |
| `supportFile` e2e (relative, with `cwd`) | `e2e.js`, `e2e.ts` | same | Yes |
| `supportFile` component | `component.tsx` | same | Yes |
| `supportFile` as an absolute pattern, no `cwd` | absolute | relative to `process.cwd()` (see Q2) | Files yes, format no |
| Nested braces `{src,cypress}/**/*.{cy,CY}.{ts,tsx}` | 5 | same 5 | Yes |
| Extglob `**/*.cy.+(ts\|tsx)` | 4 | same 4 | Yes |
| Extglob `src/**/!(*.d).ts` | `src/deep/__snapshots__/inner/Card.cy.ts` | same | Yes |
| Extglob `@(src\|cypress)/**/*.cy.ts` | 2 | same 2 | Yes |
| Case sensitivity, `cypress/e2e/*.cy.ts` | `login.cy.ts` only | same | Yes |
| `caseSensitiveMatch: false` | adds `Upper.CY.ts` | same | Yes |

Brace expansion, extglobs and case sensitivity all behave the same. The one difference is how `ignore` applies to **directories**. tinyglobby tests each `ignore` pattern against every directory it crawls and prunes the whole subtree on a match. `**/__snapshots__/*` matches the directory `src/deep/__snapshots__/inner`, so everything below it disappears. globby/fast-glob only drops `**/__snapshots__/*` entries one level below `__snapshots__`.

**Recommendation.** This changes which files the default component `excludeSpecPattern` excludes. Specs nested two or more levels under a `__snapshots__` or `__image_snapshots__` directory stop being found. That’s arguably closer to what users mean, but it’s still a user-visible change in the spec list, so the `FileDataSource` migration should:

1. Add a regression test with exactly this nested fixture and decide on purpose which behaviour to ship.
2. Treat the change as `fix`-worthy and give it a changelog entry if tinyglobby’s behaviour ships, or keep globby’s semantics if not. Moving the patterns into the pattern list as `!`-negations does **not** keep them: tinyglobby prunes the same directory and still returns 4. What does reproduce globby’s 5 is to glob with only `ignore: ['**/node_modules/**']`, then drop results that match `picomatch(excludeSpecPattern)` on the `cwd`-relative path (checked against this fixture).

The e2e default (`*.hot-update.js`) and `**/node_modules/**` aren’t affected.

## Q8. Result ordering

Fixture `order/`: `zeta`, `alpha`, `Mike`, `bravo`, `10`, `9`, `_under` and `Échec`, each as `X.cy.ts` and `X/inner.cy.ts`.

| Case (`cwd: order`) | globby | tinyglobby |
| --- | --- | --- |
| `*.cy.ts` (flat) | `10, 9, Mike, _under, alpha, bravo, zeta, Échec` (directory order) | same order |
| `**/*.cy.ts` | top-level files first, then subdirectory files in **nondeterministic** order. The async, sync and `suppressErrors` runs each gave a different order. | top-level files first, then subdirectories in a different nondeterministic order; `glob` and `globSync` differ as well |
| `['zeta/*.cy.ts', 'alpha.cy.ts', '*.cy.ts']` | grouped by input pattern: `zeta/inner.cy.ts, alpha.cy.ts, 10.cy.ts, …` | **not** grouped: one crawl, in traversal order (`10.cy.ts, …, zeta/inner.cy.ts`) |
| Set of results | identical in every case | identical in every case |

Neither library sorts. Both return the filesystem’s order, which depends on the OS and filesystem and isn’t alphabetical. Concurrent directory reads make the deep case nondeterministic in both. globby concatenates its results per pattern; tinyglobby crawls once for every pattern.

**Recommendation.** Treat the order as undefined in both. Any caller or test that depends on order (snapshot output, “first match wins” support-file resolution, spec lists shown in the UI) should sort explicitly, and it was already relying on luck under globby. Watch especially for code that takes `files[0]` from a multi-pattern call and expects the first pattern’s match. That isn’t guaranteed any more.

## Q9. Sync API parity for the `globby.sync` callers

Callers: `npm/grep/src/plugin.ts` (`globbySync(specPattern, { cwd, ignore, absolute })`), `packages/scaffold-config/src/detect.ts` (`globby.sync(globs, { onlyFiles, gitignore, cwd, ignore: ['node_modules'] })`) and `npm/webpack-preprocessor/test/e2e/e2e.spec.ts` (`globby.sync(absolutePattern)`).

| Check | globby | tinyglobby |
| --- | --- | --- |
| `sync` gives the same **set** as async, across all 54 cases above (Q1 to Q8) | yes, every case | yes, every case |
| Error behaviour of sync in Q1 | throws exactly like async | silently skips exactly like async |
| Order of sync vs async | can differ (Q8) | can differ (Q8) |
| API shape | `globby.sync(patterns, opts)` / `import { sync }` | `globSync(patterns, opts)` (named export) |
| `gitignore: true` (`detect.ts`) | supported | **no such option**; tinyglobby has no `.gitignore` support |

**Recommendation.** `globSync` is a drop-in replacement for the set of results. Per caller:

- **`npm/grep`**: swap it in directly. `specPattern` is relative to `cwd` and `absolute: true` is already set. The `excludeSpecPattern` directory-pruning difference from Q7 applies here too.
- **`webpack-preprocessor` e2e spec**: add `absolute: true` (Q2), or switch to `cwd` with a relative pattern.
- **`scaffold-config/detect.ts`**: the only real gap is `gitignore: true`. It’s an option-inventory item for T1b, but the behaviour it guards is “don’t count `.ts` files the user git-ignored as evidence of a TypeScript project.” The migration needs a replacement, such as a small `.gitignore` reader, or a decision to drop it. It shouldn’t silently lose it.

---

## Summary for the migration tasks

| # | Verdict | Action |
| --- | --- | --- |
| 1 | tinyglobby silently skips unreadable directories and never throws for them. Its results equal globby’s after the #24109 retry. | Remove the retry and the `suppressErrors` option; keep a `try/catch` safety net; update the #24109 unit test. |
| 2 | Same files from `expandDirectories`. Paths are relative to `cwd` instead of absolute for absolute patterns. | Pass `absolute: true` wherever absolute patterns are used without `cwd`; refactor `snapshotsScaffold.ts` to use `cwd`. |
| 3 | Identical: both mis-parse `[]()` in patterns, and `cwd` is always safe. | Keep the `cwd` stripping; use `escapePath`/`convertPathToPattern` or `cwd` for path-derived patterns. |
| 4 | Identical | None |
| 5 | Same files outside cycles; tinyglobby stops cycles. `onlyDirectories` output differs. | Accept the difference; avoid relying on `onlyDirectories` output shape. |
| 6 | Same, except a negation **before** a positive pattern now applies | Flag it for user `specPattern` arrays; keep the explicit `node_modules` ignore. |
| 7 | Braces and extglobs identical. `ignore` (and `!` negations) prune matching **directories**, which changes the component `excludeSpecPattern` result for nested `__snapshots__`. | Add a regression test and decide on purpose: post-filter with picomatch for parity, or ship the change with a changelog entry. |
| 8 | Neither sorts; multi-pattern grouping differs | Sort wherever order matters. |
| 9 | `globSync` set parity holds | Drop-in, plus `absolute: true` where needed; find a replacement for `gitignore` in `detect.ts`. |

## Not verified here

- **Windows and macOS.** Every run was on Linux ext4/overlay. Case-insensitive filesystems, backslash handling (the `toPosix` branch in `getFilesByGlob`) and Windows `EPERM`/`EBUSY` errors on locked files weren’t exercised.
- **Errors other than `EACCES`/`ENOENT`/`ENOTDIR`**, such as `EMFILE` or `ELOOP` on a single link. That’s why the recommendation keeps a `try/catch`.
- **Running as a real non-root user.** Q1 dropped root’s DAC capabilities instead. The kernel check is the same one, but it isn’t literally a different uid.
- **Performance and bundle size** are out of scope (T1b).

## Appendix: reproduction scripts

Run them with Node 24 in an empty scratch directory outside the repo, after `npm i globby@11.1.0 tinyglobby@0.2.17` with `"overrides": { "tinyglobby": { "picomatch": "4.0.5", "fdir": "6.5.0" } }` in its `package.json`:

```sh
node fixture.mts ./fixtures
# root bypasses chmod 000; drop the DAC capabilities so permission bits apply
setpriv --bounding-set -dac_override,-dac_read_search --inh-caps -all node compare.mts ./fixtures > results.json
```

<details>
<summary><code>fixture.mts</code></summary>

```ts
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] ?? 'fixtures')

fs.rmSync(root, { recursive: true, force: true })

const file = (rel: string, body = 'describe(\'checkout\', () => {})\n') => {
  const p = path.join(root, rel)

  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, body)
}

// Q1 unreadable directory
file('perm/aaa-readable/login.cy.ts')
file('perm/locked/hidden.cy.ts')
file('perm/zzz-readable/signup.cy.ts')
file('perm/partial/visible.cy.ts')
file('perm/partial/locked-deep/secret.cy.ts')
file('perm/locked-file.cy.ts')
file('perm/noexec/inner.cy.ts')

// Q2 directory as pattern (snapshotsScaffold.ts)
file('scaffold/cypress.config.ts', 'export default {}\n')
file('scaffold/cypress/e2e/spec.cy.ts')
file('scaffold/cypress/support/e2e.ts', '// support\n')
file('scaffold/cypress/support/commands.ts', '// commands\n')
file('scaffold/cypress/fixtures/example.json', '{"name":"Jane Doe","email":"jane.doe@example.com"}\n')
file('scaffold/cypress/.gitkeep', '')

// Q3 special characters in cwd
const special = 'special/my [app] (copy) #1'

file(`${special}/cypress/e2e/login.cy.ts`)
file(`${special}/cypress/support/e2e.ts`)
file('special/my a (copy) #1/cypress/e2e/wrong.cy.ts')
file('special/my p (copy) #1/cypress/e2e/wrong.cy.ts')

// Q4 dotfiles
file('dot/cypress/e2e/visible.cy.ts')
file('dot/cypress/e2e/.draft.cy.ts')
file('dot/.hidden/secret.cy.ts')
file('dot/.github/workflows/ci.yml', 'name: ci\n')
file('dot/.env', 'API_TOKEN=tok_live_4eC39HqLyjWDarjtT1zdp7dc\n')

// Q5 symlinks
file('symlink/real/a.cy.ts')
file('symlink/real/nested/b.cy.ts')
fs.symlinkSync('real', path.join(root, 'symlink/linkdir'))
fs.symlinkSync('real/a.cy.ts', path.join(root, 'symlink/linkfile.cy.ts'))
fs.symlinkSync('missing.cy.ts', path.join(root, 'symlink/broken.cy.ts'))
fs.symlinkSync('..', path.join(root, 'symlink/real/nested/loop'))

// Q6 negation and ignore
file('neg/src/app.ts', 'export const a = 1\n')
file('neg/src/app.d.ts', 'export declare const a: number\n')
file('neg/src/lib/util.ts', 'export const b = 2\n')
file('neg/src/lib/util.d.ts', 'export declare const b: number\n')
file('neg/node_modules/left-pad/index.ts', 'export {}\n')
file('neg/node_modules/left-pad/index.d.ts', 'export {}\n')
file('neg/packages/web/node_modules/react/index.ts', 'export {}\n')
file('neg/packages/web/src/main.ts', 'export {}\n')

// Q7 config defaults
file('config/cypress/e2e/login.cy.ts')
file('config/cypress/e2e/nested/cart.cy.jsx')
file('config/cypress/e2e/legacy.cy.js')
file('config/cypress/e2e/notes.md', '# notes\n')
file('config/cypress/e2e/Upper.CY.ts')
file('config/cypress/e2e/main.hot-update.js', '')
file('config/main.hot-update.js', '')
file('config/cypress/support/e2e.ts', '// support\n')
file('config/cypress/support/e2e.js', '// support\n')
file('config/cypress/support/component.tsx', '// support\n')
file('config/src/Button.cy.tsx')
file('config/src/__snapshots__/Button.cy.tsx')
file('config/src/__image_snapshots__/Header.cy.js')
file('config/src/deep/__snapshots__/inner/Card.cy.ts')
file('config/src/types.d.ts', 'export {}\n')
file('config/node_modules/some-lib/index.cy.js')

// Q8 ordering
for (const n of ['zeta', 'alpha', 'Mike', 'bravo', '10', '9', '_under', 'Échec']) {
  file(`order/${n}.cy.ts`)
  file(`order/${n}/inner.cy.ts`)
}

fs.chmodSync(path.join(root, 'perm/locked'), 0o000)
fs.chmodSync(path.join(root, 'perm/partial/locked-deep'), 0o000)
fs.chmodSync(path.join(root, 'perm/locked-file.cy.ts'), 0o000)
fs.chmodSync(path.join(root, 'perm/noexec'), 0o644)

process.stdout.write(`${root}\n`)
```

</details>

<details>
<summary><code>compare.mts</code></summary>

```ts
import path from 'node:path'
import fs from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const globby = require('globby') as typeof import('globby')
const tg = require('tinyglobby') as typeof import('tinyglobby')
const fg = require('fast-glob') as typeof import('fast-glob')

const F = path.resolve(process.argv[2] ?? 'fixtures')
const filter = process.argv[3]
const posix = (p: string) => p.split(path.sep).join('/')
const FP = posix(F)

type Opts = Record<string, unknown>
interface Case { id: string, q: string, patterns: string | string[], opts?: Opts, tgOpts?: Opts, keepOrder?: boolean }

const special = `${FP}/special/my [app] (copy) #1`

const cases: Case[] = [
  // Q1
  { id: 'perm-star', q: '1', patterns: '**/*.cy.ts', opts: { cwd: `${FP}/perm` } },
  { id: 'perm-star-abs-onlyFiles', q: '1', patterns: '**/*.cy.ts', opts: { cwd: `${FP}/perm`, absolute: true, onlyFiles: true, ignore: ['**/node_modules/**'] } },
  { id: 'perm-static-in-locked', q: '1', patterns: 'locked/hidden.cy.ts', opts: { cwd: `${FP}/perm` } },
  { id: 'perm-dynamic-in-locked', q: '1', patterns: 'locked/*.cy.ts', opts: { cwd: `${FP}/perm` } },
  { id: 'perm-cwd-is-locked', q: '1', patterns: '**/*', opts: { cwd: `${FP}/perm/locked` } },
  { id: 'perm-cwd-missing', q: '1', patterns: '**/*', opts: { cwd: `${FP}/perm/does-not-exist` } },
  // Q2
  { id: 'dir-abs', q: '2', patterns: `${FP}/scaffold/cypress`, opts: { onlyFiles: true } },
  { id: 'dir-abs-cfg', q: '2', patterns: `${FP}/scaffold/cypress.config.*`, opts: { onlyFiles: true } },
  { id: 'dir-rel-cwd', q: '2', patterns: 'cypress', opts: { cwd: `${FP}/scaffold`, onlyFiles: true } },
  { id: 'dir-rel-trailing-slash', q: '2', patterns: 'cypress/', opts: { cwd: `${FP}/scaffold`, onlyFiles: true } },
  { id: 'dir-rel-noexpand', q: '2', patterns: 'cypress', opts: { cwd: `${FP}/scaffold`, onlyFiles: true, expandDirectories: false } },
  { id: 'dir-rel-dot', q: '2', patterns: 'cypress', opts: { cwd: `${FP}/scaffold`, onlyFiles: true, dot: true } },
  // Q3
  { id: 'special-cwd-rel', q: '3', patterns: 'cypress/**/*.cy.ts', opts: { cwd: special, absolute: true } },
  { id: 'special-abs-unescaped', q: '3', patterns: `${special}/cypress/**/*.cy.ts`, opts: {} },
  { id: 'special-abs-unescaped-cwd', q: '3', patterns: `${special}/cypress/**/*.cy.ts`, opts: { cwd: special } },
  { id: 'special-abs-escaped', q: '3', patterns: `${fg.escapePath(special)}/cypress/**/*.cy.ts`, opts: {} },
  { id: 'special-abs-tg-escapePath', q: '3', patterns: `${tg.escapePath(special)}/cypress/**/*.cy.ts`, opts: {} },
  { id: 'special-abs-tg-convertPathToPattern', q: '3', patterns: `${tg.convertPathToPattern(special)}/cypress/**/*.cy.ts`, opts: {} },
  { id: 'special-static-abs', q: '3', patterns: `${special}/cypress/support/e2e.ts`, opts: {} },
  { id: 'special-brace-in-cwd', q: '3', patterns: 'cypress/support/e2e.{js,ts}', opts: { cwd: special } },
  // Q4
  { id: 'dot-default-spec', q: '4', patterns: '**/*.cy.ts', opts: { cwd: `${FP}/dot` } },
  { id: 'dot-default-all', q: '4', patterns: '**/*', opts: { cwd: `${FP}/dot` } },
  { id: 'dot-explicit-dotdir', q: '4', patterns: '.hidden/**', opts: { cwd: `${FP}/dot` } },
  { id: 'dot-explicit-dotfile', q: '4', patterns: 'cypress/e2e/.*.cy.ts', opts: { cwd: `${FP}/dot` } },
  { id: 'dot-static-dotfile', q: '4', patterns: '.env', opts: { cwd: `${FP}/dot` } },
  { id: 'dot-true', q: '4', patterns: '**/*', opts: { cwd: `${FP}/dot`, dot: true } },
  // Q5
  { id: 'sym-default', q: '5', patterns: '**/*.cy.ts', opts: { cwd: `${FP}/symlink` } },
  { id: 'sym-default-abs', q: '5', patterns: '**/*.cy.ts', opts: { cwd: `${FP}/symlink`, absolute: true } },
  { id: 'sym-nofollow', q: '5', patterns: '**/*.cy.ts', opts: { cwd: `${FP}/symlink`, followSymbolicLinks: false } },
  { id: 'sym-onlyDirs', q: '5', patterns: '**', opts: { cwd: `${FP}/symlink`, onlyDirectories: true } },
  { id: 'sym-deep-cap', q: '5', patterns: 'linkdir/nested/loop/linkdir/**/*.cy.ts', opts: { cwd: `${FP}/symlink` } },
  // Q6
  { id: 'neg-dts', q: '6', patterns: ['**/*.ts', '!**/*.d.ts'], opts: { cwd: `${FP}/neg` } },
  { id: 'neg-dts-first', q: '6', patterns: ['!**/*.d.ts', '**/*.ts'], opts: { cwd: `${FP}/neg` } },
  { id: 'neg-dir', q: '6', patterns: ['**/*.ts', '!src/lib'], opts: { cwd: `${FP}/neg` } },
  { id: 'neg-dir-globstar', q: '6', patterns: ['**/*.ts', '!src/lib/**'], opts: { cwd: `${FP}/neg` } },
  { id: 'ignore-nm-globstar', q: '6', patterns: '**/*.ts', opts: { cwd: `${FP}/neg`, ignore: ['**/node_modules/**'] } },
  { id: 'ignore-nm-bare', q: '6', patterns: '**/*.ts', opts: { cwd: `${FP}/neg`, ignore: ['node_modules'] } },
  { id: 'ignore-nm-default', q: '6', patterns: '**/*.ts', opts: { cwd: `${FP}/neg` } },
  { id: 'ignore-nm-explicit-pattern', q: '6', patterns: 'node_modules/**/*.ts', opts: { cwd: `${FP}/neg`, ignore: ['**/node_modules/**'] } },
  // Q7
  { id: 'cfg-e2e-spec', q: '7', patterns: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}', opts: { cwd: `${FP}/config`, absolute: true, onlyFiles: true, ignore: ['*.hot-update.js', '**/node_modules/**'] } },
  { id: 'cfg-ct-spec', q: '7', patterns: '**/*.cy.{js,jsx,ts,tsx}', opts: { cwd: `${FP}/config`, absolute: true, onlyFiles: true, ignore: ['**/__snapshots__/*', '**/__image_snapshots__/*', '**/node_modules/**'] } },
  { id: 'cfg-hot-update-exclude', q: '7', patterns: '**/*.js', opts: { cwd: `${FP}/config`, ignore: ['*.hot-update.js', '**/node_modules/**'] } },
  { id: 'cfg-support-e2e', q: '7', patterns: 'cypress/support/e2e.{js,jsx,ts,tsx}', opts: { cwd: `${FP}/config`, absolute: true, onlyFiles: true, ignore: ['**/node_modules/**'] } },
  { id: 'cfg-support-ct', q: '7', patterns: 'cypress/support/component.{js,jsx,ts,tsx}', opts: { cwd: `${FP}/config`, absolute: true, onlyFiles: true, ignore: ['**/node_modules/**'] } },
  { id: 'cfg-support-abs', q: '7', patterns: `${FP}/config/cypress/support/e2e.{js,jsx,ts,tsx}`, opts: { onlyFiles: true } },
  { id: 'cfg-nested-brace', q: '7', patterns: '{src,cypress}/**/*.{cy,CY}.{ts,tsx}', opts: { cwd: `${FP}/config` } },
  { id: 'cfg-extglob-plus', q: '7', patterns: '**/*.cy.+(ts|tsx)', opts: { cwd: `${FP}/config`, ignore: ['**/node_modules/**'] } },
  { id: 'cfg-extglob-not', q: '7', patterns: 'src/**/!(*.d).ts', opts: { cwd: `${FP}/config` } },
  { id: 'cfg-extglob-at', q: '7', patterns: '@(src|cypress)/**/*.cy.ts', opts: { cwd: `${FP}/config` } },
  { id: 'cfg-case', q: '7', patterns: 'cypress/e2e/*.cy.ts', opts: { cwd: `${FP}/config` } },
  { id: 'cfg-case-insensitive', q: '7', patterns: 'cypress/e2e/*.cy.ts', opts: { cwd: `${FP}/config`, caseSensitiveMatch: false } },
  // Q8
  { id: 'order-flat', q: '8', patterns: '*.cy.ts', opts: { cwd: `${FP}/order` }, keepOrder: true },
  { id: 'order-deep', q: '8', patterns: '**/*.cy.ts', opts: { cwd: `${FP}/order` }, keepOrder: true },
  { id: 'order-multi-pattern', q: '8', patterns: ['zeta/*.cy.ts', 'alpha.cy.ts', '*.cy.ts'], opts: { cwd: `${FP}/order` }, keepOrder: true },
]

const rel = (r: string) => r.startsWith(FP) ? `<F>${r.slice(FP.length)}` : r

type Result = { ok: true, files: string[] } | { ok: false, error: string }

const run = async (fn: () => Promise<string[]> | string[], keepOrder: boolean): Promise<Result> => {
  try {
    const files = (await fn()).map(rel)

    return { ok: true, files: keepOrder ? files : [...files].sort() }
  } catch (e: any) {
    return { ok: false, error: `${e.code ?? e.name}: ${String(e.message).split('\n')[0]}` }
  }
}

const out: Record<string, unknown> = { node: process.version, uid: process.getuid?.(), cases: [] as unknown[] }

for (const c of cases) {
  if (filter && !c.id.startsWith(filter)) continue

  const opts = c.opts ?? {}
  const tgOpts = c.tgOpts ?? opts
  const keep = !!c.keepOrder

  ;(out.cases as unknown[]).push({
    id: c.id,
    q: c.q,
    patterns: ([] as string[]).concat(c.patterns).map(rel),
    globby: await run(() => globby(c.patterns, opts), keep),
    globbySuppress: await run(() => globby(c.patterns, { ...opts, suppressErrors: true }), keep),
    globbySync: await run(() => globby.sync(c.patterns, opts), keep),
    tinyglobby: await run(() => tg.glob(c.patterns, tgOpts), keep),
    tinyglobbySync: await run(() => tg.globSync(c.patterns, tgOpts), keep),
  })
}

try {
  fs.readdirSync(`${F}/perm/locked`)
  out.permEnforced = false
} catch (e: any) {
  out.permEnforced = e.code
}

process.stdout.write(`${JSON.stringify(out, null, 2)}\n`)
```

</details>
