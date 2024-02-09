## Migration Component Testing

A component testing project without e2e. We ask the users to migrate their specs manually. `supportFile` is `false`.

The following migration steps will be used during this migration:

Steps:

- [ ] automatic file rename
- [ ] manual file rename
- [ ] rename support
- [x] update config file
- [x] setup component testing

## Automatic Migration

Not used. This is only used for E2E projects with a default `testFiles` or `integrationFolder`, or a component project with a default `testFiles`. This one has a custom `testFiles` pattern.

## Manual Files

We will not require manual migration, because the user is not using the default componentFolder or testFiles.

## Rename supportFile

Not used. `supportFile: false` is set. We would normally put this in your `e2e.supportFile` key. We assume a top level `supportFile` is used for E2E testing. Since this project does not have E2E configured, we just skip this step.

## Update Config

We can migrate to the new `cypress.config.js`. The expected output is in `expected-cypress.config.js`. The main points are:

- `specPattern` is nested under `component`. It's a combination of `componentFolder` + `testFiles`.
- `componentFolder` and `testFiles` are gone.
- We add an empty `setupNodeEvents` function in `component`.

The expected output is in [`expected-cypress.config.js`](./expected-cypress.config.js).

## Setup Component Testing

Users are required to reconfigure component testing, since the API is changing so much (we now use a `devServer` key in the config to start their dev server, etc).
