# @cypress/angular

`@cypress/angular` is a published npm package that provides the `mount` function for mounting Angular components without zone.js, targeting Angular 21+ with zoneless change detection. It is bundled with the `cypress` binary and does not typically need to be installed separately by end users.

## Key Commands

```sh
yarn build        # compile via rollup (outputs to dist/); also syncs to cli/angular
yarn check-ts     # TypeScript type-check without emitting
yarn lint         # ESLint
```

## Architecture

- `src/index.ts` — public entry point; re-exports `mount` and related types
- `src/mount.ts` — mounting logic adapted for Angular's zoneless change detection (no zone.js bootstrapping)

## Gotchas / Notes

- Peer dependencies require Angular 21+.
- The `postbuild` script copies `dist/` to `cli/angular/` in the monorepo root. Build before testing in the Cypress binary.
- Uses TypeScript ~5.9.2 (newer than most other npm packages in this workspace which use ~5.4.5).

## Integration Points

- Depends on `@cypress/mount-utils` (sibling package) for shared adapter utilities and types.
- The `cli/angular` copy is what the bundled `cypress` package ships to end users.
