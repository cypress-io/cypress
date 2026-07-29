This package standardizes the monorepo's require-time TypeScript hook (`tsx`) and provides shared base `tsconfig` options so that TypeScript is transpiled consistently at require-time during development without needing a pre-build step.

**Key Commands**

```bash
# Run unit tests (single spec: test/spec.ts — no sub-targeting needed)
yarn workspace @packages/ts test
```

**Architecture**

- `index.js` — Entry point; re-exports the `tsx` programmatic API (`tsx/cjs/api`)
- `register.js` — Convenience entry that invokes `registerDir` (used as mocha's `-r @packages/ts/register`)
- `registerDir.js` — Registers the `tsx` require hook for on-demand TypeScript transpilation (plus a `preferTsExts` shim so first-party `.ts` source wins over a co-located built `.js`)
- `tsconfig.json` — Base TypeScript config shared across the monorepo
- `tsconfig.dom.json` — TypeScript config variant for browser/DOM contexts
- `tslint.json` — TSLint config (legacy linting) shared across packages

**Gotchas / Notes**

- In production builds, the V8 snapshot handles module loading, so the `register` hook is a no-op (it is gated on `DISABLE_SNAPSHOT_REQUIRE` / the absence of a snapshot).
- Only `register.js` and `registerDir.js` are included in the published `files`; the rest is for in-monorepo development use only.
