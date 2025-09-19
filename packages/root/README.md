# Purpose

Allows packages inside the monorepo to install `@packages/root` and have access to the root `package.json` 

For this reason, `rollup` is used bundle the `package.json` so we don't have to know the exact path of the root `package.json` after package installation, as packages may be interpreted in place or be installed inside the `node_modules` directory. We build `index.mjs` for packages using `vite` and `index.js` for any CommonJS entrypoints.