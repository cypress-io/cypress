# globby → tinyglobby: option inventory and size baseline (T1b)

This branch is a hand-off, not a change. It lists every option our code passes to `globby` and what tinyglobby offers in its place, checks tinyglobby against our Node floors, and records a size baseline so T9b can measure the win. Glob *behaviour* (what each library matches) is T1a’s job and isn’t repeated here.

Measured on `origin/develop` at `a646f3d`, after a fresh `yarn --frozen-lockfile` and `yarn build`, with Node v24.22.1. Versions in `yarn.lock`: globby 11.1.0, fast-glob 3.3.3, tinyglobby 0.2.17 (fdir 6.5.0, picomatch 4.0.5).

**The short version.** Every option we pass has a tinyglobby equivalent except `gitignore` (one call site), `suppressErrors` (our own retry) and `objectMode` (one unit test). tinyglobby’s engines are far below every Node floor we support. The size win is in the binary and its V8 snapshot, not in the repo’s `node_modules`: third-party packages keep `globby@11.1.0` installed no matter what we do.

---

## 1. Option inventory

### Repo-owned `globby` imports

Found with:

```sh
git grep -n -E "from ['\"]globby['\"]|require\(['\"]globby['\"]\)|GlobbyOptions" -- ':!**/node_modules/**'
```

| # | File | Ships in the binary? | API | Pattern shape | Options passed |
| --- | --- | --- | --- | --- | --- |
| 1 | `packages/data-context/src/sources/FileDataSource.ts` (`matchGlobs`, `getFilesByGlob`; also `import type { GlobbyOptions }`) | yes | async `globby()` | `cwd`-relative after stripping the project prefix | always `onlyFiles: true`, `absolute: true`, `cwd`, `ignore` (the caller’s, plus `'**/node_modules/**'` unless `node_modules` appears in `cwd` or a pattern); on retry `suppressErrors: true`; anything else the caller passes is spread in (see the next table) |
| 2 | `packages/scaffold-config/src/detect.ts` (`detectLanguage`) | yes | `globby.sync()` | `cypress/**/*.{ts,tsx}`, `**/*tsconfig.json` | `onlyFiles: true`, `gitignore: true`, `cwd: projectRoot`, `ignore: ['node_modules']` |
| 3 | `packages/scaffold-config/src/ct-detect-third-party.ts` (`detectThirdPartyCTFrameworks`) | yes | async `globby()` | **absolute**: `<dir>/node_modules/cypress-ct-*/package.json` and `<dir>/node_modules/@*?/cypress-ct-*?/package.json` for the project root and each ancestor | none |
| 4 | `npm/grep/src/plugin.ts` | published separately in `@cypress/grep` | `sync` (named import) | user `specPattern`, relative | `cwd: process.cwd()`, `ignore: excludeSpecPattern` (array-wrapped), `absolute: true` |
| 5 | `packages/launchpad/cypress/tasks/snapshotsScaffold.ts` | no (Cypress task in launchpad’s own e2e tests) | async `globby()` | **absolute**: `<tmp>/cypress` (a directory) and `<tmp>/cypress.config.*` | `onlyFiles: true` |
| 6 | `npm/webpack-preprocessor/test/e2e/e2e.spec.ts` | no (test) | `globby.sync()` | **absolute**: `path.join(__dirname, '../../cypress/tests/e2e/**/*')` | none |
| 7 | `system-tests/test/webpack_dev_server_spec.ts` | no (test) | async `globby()` | **absolute**, built with `path.join` (so it has backslashes on Windows) | none |

`package.json` declarations to remove: `dependencies` in `packages/data-context`, `packages/scaffold-config` and `npm/grep`; `devDependencies` in `packages/launchpad`, `npm/webpack-preprocessor` and `system-tests`. Each one is `^11.1.0`. The tinyglobby range that dedupes against the lockfile is `^0.2.17`: the merged entry is `tinyglobby@^0.2.12, tinyglobby@^0.2.14, tinyglobby@^0.2.15, tinyglobby@^0.2.17` → 0.2.17, and `^0.2.17` is the only range that guarantees 0.2.17.

