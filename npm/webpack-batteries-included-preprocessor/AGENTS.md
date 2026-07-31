# @cypress/webpack-batteries-included-preprocessor

`@cypress/webpack-batteries-included-preprocessor` is a published npm package that wraps `@cypress/webpack-preprocessor` with a pre-configured webpack setup that includes Babel, TypeScript, and CoffeeScript support out of the box. It is intended for users who do not want to configure their own webpack setup for Cypress test file preprocessing.

## Key Commands

```sh
yarn build        # tsc; outputs to dist/
yarn check-ts     # TypeScript type-check without emitting
yarn lint         # ESLint
yarn test -- <path-to-spec>             # run a specific vitest spec file
yarn test -- "<glob-pattern>"          # run vitest specs matching a glob
```

## Architecture

- `index.ts` (compiled to `dist/`) — single entry point; constructs and exports the pre-configured preprocessor, bundling babel-loader, ts-loader, and coffee-loader with default configurations

## Gotchas / Notes

- Requires `@cypress/webpack-preprocessor` as a peer dependency — both packages must be installed together.
- Bundles many dependencies directly (`@babel/core`, `@babel/preset-env`, `ts-loader`, `coffee-loader`, etc.) so consumers do not need to install them. This is intentional and differs from `@cypress/webpack-preprocessor`.
- Includes Node.js polyfills (`buffer`, `os-browserify`, `path-browserify`, `process`, `stream-browserify`) for browser-targeted builds.

## Integration Points

- Directly depends on (and wraps) `@cypress/webpack-preprocessor` via a peer dependency relationship.
