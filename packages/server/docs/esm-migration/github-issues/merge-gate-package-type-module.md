# [ESM] @packages/server — Merge gate: `type: module`, tsconfig, snapshot, full matrix

**Stream:** Merge gate  
**Chunk:** MG  
**LOC budget:** N/A (integration)

## Summary

Final flip after Streams B–D **in-place** migrations and agreed child-process / snapshot behavior.

## Files

- `packages/server/package.json`
- `packages/server/tsconfig.json (and/or packages/ts alignment)`
- `packages/server/index.js`
- `packages/server/start-cypress.js`
- `packages/server/v8-snapshot-entry.js (coordinate tooling)`

## Parallelism / ordering

Land **after** planned C2, C3, C4 **in-place** work (and typically C5) unless explicit exception.

## Depends on

All planned C2–C4 **in-place** migrations complete; C5 as agreed.

## Acceptance criteria

- `"type": "module"` (or equivalent exports strategy) merged with team sign-off.
- `yarn workspace @packages/server check-ts` passes.
- `test-unit` + `test-integration` pass.
- Electron dev path validated per AGENTS.md.
- `index.js` `entryPoint` + plugin child behavior documented.

## References

- Parent plan: `server_esm_three_streams_df4e7bba.plan.md (Cursor plans, or link to PR tracking doc)` (local Cursor plan; paste link if published)
- Dependency graph: [server-graph-toposorted.json](../../../../../server-graph-toposorted.json) (repo root)
- Package: `@packages/server` — [AGENTS.md](../../../AGENTS.md)

## Global rules (from plan)

- Do **not** set `"type": "module"` in [package.json](../../../package.json) until the **merge-gate** issue is executed (after Streams B–D **in-place** migration chunks are done; **SCCs may remain**).
- Re-measure `wc -l` if files change before starting; each chunk targets **≤ 2500 LOC** unless explicitly noted.

