# Runner

This is an old package, deprecated in favor of `@packages/app`. It has two remaining responsibilities before it can be entirely removed:

1. Bundles `@packages/reporter` and `@packages/driver` via webpack. Once those can be directly imported to `@packages/app`, we can remove this.
2. Bundles styles for `@packages/reporter`, loaded in `main.scss`. Ideally, reporter should import its own styles.
3. Contains `dom.js`, which uses proprietary webpack loaders and cannot easily be imported with Vite (dev server in `@packages/app`). Once `dom.js` is free of webpack-specific loader code, we should move it to `@packages/app`.
4. Contains Cypress Studio Recorder code, which was marked as experimental in Cypress 9.x and won't be part of Cypress 10.x initially. It will return at a later date. Until then, the code will be here. It's not currently used in the app. @see https://github.com/cypress-io/cypress/issues/22870
5. Contains Legacy Cypress styles, most of these can likely be removed.

## Implicit Dependencies

We have the following implicit dependencies defined in package.json

- @packages/driver
- @packages/config
- @packages/reporter

The source code from these packages are bundled into dist/cypress_runner.js when this package is built. Because of this, we need to specify to Nx that any changes in the source files of the above packages need to invalidate the build cache for this package so that it gets rebuilt.
