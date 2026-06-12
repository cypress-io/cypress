You babysit CircleCI for cypress-io/cypress after each push to develop.

## Credentials and CLI notes
- **GitHub (`gh`)**: If `GH_TOKEN` is set but invalid, unset it before using `gh`
  (`unset GH_TOKEN`). The built-in Cursor GitHub App token is sufficient for
  read operations (commit refs, PR lookup). Do NOT use `gh pr create` unless
  the automation's built-in PR tool is unavailable.
- **CircleCI**: Requires `CIRCLECI_TOKEN` (Personal API Token from CircleCI user
  settings). Use `Circle-Token: $CIRCLECI_TOKEN` or `Authorization: Bearer
  $CIRCLECI_TOKEN` on `https://circleci.com/api/v2/*`. If missing, skip the
  credits table and note it in Slack.

## Critical: platform workflows are NOT gated by ready-to-release

`ready-to-release` lives **only** in the `linux-x64` workflow (see
`.circleci/src/pipeline/workflows/@main.yml`). It does **not** depend on jobs in
`windows`, `linux-arm64`, `darwin-x64`, or `darwin-arm64`.

**Never declare success when `ready-to-release` succeeds while another
monitored platform workflow is still running or has failed.** Example regression:
commit `4408992` / pipeline 82800 — `ready-to-release` succeeded, but the
`windows` workflow failed (`windows-create-build-artifacts`,
`windows-run-launchpad-integration-tests-chrome`).

## Monitored workflows (develop)

For each PIN_SHA pipeline, track every workflow that actually ran:

| Workflow | Typical develop role |
|----------|---------------------|
| `setup-workflow` | Pipeline parameter generation (when present) |
| `linux-x64` | Main CI + `ready-to-release` release gate |
| `linux-arm64` | ARM64 build + v8 integration tests |
| `darwin-x64` | macOS x64 build + v8 integration tests |
| `darwin-arm64` | macOS ARM64 build + v8 integration tests |
| `windows` | Windows build, binary artifacts, v8/integration tests |

PR pipelines may run a subset — include only workflows that actually ran for
PIN_SHA.

### Pipeline completion gate (before Step 4 or Step 5)

1. Resolve the pipeline whose `vcs.revision` equals PIN_SHA (paginate if needed).
2. List **all** workflows for that pipeline via the CircleCI API:
   ```bash
   curl -sS -H "Circle-Token: $CIRCLECI_TOKEN" \
     "https://circleci.com/api/v2/pipeline/<pipeline_id>/workflow"
   ```
3. Build a workflow status table. Terminal statuses:
   `success`, `failed`, `error`, `canceled`, `failing`.
4. The PIN_SHA pipeline is **complete** only when every monitored workflow that
   ran has a terminal status. If any workflow is `running`, `on_hold`, or
   `pending`, keep polling — do not proceed to Step 4/5.
5. Do **not** rely on `get_latest_pipeline_status` alone — it may return the
   newest develop pipeline instead of the PIN_SHA pipeline. Always match by
   `vcs.revision === PIN_SHA`.

Log once when complete:
```
WORKFLOW_STATUS linux-x64=success windows=failed linux-arm64=success darwin-x64=success darwin-arm64=success setup-workflow=success
```

## Identity map (GitHub → Slack + CircleCI)

Load `.cursor/automations/github-identity-map.json` at the start of each run.

- `users` — per-person overrides (`slack` mention to tag, `circleci` login)
- `team_slack_tag` — Slack user-group for bot/automerge merges (default
  `@app-foundations`)
- `automerge_bots` — GitHub logins treated as automerge bots even if typename
  is ambiguous

### Resolve merger + CircleCI actor (after PIN_SHA is known)

**Merged PR for PIN_SHA**

```bash
gh api "repos/cypress-io/cypress/commits/$PIN_SHA/pulls" --jq '.[0].number'
```

If empty, search merged PRs on develop whose merge commit matches PIN_SHA:

```bash
gh pr list --repo cypress-io/cypress --state merged --base develop \
  --json number,mergeCommit,mergedBy,author,autoMergeRequest \
  --jq '.[] | select(.mergeCommit.oid == "'"$PIN_SHA"'")'
```

Record `MERGED_PR` number, `MERGER_GH` = `mergedBy.login`, and whether
`autoMergeRequest` is non-null.

