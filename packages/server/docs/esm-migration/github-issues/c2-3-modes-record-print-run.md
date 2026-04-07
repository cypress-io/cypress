# [ESM] @packages/server C2.3 — Modes SCC: `record.ts` + `print-run.ts` (~1582 LOC)

**Stream:** B (modes SCC)  
**Chunk:** C2.3  
**LOC budget:** ~1582

## Summary

Pair that shares print/run orchestration; migrate **in place** (SCC may remain).

## Files

- `packages/server/lib/modes/record.ts`
- `packages/server/lib/util/print-run.ts`

## Parallelism / ordering

Prefer after C2.2 or coordinated single PR; not a cycle-removal gate.

## Depends on

None (C2.2 optional ordering only).

## Acceptance criteria

- Files migrated in place; static or dynamic imports as needed for correctness.
- Relevant tests pass; **SCC count may stay nonzero** in `server-graph`.

## References

- Parent plan: `server_esm_three_streams_df4e7bba.plan.md (Cursor plans, or link to PR tracking doc)` (local Cursor plan; paste link if published)
- Dependency graph: [server-graph-toposorted.json](../../../../../server-graph-toposorted.json) (repo root)
- Package: `@packages/server` — [AGENTS.md](../../../AGENTS.md)

## Global rules (from plan)

- Do **not** set `"type": "module"` in [package.json](../../../package.json) until the **merge-gate** issue is executed (after Streams B–D **in-place** migration chunks are done; **SCCs may remain**).
- Re-measure `wc -l` if files change before starting; each chunk targets **≤ 2500 LOC** unless explicitly noted.

