## Migration Component Testing Defaults

A component testing project without e2e, and all defaults for CT. We rename their specs for them in step 1, then we ask them to move them in step 2.

The following migration steps will be used during this migration:

Steps:

- [x] automatic file rename
- [x] manual file rename
- [ ] rename support
- [ ] update config file
- [x] setup component testing

## Automatic Migration

We rename the component specs, since they are using the default `testFiles` pattern.

Unless the user skips this step, after this step, the filesystem will be:

| Before | After|
|---|---|
| `component/button.spec.js` | `component/button.cy.js` |
| `component/input-spec.tsx` | `component/input-spec.tsx` |


## Manual Files

The user will need to rename and/or move their only component specs, `button.cy.js` and `input.cy.tsx`, to their new location. These were renamed in the previous step.

As long as these files are moved from their current location, this step is considered complete. We do not verify where it went.

## Rename supportFile

Not used. We do not do anything for `supportFile` in a component testing project.

## Update Config

The expected output is in [`expected-cypress.config.js`](./expected-cypress.config.js).
