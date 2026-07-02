This package contains shared constants used when rewriting JS/HTML content flowing through the Cypress proxy. The rewriting itself is implemented in `@packages/proxy` (`lib/http/util/regex-rewriter.ts`).

**Key Commands**

```bash
# Build TypeScript to JS
yarn workspace @packages/rewriter build-prod

# Type-check without emitting
yarn workspace @packages/rewriter check-ts
```

**Architecture**

- `lib/constants.json` — Shared constants (e.g. `STRIPPED_INTEGRITY_TAG`)

**Gotchas / Notes**

- Do not build `.js` files manually during development; `@packages/ts` provides require-time transpilation.
- Integration tests for the proxy rewriting live in `@packages/server` and `@packages/proxy`.

**Integration Points**

- `@packages/proxy` uses `STRIPPED_INTEGRITY_TAG` when stripping subresource integrity attributes.
- `@packages/runner` uses `STRIPPED_INTEGRITY_TAG` in its browser injection patches.
