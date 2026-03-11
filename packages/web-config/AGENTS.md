This package centralizes web-related build configuration for the Cypress monorepo, providing a shared base webpack config and utilities so that webpack settings stay consistent and DRY across browser-targeting packages.

**Architecture**

- `webpack.config.base.ts` — Shared base webpack configuration (loaders, plugins, polyfills) used as a starting point by packages like `@packages/reporter` and `@packages/runner`
- `node-register.js` — Registers Babel so that the webpack configs (written in TypeScript/modern JS) can be consumed from Node.js without a separate compile step
- `index.d.ts` — TypeScript types for the exported webpack config helpers

**Gotchas / Notes**

- This package has no `scripts` of its own and no tests; it is a pure configuration utility.
- It is installed implicitly via the top-level `yarn install`; there is no separate install step.
- All significant Babel presets and webpack loaders are declared here as `devDependencies` so they are available to any package that extends the base config.

**Integration Points**

- Extended by `@packages/reporter` and `@packages/runner` in their respective `webpack.config.ts` files.
