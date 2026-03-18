# @cypress/mount-utils

`@cypress/mount-utils` is a published npm package that exports shared TypeScript types and utility functions used by all Cypress component testing adapter packages. It is not intended for direct use by end users of Cypress.

## Key Commands

```sh
yarn build        # tsc compile (outputs to dist/); also syncs to cli/mount-utils
yarn check-ts     # TypeScript type-check without emitting
yarn lint         # ESLint
```

## Architecture

- `src/index.ts` — single entry point exporting all shared utilities and types for adapter packages

## Gotchas / Notes

- The `build` script tolerates type errors (`|| echo 'built, with type errors'`) — check `yarn check-ts` separately for a clean type report.
- The `postbuild` step syncs `dist/` to both `cli/mount-utils/` and `{projectRoot}/dist` — required before any adapter package that depends on it can build correctly.
- This package has no test script; it is a pure utility library validated through the consuming adapter packages.

## Integration Points

- Consumed by `@cypress/react`, `@cypress/vue`, `@cypress/angular`, `@cypress/angular-zoneless`, and `@cypress/svelte` as a build-time (`devDependencies`) dependency.
