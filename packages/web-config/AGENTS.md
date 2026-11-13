This package centralizes web-related build configuration for the Cypress monorepo, providing a shared base webpack config and utilities so that webpack settings stay consistent and DRY across browser-targeting packages.

**Architecture**

- `webpack.config.base.ts` — Shared base webpack configuration (loaders, plugins, polyfills) used as a starting point by packages like `@packages/reporter` and `@packages/runner`
- `bundle-stats.ts` — Shared stats format and the webpack plugin that records per-module bytes for `yarn bundle-report`; does nothing unless `CYPRESS_INTERNAL_BUNDLE_STATS_DIR` is set
- `vite-plugin-bundle-stats.mts` — The Vite counterpart, loaded as native ESM by `@packages/frontend-shared/vite.config.mjs`. With the variable set it builds hidden source maps, attributes output bytes from them, and deletes the `.map` files, so the JS output matches a normal build
- `tsconfig.json` — TypeScript config for the package; `scripts/type_check` runs `tsc --noEmit` against it

**Gotchas / Notes**

- This package has no `scripts` of its own and no tests; it is a pure configuration utility.
- It is installed implicitly via the top-level `yarn install`; there is no separate install step.
- All significant Babel presets and webpack loaders are declared here as `devDependencies` so they are available to any package that extends the base config.

**Integration Points**

- Extended by `@packages/reporter` and `@packages/runner` in their respective `webpack.config.ts` files.
