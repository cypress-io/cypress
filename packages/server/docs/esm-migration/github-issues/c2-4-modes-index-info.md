# [ESM] @packages/server C2.4 — Modes barrel + `info` (blocked; ~183 LOC)

**Stream:** B (modes SCC)  
**Chunk:** C2.4  
**LOC budget:** ~183

## Summary

`blockedByCycles` modes entrypoints; migrate when other modes files use agreed ESM pattern (graph may stay cyclic).

## Files

- `packages/server/lib/modes/index.ts`
- `packages/server/lib/modes/info.ts`

## Parallelism / ordering

After C2.1–C2.3 recommended to avoid barrel churn.

## Depends on

None (optional ordering vs C2.1–C2.3).

## Acceptance criteria

- `modes/index` and `modes/info` use ESM consistent with package.
- No regression in `modes/info_spec` and related tests.

## References

- Parent plan: `server_esm_three_streams_df4e7bba.plan.md (Cursor plans, or link to PR tracking doc)` (local Cursor plan; paste link if published)
- Dependency graph: [server-graph-toposorted.json](../../../../../server-graph-toposorted.json) (repo root)
- Package: `@packages/server` — [AGENTS.md](../../../AGENTS.md)

## Global rules (from plan)

- Do **not** set `"type": "module"` in [package.json](../../../package.json) until the **merge-gate** issue is executed (after Streams B–D **in-place** migration chunks are done; **SCCs may remain**).
- Re-measure `wc -l` if files change before starting; each chunk targets **≤ 2500 LOC** unless explicitly noted.

