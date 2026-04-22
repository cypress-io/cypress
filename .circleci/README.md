# CircleCI Configuration

This directory contains CircleCI configuration files that use a dynamic workflow packing system for efficient CI development and execution.

> **Looking for an overview of what our CI does?** See the [Continuous Integration guide](../guides/continuous-integration.md).

## Prerequisites

### CircleCI Local CLI

The CircleCI Local CLI is required to pack the source configurations.

**Installation:**

- **macOS (Homebrew):**
  ```bash
  brew install circleci
  ```

- **Linux:**
  ```bash
  curl -fLSs https://raw.githubusercontent.com/CircleCI-Public/circleci-cli/master/install.sh | bash
  ```

- **Windows:**
  ```bash
  choco install circleci-cli
  ```

- **Manual installation:**
  Download from [CircleCI Local CLI releases](https://github.com/CircleCI-Public/circleci-cli/releases)

For more detailed installation instructions, see the [CircleCI Local CLI documentation](https://circleci.com/docs/2.0/local-cli/).

## Pre-commit Validation

When files in `.circleci/src/` are modified, the pre-commit hook automatically runs:

```bash
yarn pack-ci --verify
```

This command:
1. Scans all directories in `./.circleci/src/` for modifications
2. Packs only the modified directories (e.g., `workflows/` → `workflows.yml`)
3. Validates the packed configurations
4. Exits with error if validation fails

## File Structure

- `src/` - Source configuration directories (modify these)
- `packed/` - Generated configuration files (ignored by git)
- `path-filter-mapping.conf` - Path → pipeline-parameter rules consumed by
  the [`circleci/path-filtering`](https://circleci.com/developer/orbs/orb/circleci/path-filtering)
  orb on PR pipelines (see [Path filtering](#path-filtering) below).

## Development Workflow

1. Make changes to files in `src/` directories
2. Stage and commit changes - pre-commit hook automatically validates and packs configurations
3. The jobs defined in `config.yml` will pack these source directories on-the-fly when CI gets kicked off.

## `config.yml`

This is the main entrypoint to Cypress CI. It loads packed workflow files from cache, or builds them if necessary. Then it continues to the primary workflow. The main entrypoint to our CI must be available in source control and not packed on-the-fly.

`config.yml` declares two setup workflows; exactly one runs per pipeline based
on the branch and pipeline parameters:

| Setup workflow | Continuation | When it runs |
| --- | --- | --- |
| `setup-workflow-full` | `launch-primary-workflow` → continues with `run-all-jobs: true` | `develop`, `update-v8-snapshot-cache-on-develop`, `release/*`, `force-persist-artifacts=true`, or `run-all-jobs=true` |
| `setup-workflow-filtered` | `launch-path-filtered-workflow` (the `path-filtering/filter` orb job) | All other branches (regular PR pipelines) |

## Path filtering

On regular PR pipelines, the `path-filtering` orb diffs the branch against
`develop` and sets a set of `run-*` pipeline parameters (e.g. `run-driver-tests`,
`run-server-tests`, `run-npm-webpack-dev-server-tests`) based on the declarative
rules in [`path-filter-mapping.conf`](./path-filter-mapping.conf). Each
conditional job in `src/pipeline/workflows/pull-request.yml` has an
expression-based `filters:` clause that references its parameter plus
`run-all-jobs`, so jobs the diff doesn't touch are removed from the DAG
entirely (no container spawned, no "skipped" step).

A single `all-jobs-passed` aggregator fans in from every conditional job; it is
the only required GitHub status check for PRs. Because skipped jobs are
removed from the DAG, their entries in `all-jobs-passed.requires:` become
no-ops, and the aggregator completes as soon as all non-skipped dependencies
finish.

### Workflow DAG invariants (`pull-request.yml`)

These rules prevent subtle CI failures when jobs are skipped by expression
filters but downstream work still runs (broken cache, missing artifacts, or
gates finishing before the work they summarize).

**`system-tests-node-modules-install`**

- In `@pipeline.yml`, any job whose steps call `restore_cached_system_tests_deps`
  must list `system-tests-node-modules-install` under `requires:` in
  `workflows/pull-request.yml` (the install job runs
  `update_cached_system_tests_deps`, which seeds the Circle cache those steps
  restore).
- The install job's `filters:` expression must OR in every
  `pipeline.parameters.run-*` that can schedule any job that depends on it
  (otherwise CircleCI drops the install job from the DAG while dependents
  still run, and `requires:` becomes a no-op).
- For path-filter-only PRs, add matching rows in `path-filter-mapping.conf` so
  fixture edits under `system-tests/projects/**` set the same `run-*`
  parameters as changes to the corresponding `npm/**` package when applicable.

**`verify-accessibility-results`**

- This job should `require` the same **driver integration** jobs as
  `all-jobs-passed` (every `driver-integration-tests-*` in the PR workflow).
  Keep the lists in sync when adding or removing a driver matrix job; ordering
  may differ for readability, but no driver should be omitted from the
  accessibility fan-in unless the team explicitly excludes it.

**`percy-finalize`**

- Intentionally narrower: only Percy-participating jobs. Do not mirror the full
  `all-jobs-passed` list here.

### Mapping file format

Each non-comment, non-blank line in `path-filter-mapping.conf` is:

```
<python-regex>  <pipeline-parameter>  <value>
```

- Regexes are anchored with `^` and `$` automatically.
- For every changed file, each rule whose regex matches sets
  `<pipeline-parameter>` to `<value>`. Later matches win over earlier ones.
- Parameters not set by any rule keep the default declared in
  `src/pipeline/@pipeline.yml` (all `run-*` default to `false`).
- A docs-only PR matches nothing, so all `run-*` parameters stay `false` and
  the only jobs that run are the always-run ones (lint, check-ts, health-check,
  lint-types, `all-jobs-passed`).

Changes to any of the "global trigger" paths in the mapping
(`.circleci/`, `yarn.lock`, `scripts/`, `tooling/`, shared packages, etc.) set
`run-all-jobs: true`, which forces every conditional job to run.

### Adding a new package or directory

When adding a new top-level directory or `packages/*` entry, add a rule to
`path-filter-mapping.conf` so changes to it trigger the right test jobs. A
directory with no mapping rule is silently treated as "no tests needed" —
catch this in review.

### Forcing a full CI run on a branch

Trigger the pipeline from the CircleCI "Trigger Pipeline" UI with
`run-all-jobs: true`. This routes the pipeline through
`setup-workflow-full`, which passes `run-all-jobs: true` to the continuation
and causes every conditional job's expression filter to evaluate true.
