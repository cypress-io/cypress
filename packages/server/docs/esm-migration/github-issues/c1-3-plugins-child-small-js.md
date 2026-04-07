# [ESM] @packages/server C1.3 — Plugin child processes + small `lib` JS (~1109 LOC)

**Stream:** A (tooling)  
**Chunk:** C1.3  
**LOC budget:** ~1109

## Summary

Child-process and privileged-channel code: document and implement ESM/CJS boundary (e.g. `.cjs`, `createRequire`, or spawn flags).

## Files

- `packages/server/lib/task.js`
- `packages/server/lib/template_engine.js`
- `packages/server/lib/privileged-commands/*.js`
- `packages/server/lib/plugins/child/*.js`

## Parallelism / ordering

Parallel with C1.*; coordinate if changing how children are spawned from `index.js`.

## Depends on

Prefer C1.1 merged if spawn / entry behavior changes.

## Acceptance criteria

- Explicit strategy for plugin child ESM vs CJS documented in PR description.
- Plugin child tests under `test/unit/plugins/child/` still pass.

## References

- Parent plan: `server_esm_three_streams_df4e7bba.plan.md (Cursor plans, or link to PR tracking doc)` (local Cursor plan; paste link if published)
- Dependency graph: [server-graph-toposorted.json](../../../../../server-graph-toposorted.json) (repo root)
- Package: `@packages/server` — [AGENTS.md](../../../AGENTS.md)

## Global rules (from plan)

- Do **not** set `"type": "module"` in [package.json](../../../package.json) until the **merge-gate** issue is executed (after Streams B–D **in-place** migration chunks are done; **SCCs may remain**).
- Re-measure `wc -l` if files change before starting; each chunk targets **≤ 2500 LOC** unless explicitly noted.

