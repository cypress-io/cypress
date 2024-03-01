# Migration Component Testing Customized

A component testing project without e2e. We ask the users to migrate their specs manually.

The following migration steps will be used during this migration:

Steps:

- [ ] automatic file rename
- [ ] manual file rename
- [ ] rename support
- [x] update config file
- [x] setup component testing

## Automatic Migration

Not used.

## Manual Files

Since the user has a custom componentFolder and testFiles pattern, we won't ask them to migrate away. We only do this if they are using the defaults.

## Rename supportFile

Not used. `supportFile: false` is set. We would normally put this in your `e2e.supportFile` key. We assume a top level `supportFile` is used for E2E testing. Since this project does not have E2E configured, we just skip this step.

## Update Config

The expected output is in [`expected-cypress.config.js`](./expected-cypress.config.js).

## Setup Component Testing

Users are required to reconfigure component testing, since the API is changing so much (we now use a `devServer` key in the config to start their dev server, etc).
