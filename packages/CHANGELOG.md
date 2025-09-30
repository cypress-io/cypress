# Unreleased Cypress App Changes

## Dependency Updates

- Upgraded `electron` from `36.8.1` to `37.6.0`
- Upgraded bundled Node.js version from `22.18.0` to `22.19.0`
- Upgraded bundled Chromium version from `136.0.7103.177` to `138.0.7204.251`

## Breaking

- Removed the `rawJson` configuration data from `Cypress.state()`. Addressed [#23945](https://github.com/cypress-io/cypress/issues/23945).