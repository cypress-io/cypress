# [ESM] @packages/server C1.5 — `test/unit/util` specs batch A (~1337 LOC)

**Stream:** A (tooling)  
**Chunk:** C1.5  
**LOC budget:** ~1337

## Summary

Topological-only util specs (not in `blockedByCycles`).

## Files

- `packages/server/test/unit/util/app_data_spec.js`
- `packages/server/test/unit/util/args_spec.js`
- `packages/server/test/unit/util/async_retry_spec.ts`
- `packages/server/test/unit/util/cache_buster_spec.js`
- `packages/server/test/unit/util/chrome_policy_check.js`
- `packages/server/test/unit/util/chromium_flags_spec.js`

## Parallelism / ordering

Parallel with C1.6, C1.7, other C1.8 batches.

## Depends on

None.

## Acceptance criteria

- Listed specs run under the post–C1.1 runner assumptions.
- Imports updated for ESM if parent package rules require extensions or default exports.

## References

- Parent plan: `server_esm_three_streams_df4e7bba.plan.md (Cursor plans, or link to PR tracking doc)` (local Cursor plan; paste link if published)
- Dependency graph: [server-graph-toposorted.json](../../../../../server-graph-toposorted.json) (repo root)
- Package: `@packages/server` — [AGENTS.md](../../../AGENTS.md)

## Global rules (from plan)

- Do **not** set `"type": "module"` in [package.json](../../../package.json) until the **merge-gate** issue is executed (after Streams B–D **in-place** migration chunks are done; **SCCs may remain**).
- Re-measure `wc -l` if files change before starting; each chunk targets **≤ 2500 LOC** unless explicitly noted.

