# @packages/network-tools

Isomorphic (browser and Node.js) low-level networking utilities. Provides CORS helpers, URI parsing, domain utilities, and `document.domain` injection logic that must run in both the browser-side driver and the server-side proxy without Node.js-specific APIs.

## Key Commands

```bash
# Run a specific test file
yarn workspace @packages/network-tools test -- <path-to-spec>

# Run tests matching a glob pattern
yarn workspace @packages/network-tools test -- "<glob-pattern>"

# Build CJS and ESM outputs
yarn workspace @packages/network-tools build

# Type-check
yarn workspace @packages/network-tools check-ts
```

## Architecture

```
lib/
  accept-encoding.ts           Parses and normalizes Accept-Encoding header values
  cors.ts                      CORS utilities: origin comparison, header manipulation
  document-domain-injection.ts Helpers for injecting document.domain overrides via the spec bridge
  index.ts                     Public entry point re-exporting all modules
  types.ts                     Shared TypeScript types
  uri.ts                       URI parsing, normalization, and same-origin comparison helpers
```

## Gotchas / Notes

- This package must remain isomorphic — do not import Node.js built-ins (`fs`, `net`, `tls`, etc.) here. For Node.js-only networking, use **@packages/network**.
- Builds to both `cjs/` and `esm/`; the ESM build is consumed by browser-bundled packages.
- Uses `@cypress/parse-domain` for domain parsing, which handles edge cases like public-suffix-aware eTLD+1 extraction.

## Integration Points

- Consumed by **@packages/driver** (browser) for CORS and URI utilities used in command implementations.
- Consumed by **@packages/rewriter** and **@packages/proxy** (Node.js) for the same CORS and URI logic on the server side.
- Consumed by **@packages/config** for URL/domain validation.
