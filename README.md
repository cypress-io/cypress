## Cypress Example [![Circle CI](https://circleci.com/gh/cypress-io/cypress-core-example.svg?style=svg)](https://circleci.com/gh/cypress-io/cypress-core-example) [![Travis CI Build Status](https://travis-ci.org/cypress-io/cypress-core-example.svg?branch=master)](https://travis-ci.org/cypress-io/cypress-core-example) [ ![Codeship Status for cypress-io/cypress-core-example](https://codeship.com/projects/63b71ec0-c850-0133-987c-12caa2fab171/status?branch=master)](https://codeship.com/projects/139291)

This repo contains the source code for pushing out [https://example.cypress.io](https://example.cypress.io).

You should not clone this repo. It is used interally.

The actual example repo you're probably looking for is [the kitchen sink app here](https://github.com/cypress-io/cypress-example-kitchensink).

## Developing

```bash
npm install
```

This copies the `cypress-example-kitchensink` src files here, and they can now be built + pushed.

## Building

```bash
npm run build
```

## Deploying

```bash
npm run deploy
```



## Changelog

#### 0.2.0
- public interface for accessing path to example_spec.js

#### 0.1.0
- initial release
