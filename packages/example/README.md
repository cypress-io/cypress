## Cypress Example [![Circle CI](https://circleci.com/gh/cypress-io/cypress-core-example.svg?style=svg)](https://circleci.com/gh/cypress-io/cypress-core-example) [![Travis CI Build Status](https://travis-ci.org/cypress-io/cypress-core-example.svg?branch=master)](https://travis-ci.org/cypress-io/cypress-core-example)

This repo contains the source code for pushing out [https://example.cypress.io](https://example.cypress.io).

The actual example repo you're probably looking for is [the kitchen sink app here](https://github.com/cypress-io/cypress-example-kitchensink).

**THERE'S LIKELY NO REASON YOU NEED TO EDIT ANY OF THE CODE ON THIS REPO.**

- Want to edit the `example_spec.js` file? -> edit it [here](https://github.com/cypress-io/cypress-example-kitchensink/blob/master/cypress/integration/example_spec.js) instead.
- Want to edit the actual [https://example.cypress.io](https://example.cypress.io) website? edit it [here](https://github.com/cypress-io/cypress-example-kitchensink/tree/master/app) instead.

## Developing

```bash
npm install
```

## Building

After running `npm install` you must build the app + spec files.

```bash
npm run build
```

This copies the src files from [`cypress-example-kitchensink`](https://github.com/cypress-io/cypress-example-kitchensink), modifies them to point to `https://example.cypress.io` and creates the `example_spec.js`.

## Deploying

```bash
npm run deploy
```

## Releasing

```bash
npm run release
```

## Changelog

#### 0.8.0
- new traversal methods

#### 0.7.1
- fix flaky test

#### 0.7.0
- bump kitchensink dep, spies, stubs, clocks, cy.readfile fixes

#### 0.6.3
- fix missing var

#### 0.6.2
- bump kitchen sink default config values

#### 0.6.1
- prevent file server from caching

#### 0.6.0
- new cy commands

#### 0.5.5
- do not postinstall

#### 0.5.4
- renamed commandTimeout -> defaultCommandTimeout

#### 0.5.3
- updated example spec

#### 0.5.2
- removed committed screenshots

#### 0.5.1
- bump kitchen sink to 0.4.1

#### 0.5.0
- added cy.screenshot

#### 0.4.0
- added cy.exec() example from kitchen-sink dep

#### 0.3.3
- fixes clearing 3rd party cookies after cy.visit

#### 0.3.2
- bump kitchen sink dep

#### 0.3.1
- fix failed push

#### 0.3.0
- new cypress cookie commands

#### 0.2.5
- bumped cypress-example-kitchensink

#### 0.2.4
- updated node version to 5.10.0
- updated deps

#### 0.2.3
- renamed visitTimeout -> pageLoadTimeout

#### 0.2.2
- build in ci first

#### 0.2.1
- bugfix do not preinstall or postinstall

#### 0.2.0
- public interface for accessing path to example_spec.js

#### 0.1.0
- initial release