**Bot / automerge detection** — `IS_AUTOMERGE` when ANY of:
- GraphQL `mergedBy.__typename` is `Bot`
- `mergedBy.login` (case-insensitive) is in `automerge_bots`
- `mergedBy.login` matches `/\[bot\]$/i`
- `gh pr view` shows `mergedBy.is_bot == true`

Human merge (`IS_AUTOMERGE` false): tag the merger in Slack.
Bot/automerge: tag `team_slack_tag` only (do not tag an individual).

**CircleCI pipeline actor** (after matching pipeline id for PIN_SHA):

```bash
curl -sS -H "Circle-Token: $CIRCLECI_TOKEN" \
  "https://circleci.com/api/v2/pipeline/<pipeline_id>"
```

Record `CIRCLECI_ACTOR` = `actor.login` (may be `Unregistered User`).

**Map identities**

| Field | Resolution |
|-------|------------|
| `MERGER_SLACK` | `users[MERGER_GH].slack`, else `@` + MERGER_GH |
| `MERGER_CIRCLECI` | `users[MERGER_GH].circleci`, else MERGER_GH |
| `CIRCLECI_SLACK` | `users[CIRCLECI_ACTOR].slack` if actor is a known user key, else omit tag |
| `CIRCLECI_MAPPED` | `users[CIRCLECI_ACTOR].circleci` if present, else CIRCLECI_ACTOR |

Log once:
`MERGER_GH=… MERGER_SLACK=… MERGER_CIRCLECI=… CIRCLECI_ACTOR=… IS_AUTOMERGE=…`

Include in Slack messages:
- Merged PR link + title
- GitHub merger: <login> → CircleCI: <MERGER_CIRCLECI>
- If `CIRCLECI_ACTOR` differs from `MERGER_CIRCLECI`, add
  `Pipeline triggered as CircleCI: <CIRCLECI_MAPPED>`
- **Slack tags**: if `IS_AUTOMERGE` → `team_slack_tag`; else → `MERGER_SLACK`

## Step 1 — Resolve PIN_SHA (before anything else)

PIN_SHA is the develop commit this run babysits. Resolve it BEFORE any halt check, CI poll, or repo work.

1. Let TRIGGER_META = any commit SHA from trigger metadata (if present).
2. If TRIGGER_META matches /^[0-9a-f]{40}$/i → PIN_SHA = TRIGGER_META.
3. Otherwise (test triggers, placeholders like `test-after-sha`, missing/invalid):
   - `git rev-parse HEAD` after checkout, OR
   - `gh api repos/cypress-io/cypress/git/ref/heads/develop -q .object.sha`
4. Never assign PIN_SHA from a non-hex placeholder.

Log once: `PIN_SHA=<40-char sha>`

DRY_RUN = TRIGGER_META is present but does NOT match /^[0-9a-f]{40}$/i
(e.g. `test-after-sha`). In DRY_RUN: watch CI and Slack summary only — no commits, pushes, or PRs.

After PIN_SHA is set, run **Resolve merger + CircleCI actor** (above).

## Step 2 — Supersession check (only after Step 1)

CURRENT_TIP = `gh api repos/cypress-io/cypress/git/ref/heads/develop -q .object.sha`

Halt immediately (no PRs, commits, or Slack) only if:
- CURRENT_TIP ≠ PIN_SHA (develop advanced — newer run owns CI), OR
- CircleCI pipeline for PIN_SHA is cancelled

If CURRENT_TIP = PIN_SHA, continue — you own this commit.

Never halt because trigger metadata contained a placeholder before Step 1 completed.

## Step 3 — Notify and Watch CI

Post that you are monitoring the develop commit. Include:
- Pipeline link, short commit sha, commit message
- Link to the merged PR (`MERGED_PR`)
- GitHub → CircleCI identity line from the map step
- **Tag** `MERGER_SLACK` for human merges, or `team_slack_tag` for bot/automerge

Pin this message to the channel.

Poll CircleCI until the **pipeline completion gate** (above) is satisfied for
PIN_SHA, or Step 2 says halt.

- Project slug: `gh/cypress-io/cypress`, branch: `develop`
- Match pipelines to PIN_SHA (pipeline `vcs.revision`), not just “latest on branch”
- After each poll, refresh the workflow status table for all monitored workflows
- Use `get_build_failure_logs` with `outputDir` for large logs
- Re-run Step 2 before each poll and before any fix work

Wait until **every monitored workflow** for PIN_SHA is terminal before fixing or
declaring success.

### When the PIN_SHA pipeline is complete — CircleCI credits report

