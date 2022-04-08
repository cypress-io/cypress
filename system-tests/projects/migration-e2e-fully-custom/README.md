## Migration E2E Fully Custom

A fully custom project for migration.

The following migration steps will be used during this migration:

- [ ] automatic file rename
- [ ] manual file rename
- [ ] rename support
- [x] update config file
- [ ] setup component testing

## Automatic Migration

This step is not used, since both `integrationFolder` and `testFiles` are customized. We will seed the config with a `specPattern` based on these values.

## Manual Files

Not used.

## Rename supportFile

This step is not used.

The project has a custom support file, `src/some-support-file.js`. We insert this value into `e2e.supportFile` in the next step. Same for `pluginsFile`, except that is `require`d inside of `setupNodeEvents`.

## Update Config

The expected output is in [`expected-cypress.config.js`](./expected-cypress.config.js).