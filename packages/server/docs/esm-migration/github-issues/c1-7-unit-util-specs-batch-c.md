# [ESM] @packages/server C1.7 — `test/unit/util` specs batch C (~1141 LOC)

**Stream:** A (tooling)  
**Chunk:** C1.7  
**LOC budget:** ~1141

## Summary

Topological-only util specs batch C.

## Files

- `packages/server/test/unit/util/obj_utils_spec.ts`
- `packages/server/test/unit/util/process_profiler_spec.ts`
- `packages/server/test/unit/util/profile_cleaner_spec.js`
- `packages/server/test/unit/util/random_spec.ts`
- `packages/server/test/unit/util/settings_spec.js`
- `packages/server/test/unit/util/socket_allowed_spec.ts`
- `packages/server/test/unit/util/stream_buffer_spec.js`
- `packages/server/test/unit/util/suppress_warnings_spec.ts`
- `packages/server/test/unit/util/terminal_spec.ts`
- `packages/server/test/unit/util/trash_spec.ts`
- `packages/server/test/unit/util/tty_spec.ts`

## Parallelism / ordering

Parallel with C1.5, C1.6, C1.8 batches.

## Depends on

None.

## Acceptance criteria

- All listed specs pass.

## References

- Parent plan: `server_esm_three_streams_df4e7bba.plan.md (Cursor plans, or link to PR tracking doc)` (local Cursor plan; paste link if published)
- Dependency graph: [server-graph-toposorted.json](../../../../../server-graph-toposorted.json) (repo root)
- Package: `@packages/server` — [AGENTS.md](../../../AGENTS.md)

## Global rules (from plan)

- Do **not** set `"type": "module"` in [package.json](../../../package.json) until the **merge-gate** issue is executed (after Streams B–D **in-place** migration chunks are done; **SCCs may remain**).
- Re-measure `wc -l` if files change before starting; each chunk targets **≤ 2500 LOC** unless explicitly noted.

