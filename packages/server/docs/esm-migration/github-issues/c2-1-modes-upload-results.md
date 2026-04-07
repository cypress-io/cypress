# [ESM] @packages/server C2.1 — Modes SCC: upload + pass + results + print protocol error (~624 LOC)

**Stream:** B (modes SCC)  
**Chunk:** C2.1  
**LOC budget:** ~624

## Summary

Migrate modes/upload SCC **in place** (no graph refactor to remove cycles); convert `require` → `import`/`export` and use dynamic `import()` only if static ESM fails.

## Files

- `packages/server/lib/cloud/artifacts/upload_artifacts.ts`
- `packages/server/lib/modes/pass-with-no-tests.ts`
- `packages/server/lib/modes/results.ts`
- `packages/server/lib/cloud/artifacts/print_protocol_upload_error.ts`

## Parallelism / ordering

**Recommended before C2.2–C2.4** to reduce merge conflicts; not required to remove the SCC.

## Depends on

None.

## Acceptance criteria

- ESM syntax + runtime-safe pattern; **no refactor** whose goal is breaking the modes SCC.
- Targeted tests pass.

## References

- Parent plan: `server_esm_three_streams_df4e7bba.plan.md (Cursor plans, or link to PR tracking doc)` (local Cursor plan; paste link if published)
- Dependency graph: [server-graph-toposorted.json](../../../../../server-graph-toposorted.json) (repo root)
- Package: `@packages/server` — [AGENTS.md](../../../AGENTS.md)

## Global rules (from plan)

- Do **not** set `"type": "module"` in [package.json](../../../package.json) until the **merge-gate** issue is executed (after Streams B–D **in-place** migration chunks are done; **SCCs may remain**).
- Re-measure `wc -l` if files change before starting; each chunk targets **≤ 2500 LOC** unless explicitly noted.

