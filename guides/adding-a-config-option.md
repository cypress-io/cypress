# Adding a Cypress Configuration Option

Adding a configuration option looks like a one-line change to
[`packages/config/src/options.ts`](../packages/config/src/options.ts). It is not. A public
option touches roughly ten files across three packages, three checked-in snapshot files in two
different snapshot systems, and a pull request in a second repository.

This guide is the source of truth for the workflow. Read it before you add, rename, or remove
an option.

## Decide What Kind of Option You Are Adding

Three decisions shape everything that follows. Make them first.

### 1. Which array?

[`options.ts`](../packages/config/src/options.ts) holds two arrays that are concatenated into
the exported `options` list:

| Array | Line | For |
| -- | -- | -- |
| `driverConfigOptions` | ~157 | Options the driver reads in the browser — timeouts, viewport, retries, `experimental*` behavior flags. Supports `isFolder`. |
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

An option is experimental if — and only if — its **name starts with `experimental`**. Both the
Settings screen and the `cypress run` header discover experiments by that prefix, and nothing
else marks one. Experimental options need the extra copy described in
[Adding an Experimental Option](#adding-an-experimental-option).

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

- **`name`** (required) — the key users write in `cypress.config.ts`.
- **`defaultValue`** (required for `runtimeOptions`) — may be a **function** `(runtimeOptions) => value`,
  evaluated at resolve time by `getDefaultValues`. Use that form when the default differs between
  `e2e` and `component`, as `slowTestThreshold` does.
- **`validation`** (required) — a function from [`validation.ts`](../packages/config/src/validation.ts).
- **`overrideLevel`** — where the option may be overridden at test time: `'any'`, `'suiteOrTest'`,
  `'suite'`, or `'never'`. **Omitting it means `'never'`**; `testOverrideLevels` fills the gap with
  that fallback. Setting anything else means you have a second `cypress.d.ts` edit to make.
- **`requireRestartOnChange`** — `'server'` or `'browser'`. Editing the option in open mode restarts
  that process rather than hot-reloading.
- **`isFolder`** (driver options only) — the value is resolved to an absolute path against
  `projectRoot` by `convertRelativeToAbsolutePaths` in
  [`project/utils.ts`](../packages/config/src/project/utils.ts).
- **`isInternal`** (runtime options only) — excludes the key from the public config surface and from
  Cloud recording payloads.

Both arrays are kept **sorted by `name`**, and names must be unique across the two.
[`options.spec.ts`](../packages/config/test/options.spec.ts) fails the build otherwise, naming
the entries to move — declaration order is observable in `getPublicConfigKeys` and in the resolved
config sent to Cypress Cloud, so an unsorted insert shows up as unrelated snapshot churn.

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
`Partial<Pick<...>>` and `CoreConfigOptions`, so a `?` here is redundant.

**If `overrideLevel` is anything other than `'never'`, you have a second edit here.** The
`Pick<ConfigOptions, ...>` unions in `SuiteConfigOverrides` and `TestConfigOverrides` are
maintained by hand and list exactly which options may appear in `describe`/`it` config overrides.
Miss them and `it('...', { myNewOption: true }, () => {})` is a type error even though the runtime
accepts it. [`options.spec.ts`](../packages/config/test/options.spec.ts) compares the two lists
against `overrideLevel` and fails when they diverge, so you will be told rather than having to
remember.

Not every overridable option can go in those unions. `Pick<ConfigOptions, ...>` can only reach
members of `ResolvedConfigOptions` that `UserConfigOptions` does not omit, so an option declared
on `EndToEndConfigOptions` (such as `experimentalOriginDependencies`) or omitted outright (such as
`excludeSpecPattern`) is unreachable there. Those, plus options whose value cannot take effect
per-test, are listed with their reasons in `OVERRIDE_TYPE_EXCEPTIONS` in that spec. Add yours
there rather than forcing it into the union — `yarn workspace cypress dtslint` will reject a
`Pick` of a key that `ConfigOptions` does not have.

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

An option is an experiment purely because its name starts with `experimental`. Both surfaces
that show experiments to users discover them by that prefix and then look their display copy up
by key, so an experiment needs copy in two places.

### 7a. Settings screen copy — `en-US.json`

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

### 7b. Run header copy — `experiments.ts`

The `Experiments:` row of the `cypress run` header is plain text, so
[`packages/server/lib/experiments.ts`](../packages/server/lib/experiments.ts) carries its own
`_names` and `_summaries` maps. Copy the same strings across, with any markdown links reduced to
their labels:

```ts
export const _names: StringValues = {
  experimentalRunAllSpecs: 'Run All Specs',
}

export const _summaries: StringValues = {
  experimentalRunAllSpecs: 'Enables the "Run All Specs" UI feature, allowing the execution of multiple specs sequentially.',
}
```

Both maps are kept sorted by key. The server cannot import from `@packages/frontend-shared` —
that package depends on `@packages/server`, so the dependency only runs one way — which is why
the copy is duplicated rather than shared.

**You do not have to remember any of this.**
[`experiments_spec.ts`](../packages/server/test/unit/experiments_spec.ts) asserts that every
`experimental*` option in `@packages/config` has copy in *both* files, that neither file carries
copy for an option that no longer exists, and that the two say the same thing once markdown links
are flattened. Miss a file and the test names it:

```
add copy to packages/server/lib/experiments.ts
```

Both files also share one definition of the prefix — `hasExperimentalPrefix` from
[`@packages/config`](../packages/config/src/browser.ts) — rather than each re-deriving it.

The prefix alone is not enough to identify an experiment, though. **Cypress does not reject
unknown keys in a user's config**, so a user's own `experimentalWhateverTheyLike` reaches the
resolved config and matches the prefix. `getExperimentsFromResolved` therefore skips any key with
no entry in `_names`, which is what keeps a user's invented key out of the run header. That guard
is load-bearing, not dead code — do not "simplify" it into a fallback to the key name.

### 7c. Add the option to the Settings component fixture

[`Experiments.cy.tsx`](../packages/app/src/settings/project/Experiments.cy.tsx) renders the
Settings screen against
[`packages/frontend-shared/cypress/fixtures/config.json`](../packages/frontend-shared/cypress/fixtures/config.json)
and asserts each row against the i18n messages. That fixture is hand-maintained and currently
lists only a subset of options, so add yours to get the component covered:

```json
{
  "value": false,
  "from": "default",
  "field": "experimentalRunAllSpecs"
}
```

### Why the copy matters more than it looks

[`Experiments.vue`](../packages/app/src/settings/project/Experiments.vue) builds its i18n key by
interpolation:

```ts
name: t(`settingsPage.experiments.${configItem.field}.name`),
```

`vue-i18n` returns the key path itself when a key is missing, so without step 7a the Settings
screen renders the literal string `settingsPage.experiments.myNewOption.name` as the experiment's
name. TypeScript cannot catch it — the key is built from runtime config, so there is nothing
static to check — which is why the coverage assertions in step 7b exist.

Note that this component filters on the `experimental` prefix alone, with no equivalent of the
run header's `_names` check, so a user's own `experimental*` config key renders here the same way.
That is existing behavior and not something your option introduces.

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

# experiment copy coverage (experimental options only)
yarn workspace @packages/server test-unit -- experiments_spec

# the Settings screen component test (experimental options only)
yarn workspace @packages/app cypress:run:ct -- --spec src/settings/project/Experiments.cy.tsx

# the slow one, last
yarn workspace @tooling/system-tests test results_spec
```

`options.spec.ts` and `experiments_spec.ts` are the guards that catch the mistakes this workflow
used to hide: unsorted or duplicated option names, override types that fall behind
`overrideLevel`, and experiment copy present in one file but not the other. If either fails, the
message names the file to edit.

## Checklist

- [ ] Option added to `driverConfigOptions` or `runtimeOptions` in `packages/config/src/options.ts`, in alphabetical position
- [ ] `isInternal` set correctly — public keys are sent to Cypress Cloud on recorded runs
- [ ] Validator chosen or written in `packages/config/src/validation.ts`, with test cases
- [ ] Type added to `ResolvedConfigOptions` in `cli/types/cypress.d.ts` with an `@default` tag
- [ ] If `overrideLevel` is not `'never'`: added to the `Pick` unions in `SuiteConfigOverrides` **and** `TestConfigOverrides` (or listed in `OVERRIDE_TYPE_EXCEPTIONS` with a reason)
- [ ] Hand-written expectations updated in `packages/config/test/project/utils.spec.ts`
- [ ] `@packages/config` snapshots regenerated (`test-unit -- -u`)
- [ ] `system-tests/__snapshots__/results_spec.ts.js` regenerated (`SNAPSHOT_UPDATE=1`)
- [ ] **Experimental only:** copy added to `packages/frontend-shared/src/locales/en-US.json`
- [ ] **Experimental only:** matching `_names` and `_summaries` added to `packages/server/lib/experiments.ts`
- [ ] **Experimental only:** entry added to `packages/frontend-shared/cypress/fixtures/config.json`
- [ ] **Experimental only:** `experiments_spec` passes
- [ ] Changelog entry added per [Writing the Cypress Changelog](./writing-the-cypress-changelog.md)
- [ ] Pull request opened in [`cypress-io/cypress-documentation`](https://github.com/cypress-io/cypress-documentation) and linked in the template
