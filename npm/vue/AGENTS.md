# @cypress/vue

`@cypress/vue` is a published npm package that provides the `mount` function for mounting Vue 3 components inside the Cypress test runner for component testing. It is bundled with the `cypress` binary and does not typically need to be installed separately by end users.

## Key Commands

```sh
yarn build        # rimraf dist + rollup; also syncs to cli/vue
yarn check-ts     # vue-tsc type-check + tsd validation
yarn lint         # ESLint (includes .vue files)
yarn cy:run -- --spec <path-to-spec>   # run a specific component test spec
yarn tsd          # build + run tsd type assertion tests
```

## Architecture

- `src/index.ts` — public entry point; re-exports `mount` and types
- `src/mount.ts` — core Vue 3 mounting logic (creates a Vue app instance inside the Cypress AUT iframe)
- `src/types.ts` — shared TypeScript types for mount options
- `src/shims-vue.d.ts` — TypeScript shim so `.vue` files can be imported

## Gotchas / Notes

- Type-checking uses `vue-tsc` (not plain `tsc`) and also runs `tsd` assertions in the `test-tsd/` directory. Run `yarn check-ts` to execute both.
- The `postbuild` step syncs `dist/` to `cli/vue/` — build before testing against the Cypress binary.
- Peer dependency on `@cypress/webpack-dev-server` is optional (used in webpack-based setups).

## Integration Points

- Depends on `@cypress/mount-utils` (sibling package) for shared adapter utilities.
- Optional peer dependency on `@cypress/webpack-dev-server` for webpack-based component test configurations.
