# [ESM] @packages/server C1.2 — `reporter.js` + `request.js` (~1528 LOC)

**Stream:** A (tooling)  
**Chunk:** C1.2  
**LOC budget:** ~1528

## Summary

Migrate large CJS modules toward ESM-compatible patterns (syntax + imports) per plan.

## Files

- `packages/server/lib/reporter.js`
- `packages/server/lib/request.js`

## Parallelism / ordering

Parallel with other C1.* chunks; avoid overlapping edits with same files.

## Depends on

None.

## Acceptance criteria

- Both modules use `import`/`export` or agreed interim pattern consistent with package strategy.
- Unit tests touching these modules still pass.

## References

- Parent plan: `server_esm_three_streams_df4e7bba.plan.md (Cursor plans, or link to PR tracking doc)` (local Cursor plan; paste link if published)
- Dependency graph: [server-graph-toposorted.json](../../../../../server-graph-toposorted.json) (repo root)
- Package: `@packages/server` — [AGENTS.md](../../../AGENTS.md)

## Global rules (from plan)

- Do **not** set `"type": "module"` in [package.json](../../../package.json) until the **merge-gate** issue is executed (after Streams B–D **in-place** migration chunks are done; **SCCs may remain**).
- Re-measure `wc -l` if files change before starting; each chunk targets **≤ 2500 LOC** unless explicitly noted.

