# [ESM] @packages/server C5.5 — Blocked tests: memory, protocol, cloud API, artifacts (~2492 LOC)

**Stream:** E (blocked tests)  
**Chunk:** C5.x  
**LOC budget:** ~2492

## Summary

Specs from `blockedByCycles` in server-graph-toposorted.json; land after corresponding lib work (C3/C4).

## Files

- `packages/server/test/unit/browsers/memory/memory_spec.ts`
- `packages/server/test/unit/browsers/protocol_spec.ts`
- `packages/server/test/unit/browsers/webkit_spec.ts`
- `packages/server/test/unit/cloud/api/cloud_request_encryption_spec.ts`
- `packages/server/test/unit/cloud/api/cloud_request_spec.ts`
- `packages/server/test/unit/cloud/api/create_instance_spec.ts`
- `packages/server/test/unit/cloud/api/cy-prompt/get_cy_prompt_bundle_spec.ts`
- `packages/server/test/unit/cloud/api/studio/get_studio_bundle_spec.ts`
- `packages/server/test/unit/cloud/artifacts/print_protocol_upload_error_spec.ts`

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

