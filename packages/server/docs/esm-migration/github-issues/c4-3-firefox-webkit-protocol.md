# [ESM] @packages/server C4.3 — Blocked lib: Firefox + WebKit + protocol (~1411 LOC)

**Stream:** D (blocked lib)  
**Chunk:** C4.3  
**LOC budget:** ~1411

## Summary

Downstream of core SCC; migrate **in place** after relevant **C3** chunks for your imports are done.

## Files

- `packages/server/lib/browsers/firefox.ts`
- `packages/server/lib/browsers/firefox-util.ts`
- `packages/server/lib/browsers/webkit.ts`
- `packages/server/lib/browsers/webkit-automation.ts`
- `packages/server/lib/browsers/protocol.ts`

## Parallelism / ordering

Parallel C4.1–C4.3 after C3; coordinate C4.4 with browser façade PRs.

## Depends on

Relevant C3 chunks migrated in place for modules you import.

## Acceptance criteria

- ESM migration for listed files complete per convention.
- Document dynamic `import()` where required; **SCC may remain** in `server-graph` follow-up.

## References

- Parent plan: `server_esm_three_streams_df4e7bba.plan.md (Cursor plans, or link to PR tracking doc)` (local Cursor plan; paste link if published)
- Dependency graph: [server-graph-toposorted.json](../../../../../server-graph-toposorted.json) (repo root)
- Package: `@packages/server` — [AGENTS.md](../../../AGENTS.md)

## Global rules (from plan)

- Do **not** set `"type": "module"` in [package.json](../../../package.json) until the **merge-gate** issue is executed (after Streams B–D **in-place** migration chunks are done; **SCCs may remain**).
- Re-measure `wc -l` if files change before starting; each chunk targets **≤ 2500 LOC** unless explicitly noted.

