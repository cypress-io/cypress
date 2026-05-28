# @cypress/vite-plugin-cypress-esm

`@cypress/vite-plugin-cypress-esm` is a published npm package (currently alpha/pre-release) providing a Vite plugin that intercepts and rewrites ES module imports inside Cypress component tests, wrapping them in a `Proxy` so that ESM module namespaces become mutable. This enables mocking libraries like Sinon to replace module members even though the ESM spec requires sealed namespaces.

## Key Commands

```sh
yarn build          # tsc; outputs to dist/
yarn check-ts       # TypeScript type-check without emitting
yarn lint           # ESLint
yarn cypress:run -- --spec <path-to-spec>   # run a targeted component test
```

## Architecture

- `src/index.ts` — Vite plugin entry; registers Vite transform hooks to rewrite ES module imports
- `client/` — browser-side runtime code that implements the `Proxy` wrapper for module namespaces
- `dist/` — compiled output

## Gotchas / Notes

- This package is alpha/pre-release — API and behavior may change. Not recommended for production use without accepting potential instability.
- Debug logs are available at runtime: set `DEBUG=cypress:vite-plugin-cypress-esm` in Node for transform logs; browser console shows proxy interception logs.
- Uses `picomatch` for pattern matching to decide which modules to wrap.
- Requires Vite (consumed from the user's project as a peer dependency); not listed explicitly as a peer but implied by being a Vite plugin.

## Integration Points

- Used alongside `@cypress/vite-dev-server` in Vite-based component test setups.
