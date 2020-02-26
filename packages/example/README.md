## Example

This repo contains the source code for pushing out [https://example.cypress.io](https://example.cypress.io).

The actual example repo you're probably looking for is [the kitchen sink app here](https://github.com/cypress-io/cypress-example-kitchensink).

**THERE'S LIKELY NO REASON YOU NEED TO EDIT ANY OF THE CODE ON THIS REPO.**

- Want to edit the `example` tests? -> edit it [here](https://github.com/cypress-io/cypress-example-kitchensink/blob/master/cypress/integration/examples) instead.
- Want to edit the actual [https://example.cypress.io](https://example.cypress.io) website? edit it [here](https://github.com/cypress-io/cypress-example-kitchensink/tree/master/app) instead.

## Updating the `example` app

After [releasing a new version](https://github.com/cypress-io/cypress-example-kitchensink/blob/master/CONTRIBUTING.md#deployment) on the [`cypress-example-kitchen-sink` repo](https://github.com/cypress-io/cypress-example-kitchensink/blob/master/cypress/integration/examples), you now want to update the `example`'s dependency to match the newly released version.

1. Bump the `cypress-example-kitchensink` `devDependency` within this package's [`package.json`](https://github.com/cypress-io/cypress/blob/develop/packages/example/package.json).

2. Run `yarn` and `yarn lerna run build --scope @packages/example` to build the app and spec files.
CONTRIBUTING
3. Create a new pull-request following this repo's [pull request instructions](.github/CONTRIBUTING.md#pull-requests).

## Building

After running `yarn` you must build the app + spec files.

```bash
yarn lerna run build --scope @packages/example --stream
```

This copies the src files from [`cypress-example-kitchensink`](https://github.com/cypress-io/cypress-example-kitchensink), modifies them to point to `https://example.cypress.io` and creates the `example` tests.

## Deploying

```bash
yarn lerna run deploy --scope @packages/example --stream
```
