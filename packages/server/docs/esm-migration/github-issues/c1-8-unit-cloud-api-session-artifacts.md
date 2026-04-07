# [ESM] @packages/server C1.8 — Cloud API session / artifact specs (~2398 LOC)

**Stream:** A (tooling)  
**Chunk:** C1.8  
**LOC budget:** ~2398

## Summary

Topological-only tests/support files (excludes `test/unit/util/*` and C1.1 entry files).

## Files

- `packages/server/test/unit/cloud/api/api_spec.js`
- `packages/server/test/unit/cloud/api/cy-prompt/post_cy_prompt_session_spec.ts`
- `packages/server/test/unit/cloud/api/cy-prompt/report_cy_prompt_error_spec.ts`
- `packages/server/test/unit/cloud/api/put_protocol_artifact_spec.ts`
- `packages/server/test/unit/cloud/api/studio/post_studio_session_spec.ts`

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

