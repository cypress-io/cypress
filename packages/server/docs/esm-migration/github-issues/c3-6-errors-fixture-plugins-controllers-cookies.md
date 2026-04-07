# [ESM] @packages/server C3.6 — Errors, fixture, plugins, controllers, cookies (~1023 LOC)

**Stream:** C (core SCC)  
**Chunk:** C3.6  
**LOC budget:** ~1023

## Summary

Member of the large SCC: migrate **in place**; **SCC may remain**. Use strict file ownership when parallelizing (up to 8 chunks).

## Files

- `packages/server/lib/errors.ts`
- `packages/server/lib/fixture.ts`
- `packages/server/lib/plugins/preprocessor.ts`
- `packages/server/lib/plugins/run_events.ts`
- `packages/server/lib/util/cookies.ts`
- `packages/server/lib/controllers/files.ts`
- `packages/server/lib/controllers/iframes.ts`
- `packages/server/lib/controllers/spec.ts`
- `packages/server/lib/controllers/xhrs.ts`

## Parallelism / ordering

Up to 8-way parallel with **coordination** on overlapping imports; no prerequisite to remove the SCC.

## Depends on

None (coordinate with Stream B if shared files).

## Acceptance criteria

- Listed files use ESM-consistent `import`/`export` or documented dynamic `import()` where static cycles are unsafe.
- Relevant unit/integration tests pass.

## References

- Parent plan: `server_esm_three_streams_df4e7bba.plan.md (Cursor plans, or link to PR tracking doc)` (local Cursor plan; paste link if published)
- Dependency graph: [server-graph-toposorted.json](../../../../../server-graph-toposorted.json) (repo root)
- Package: `@packages/server` — [AGENTS.md](../../../AGENTS.md)

## Global rules (from plan)

- Do **not** set `"type": "module"` in [package.json](../../../package.json) until the **merge-gate** issue is executed (after Streams B–D **in-place** migration chunks are done; **SCCs may remain**).
- Re-measure `wc -l` if files change before starting; each chunk targets **≤ 2500 LOC** unless explicitly noted.

