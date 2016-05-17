## Cypress Example [![Circle CI](https://circleci.com/gh/cypress-io/cypress-core-example.svg?style=svg)](https://circleci.com/gh/cypress-io/cypress-core-example) [![Travis CI Build Status](https://travis-ci.org/cypress-io/cypress-core-example.svg?branch=master)](https://travis-ci.org/cypress-io/cypress-core-example) [ ![Codeship Status for cypress-io/cypress-core-example](https://codeship.com/projects/63b71ec0-c850-0133-987c-12caa2fab171/status?branch=master)](https://codeship.com/projects/139291)

This repo contains the source code for pushing out [https://example.cypress.io](https://example.cypress.io).

You should not clone this repo. It is used interally.

The actual example repo you're probably looking for is [the kitchen sink app here](https://github.com/cypress-io/cypress-example-kitchensink).

## Developing

```bash
npm install
```

## Building

After running `npm install` you must build the app + spec files.

```bash
npm run build
```

This copies the src files from `cypress-example-kitchensink`, modifies them to point to `https://example.cypress.io` and creates the `example_spec.js`.

## Deploying

```bash
npm run deploy
```

## Releasing

```bash
npm run release
```

## Changelog

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
