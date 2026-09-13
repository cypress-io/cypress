# Adding a Cypress Configuration Option

Adding a configuration option looks like a one-line change to
[`packages/config/src/options.ts`](../packages/config/src/options.ts). It is not. A public
option touches roughly ten files across three packages, three checked-in snapshot files in two
different snapshot systems, and a pull request in a second repository — and two of those steps
fail *silently*, shipping a visibly broken Settings screen with a green CI run.

This guide is the source of truth for the workflow. Read it before you add, rename, or remove
an option.

## Before You Start: This Change Is Expensive in CI

`packages/config/*` is a **global trigger** in
[`.circleci/scripts/generate-pipeline-parameters.sh`](../.circleci/scripts/generate-pipeline-parameters.sh)
(line 133). Path-based job filtering is skipped entirely and `emit_all_true` flips all 23 job
groups to `true` — driver, server, app UI, launchpad, reporter, frontend-shared, system tests,
V8, CLI, unit, and every `npm/*` package suite — on every platform in the matrix.

The global-trigger loop runs **before** the targeted path mapping that exempts `*.md` and other
documentation files, and it exits as soon as it matches. So `packages/config/*` means *every* file
under that directory — editing `packages/config/AGENTS.md` runs the full matrix just as surely as
editing `options.ts` does.

