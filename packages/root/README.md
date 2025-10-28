# Purpose

Bundles the monorepo root `package.json` as an installable package, allowing `@packages/root` to be installed in any context without having an absolute reference to the root `package.json`

In order to accomplish this, `rollup` is used to bundle the `package.json`, as packages may be interpreted in place or be installed inside the `node_modules` directory. This package builds an `index.mjs` file for packages using `vite`/ ES Modules and an `index.js` file for any CommonJS entry points.

We currently don't use a watcher for this package because it is so small, so if any changes happen to the `package.json` in the root you will need to manually retrigger the build of this package.