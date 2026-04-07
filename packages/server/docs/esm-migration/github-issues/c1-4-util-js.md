# [ESM] @packages/server C1.4 — All `lib/util/*.js` (~2420 LOC)

**Stream:** A (tooling)  
**Chunk:** C1.4  
**LOC budget:** ~2420

## Summary

Convert utility `.js` files under `lib/util/` to the agreed ESM pattern in one bounded chunk.

## Parallelism / ordering

Parallel with C1.* ; single directory — one assignee recommended to reduce conflicts.

## Depends on

None.

## Acceptance criteria

- All `packages/server/lib/util/*.js` migrated per team convention.
- `wc -l` on touched files stays within ~2500 LOC budget (re-split if needed).

## References

- Parent plan: `server_esm_three_streams_df4e7bba.plan.md (Cursor plans, or link to PR tracking doc)` (local Cursor plan; paste link if published)
- Dependency graph: [server-graph-toposorted.json](../../../../../server-graph-toposorted.json) (repo root)
- Package: `@packages/server` — [AGENTS.md](../../../AGENTS.md)

## Global rules (from plan)

- Do **not** set `"type": "module"` in [package.json](../../../package.json) until the **merge-gate** issue is executed (after Streams B–D **in-place** migration chunks are done; **SCCs may remain**).
- Re-measure `wc -l` if files change before starting; each chunk targets **≤ 2500 LOC** unless explicitly noted.

