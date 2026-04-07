# [ESM] @packages/server C2.2 — Modes SCC: `run.ts` (~1242 LOC)

**Stream:** B (modes SCC)  
**Chunk:** C2.2  
**LOC budget:** ~1242

## Summary

Large orchestration file in the small SCC; migrate **in place**.

## Files

- `packages/server/lib/modes/run.ts`

## Parallelism / ordering

Prefer after C2.1 or same PR to limit conflicts; parallel OK if ownership is clear.

## Depends on

None (C2.1 optional ordering only).

## Acceptance criteria

- `modes/run` uses ESM-consistent imports; document dynamic `import()` if required for initialization order.
- Run-mode tests still pass.

## References

- Parent plan: `server_esm_three_streams_df4e7bba.plan.md (Cursor plans, or link to PR tracking doc)` (local Cursor plan; paste link if published)
- Dependency graph: [server-graph-toposorted.json](../../../../../server-graph-toposorted.json) (repo root)
- Package: `@packages/server` — [AGENTS.md](../../../AGENTS.md)

## Global rules (from plan)

- Do **not** set `"type": "module"` in [package.json](../../../package.json) until the **merge-gate** issue is executed (after Streams B–D **in-place** migration chunks are done; **SCCs may remain**).
- Re-measure `wc -l` if files change before starting; each chunk targets **≤ 2500 LOC** unless explicitly noted.

