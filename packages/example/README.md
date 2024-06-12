# Example

This package is responsible for copying the `cypress/e2e` and `app` files from [`cypress-example-kitchensink`](https://github.com/cypress-io/cypress-example-kitchensink) into the cypress repository.

The `cypress/e2e` tests, pulled into this package from the [kitchen sink app](https://github.com/cypress-io/cypress-example-kitchensink), are used for scaffolding user's e2e tests in `packages/data-context`.

The `app` content, pulled into this package from the [kitchen sink app](https://github.com/cypress-io/cypress-example-kitchensink), is published to `cypress-io/cypress` repository's Github page, [https://example.cypress.io](https://example.cypress.io).

## Updating Content

**THERE'S LIKELY NO REASON YOU NEED TO EDIT ANY OF THE CODE IN THIS PACKAGE.**

- Want to edit the `example` tests? -> edit it [here](https://github.com/cypress-io/cypress-example-kitchensink/blob/master/cypress/e2e) instead.
- Want to edit the actual [https://example.cypress.io](https://example.cypress.io) website? edit it [here](https://github.com/cypress-io/cypress-example-kitchensink/tree/master/app) instead.

## Major Version Bumps of Cypress

If any of the breaking changes in the next major release requires updates to Cypress commands or APIs, verify the site content in `cypress-example-kitchensink` is up-to-date and that all examples that will be scaffolded can successfully run with the breaking change.

## Using a new version of `cypress-example-kitchen-sink`

When a commit is merged into `master`, a new version of the [`cypress-example-kitchen-sink` repo](https://github.com/cypress-io/cypress-example-kitchensink/tree/master/cypress/e2e/2-advanced-examples) is released [automatically to npm](https://github.com/cypress-io/cypress-example-kitchensink/blob/master/CONTRIBUTING.md#deployment). When this happens, you will need to update the `example`'s dependency to match the newly released version.

1. Bump the `cypress-example-kitchensink` `devDependency` within this package's [`package.json`](https://github.com/cypress-io/cypress/blob/develop/packages/example/package.json).

2. Run `yarn` and `yarn workspace @packages/example build` to build the app and spec files.

3. Create a new pull-request following this repo's [pull request instructions](../../CONTRIBUTING.md#pull-requests).

## Building

After running `yarn` you must build the app + spec files.

```bash
yarn workspace @packages/example build
```

This copies the `cypress/e2e` and files from [`cypress-example-kitchensink`](https://github.com/cypress-io/cypress-example-kitchensink), modifies them to point to `https://example.cypress.io` and creates the `example` tests.

## Deploying

This command deploys directly to production! Before executing it, ensure everything looks correct in the `./build` directory.

```bash
yarn workspace @packages/example deploy
```