Prose that names globby and will need updating: `guides/writing-cross-platform-javascript.md` (lines 20–27), `packages/data-context/README.md` (lines 67–73), `npm/grep/AGENTS.md` (line 34), and two code comments in `FileDataSource.ts` (lines 45 and 58–59) plus one in `ProjectDataSource.ts` (line 555).

### What reaches `FileDataSource.getFilesByGlob`

Found with:

```sh
git grep -n -E "getFilesByGlob|matchGlobs" -- packages npm cli ':!*.md' | grep -v /test/
```

| Caller | Pattern | Options passed in | Where the pattern comes from |
| --- | --- | --- | --- |
| `ProjectDataSource.findSpecs`, both calls (`packages/data-context/src/sources/ProjectDataSource.ts:323` and `:343`) | `specPattern`, then `configSpecPattern` (`string[]`) | `absolute: true`, `ignore: [...excludeSpecPattern, ...additionalIgnorePattern]` | user config or `--spec`. For component testing, `additionalIgnorePattern` is the project’s e2e `specPattern` (`packages/config/src/project/utils.ts:458–461`), e.g. `cypress/e2e/**/*.cy.{js,jsx,ts,tsx}`. It doesn’t end in `/**`, so under the agreed design it goes through the picomatch post-filter, not to tinyglobby’s `ignore`. |
| `ProjectDataSource` JSX check (`:473`) | `'**/*.[jt]sx'` | none | constant |
| `ProjectDataSource.getCodeGenCandidates` (`:616`) | GraphQL `codeGenCandidates(glob:)` argument | `expandDirectories: true`, `ignore: ['**/*.config.{js,ts}', '**/*.{cy,spec}.{js,ts,jsx,tsx}']` | typed into the component generator UI (`packages/app/src/specs/generators/component/*StepOne.vue`) |
| `setSupportFileAndFolder` (`packages/config/src/project/utils.ts:334`), via `ProjectConfigManager.ts:554` | `supportFile` | none | user config, relative or absolute. Also order-sensitive: `MULTIPLE_SUPPORT_FILES_FOUND` prints the result list, and `[0]` is used when there’s exactly one result. |
| `FileDataSource.getFilesByGlob` itself (retry at `:83`) | same | adds `suppressErrors: true` | — |
| Tests only: `packages/data-context/test/unit/sources/FileDataSource.spec.ts` | — | `absolute: false`; `absolute: false, objectMode: true` | — |

`packages/server/test/**` and `packages/config/test/**` only pass `getFilesByGlob` around or stub it. They add no options.

### Option support

Defaults come from the installed sources: `node_modules/fast-glob/out/settings.js` and `node_modules/globby/index.js` for globby 11.1.0, and `node_modules/tinyglobby/dist/index.d.cts` for tinyglobby 0.2.17.

