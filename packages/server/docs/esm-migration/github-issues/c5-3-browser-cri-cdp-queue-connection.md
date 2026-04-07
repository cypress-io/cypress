# [ESM] @packages/server C5.3 — Blocked tests: browser-cri + browsers + CDP queue/connection (~1925 LOC)

**Stream:** E (blocked tests)  
**Chunk:** C5.x  
**LOC budget:** ~1925

## Summary

Specs from `blockedByCycles` in server-graph-toposorted.json; land after corresponding lib work (C3/C4).

## Files

- `packages/server/test/unit/browsers/browser-cri-client_spec.ts`
- `packages/server/test/unit/browsers/browsers_spec.ts`
- `packages/server/test/unit/browsers/cdp-command-queue_spec.ts`
- `packages/server/test/unit/browsers/cdp-connection_spec.ts`

## Parallelism / ordering

Parallel C5 batches once imports exist; align with C4 browser and C3 cloud PRs.

## Depends on

Matching production modules migrated (C3/C4).

## Acceptance criteria

- All listed specs pass.

## References

- Parent plan: `server_esm_three_streams_df4e7bba.plan.md (Cursor plans, or link to PR tracking doc)` (local Cursor plan; paste link if published)
- Dependency graph: [server-graph-toposorted.json](../../../../../server-graph-toposorted.json) (repo root)
- Package: `@packages/server` — [AGENTS.md](../../../AGENTS.md)

## Global rules (from plan)

- Do **not** set `"type": "module"` in [package.json](../../../package.json) until the **merge-gate** issue is executed (after Streams B–D **in-place** migration chunks are done; **SCCs may remain**).
- Re-measure `wc -l` if files change before starting; each chunk targets **≤ 2500 LOC** unless explicitly noted.

