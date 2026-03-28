This package rewrites JavaScript and HTML content flowing through the Cypress proxy, enabling features such as source map support, URL rewriting, and instrumentation injection.

**Key Commands**

```bash
# Build TypeScript to JS
yarn workspace @packages/rewriter build-prod

# Run a specific test file
yarn workspace @packages/rewriter test -- test/unit/js.spec.ts

# Run tests matching a glob pattern
yarn workspace @packages/rewriter test -- "test/unit/**/*.spec.ts"

# Type-check without emitting
yarn workspace @packages/rewriter check-ts
```

**Architecture**

- `lib/js.ts` — JavaScript AST rewriting logic using `recast`
- `lib/js-rules.ts` — Rules applied to JS ASTs during rewriting
- `lib/html.ts` — HTML rewriting using `parse5-html-rewriting-stream`
- `lib/html-rules.ts` — Rules applied to HTML nodes during rewriting
- `lib/async-rewriters.ts` — Async wrappers that coordinate rewriting pipelines
- `lib/deferred-source-map-cache.ts` — Caching layer for deferred source map generation

**Gotchas / Notes**

- Do not build `.js` files manually during development; `@packages/ts` provides require-time transpilation.
- `parse5-html-rewriting-stream` is nohoisted in workspaces to avoid version conflicts.
- Integration tests for the rewriter are also present in `@packages/server` and `@packages/proxy`.

**Integration Points**

- Called by `@packages/proxy`'s response middleware to transform response bodies before they reach the browser.