| Option | Used by | globby 11 default | tinyglobby default | tinyglobby support | Replacement / note |
| --- | --- | --- | --- | --- | --- |
| `absolute` | #1, #4, `findSpecs`, unit test | `false` | `false` | yes | Same default, but with an absolute pattern and no `cwd`, tinyglobby returns `cwd`-relative paths. #3, #5, #6 and #7 pass no options today and must add `absolute: true` and a `cwd`. |
| `cwd` | #1, #2, #4 | `process.cwd()` | `process.cwd()` | yes (also accepts a `URL`) | #3, #5, #6 and #7 should move their path prefix into `cwd` (project paths can contain `[]()`). |
| `onlyFiles` | #1, #2, #5 | `true` | `true` | yes | — |
| `ignore` | #1, #2, #4, `findSpecs`, `getCodeGenCandidates` | `[]` | `[]` | yes, but it also prunes matching directories | Per the agreed design, only patterns ending in `/**` go to tinyglobby; filter the rest afterwards with picomatch. `detect.ts`’s bare `'node_modules'` matches only the root `node_modules` in both libraries. |
| `expandDirectories` | `getCodeGenCandidates` (`true`); implicit default everywhere | `true`; also accepts `string[]` or `{ files, extensions }` | `true`; boolean only | yes (boolean) | Our only explicit value is `true`. |
| `gitignore` | #2 (`detect.ts`) | `false` | — | **no** | globby 11 reads every `**/.gitignore` under `cwd`. Options: read `.gitignore` files with the `ignore` package and filter afterwards, or drop it on purpose. It only stops git-ignored `.ts` files counting as evidence of a TypeScript project, so this is a decision for the `scaffold-config` migration task. |
| `suppressErrors` | #1 (retry) | `false` | — | **no** | Not needed. tinyglobby skips unreadable directories without throwing (T1a), so the retry and the option both go. |
| `objectMode` | unit test only (`FileDataSource.spec.ts:347`) | `false` | — | **no** | No production caller uses it. Change the test to pass an option tinyglobby has. |
| `caseSensitiveMatch`, `deep`, `dot`, `extglob`, `followSymbolicLinks`, `globstar`, `onlyDirectories`, `braceExpansion` | nobody | fast-glob defaults | same names and defaults (`true`, `Infinity`, `false`, `true`, `true`, `true`, `false`, `true`) | yes | Unused today. They only reach globby through the `...globOptions` spread in #1. |
| `baseNameMatch`, `concurrency`, `markDirectories`, `stats`, `throwErrorOnBrokenSymbolicLink`, `unique` | nobody | fast-glob defaults | — | no | Unused, so nothing to replace. Once the parameter type changes from `GlobbyOptions` to tinyglobby’s `GlobOptions`, the type checker will reject them anyway. |
| `GlobbyOptions` (type) | #1 | — | `GlobOptions` | `import type { GlobOptions } from 'tinyglobby'` | — |
| Sync API | #2, #4, #6 | `globby.sync` / `sync` | `globSync` | yes | — |

## 2. Engines

| What | Node version |
| --- | --- |
| tinyglobby 0.2.17 `engines.node` | `>=12.0.0` |
| fdir 6.5.0 (tinyglobby dependency) | `>=12.0.0` |
| picomatch 4.0.5 (tinyglobby dependency) | `>=12` |
| globby 11.1.0, for comparison | `>=10` |
| User floor: `cli/package.json` `engines.node` | `^22.0.0 \|\| ^24.0.0 \|\| >=26.0.0` |
| Bundled Electron 43.8.4 (root `package.json`) | Node 24.22.1 |
| `.node-version` (dev) | 24.22.1 |

```sh
node -p "require('./node_modules/tinyglobby/package.json').engines"
node -p "require('./cli/package.json').engines"
ELECTRON_RUN_AS_NODE=1 ./node_modules/.bin/electron -p "process.versions.node + ' ' + process.versions.electron"
```

Every floor is well above tinyglobby’s minimum, so there’s no conflict. All three ship a CommonJS `main` (tinyglobby and fdir `./dist/index.cjs`; picomatch 4 `index.js`, with no `"type": "module"`), which matters for our CJS packages and for the plugins child process that runs on the user’s Node.

## 3. Size baseline

### V8 snapshot entries

