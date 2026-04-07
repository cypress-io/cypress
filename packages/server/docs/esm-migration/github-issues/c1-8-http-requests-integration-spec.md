# [ESM] @packages/server C1.8 — `http_requests_spec.js` only (~4922 LOC, exceeds budget)

**Stream:** A (tooling)  
**Chunk:** C1.8  
**LOC budget:** ~4922

## Summary

Topological-only tests/support files (excludes `test/unit/util/*` and C1.1 entry files).

**Note:** This file alone exceeds the 2500 LOC chunk budget. Either split the spec file into smaller modules + re-export, or treat this issue as a dedicated exception with staff-engineer sign-off.

## Files

- `packages/server/test/integration/http_requests_spec.js`

## Parallelism / ordering

Parallel with other C1.8 batches and C1.1–C1.7.

## Depends on

C1.1 if runner or spec_helper behavior is required.

## Acceptance criteria

- All listed tests pass under the updated runner.
- Document approach for oversized spec (split vs exception) in PR.

## References

- Parent plan: `server_esm_three_streams_df4e7bba.plan.md (Cursor plans, or link to PR tracking doc)` (local Cursor plan; paste link if published)
- Dependency graph: [server-graph-toposorted.json](../../../../../server-graph-toposorted.json) (repo root)
- Package: `@packages/server` — [AGENTS.md](../../../AGENTS.md)

## Global rules (from plan)

- Do **not** set `"type": "module"` in [package.json](../../../package.json) until the **merge-gate** issue is executed (after Streams B–D **in-place** migration chunks are done; **SCCs may remain**).
- Re-measure `wc -l` if files change before starting; each chunk targets **≤ 2500 LOC** unless explicitly noted.

