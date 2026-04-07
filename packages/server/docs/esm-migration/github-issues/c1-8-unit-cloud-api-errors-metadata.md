# [ESM] @packages/server C1.8 — Cloud API errors + metadata specs (~2455 LOC)

**Stream:** A (tooling)  
**Chunk:** C1.8  
**LOC budget:** ~2455

## Summary

Topological-only tests/support files (excludes `test/unit/util/*` and C1.1 entry files).

## Files

- `packages/server/test/unit/cloud/api/studio/report_studio_error_spec.ts`
- `packages/server/test/unit/cloud/api/transform_error_spec.ts`
- `packages/server/test/unit/cloud/api/utils/fake_proxy_server.ts`
- `packages/server/test/unit/cloud/auth_spec.js`
- `packages/server/test/unit/cloud/cy-prompt/CyPromptManager_spec.ts`
- `packages/server/test/unit/cloud/encryption_spec.js`
- `packages/server/test/unit/cloud/environment_spec.ts`
- `packages/server/test/unit/cloud/exceptions_spec.js`
- `packages/server/test/unit/cloud/extract_atomic_spec.ts`
- `packages/server/test/unit/cloud/get_cloud_metadata_spec.ts`
- `packages/server/test/unit/cloud/network/fetch_spec.ts`

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

