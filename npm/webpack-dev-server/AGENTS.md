# @cypress/webpack-dev-server

`@cypress/webpack-dev-server` is a published npm package that implements the object-syntax `devServer` API for Cypress component testing backed by Webpack Dev Server. It is bundled with the Cypress binary and typically does not need to be installed separately by end users.

## Key Commands

```sh
yarn build        # rimraf dist + tsc; outputs to dist/
yarn check-ts     # TypeScript type-check without emitting
yarn clean        # rimraf dist
yarn lint         # ESLint
yarn test -- <path-to-spec>                  # run a specific vitest spec file
yarn test -- "<glob-pattern>"                # run vitest specs matching a glob
```

## Architecture

- `src/devServer.ts` — main entry; resolves framework/webpack config and starts Webpack Dev Server
- `src/index.ts` — public exports
- `src/createWebpackDevServer.ts` — constructs the webpack dev server instance with Cypress-specific config
- `src/makeWebpackConfig.ts` — builds the merged webpack configuration
- `src/makeDefaultWebpackConfig.ts` — base webpack config applied to all setups
- `src/CypressCTWebpackPlugin.ts` — custom webpack plugin for component testing
- `src/loader.ts` — custom webpack loader
- `src/aut-runner.ts` — browser-side AUT runner entry
- `src/browser.ts` — browser runtime utilities
- `src/constants.ts` — shared constants
- `src/helpers/` — framework-specific config helpers:
  - `angularHandler.ts` — Angular webpack config integration
  - `nextHandler.ts` — Next.js webpack config integration
  - `sourceRelativeWebpackModules.ts` — resolves webpack modules relative to the user's project

## Gotchas / Notes

- Uses a "cypress-in-cypress" integration test approach (special env vars required; see `cypress:run` script).
- Webpack itself is a dev dependency only (`webpack: "npm:webpack@^5"`) — consumers supply their own webpack install via their project.

## Integration Points

- Works alongside component adapter packages (`@cypress/react`, `@cypress/vue`) which provide the `mount` function.
- Has specific handling for Angular and Next.js project structures in `src/helpers/`.