Command (the script is in the [appendix](#appendix-scripts)):

```sh
node snapshot-counts.mts   # run from the repo root
```

A file counts towards the package after its *last* `node_modules/` segment. Snapshot cache last touched in `b8d3bdc` (2026-11-16). Every package below lives at `./node_modules/<name>`.

| Package | linux | darwin | win32 | Split (healthy / deferred / norewrite) |
| --- | --- | --- | --- | --- |
| globby | 3 | 3 | 3 | 2 / 1 / 0 |
| fast-glob | 25 | 25 | 25 | 23 / 2 / 0 |
| @nodelib/fs.scandir | 9 | 9 | 9 | 8 / 1 / 0 |
| @nodelib/fs.stat | 5 | 5 | 5 | 4 / 1 / 0 |
| @nodelib/fs.walk | 9 | 9 | 9 | 9 / 0 / 0 |
| micromatch | 1 | 1 | 1 | 1 / 0 / 0 |
| dir-glob | 1 | 1 | 1 | 1 / 0 / 0 |
| merge2 | 1 | 1 | 1 | 1 / 0 / 0 |
| array-union | 1 | 1 | 1 | 1 / 0 / 0 |
| slash | 1 | 1 | 1 | 1 / 0 / 0 |
| **Total** | **56** of 3732 | **56** of 3733 | **56** of 3732 | |

The rest of globby’s subtree is also in the snapshot, one entry each: `fastq`, `reusify`, `run-parallel`, `queue-microtask`, `path-type`, `ignore`, `fast-glob/node_modules/glob-parent`, `is-glob`, `is-extglob`, `fill-range` and `to-regex-range`, plus `braces` (7) and `micromatch/node_modules/picomatch` (6). tinyglobby, fdir and picomatch 4 aren’t in the snapshot today, so T9b should expect them as **new** entries.

**Expected to leave the snapshot** once nothing on the runtime path imports globby: every row above except `micromatch` (55 entries), plus `fastq`, `reusify`, `run-parallel`, `queue-microtask`, `path-type`, `fast-glob/node_modules/glob-parent` and probably `ignore` (62 in total). Expected to **stay**: `micromatch` and its subtree (`braces`, `fill-range`, `to-regex-range`, picomatch 2), because `packages/data-context/src/sources/ProjectDataSource.ts` imports `micromatch` directly; and `is-glob`/`is-extglob`, because both chokidar copies depend on `is-glob`. This is a reachability estimate. Only a snapshot rebuild in T9b confirms it.

### What still pulls in fast-glob and micromatch

```sh
yarn why fast-glob
yarn why micromatch
yarn why globby
node exclusive-subtree.mts --prod   # production deps of packages/* and npm/* only
node exclusive-subtree.mts          # every workspace, every dependency section
```

`yarn why` lists 14 reasons for the hoisted `fast-glob@3.3.3` and 42 for the hoisted `micromatch@4.0.8`, mostly dev tooling (jest, lerna, semantic-release, tailwind, vite plugins). Restricted to production dependencies of the workspaces the binary build copies (`packages/*` and `npm/*`; `scripts/binary/util/packages.ts` `copyAllToDist`, then `yarn --production`), with the workspaces’ own `globby` declarations removed:

| Target | Still reached from (production) | Chain | Loaded by the server at runtime? |
| --- | --- | --- | --- |
| fast-glob | `@packages/frontend-shared` | `@intlify/unplugin-vue-i18n@4.0.0 > fast-glob` | no: a Vite build plugin |
| fast-glob | `@cypress/grep` | `find-test-names@1.28.18 > globby@11.1.0 > fast-glob` | no: `@cypress/grep` is a user plugin, and only a devDependency of `cli` |
| micromatch | `@packages/data-context` | direct dependency (`ProjectDataSource.ts:12`) | **yes** |
| micromatch | `@cypress/webpack-batteries-included-preprocessor` | `ts-loader@9.5.7 > micromatch` | yes: `ts-loader` is a `binary-cleanup.js` entry point |
| micromatch | `@cypress/webpack-dev-server` | `webpack-dev-server@5.2.7 > http-proxy-middleware@2.0.9 > micromatch` | yes, when component testing with webpack |
| micromatch | `@packages/frontend-shared`, `@cypress/grep` | through fast-glob, as above | no |

`scripts/binary/binary-cleanup.js` keeps only files reachable from the server entry points (plus the list in `getDependencyPathsToKeep`). So after the migration nothing shipped should load fast-glob, while micromatch stays in the binary regardless.

### On-disk size of globby and its subtree

```sh
node subtree-size.mts    # walks globby's dependencies the way Node resolves them, du -sb each directory once
du -sb node_modules/tinyglobby node_modules/fdir node_modules/picomatch
```

| Package | Path | Bytes | After migration |
| --- | --- | --- | --- |
| globby@11.1.0 | `node_modules/globby` | 21,758 | drops |
| fast-glob@3.3.3 | `node_modules/fast-glob` | 110,530 | drops |
| glob-parent@5.1.2 | `node_modules/fast-glob/node_modules/glob-parent` | 12,134 | drops |
| @nodelib/fs.scandir@2.1.5 | `node_modules/@nodelib/fs.scandir` | 22,155 | drops |
| @nodelib/fs.stat@2.0.5 | `node_modules/@nodelib/fs.stat` | 11,845 | drops |
| @nodelib/fs.walk@1.2.8 | `node_modules/@nodelib/fs.walk` | 26,377 | drops |
| fastq@1.11.0 | `node_modules/fastq` | 17,581 | drops |
| reusify@1.0.4 | `node_modules/reusify` | 9,158 | drops |
| run-parallel@1.2.0 | `node_modules/run-parallel` | 6,563 | drops |
| queue-microtask@1.2.2 | `node_modules/queue-microtask` | 8,352 | drops |
| merge2@1.4.1 | `node_modules/merge2` | 8,897 | drops |
| dir-glob@3.0.1 | `node_modules/dir-glob` | 5,417 | drops |
| path-type@4.0.0 | `node_modules/path-type` | 5,407 | drops |
| array-union@2.1.0 | `node_modules/array-union` | 3,169 | drops |
| slash@3.0.0 | `node_modules/slash` | 3,507 | drops |
| ignore@5.3.2 | `node_modules/ignore` | 53,630 | probably drops (no shipped runtime dependent found) |
| is-glob@4.0.3 | `node_modules/is-glob` | 13,609 | kept (chokidar) |
| is-extglob@2.1.1 | `node_modules/is-extglob` | 6,217 | kept (chokidar, via is-glob) |
| micromatch@4.0.8 | `node_modules/micromatch` | 147,204 | kept (direct `data-context` dependency) |
| picomatch@2.3.2 | `node_modules/micromatch/node_modules/picomatch` | 90,605 | kept (micromatch) |
| braces@3.0.3 | `node_modules/braces` | 44,635 | kept (micromatch) |
| fill-range@7.1.1 | `node_modules/fill-range` | 16,743 | kept (micromatch) |
| to-regex-range@5.0.1 | `node_modules/to-regex-range` | 32,554 | kept (micromatch) |
| is-number@7.0.0 | `node_modules/to-regex-range/node_modules/is-number` | 9,615 | kept (micromatch) |
| **Total** | 24 directories | **687,662** | |

| Summary | Bytes |
| --- | --- |
| globby plus its whole subtree | 687,662 (671.5 KiB) |
| Leaves the runtime graph (every “drops” row, including `ignore`) | 326,480 (318.8 KiB) |
| Stays: micromatch’s subtree plus `is-glob`/`is-extglob` | 361,182 (352.7 KiB) |
| Added by tinyglobby 0.2.17, fdir 6.5.0 and picomatch 4.0.5 | 185,568 (181.2 KiB): 39,288 + 53,291 + 92,989 |
| Expected net change in the runtime graph | about −137.6 KiB (−140,912 bytes), or −85.2 KiB (−87,282 bytes) if `ignore` turns out to be kept |

`subtree-size.mts` only checks reachability from micromatch, so its own “drops” line reads 346,306 bytes. The figure above subtracts `is-glob` (13,609) and `is-extglob` (6,217), which chokidar keeps. That was checked by hand with `node -p "require('./node_modules/chokidar/package.json').dependencies"` and the same for `packages/server/node_modules/chokidar`.

For `yarn why globby`, yarn itself reports `globby@11.1.0` at 40KB without dependencies, 512KB with unique dependencies and 1.54MB with transitive ones.

**In the repo’s `node_modules`, nothing goes away.** `node exclusive-subtree.mts` finds **0** packages that only our own `globby` declarations keep installed, in both modes. `globby@11.1.0` is still required by `find-test-names` (a production dependency of `@cypress/grep`), `@graphql-tools/code-file-loader` (a devDependency of `data-context`), `@graphql-codegen/cli`, `lerna` and others. `yarn why globby` lists 15 reasons for the hoisted copy, plus nested copies such as `packages/eslint-config/node_modules/globby`. T9b should therefore measure the **binary** (`binary-cleanup.js` output and `tooling/v8-snapshot/cache/*/snapshot-meta.json`), not the repo install. Published `@cypress/grep` users keep getting globby through `find-test-names` too.

## Not verified here

- **That the binary actually drops these packages.** The “drops/kept” columns come from package-graph reachability, not from a `binary-build` or a snapshot rebuild, neither of which this task ran. That’s T9b’s measurement.
- **Whether `ignore@5.3.2` is still reached at runtime** by something outside the dependency chains checked (`packages/server`, `data-context`, `scaffold-config`, `config`).
- **Sizes on macOS and Windows.** `du -sb` counts apparent bytes on Linux. Packed sizes and platform-specific installs weren’t measured.
- **Timing and bundle-size impact** inside `@packages/data-context`’s build output weren’t measured.

## Appendix: scripts

Run them from the repo root with Node 24 after `yarn` and `yarn build`. They were kept in a scratch directory and are reproduced here because that directory doesn’t outlive the session.

<details>
<summary><code>snapshot-counts.mts</code></summary>

```ts
// Usage (from the repo root): node <this file>
// Counts snapshot-meta.json entries owned by globby and the packages it pulls in.
// A file belongs to the package after its *last* `node_modules/` segment, so
// `node_modules/globby/node_modules/slash/index.js` counts as `slash`.
import fs from 'node:fs'

const packages = ['globby', 'fast-glob', '@nodelib', 'micromatch', 'dir-glob', 'merge2', 'array-union', 'slash']
const categories = ['healthy', 'deferred', 'norewrite'] as const

const owner = (file: string) => {
  const rest = file.split('node_modules/').pop() ?? ''
  const [first, second] = rest.split('/')

  return first?.startsWith('@') ? `${first}/${second}` : first
}

for (const platform of ['linux', 'darwin', 'win32']) {
  const meta = JSON.parse(fs.readFileSync(`tooling/v8-snapshot/cache/${platform}/snapshot-meta.json`, 'utf8'))
  const rows: Record<string, Record<string, number>> = {}
  const paths: Record<string, Set<string>> = {}

  for (const category of categories) {
    for (const file of meta[category] as string[]) {
      const name = owner(file)

      if (!name) continue

      const pkg = packages.find((p) => name === p || name.startsWith(`${p}/`))

      if (!pkg) continue

      const key = pkg === '@nodelib' ? name : pkg

      rows[key] ??= { healthy: 0, deferred: 0, norewrite: 0 }
      rows[key][category]++
      paths[key] ??= new Set()
      paths[key].add(file.slice(0, file.lastIndexOf('node_modules/') + 'node_modules/'.length + name.length))
    }
  }

  let total = 0

  process.stdout.write(`\n## ${platform}\n| package | healthy | deferred | norewrite | total | install paths |\n| --- | --- | --- | --- | --- | --- |\n`)
  for (const key of Object.keys(rows).sort()) {
    const r = rows[key]!
    const sum = r.healthy! + r.deferred! + r.norewrite!

    total += sum
    process.stdout.write(`| ${key} | ${r.healthy} | ${r.deferred} | ${r.norewrite} | ${sum} | ${[...paths[key]!].join('<br>')} |\n`)
  }

  const all = categories.reduce((n, c) => n + meta[c].length, 0)

  process.stdout.write(`| **total** | | | | **${total}** | of ${all} entries |\n`)
}
```

</details>

<details>
<summary><code>exclusive-subtree.mts</code></summary>

```ts
// Usage (from the repo root): node <this file> [--prod]
//
// Builds the dependency graph from yarn.lock plus every workspace's package.json and
// prints the packages that only globby@11 keeps installed, i.e. what disappears once
// every workspace stops declaring `globby`. With --prod, only `dependencies` and
// `optionalDependencies` of packages/* and npm/* count as roots, which is what the
// binary build installs with `yarn --production`.
//
// Only the workspaces' own `globby` declarations are removed: third-party packages
// that depend on globby@11 keep it. It also prints, for each root, a shortest chain
// that still reaches fast-glob and micromatch, and the on-disk size of each exclusive
// package.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(path.resolve('package.json'))
const lockfile = require('@yarnpkg/lockfile') as { parse: (s: string) => { object: Record<string, any> } }

const prodOnly = process.argv.includes('--prod')
const lock = lockfile.parse(fs.readFileSync('yarn.lock', 'utf8')).object

const nameOf = (key: string) => key.slice(0, key.lastIndexOf('@'))
const resolve = (name: string, range: string) => {
  const entry = lock[`${name}@${range}`]

  return entry ? `${name}@${entry.version}` : undefined
}

const edges = new Map<string, Set<string>>()

for (const [key, entry] of Object.entries(lock)) {
  const id = `${nameOf(key)}@${entry.version}`
  const out = edges.get(id) ?? new Set<string>()

  for (const deps of [entry.dependencies, entry.optionalDependencies]) {
    for (const [n, r] of Object.entries(deps ?? {})) {
      const target = resolve(n, r as string)

      if (target) out.add(target)
    }
  }
  edges.set(id, out)
}

const workspaceDirs = execFileSync('git', ['ls-files', 'package.json', 'cli/package.json', 'packages/*/package.json', 'npm/*/package.json', 'tooling/*/package.json', 'system-tests/package.json', 'scripts/package.json'], { encoding: 'utf8' })
.split('\n').filter(Boolean).map(path.dirname)

const GLOBBY = 'globby@11.1.0'
const roots = new Map<string, string[]>() // root label -> resolved ids

for (const dir of workspaceDirs) {
  const shipped = /^(packages|npm)\//.test(dir)

  if (prodOnly && !shipped) continue

  const json = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
  const sections = prodOnly ? ['dependencies', 'optionalDependencies'] : ['dependencies', 'optionalDependencies', 'devDependencies']
  const ids: string[] = []

  for (const s of sections) {
    for (const [n, r] of Object.entries(json[s] ?? {})) {
      const id = resolve(n, r as string)

      if (id && id !== GLOBBY) ids.push(id)
    }
  }
  roots.set(`${json.name} (${dir})`, ids)
}

const reach = (starts: string[], blocked?: string) => {
  const seen = new Set<string>()
  const stack = [...starts]

  while (stack.length) {
    const id = stack.pop()!

    if (seen.has(id) || id === blocked) continue

    seen.add(id)
    stack.push(...(edges.get(id) ?? []))
  }

  return seen
}

const keptWithoutGlobby = reach([...roots.values()].flat())
const globbySubtree = reach([GLOBBY])
const exclusive = [...globbySubtree].filter((id) => !keptWithoutGlobby.has(id)).sort()

const installDirs = (id: string) => {
  const name = nameOf(id)
  const version = id.slice(name.length + 1)
  const out = execFileSync('find', ['.', '-path', `*/node_modules/${name}/package.json`, '-not', '-path', '*/system-tests/projects/*', '-not', '-path', '*/node_modules/.cache/*'], { encoding: 'utf8' })

  return out.split('\n').filter(Boolean).filter((p) => {
    try {
      const j = JSON.parse(fs.readFileSync(p, 'utf8'))

      return j.name === name && j.version === version
    } catch {
      return false
    }
  }).map(path.dirname)
}

const du = (dir: string) => Number(execFileSync('du', ['-sb', dir], { encoding: 'utf8' }).split('\t')[0])

process.stdout.write(`mode: ${prodOnly ? 'production (packages/*, npm/*)' : 'all workspaces, all dependency sections'}\n`)
process.stdout.write(`globby@11.1.0 subtree: ${globbySubtree.size} packages; exclusive: ${exclusive.length}\n\n| package | install dirs | bytes (du -sb) |\n| --- | --- | --- |\n`)

let totalBytes = 0
let totalDirs = 0

for (const id of exclusive) {
  const dirs = installDirs(id)
  const bytes = dirs.reduce((n, d) => n + du(d), 0)

  totalBytes += bytes
  totalDirs += dirs.length
  process.stdout.write(`| ${id} | ${dirs.join('<br>') || '(not installed)'} | ${bytes} |\n`)
}
process.stdout.write(`| **total** | ${totalDirs} dirs | **${totalBytes}** (${(totalBytes / 1024).toFixed(1)} KiB) |\n`)

process.stdout.write(`\nShared (stays installed without globby@11): ${[...globbySubtree].filter((id) => keptWithoutGlobby.has(id)).sort().join(', ')}\n`)

// Which roots still reach these packages once globby@11 is gone, and through what.
for (const target of ['fast-glob', 'micromatch']) {
  process.stdout.write(`\n### ${target} still reached from (globby@11 removed)\n`)
  for (const [label, ids] of roots) {
    // BFS for a shortest path to any version of target
    const prev = new Map<string, string | null>()
    const queue = ids.filter((id) => id !== GLOBBY)

    for (const id of queue) prev.set(id, null)

    let hit: string | undefined

    while (queue.length && !hit) {
      const id = queue.shift()!

      if (nameOf(id) === target) {
        hit = id
        break
      }
      for (const next of edges.get(id) ?? []) {
        if (prev.has(next)) continue

        prev.set(next, id)
        queue.push(next)
      }
    }

    if (!hit) continue

    const chain: string[] = []

    for (let cur: string | null | undefined = hit; cur; cur = prev.get(cur)) chain.unshift(cur)
    process.stdout.write(`- ${label}: ${chain.join(' > ')}\n`)
  }
}
```

</details>

<details>
<summary><code>subtree-size.mts</code></summary>

```ts
// Usage (from the repo root): node <this file>
// Walks globby's dependency tree the way Node resolves it from ./node_modules/globby
// and prints the on-disk size (du -sb) of every package directory reached, once each.
// Packages also reached from micromatch (which @packages/data-context imports directly)
// are marked "kept".
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'

const walk = (startDir: string) => {
  const seen = new Map<string, { name: string, version: string }>()
  const stack = [startDir]

  while (stack.length) {
    const dir = stack.pop()!

    if (seen.has(dir)) continue

    const json = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))

    seen.set(dir, { name: json.name, version: json.version })

    const req = createRequire(path.join(dir, 'package.json'))

    for (const dep of Object.keys(json.dependencies ?? {})) {
      let pj: string

      try {
        pj = req.resolve(`${dep}/package.json`)
      } catch {
        // packages with an `exports` map that hides package.json
        const main = req.resolve(dep)

        pj = path.join(main.slice(0, main.lastIndexOf(`node_modules/${dep}`) + `node_modules/${dep}`.length), 'package.json')
      }
      stack.push(path.dirname(fs.realpathSync(pj)))
    }
  }

  return seen
}

const du = (dir: string) => Number(execFileSync('du', ['-sb', dir], { encoding: 'utf8' }).split('\t')[0])
const root = path.resolve('node_modules')
const globby = walk(path.join(root, 'globby'))
const kept = walk(path.join(root, 'micromatch'))

let removable = 0
let shared = 0

process.stdout.write('| package | path | bytes | after migration |\n| --- | --- | --- | --- |\n')
for (const [dir, { name, version }] of [...globby].sort((a, b) => a[1].name.localeCompare(b[1].name))) {
  const bytes = du(dir)
  const isKept = kept.has(dir)

  if (isKept) shared += bytes
  else removable += bytes
  process.stdout.write(`| ${name}@${version} | ${path.relative(process.cwd(), dir)} | ${bytes} | ${isKept ? 'kept (micromatch)' : 'drops from runtime graph'} |\n`)
}
process.stdout.write(`\nglobby + subtree: ${globby.size} dirs, ${removable + shared} bytes\n`)
process.stdout.write(`drops with globby: ${removable} bytes (${(removable / 1024).toFixed(1)} KiB)\n`)
process.stdout.write(`kept via micromatch: ${shared} bytes (${(shared / 1024).toFixed(1)} KiB)\n`)
```

</details>