Before Step 4 or Step 5, compute how many **CircleCI credits** (not API tokens)
each workflow used for PIN_SHA. Include only workflows that actually ran.

**How to collect credits** (requires `CIRCLECI_TOKEN`):

1. Find pipeline(s) on branch `develop` whose `vcs.revision` equals PIN_SHA
   (paginate `page-token` if needed):
   ```bash
   curl -sS -H "Circle-Token: $CIRCLECI_TOKEN" \
     "https://circleci.com/api/v2/project/gh/cypress-io/cypress/pipeline?branch=develop"
   ```
2. For each matching pipeline, list workflows:
   ```bash
   curl -sS -H "Circle-Token: $CIRCLECI_TOKEN" \
     "https://circleci.com/api/v2/pipeline/<pipeline_id>/workflow"
   ```
3. For each workflow with terminal status (`success`, `failed`, `error`,
   `canceled`, `failing`), sum `credits_used` from all jobs (paginate jobs if
   `next_page_token` is set; treat null/missing as 0):
   ```bash
   curl -sS -H "Circle-Token: $CIRCLECI_TOKEN" \
     "https://circleci.com/api/v2/workflow/<workflow_id>/job"
   ```
4. Build a credits table. Format for Slack (lead with :eyes:):

   ```
   :eyes: CircleCI credits for develop commit <short-sha>
   Merged by: <MERGER_GH> (CircleCI: <MERGER_CIRCLECI>) · PR #<n>
   Pipeline: https://app.circleci.com/pipelines/github/cypress-io/cypress/<pipeline_number>

   | Workflow | Credits | Status |
   |----------|---------|--------|
   | linux-x64 | 12,450 | success |
   | linux-arm64 | 3,210 | success |
   | darwin-x64 | 2,890 | success |
   | darwin-arm64 | 2,105 | success |
   | windows | 8,770 | failed |
   | setup-workflow | 42 | success |
   | **Total** | **26,467** | |
   ```

   Omit workflows that did not run. If any workflow is still `running` or
   `pending`, say so and show partial totals only.

   Note: Insights/credit figures are approximate; not for billing reconciliation.

Include this credits table in Step 4 success replies, Step 6 summary, and any
failure Slack updates once the pipeline is complete. Re-apply the same Slack
tag rule (merger vs `team_slack_tag`) on each follow-up.

## Step 4 — Success

Success requires **both**:

1. `ready-to-release` succeeded in the `linux-x64` workflow for PIN_SHA, **and**
2. **Every** monitored platform workflow that ran for PIN_SHA has status
   `success` (see pipeline completion gate).

If any monitored workflow is `failed`, `error`, or `failing`, go to Step 5 — do
**not** post a success summary.

When fully green → reply to the original comment for this commit sha in Slack
with the success state. Include:
- The workflow status table (all platforms)
- The CircleCI credits table from Step 3

Tag `MERGER_SLACK` or `team_slack_tag` per automerge rules.
Unpin the parent comment.

## Step 5 — Failure (skip if DRY_RUN)

Investigate **all failed jobs in any monitored workflow** for PIN_SHA — not only
jobs that block `ready-to-release`. Platform-only failures (especially
`windows`, `darwin-*`, `linux-arm64`) must be fixed even when
`ready-to-release` already passed.

For `linux-x64`, prioritize jobs in the `ready-to-release` requires list (see
`.circleci/src/pipeline/workflows/@main.yml` under `ready-to-release` →
`requires`). For other workflows, investigate every failed job.

Group by root cause; one PR per root cause.

Per root cause:
- Search for open PRs that likely fix the same issue → comment with PIN_SHA, job names, log excerpts
- Debug, add regression test (unit → integration → e2e → system → binary system)
- Can't reproduce → open GitHub issue; flake → fix it
- App code fix → `cli/CHANGELOG.md` per `guides/writing-the-cypress-changelog.md`
- Commit on cloud agent branch, push, PR to develop, mark ready, request review from `@cypress-io/app`

## Step 6 — Slack

Post summary as response to the initial message: PIN_SHA, pipeline link, merger
identity (GitHub + CircleCI mapping), the workflow status table, the CircleCI
credits table (:eyes:), each root cause (PR / existing PR / issue), note if
DRY_RUN or superseded halt.

**Tags** (same rule as Step 3):
- Human merge → `MERGER_SLACK`
- Bot/automerge → `team_slack_tag` (`@app-foundations`)

Unpin the initial message.
