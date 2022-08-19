# Runner

This is an old package, deprecated in favor of `@packages/app`. It has two remaining responsibilities before it can be entirely removed:

1. Bundles `@packages/reporter` and `@packages/driver` via webpack. Once those can be directly imported to `@packages/app`, we can remove this.
2. Bundles styles for `@packages/reporter`, loaded in `main.scss`. Ideally, reporter should import its own styles.
3. Contains `dom.js`, which uses proprietary webpack loaders and cannot easily be imported with Vite (dev server in `@packages/app`). Once `dom.js` is free of webpack-specific loader code, we should move it to `@packages/app`.
4. Contains Cypress Studio Recorder code, which was marked as experimental in Cypress 9.x and won't be part of Cypress 10.x initially. It will return at a later date. Until then, the code will be here. It's not currently used in the app. @see https://github.com/cypress-io/cypress/issues/22870
5. Contains Legacy Cypress styles, most of these can likely be removed.
