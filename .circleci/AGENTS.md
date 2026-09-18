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

This gate turns on the main/multi-platform workflow graph, including `windows-v8-integration-tests` and `v8-integration-tests` on Linux/macOS. The existing `update-v8-snapshot-cache-on-develop` entry is reserved for automated v8 snapshot cache PRs.

This gate does not turn on `windows`, `linux-arm64`, `darwin-x64`, or `darwin-arm64` for plain `develop` or `release/*` pushes. On those two, all four run from a scheduled pipeline instead — see "Scheduled platform CI" below. Any other branch you add here turns all five on per-push.

**Optional — only if you need more than main workflows + path-filtered jobs:**

| Location | When you also need it |
|----------|------------------------|
| `pull-request.yml` exclusion list | Avoid the PR workflow running in parallel with the main workflows on the same branch |
| `notify-binary-failure`'s `filters:` in `@main.yml` | Testing binary failure alerting on a branch — it is pinned to `develop`, so it never fires elsewhere |
| `generate-pipeline-parameters.sh` branch override | Force every path-filtered job to run even when changed files would not normally select them (or trigger manually with `run-all-jobs=true`) |
| `&mainBuildFilters` in `@main.yml` | Binary/kitchensink/staging jobs in `linux-x64` that have an extra branch filter beyond the workflow `when:` |

For typical v8 snapshot cache work, changes under `tooling/*` already enable `run-v8-tests` via path filtering, so **`&full-workflow-filters` alone is usually enough**.

After editing `.circleci/src/`, run `yarn pack-ci --validate` before committing.

### Per-workflow gates

- **`linux-x64`**: most develop CI (build, system tests, `v8-integration-tests`, packaging, the full binary build-and-verify chain, etc.) — subject to path filtering unless overridden
- **`windows`**: Windows build, binary artifacts, v8 integration tests, and selected integration/unit jobs
- **`linux-arm64` / `darwin-*`**: platform builds, packaging, and v8 integration tests where supported

`linux-x64` runs on any `&full-workflow-filters` branch directly. The other four need more than that. On `develop` and `release/*` they run only from a scheduled pipeline. On `electron/*`, `update-v8-snapshot-cache-on-develop`, or an allowlisted branch, `&full-workflow-filters` alone is enough.

`npm-release` still runs only on `develop`, not on allowlisted feature branches.

### Scheduled platform CI (develop and release/*)

None of the four runs on every `develop` or `release/*` push. Windows moved for credit cost. The two `darwin-*` workflows moved to free leased self-hosted macOS hardware. `linux-arm64` costs almost nothing and moved for consistency, so all platform coverage lands in one sweep. Per-merge platform signal was not actionable anyway — `develop` passed 47 of 213 runs. A release branch is long-lived enough for a scheduled sweep to cover it the same way.

**What exists today**: a CircleCI Scheduled Pipeline named "Windows Develop Branch Schedule" (id `40ddfea0-34c3-47ab-8557-6bdb150b4d8d`) runs on `develop` at 17:00 and 23:00 UTC and sets `run-windows-workflow=true`. `run-windows-workflow` no longer exists as a pipeline parameter — `windows`, `linux-arm64`, `darwin-x64`, and `darwin-arm64` all read `run-platform-workflows` now. Until the schedule is repointed at that parameter, every scheduled fire submits an unrecognized parameter and CircleCI rejects the pipeline at creation — loud, not silent, but `linux-arm64`, `darwin-x64`, and `darwin-arm64` still get zero `develop` coverage in the meantime, same as `windows`. There is no release-branch schedule yet at all: `release/*` pushes get zero platform coverage of any kind until one exists.

**What must exist**, to match the gates in `@main.yml`:

- **Develop schedule** — repoint the existing schedule (id `40ddfea0-34c3-47ab-8557-6bdb150b4d8d`):
  - **Branch**: `develop`
  - **Parameters to set**: `run-platform-workflows=true` only
  - **Timetable**: 1×/weekday, Mon–Fri, at 23:00 UTC (drop the 17:00 slot, keep 23:00)
- **Release schedule** — a second Scheduled Pipeline, targeting whichever `release/*` branch is currently active, setting `run-platform-workflows=true`. Repointing its branch to the new release branch is part of cutting a release; disabling it is part of shipping one. There is no default branch this can target permanently, since release branches are cut and retired.
- **Owner** (both schedules): App Foundations team

Both are CircleCI project settings, not code — neither is visible anywhere in `.circleci/src`. Changing either requires CircleCI project-settings access (Project Settings → Triggers → Scheduled Pipelines), via the UI or `PATCH /api/v2/schedule/{id}`.

For an on-demand run of all four platform workflows outside either schedule (e.g. to validate a change before it reaches `develop`, or to recover a missed/failed release-branch build), use Trigger Pipeline with `run-platform-workflows=true`, or `force-persist-artifacts=true` — the latter works regardless of branch and needs only one flag. See the comment above the `linux-arm64` workflow in `@main.yml`.
