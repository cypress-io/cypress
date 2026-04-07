# [ESM] @packages/server C1.6 — `test/unit/util` specs batch B (~2491 LOC)

**Stream:** A (tooling)  
**Chunk:** C1.6  
**LOC budget:** ~2491

## Summary

Topological-only util specs batch B.

## Files

- `packages/server/test/unit/util/ci_provider_spec.js`
- `packages/server/test/unit/util/commit-info_spec.ts`
- `packages/server/test/unit/util/duration_spec.js`
- `packages/server/test/unit/util/editors_spec.ts`
- `packages/server/test/unit/util/electron-app_spec.js`
- `packages/server/test/unit/util/ensure_url_spec.ts`
- `packages/server/test/unit/util/file_spec.ts`
- `packages/server/test/unit/util/find_process_spec.ts`
- `packages/server/test/unit/util/human_time_spec.js`
- `packages/server/test/unit/util/newlines_spec.ts`

## Parallelism / ordering

Parallel with C1.5, C1.7, C1.8 batches.

## Depends on

None.

## Acceptance criteria

- All listed specs pass.
- If `wc -l` exceeds 2500 after upstream edits, split follow-up issue.

## References

- Parent plan: `server_esm_three_streams_df4e7bba.plan.md (Cursor plans, or link to PR tracking doc)` (local Cursor plan; paste link if published)
- Dependency graph: [server-graph-toposorted.json](../../../../../server-graph-toposorted.json) (repo root)
- Package: `@packages/server` — [AGENTS.md](../../../AGENTS.md)

## Global rules (from plan)

- Do **not** set `"type": "module"` in [package.json](../../../package.json) until the **merge-gate** issue is executed (after Streams B–D **in-place** migration chunks are done; **SCCs may remain**).
- Re-measure `wc -l` if files change before starting; each chunk targets **≤ 2500 LOC** unless explicitly noted.

