# @cypress/react

`@cypress/react` is a published npm package that provides the `mount` function for mounting React components (React 18+) inside the Cypress test runner for component testing. It is bundled with the `cypress` binary and does not typically need to be installed separately by end users.

## Key Commands

```sh
yarn build        # rimraf dist + rollup (outputs to dist/); also syncs to cli/react
yarn check-ts     # TypeScript type-check without emitting
yarn lint         # ESLint
yarn cy:run -- --spec <path-to-spec>   # run a specific component test spec
```

## Architecture

- `src/index.ts` — public entry point
- `src/mount.ts` — core React mounting logic (renders into the Cypress AUT iframe using `react-dom`)
- `src/createMount.ts` — factory used to create the `mount` function with custom options
- `src/getDisplayName.ts` — utility to extract display names for logging

## Gotchas / Notes

- The `postbuild` step syncs `dist/` to `cli/react/` in the monorepo root — build before testing against the Cypress binary.
- Ships multiple bundle formats: CJS (`dist/cypress-react.cjs.js`), ESM bundler (`dist/cypress-react.esm-bundler.js`), and browser UMD (`dist/cypress-react.browser.js`).
- Supports React 18 and 19 via peer dependency ranges.

## Integration Points

- Depends on `@cypress/mount-utils` (sibling package) for shared adapter utilities.
- The `cli/react` copy is what the bundled `cypress` package ships to end users.
