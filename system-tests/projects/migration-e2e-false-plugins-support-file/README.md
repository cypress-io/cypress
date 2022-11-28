## Migration E2E No Plugins No Support

An e2e project with `plugins/index.js` and `support/index.js` set to false.

The following migration steps will be used during this migration:

- [x] automatic file rename
- [ ] manual file rename
- [ ] rename support
- [x] update config file
- [ ] setup component testing

## Automatic Migration

Unless the user skips this step, after this step, the filesystem will be:

| Before | After|
|---|---|
| `integration/foo.spec.js` | `e2e/basic.cy.js` |

## Manual Files

This step is not used.

## Rename supportFile

This step is not used. There is no `supportFile` to rename.

## Update Config

The expected output is in [`expected-cypress.config.js`](./expected-cypress.config.js).
