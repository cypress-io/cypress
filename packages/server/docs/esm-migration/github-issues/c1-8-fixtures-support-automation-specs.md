# [ESM] @packages/server C1.8 — Fixtures, support helpers, automation specs (~1153 LOC)

**Stream:** A (tooling)  
**Chunk:** C1.8  
**LOC budget:** ~1153

## Summary

Topological-only tests/support files (excludes `test/unit/util/*` and C1.1 entry files).

## Files

- `packages/server/test/performance/proxy_performance_spec.js`
- `packages/server/test/specUtils.ts`
- `packages/server/test/support/fixtures/ajax/app.js`
- `packages/server/test/support/fixtures/cloud/cy-prompt/test-cy-prompt.ts`
- `packages/server/test/support/fixtures/cloud/encryption/index.js`
- `packages/server/test/support/fixtures/cloud/environment/test-project/child.js`
- `packages/server/test/support/fixtures/cloud/environment/test-project/grandchild.js`
- `packages/server/test/support/fixtures/cloud/environment/test-project/index.js`
- `packages/server/test/support/fixtures/cloud/protocol/test-protocol.ts`
- `packages/server/test/support/fixtures/cloud/studio/test-studio.ts`
- `packages/server/test/support/fixtures/example_generated_file.js`
- `packages/server/test/support/fixtures/example_source.js`
- `packages/server/test/support/fixtures/ids/todos_test1_expected.js`
- `packages/server/test/support/fixtures/server/commonjs_dep.js`
- `packages/server/test/support/fixtures/server/es2015_dep.jsx`
- `packages/server/test/support/fixtures/server/es2015_root.js`
- `packages/server/test/support/fixtures/server/sample.js`
- `packages/server/test/support/fixtures/server/syntax_error.js`
- `packages/server/test/support/helpers/data-context-helper.ts`
- `packages/server/test/support/helpers/deferred.ts`
- `packages/server/test/support/helpers/electron_stub.js`
- `packages/server/test/unit/append_electron_switches_spec.ts`
- `packages/server/test/unit/automation/util_spec.ts`
- `packages/server/test/unit/automation_spec.js`

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

