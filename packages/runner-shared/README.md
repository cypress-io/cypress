# Runner Shared

This is an old package, deprecated in favor of `@packages/app`. It has two remaining responsibilities before it can be entirely removed:

1. Contains `dom.js`, which uses proprietary webpack loaders and cannot easily be imported with Vite (dev server in `@packages/app`). This is bundled via webpack in either `@packages/runner` or `@packages/runner-ct`. Once `dom.js` is free of webpack-specific loader code, we should move it to `@packages/app`.
2. Contains UI code for Cypress Studio, which was marked as experimental in Cypress 9.x and won't be part of Cypress 10.x initially. It will return at a later date. Until then, the code will be here. It's not currently used in the app.