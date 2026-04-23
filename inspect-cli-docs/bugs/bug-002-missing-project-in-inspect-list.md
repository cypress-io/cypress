# BUG-002 — Missing PROJECT in `inspect list`

**Status:** ✅ Closed (2026-04-22)
**Severity:** Medium (misleading output, also breaks `--instance <substring>` project-matching — the `withProject` filter in `instance-discovery.ts:269` drops instances whose `projectRoot` is null)
**Affects:** Phase 0+
**Reported:** 2026-04-22
**Resolved:** 2026-04-22

## Observed

With `yarn dev` running (Cypress `open --global`), after selecting a project from Launchpad and landing on the specs list:

```
$ CYPRESS_INTERNAL_ENV=development node cli/bin/cypress inspect list
┌───────┬───────┬─────────┬──────┬───────────────┐
│ PID   │ PORT  │ PROJECT │ MODE │ BROWSER       │
├───────┼───────┼─────────┼──────┼───────────────┤
│ 66961 │ 49860 │ —       │ e2e  │ chrome (open) │
└───────┴───────┴─────────┴──────┴───────────────┘
```

MODE and BROWSER update correctly; PROJECT stays `—`.

## Expected

Once the user is on the specs list (or anywhere past project selection), PROJECT should show the absolute path of the opened project — matching what `cypress inspect status` prints on the `Project:` line.

## Root cause

The per-instance descriptor file at `{runningDir()}/{pid}.json` is written **once**, at server boot, by `writeInstanceDescriptor` in `packages/data-context/src/actions/ServersActions.ts:66-115`. That function reads `this.ctx.coreData.currentProject` at that moment (line 71) and bakes it into the descriptor:

```ts
const projectRoot = this.ctx.coreData.currentProject
// ...
const descriptor = { ..., projectRoot: projectRoot ?? null, ... }
fs.writeFileSync(filePath, JSON.stringify(descriptor, null, 2), { mode: 0o600 })
```

In `--global` mode (the default for `yarn dev`), `currentProject` is `null` at boot. When the user later picks a project, `ProjectLifecycleManager.setCurrentProject` updates `coreData.currentProject` in memory (`packages/data-context/src/data/ProjectLifecycleManager.ts:428`), but **nothing rewrites the descriptor**. `cypress inspect list` reads straight from the descriptor (`cli/lib/util/instance-discovery.ts:137`), so it keeps surfacing the stale `null`.

`cypress inspect status` is partially protected because its `projectRoot` resolver reads `ctx.coreData.currentProject` live (`packages/data-context/graphql/schemaTypes/objectTypes/gql-InspectSnapshot.ts:85-88`) — but the user reported seeing `—` from `status` as well; needs reproduction to confirm whether that path has a separate gap or the observation was from `list`.

## Fix

Landed 2026-04-22:

- `coreData.servers.inspect` now also stores `startedAt` so it can be preserved across re-emits.
- `ServersActions.writeInstanceDescriptor` stays the initial-boot path (mints fresh `token` + `startedAt`). The file-writing logic is extracted into a private `_writeDescriptor(token, startedAt)` helper.
- New `ServersActions.refreshInstanceDescriptor` re-emits `{pid}.json` using the preserved `token`/`startedAt` from `coreData.servers.inspect`, with fresh `projectRoot`/`projectHash` read live. No-op when the initial descriptor has not been written yet — this safely ignores early-construction calls before the GraphQL server is listening.
- `ProjectLifecycleManager._setCurrentProject` calls `refreshInstanceDescriptor` after updating `coreData.currentProject` (covers the Launchpad → project-selected transition in `--global` mode).
- `ProjectActions.clearCurrentProject` calls `refreshInstanceDescriptor` after clearing `currentProject` (covers return-to-Launchpad so the descriptor reflects reality).
- Existing `cypress inspect list` / `--instance <substring>` project-matching now works for open-mode instances that started in `--global` without a project.
