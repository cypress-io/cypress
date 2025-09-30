# Purpose

Bundles the monorepo root `package.json` as an installable package, allowing `@packages/root` to be installed in any context without having an absolute reference to the root `package.json`

In order to accomplish this, `rollup` is used to bundle the `package.json`, as packages may be interpreted in place or be installed inside the `node_modules` directory. This package builds an `index.mjs` file for packages using `vite`/ ES Modules and an `index.js` file for any CommonJS entry points.