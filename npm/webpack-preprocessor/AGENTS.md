# @cypress/webpack-preprocessor

`@cypress/webpack-preprocessor` is a published npm package that provides a Cypress file preprocessor for bundling test files via Webpack 5. It is a low-level package that does not include any loaders or Babel plugins — consumers must configure webpack themselves.

## Key Commands

```sh
yarn build        # rimraf dist + tsc; outputs to dist/
yarn check-ts     # TypeScript type-check without emitting
yarn lint         # ESLint
yarn test-unit -- <path-to-spec>            # run a specific vitest unit spec file
yarn test-unit -- "<glob-pattern>"          # run unit specs matching a glob
yarn test-e2e -- <path-to-spec>             # run a specific vitest e2e spec file
```

## Architecture

- `lib/index.ts` (compiled to `dist/`) — main entry; exports the preprocessor factory function
- `test/unit/` — vitest unit tests
- `test/e2e/` — vitest e2e tests that exercise real webpack compilation
- `scripts/test-webpack-5.ts` — test runner script invoked by `yarn test`

## Gotchas / Notes

- Peer dependencies (`@babel/core`, `@babel/preset-env`, `babel-loader`, `webpack@^5`) must be installed in the consumer's project. This package deliberately ships without bundled loaders.
- For a batteries-included alternative with TypeScript and CoffeeScript support built-in, use `@cypress/webpack-batteries-included-preprocessor`.
- The `main` field points to `dist` (a directory), relying on Node's `index.js` resolution within it.
