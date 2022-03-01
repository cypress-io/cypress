## Migration E2E Defaults No Specs

An e2e project with TypeScript using `export default` in `cypress/plugins/index.ts`.

The following migration steps will be used during this migration:

- [ ] automatic file rename
- [ ] manual file rename
- [x] rename support
- [x] update config file
- [ ] setup component testing

## Automatic Migration

This step is not used, since there are no spec files to rename. 

## Manual Files

This step is not used.

## Rename supportFile

The project has a default support file, `cypress/support/index.js`. We can rename it for them to `cypress/support/e2e.js`.

| Before | After|
|---|---|
| `cypress/support/index.ts` | `cypress/support/e2e.ts` |

## Update Config

The expected output is in [`expected-cypress.config.ts`](./expected-cypress.config.ts).
