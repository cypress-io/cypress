# [ESM] @packages/server C1.1 — Test runner, entries, ESLint (~527 LOC)

**Stream:** A (tooling)  
**Chunk:** C1.1  
**LOC budget:** ~527

## Summary

Prepare ESM-friendly test execution and entry stubs without flipping package `type` yet.

## Files

- `packages/server/test/scripts/run.js`
- `packages/server/test/spec_helper.js`
- `packages/server/index.js`
- `packages/server/start-cypress.js`
- `packages/server/hook-require.js`
- `packages/server/eslint.config.ts`

## Parallelism / ordering

Parallel with C1.2–C1.7, C1.8 batches, and design work on Streams B–C.

## Depends on

None.

## Acceptance criteria

- Mocha / runner can load specs during transition (document loader or dual mode).
- No `package.json` `type: module` in this PR unless explicitly part of merge gate.
- `yarn workspace @packages/server test-unit -- <spec>` still passes for unaffected specs.

## References

- Parent plan: `server_esm_three_streams_df4e7bba.plan.md (Cursor plans, or link to PR tracking doc)` (local Cursor plan; paste link if published)
- Dependency graph: [server-graph-toposorted.json](../../../../../server-graph-toposorted.json) (repo root)
- Package: `@packages/server` — [AGENTS.md](../../../AGENTS.md)

## Global rules (from plan)

- Do **not** set `"type": "module"` in [package.json](../../../package.json) until the **merge-gate** issue is executed (after Streams B–D **in-place** migration chunks are done; **SCCs may remain**).
- Re-measure `wc -l` if files change before starting; each chunk targets **≤ 2500 LOC** unless explicitly noted.