There is no cheap iteration loop here. A wrong guess about a default value or a missed snapshot
costs a full matrix run. **Run the local checks in [Verifying Your Change](#verifying-your-change)
before you push**, not after CI tells you.

## Decide What Kind of Option You Are Adding

Three decisions shape everything that follows. Make them first.

### 1. Which array?

[`options.ts`](../packages/config/src/options.ts) holds two arrays that are concatenated into
the exported `options` list:

| Array | Line | For |
| -- | -- | -- |
| `driverConfigOptions` | ~157 | Options the driver reads in the browser — timeouts, viewport, retries, `experimental*` behavior flags. Supports `isFolder` and `isExperimental`. |
| `runtimeOptions` | ~520 | Options resolved by the Node process — ports, paths, browser lists, CLI-only values. Supports `isInternal`. |

If a user writes it in `cypress.config.ts` and it changes how commands behave in the browser,
it belongs in `driverConfigOptions`.

### 2. Public or internal?

Only `runtimeOptions` entries may set `isInternal: true`. This is not cosmetic:

```ts
const publicConfigKeys = _(options).reject({ isInternal: true }).map('name').value()
```

Every **public** key is included in `getCloudRecordingConfigKeys()`
([`browser.ts`](../packages/config/src/browser.ts)), which `filterRuntimeConfigForRecording` in
[`packages/server/lib/config.ts`](../packages/server/lib/config.ts) uses as the allow-list for the
configuration payload sent to Cypress Cloud on recorded runs. If the value could contain anything
user-specific that should not leave the machine, it must be internal — or it must be sanitized
there the way `env` and `devServerConfig` already are.

### 3. Experimental or not?

An option is experimental if — and only if — its **name starts with `experimental`**. Nothing
else decides this. See [The Two Silent Failures](#the-two-silent-failures) below; it is the
single most important section of this guide.

> **`isExperimental: true` does nothing.** The flag is declared on `DriverConfigOption` and set
> on six options, and it has **zero consumers anywhere in the repository**. Set it for
> consistency with its neighbors, but do not rely on it to make anything happen. In particular,
> `experimentalCspAllowList` does *not* set it and still renders in the experiments UI.

## The Shape of an Option

```ts
{
  name: 'myNewOption',
  defaultValue: false,
  validation: validate.isBoolean,
  overrideLevel: 'any',
  requireRestartOnChange: 'server',
}
```

| Field | Required | What it actually does |
| -- | -- | -- |
| `name` | yes | The key users write in `cypress.config.ts`. |
| `defaultValue` | yes for `runtimeOptions` | May be a **function** `(runtimeOptions) => value`, evaluated at resolve time by `getDefaultValues`. Use that form when the default differs between `e2e` and `component` (see `slowTestThreshold`). |
| `validation` | yes | A function from [`validation.ts`](../packages/config/src/validation.ts). |
| `overrideLevel` | no | Where the option may be overridden at test time: `'any'`, `'suiteOrTest'`, `'suite'`, `'never'`. **Omitting it means `'never'`** — `testOverrideLevels` fills the gap with that fallback. Setting anything other than `'never'` means you have a second `cypress.d.ts` edit to make. |
| `requireRestartOnChange` | no | `'server'` or `'browser'`. Editing the option in open mode restarts that process rather than hot-reloading. |
| `isFolder` | driver only | The value is resolved to an absolute path against `projectRoot` by `convertRelativeToAbsolutePaths` in [`project/utils.ts`](../packages/config/src/project/utils.ts). |
| `isExperimental` | driver only | Nothing. See the note above. |
| `isInternal` | runtime only | Excludes the key from the public config surface and from Cloud recording payloads. |

Array **order is observable**. The `getPublicConfigKeys` snapshot records keys in declaration
order, not alphabetical order, so inserting an option in the middle of an array rewrites part of
that snapshot. The file asks you to keep options alphabetical; it has drifted, so match your
neighbors rather than forcing a re-sort.

### Validators

Reuse an existing validator whenever one fits — `isBoolean`, `isNumber`, `isString`, `isArray`,
`isStringOrFalse`, `isNumberOrFalse`, `isOneOf(...)`, `isArrayIncludingAny(...)`,
`isStringOrArrayOfStrings`, `isNullOrArrayOfStrings`. Compose alternatives with `validateAny`:

```ts
validation: validate.validateAny(validate.isBoolean, validate.isArrayIncludingAny('script-src', 'default-src')),
```

A validator takes `(key, value)` and returns `true` on success or an `ErrResult` built by
`errMsg(key, value, type)` on failure, where `type` is a human-readable phrase such as
`'a boolean'`. Every validator accepts `null`/`undefined` as valid — absence is handled by
default resolution, not validation.

If you write a new validator, add cases to
[`validation.spec.ts`](../packages/config/test/validation.spec.ts); its error messages are
snapshotted.

## Adding a Plain Option

Worked against `redirectionLimit` and `defaultCommandTimeout`, both plain public driver options
with test-time overrides.

### 1. Define the option

Add the object to `driverConfigOptions` or `runtimeOptions` in
[`packages/config/src/options.ts`](../packages/config/src/options.ts), next to related options.

### 2. Add the user-facing type

In [`cli/types/cypress.d.ts`](../cli/types/cypress.d.ts), add the property to
`interface ResolvedConfigOptions` (~line 2968), with a jsdoc description and an `@default` tag
matching the `defaultValue` you just wrote:

```ts
/**
 * Time, in milliseconds, to wait until most DOM based commands are considered timed out
 * @default 4000
 */
defaultCommandTimeout: number
```

Declare the property **non-optional**. Optionality is applied by consumers through
`Partial<Pick<...>>` and `CoreConfigOptions`, so a `?` here is redundant — match your neighbors.
(A handful of `experimental*` entries are declared optional; that is drift, not a convention.)

**If `overrideLevel` is anything other than `'never'`, you have a second edit here.** The
`Pick<ConfigOptions, ...>` unions in `SuiteConfigOverrides` (~line 3427) and
`TestConfigOverrides` (~line 3435) are maintained by hand and list exactly which options may
appear in `describe`/`it` config overrides. Miss them and
`it('...', { myNewOption: true }, () => {})` is a type error even though it works at runtime.
These lists have drifted from `overrideLevel` before — `experimentalOriginDependencies` is
`overrideLevel: 'any'` and is not in either `Pick` — so treat the existing contents as a
precedent, not as proof of completeness.

The pull request template has a dedicated checkbox for this step: *"Have API changes been
updated in the type definitions?"*

### 3. Update the hand-written config expectations

[`packages/config/test/project/utils.spec.ts`](../packages/config/test/project/utils.spec.ts)
asserts two complete resolved-config objects (~lines 1302 and 1404) as literal
`{ value, from: 'default' }` entries. These are **not** snapshots — `-u` will not touch them.
Add your option by hand, or the tests fail with a diff you have to read carefully.

The same file has a block of one-line default-value assertions (`await defaults('defaultCommandTimeout', 4000)`,
~line 986). Adding one for your option is optional but cheap, and it fails with a far clearer
message than a 200-line object diff.

### 4. Regenerate the snapshots

See [Regenerating Snapshots](#regenerating-snapshots). All three systems are affected by a
public option.

### 5. Write the changelog entry

A new configuration option is a `feat`. Follow
[Writing the Cypress Changelog](./writing-the-cypress-changelog.md) — in particular rule 10,
which asks you to link the first mention of a configuration option to its documentation.

### 6. Open the documentation pull request

User-facing options are documented in
[`cypress-io/cypress-documentation`](https://github.com/cypress-io/cypress-documentation), not
here. Open a pull request there adding the option to the configuration reference, and link it in
the *"Has a PR for user-facing changes been opened in `cypress-documentation`?"* checkbox. An
option that ships without a docs entry is effectively undiscoverable.

## Adding an Experimental Option

Everything above, plus two independent copies of the display copy, in two different packages.
**Both are looked up by key at runtime, with no compile-time check** — and by default, nothing
tests either one. Step 7c fixes half of that.

### 7a. Frontend copy in `en-US.json`

[`packages/frontend-shared/src/locales/en-US.json`](../packages/frontend-shared/src/locales/en-US.json),
under `settingsPage.experiments.<optionName>`:

```json
"experimentalRunAllSpecs": {
  "name": "Run All Specs",
  "description": "Enables the \"Run All Specs\" UI feature, allowing the execution of multiple specs sequentially."
}
```

The `description` is rendered as **markdown** by `ExperimentRow.vue`, so backticks and links
work: wrap config values in backticks and link out to `https://on.cypress.io/...` where useful.

### 7b. Terminal copy in `experiments.ts`

[`packages/server/lib/experiments.ts`](../packages/server/lib/experiments.ts) keeps a *second,
independent* copy of the same two strings, in the `_names` and `_summaries` maps. Add both:

```ts
const _summaries: StringValues = {
  experimentalRunAllSpecs: 'Enables the "Run All Specs" UI feature, allowing the execution of multiple specs sequentially',
}

const _names: StringValues = {
  experimentalRunAllSpecs: 'Run All Specs',
}
```

These feed the `Experiments:` row of the `cypress run` header table via
[`print-run.ts`](../packages/server/lib/util/print-run.ts). The two copies are not kept in sync
by anything — today they already disagree on trailing punctuation — so write both at once while
the wording is in front of you.

### 7c. Opt into the component test via `config.json`

Add your option to
[`packages/frontend-shared/cypress/fixtures/config.json`](../packages/frontend-shared/cypress/fixtures/config.json):

```json
{
  "value": false,
  "from": "default",
  "field": "experimentalRunAllSpecs"
}
```

This is what makes step 7a testable rather than hope-based. See
[Failure 1](#failure-1-the-settings-ui-renders-the-raw-i18n-key).

## The Two Silent Failures

Neither of the copy files above is referenced by name anywhere. Both consumers **discover
experiments by scanning for the `experimental` key prefix and then looking the name up by key**.
Skip either file and every test still passes.

### Failure 1: the Settings UI renders the raw i18n key

[`packages/app/src/settings/project/Experiments.vue`](../packages/app/src/settings/project/Experiments.vue):

```ts
const experimentalConfigurations = props.gql.config.filter((item) => item.field.startsWith('experimental'))

return experimentalConfigurations.map((configItem) => ({
  key: configItem.field,
  name: t(`settingsPage.experiments.${configItem.field}.name`),
  enabled: !!configItem.value,
  description: t(`settingsPage.experiments.${configItem.field}.description`),
}))
```

Your option appears in the list the moment it exists in `options.ts`, because it matches the
prefix. The name and description are then resolved from `en-US.json` **by an interpolated key**.
`vue-i18n` returns the key path itself when a key is missing, so the Settings screen renders:

> ### settingsPage.experiments.myNewOption.name
> `myNewOption`
>
> settingsPage.experiments.myNewOption.description

TypeScript cannot catch this. The `t()` calls are typed against the `en-US.json` schema, but the
key is a template literal built from runtime config, so there is nothing static to check.

**There is one test that can catch it, and you have to opt your option into it.**
[`Experiments.cy.tsx`](../packages/app/src/settings/project/Experiments.cy.tsx) mounts the
component against a hand-maintained fixture and asserts each rendered name against the i18n
messages:

```tsx
let experimentEntries = config.filter((a) => a.field.startsWith('experimental'))
...
const expName = defaultMessages.settingsPage.experiments[exp.field].name
cy.contains(`[data-cy="experiment-${exp.field}"]`, expName)
```

The fixture is
[`packages/frontend-shared/cypress/fixtures/config.json`](../packages/frontend-shared/cypress/fixtures/config.json),
and it is **stale**: it lists 45 of the 67 public config keys and only 3 of the 7 experimental
options. Your option is not in it, so the test iterates right past it and passes.

Add the entry described in [step 7c](#7c-opt-into-the-component-test-via-configjson) and the test
starts guarding you: a missing `en-US.json` key then throws on
`defaultMessages.settingsPage.experiments[exp.field].name` instead of quietly rendering garbage.
It is three lines of JSON, and it converts the worst failure mode in this workflow into a normal
red test.

### Failure 2: the `cypress run` header drops the experiment entirely

[`packages/server/lib/experiments.ts`](../packages/server/lib/experiments.ts) does the same
prefix scan, then bails out without a warning:

```ts
const isExperimentKey = (key) => key.startsWith('experimental')
const experimentalKeys = Object.keys(resolvedConfig).filter(isExperimentKey)

experimentalKeys.forEach((key) => {
  const name = get(names, key)

  if (!name) {
    // ignore unknown experiments
    return
  }
  ...
})
```

Miss `_names` and your experiment is simply absent from the `Experiments:` row when a user enables
it. Nothing logs, nothing fails. Because the row is only populated for experiments whose value
differs from the default, no CI job that runs with default config will ever notice, and there is
no equivalent of the `Experiments.cy.tsx` hook here —
[`experiments_spec.ts`](../packages/server/test/unit/experiments_spec.ts) passes its own `names`
and `summaries` maps in rather than exercising the real ones.

**Verify this one by eye.** Run a project with the option enabled and read the run header.

## Regenerating Snapshots

Three checked-in snapshot files record the config surface, across two snapshot systems with two
different update mechanisms. A public option changes all three files. Confirm the commands against
[`packages/config/package.json`](../packages/config/package.json) and
[`system-tests/README.md`](../system-tests/README.md) if they drift. (A third system — the `.ansi`
error snapshots in `@packages/errors` — only comes into play when you
[remove an option](#renaming-or-removing-an-option).)

| Snapshot | System | Command |
| -- | -- | -- |
| [`packages/config/test/__snapshots__/index.spec.ts.snap`](../packages/config/test/__snapshots__/index.spec.ts.snap) | vitest | `yarn workspace @packages/config test-unit -- -u` |
| [`packages/config/test/__snapshots__/validation.spec.ts.snap`](../packages/config/test/__snapshots__/validation.spec.ts.snap) | vitest | same command (only changes if you added or edited a validator) |
| [`system-tests/__snapshots__/results_spec.ts.js`](../system-tests/__snapshots__/results_spec.ts.js) | `snap-shot-it` | `SNAPSHOT_UPDATE=1 yarn workspace @tooling/system-tests test results_spec` |

A new public option lands in three places inside `index.spec.ts.snap`: the full default-values
object twice (once per testing type) and the declaration-ordered list of public keys once. The
fourth snapshot in that file is the breaking-keys list, which only moves when you add to
`breakingOptions`.

The system test runs a real `cypress run` and snapshots the serialized results object, including
the whole resolved config. It is the slowest of the three; run it last, once the option's shape is
settled.

Remember that
[`packages/config/test/project/utils.spec.ts`](../packages/config/test/project/utils.spec.ts) is
**not** a snapshot and must be edited by hand (step 3 above).

## Renaming or Removing an Option

Removing an option is not a deletion. Users have it in their config files, and Cypress must tell
them what happened rather than silently ignoring it.

1. **Delete** the entry from `driverConfigOptions` / `runtimeOptions`.
2. **Add an entry to `breakingOptions`** in the same file, with an `errorKey`:
   ```ts
   {
     name: 'experimentalMemoryManagement',
     errorKey: 'EXPERIMENTAL_MEMORY_MANAGEMENT_REMOVED',
     isWarning: true,
   }
   ```
   Use `isWarning: true` to warn and continue, `false` to throw. For a rename, set `newName` and
   use the `RENAMED_CONFIG_OPTION` key. To warn only for particular values — as
   `visibilityStrategy` does for `'legacy'` — supply `shouldDisplayOrThrow`.
   Options that are invalid only in a specific position go in `breakingRootOptions` or
   `testingTypeBreakingOptions` instead.
3. **Register the error key** in the `BREAKING_OPTION_ERROR_KEY` array at the top of `options.ts`
   (~line 24). It is typed as `AllCypressErrorNames[]`, so this is where the change crosses into
   [`@packages/errors`](../packages/errors).
4. **Define the error** in [`packages/errors/src/errors.ts`](../packages/errors/src/errors.ts) and
   add a case to
   [`visualSnapshotErrors.spec.ts`](../packages/errors/test/visualSnapshotErrors.spec.ts), which
   renders every error to an `.ansi` snapshot.
5. **Regenerate the GraphQL schema.** `ErrorTypeEnum` is built from `Object.keys(AllCypressErrors)`
   in
   [`gql-ErrorTypeEnum.ts`](../packages/data-context/graphql/schemaTypes/enumTypes/gql-ErrorTypeEnum.ts),
   so a new error key changes the checked-in
   [`packages/data-context/schemas/schema.graphql`](../packages/data-context/schemas/schema.graphql).
   Run the three steps in this order — `nexus-build` is what *writes* `schema.graphql`, and the
   other two read it, so the package's own `build` script runs them the wrong way round for this
   case:

   ```bash
   yarn workspace @packages/data-context nexus-build   # rewrites schemas/schema.graphql
   yarn workspace @packages/data-context build:schema  # regenerates src/gen/urql-introspection.gen.ts
   yarn workspace @packages/data-context build:graphql # regenerates the typed documents
   ```

   Then check `git status` — generated GraphQL types are checked in across more than one package.
6. **Remove the type** from `cypress.d.ts`, including any `Pick` unions, and remove the
   experiment copy from `en-US.json` and `experiments.ts` if it was experimental.
7. **Write a `breaking` or `deprecation` changelog entry** and open the corresponding
   `cypress-documentation` pull request.

Leftover snapshots are a real hazard here.
`packages/errors/test/__snapshots__/EXPERIMENTAL_RUN_ALL_SPECS_E2E_ONLY.ansi` is an orphan — the
error key it records no longer exists in `errors.ts`. Delete the `.ansi` file when you delete an
error.

## Verifying Your Change

Run these locally before pushing, in this order. Everything except the system test is fast, and
`packages/config/*` triggering the whole matrix means a failed push is expensive.

```bash
# type definitions compile and satisfy the type tests
yarn workspace cypress dtslint
yarn check-ts

# config unit tests, including the regenerated snapshots
yarn workspace @packages/config test-unit

# lint (formatting is enforced entirely through ESLint — this repo has no Prettier)
yarn lint --scope @packages/config

# experimental options only: the Settings screen component test
yarn workspace @packages/app cypress:run:ct -- --spec src/settings/project/Experiments.cy.tsx

# the slow one, last
yarn workspace @tooling/system-tests test results_spec
```

Then verify the `cypress run` header by hand with the option enabled, per
[Failure 2](#failure-2-the-cypress-run-header-drops-the-experiment-entirely). No automated check
covers it.

## Checklist

- [ ] Option added to `driverConfigOptions` or `runtimeOptions` in `packages/config/src/options.ts`
- [ ] `isInternal` set correctly — public keys are sent to Cypress Cloud on recorded runs
- [ ] Validator chosen or written in `packages/config/src/validation.ts`, with test cases
- [ ] Type added to `ResolvedConfigOptions` in `cli/types/cypress.d.ts` with an `@default` tag
- [ ] If `overrideLevel` is not `'never'`: added to the `Pick` unions in `SuiteConfigOverrides` **and** `TestConfigOverrides`
- [ ] Hand-written expectations updated in `packages/config/test/project/utils.spec.ts`
- [ ] `@packages/config` snapshots regenerated (`test-unit -- -u`)
- [ ] `system-tests/__snapshots__/results_spec.ts.js` regenerated (`SNAPSHOT_UPDATE=1`)
- [ ] **Experimental only:** copy added to `packages/frontend-shared/src/locales/en-US.json`
- [ ] **Experimental only:** `_names` and `_summaries` added to `packages/server/lib/experiments.ts`
- [ ] **Experimental only:** entry added to `packages/frontend-shared/cypress/fixtures/config.json` so `Experiments.cy.tsx` guards the copy
- [ ] **Experimental only:** the `cypress run` header checked by eye with the option enabled
- [ ] Changelog entry added per [Writing the Cypress Changelog](./writing-the-cypress-changelog.md)
- [ ] Pull request opened in [`cypress-io/cypress-documentation`](https://github.com/cypress-io/cypress-documentation) and linked in the template
