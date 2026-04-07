# [ESM] @packages/server C1.8 — Electron + memory browser specs (~1786 LOC)

**Stream:** A (tooling)  
**Chunk:** C1.8  
**LOC budget:** ~1786

## Summary

Topological-only tests/support files (excludes `test/unit/util/*` and C1.1 entry files).

## Files

- `packages/server/test/unit/browsers/electron_spec.js`
- `packages/server/test/unit/browsers/memory/cgroup-v1_spec.ts`
- `packages/server/test/unit/browsers/memory/default_spec.ts`
- `packages/server/test/unit/browsers/privileged-channel_spec.js`
- `packages/server/test/unit/cache_spec.ts`
- `packages/server/test/unit/capture_spec.ts`

## Parallelism / ordering

Parallel with other C1.8 batches and C1.1–C1.7.

## Depends on

C1.1 if runner or spec_helper behavior is required.

## Acceptance criteria

- All listed tests pass under the updated runner.

## References

- Parent plan: `server_esm_three_streams_df4e7bba.plan.md (Cursor plans, or link to PR tracking doc)` (local Cursor plan; paste link if published)
- Dependency graph: [server-graph-toposorted.json](../../../../../server-graph-toposorted.json) (repo root)
- Package: `@packages/server` — [AGENTS.md](../../../AGENTS.md)

## Global rules (from plan)

- Do **not** set `"type": "module"` in [package.json](../../../package.json) until the **merge-gate** issue is executed (after Streams B–D **in-place** migration chunks are done; **SCCs may remain**).
- Re-measure `wc -l` if files change before starting; each chunk targets **≤ 2500 LOC** unless explicitly noted.

