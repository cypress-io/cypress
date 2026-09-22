# CircleCI Configuration

Agent guidance for `.circleci/` — source configs under `src/` are packed into `packed/` at CI runtime. See [README.md](./README.md) for local CLI setup and the pre-commit `yarn pack-ci --validate` workflow.

## Full CI branch allowlist

Most PR branches run the **pull-request workflow** with path-based job filtering (`generate-pipeline-parameters.sh`). A small set of branch names instead run the **main workflows** (`linux-x64`, `linux-arm64`, `darwin-x64`, `darwin-arm64`, `windows`).

### When to add a branch name

Add a branch when the change affects behavior that is only validated by main-branch CI — in particular:

- **Windows jobs** — the `windows` workflow (`windows-v8-integration-tests`, `windows-create-build-artifacts`, etc.)
- **V8 snapshot / packaging tooling** — `v8-integration-tests` on Linux, macOS, and Windows; snapshot cache updates in `tooling/v8-snapshot/cache/`
- **Full binary tests** — kitchensink, staging, and npm-module verification jobs (see optional gates below). These no longer run on pull requests at all, so an allowlisted branch is the only way to exercise them before merge.

If only unit/integration tests scoped to changed packages are sufficient, do **not** add the branch — use a normal PR branch instead.

### Where to add the branch name

**Required:** append a **new** `- equal:` entry to the `or:` block in `&full-workflow-filters` in `.circleci/src/pipeline/workflows/@main.yml` (the `when:` at the top of `linux-x64`, reused by `windows` and other platform workflows). Do **not** rename or remove existing entries (`develop`, `update-v8-snapshot-cache-on-develop`, the `release/*` / `electron/*` patterns, or `force-persist-artifacts`):

```yaml
    or:
      - equal: [ develop, << pipeline.git.branch >> ]
      # ... leave existing entries unchanged ...
      - equal: [ 'your-branch-name', << pipeline.git.branch >> ]  # add this line
```

Push your work to the branch name you add — do not repurpose an existing allowlisted branch (for example, do not change `update-v8-snapshot-cache-on-develop` to a different name).

This gate turns on the main/multi-platform workflow graph — including `windows-v8-integration-tests` and `v8-integration-tests` on Linux/macOS. The existing `update-v8-snapshot-cache-on-develop` entry is reserved for automated v8 snapshot cache PRs. Note: `windows` specifically excludes plain `develop`/`release/*` pushes from this gate (it runs on those on a CircleCI Scheduled Pipeline instead — see the comment above the `windows` workflow in `@main.yml`); any other branch added here still turns Windows on immediately as before.

**Optional — only if you need more than main workflows + path-filtered jobs:**

| Location | When you also need it |
|----------|------------------------|
| `pull-request.yml` exclusion list | Avoid the PR workflow running in parallel with the main workflows on the same branch |
| `notify-binary-failure`'s `filters:` in `@main.yml` | Testing binary failure alerting on a branch — it is pinned to `develop`, so it never fires elsewhere |
| `generate-pipeline-parameters.sh` branch override | Force every path-filtered job to run even when changed files would not normally select them (or trigger manually with `run-all-jobs=true`) |
| `&mainBuildFilters` in `@main.yml` | Binary/kitchensink/staging jobs in `linux-x64` that have an extra branch filter beyond the workflow `when:` |

For typical v8 snapshot cache work, changes under `tooling/*` already enable `run-v8-tests` via path filtering, so **`&full-workflow-filters` alone is usually enough**.

After editing `.circleci/src/`, run `yarn pack-ci --validate` before committing.

### What runs with only `&full-workflow-filters`

The `run-*` guards live in the shared job definitions in `@pipeline.yml` (via `halt-if-skipped`), not in the workflow files, so they apply to every workflow below — not just the PR one.

- **`linux-x64`**: `build`, lint, and type checks always run, as do the binary/packaging chain and release gating (`create-build-artifacts`, `test-binary-*`, `verify-release-readiness`, `ready-to-release`, `npm-release`). Per-package integration/unit jobs, system tests, and `v8-integration-tests` are guarded, so a webhook push to `develop` runs only the ones its changed paths select.
- **`windows`**: doesn't run on a plain `develop` or `release/*` push; it runs from a CircleCI Scheduled Pipeline instead (see the comment above the `windows` workflow in `@main.yml`). Its `v8-integration-tests`, `driver-integration-memory-tests`, and selected integration/unit jobs are guarded by `run-*` parameters, but a scheduled run gets all-true from `generate-pipeline-parameters.sh`'s trigger-source check, so nothing inside it is actually path-filtered once it runs.
- **`linux-arm64` / `darwin-*`**: run on every `&full-workflow-filters` push, with the same `run-*` parameters as `linux-x64`.

`npm-release` still runs only on `develop`, not on allowlisted feature branches.
