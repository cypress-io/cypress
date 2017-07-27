Build status | Description
:--- | :---
[![CircleCI](https://circleci.com/gh/cypress-io/cypress-monorepo.svg?style=svg&circle-token=ad2c9212a3dc5b80fe92c8780b2533be1ef42d7e)](https://circleci.com/gh/cypress-io/cypress-monorepo) | Cypress CI (this repo)
[![CircleCI](https://circleci.com/gh/cypress-io/cypress-test-node-versions.svg?style=svg&circle-token=6a7c4e7e7ab427e11bea6c2af3df29c4491d2376)](https://circleci.com/gh/cypress-io/cypress-test-node-versions) | cypress-test-node-versions
[![CircleCI](https://circleci.com/gh/cypress-io/cypress-test-ci-environments.svg?style=svg&circle-token=66a4d36c3966cbe476f13e7dfbe3af0693db3fb9)](https://circleci.com/gh/cypress-io/cypress-test-ci-environments) | cypress-test-ci-environments
[![CircleCI](https://circleci.com/gh/cypress-io/cypress-test-module-api.svg?style=svg&circle-token=317f79ae796e0ffd6cc7dd90859c0f67e5a306e7)](https://circleci.com/gh/cypress-io/cypress-test-module-api) | cypress-test-module-api
[![CircleCI](https://circleci.com/gh/cypress-io/cypress-on.svg?style=svg&circle-token=51ba85f5720654ee58212f45f6b9afc56d55d52a)](https://circleci.com/gh/cypress-io/cypress-on) | cypress-on
[![CircleCI](https://circleci.com/gh/cypress-io/docsearch-scraper.svg?style=svg&circle-token=8087137233788ec1eab4f79d4451392ca53183b2)](https://circleci.com/gh/cypress-io/docsearch-scraper) | docsearch-scraper
[![Docker Build Status](https://img.shields.io/docker/build/cypress/base.svg)](https://hub.docker.com/r/cypress/base/) | [cypress-docker-images](https://github.com/cypress-io/cypress-docker-images)

# Cypress

This is the Cypress monorepo, containing all packages that make up the Cypress app. See [Issue #256](https://github.com/cypress-io/cypress/issues/256) for details.

This monorepo is made up of various packages, all of which are found under the `packages` directory. They are discrete modules with different responsibilities, but each is necessary for the Cypress app and is not necessarily useful outside of the Cypress app.

Some, like `core-https-proxy` and `core-launcher`, run solely in node and support the Cypress server. Others, like `core-desktop-gui` and `core-runner`, create the GUI parts of the Cypress app.

[CLI Documentation](https://on.cypress.io/cli)

## Badges

Let the world know your project is using Cypress.io to test with this cool badge

[![badge](https://img.shields.io/badge/cypress.io-tests-green.svg?style=flat-square)](https://cypress.io)

### Markdown

```
[![Cypress.io tests](https://img.shields.io/badge/cypress.io-tests-green.svg?style=flat-square)](https://cypress.io)
```

### SVG image

```
https://img.shields.io/badge/cypress.io-tests-green.svg?style=flat-square
```

## Development

Please see our [Contributing Guideline](/CONTRIBUTING.md)
