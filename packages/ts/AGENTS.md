This package standardizes the monorepo's version of `ts-node` and provides shared base `tsconfig` options so that TypeScript is transpiled consistently at require-time during development without needing a pre-build step.

**Key Commands**

```bash
# Run unit tests (single spec: test/spec.ts — no sub-targeting needed)
yarn workspace @packages/ts test
```

**Architecture**

- `index.js` — Entry point; re-exports the configured ts-node/typescript-cached-transpile setup
- `register.js` — Registers ts-node for require-time TypeScript transpilation in a single directory
- `registerDir.js` — Registers ts-node for an entire directory tree
- `tsconfig.json` — Base TypeScript config shared across the monorepo
- `tsconfig.dom.json` — TypeScript config variant for browser/DOM contexts
- `tslint.json` — TSLint config (legacy linting) shared across packages

**Gotchas / Notes**

- In production builds, all TypeScript is pre-compiled to JavaScript, making this package's `register` export a no-op.
- Only `register.js` and `registerDir.js` are included in the published `files`; the rest is for in-monorepo development use only.
- Patches are applied via `patch-package` on postinstall.
