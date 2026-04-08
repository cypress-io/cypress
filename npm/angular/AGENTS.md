# @cypress/angular

`@cypress/angular` is a published npm package that provides the `mount` function for mounting Angular components (Angular 18+) inside the Cypress test runner for component testing. It is bundled with the `cypress` binary and does not typically need to be installed separately by end users.

## Key Commands

```sh
yarn build        # compile via rollup (outputs to dist/); also syncs to cli/angular
yarn check-ts     # TypeScript type-check without emitting
yarn lint         # ESLint
```

## Architecture

- `src/index.ts` — public entry point; re-exports `mount` and related types
- `src/mount.ts` — core Angular component mounting logic (bootstraps an Angular application into the Cypress AUT iframe)

## Gotchas / Notes

- Requires `zone.js` as a peer dependency. For Angular 20+ without zone.js, use `@cypress/angular-zoneless` instead.
- The `postbuild` script (`sync-exported-npm-with-cli.js`) copies `dist/` to `cli/angular/` in the monorepo root. If you change this package and need to test it inside the full Cypress binary, you must run `yarn build` first.
- Built output goes to `{workspaceRoot}/cli/angular` per the Nx target config — not just `dist/`.

## Integration Points

- Depends on `@cypress/mount-utils` (sibling package) for shared adapter utilities and types.
- The `cli/angular` copy is what the bundled `cypress` package ships to end users.
