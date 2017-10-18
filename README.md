Build status | Description
:--- | :---
[![CircleCI](https://circleci.com/gh/cypress-io/cypress/tree/develop.svg?style=svg)](https://circleci.com/gh/cypress-io/cypress/tree/develop) | `develop` branch

# Cypress

This is the Cypress monorepo, containing all packages that make up the Cypress app. See [Issue #256](https://github.com/cypress-io/cypress/issues/256) for details.

This monorepo is made up of various packages, all of which are found under the `packages` directory. They are discrete modules with different responsibilities, but each is necessary for the Cypress app and is not necessarily useful outside of the Cypress app.

Some, like `https-proxy` and `launcher`, run solely in node and support the Cypress server. Others, like `desktop-gui` and `runner`, create the GUI parts of the Cypress app. All packages can require each other using `const server = require('@packages/server')` syntax.

## Documentation

- [Main Docs](https://on.cypress.io)
- [Roadmap](https://on.cypress.io/roadmap)
- [Changelog](https://on.cypress.io/changelog)

## Development

Please see our [Contributing Guideline](/CONTRIBUTING.md) which explains repo organization, linting, testing, and other steps.

## Deployment

Please see our [deployment document](DEPLOY.md).

## License

This project is licensed under the terms of the [MIT license](/LICENSE.md).

## Badges

Let the world know your project is using Cypress.io to test with this cool badge

[![badge](https://img.shields.io/badge/cypress.io-tests-green.svg?style=flat-square)](https://cypress.io)

```
[![Cypress.io tests](https://img.shields.io/badge/cypress.io-tests-green.svg?style=flat-square)](https://cypress.io)
```
