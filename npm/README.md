# npm

This directory contains packages that are both used internally inside the Cypress monorepo [`packages`](../packages) and also published independently on npm under the Cypress organization using the `@cypress` prefix. For example, `vite-dev-server` is published as `@cypress/vite-dev-server`.

## Release Process

These are automatically released based on [Semantic Version](https://semver.org) commit message prefixes (`feat`, `chore` etc). You can read more about semantic versioning [here](https://semver.org).

This happens when **develop** is merged into **master**. This is usually on a bi-weekly basis, when we do a Cypress release, but can happen out of sync by simply forking from `master` and making a PR directly against `master`.

## Overview

There are several types of packages in the `npm` directory.

## Mount Adapters

These are used for Component Testing. Currently we support Angular, Vue and React. There is also `mount-utils`, which has some shared code that all the adapters use, such as constants.

- [angular](./angular)
- [react](./react)
- [react18](./react18)
- [vue](./vue)
- [vue2](./vue2)
- [mount-utils](./mount-utils)

## Dev Servers

These are thin layers on top of popular dev servers to integrate with Cypress Component Testing. We currently support Vite (v2) and Webpack (v4, v5).

- [vite-dev-server](./vite-dev-server)
- [webpack-dev-server](./webpack-dev-server)

## Preprocessors

These are generally used with E2E testing. They are used to bundle code. Currently we only support webpack officially. There are third party preprocessors built in the same fashion, such as [esbuild-preprocessor](https://github.com/bahmutov/cypress-esbuild-preprocessor).

- [webpack-batteries-included-preprocessor](./webpack-batteries-included-preprocessor)
- [webpack-preprocessor](./webpack-preprocessor)


## Misc

Some other packages, mainly used internally or for tooling.

- create-cypress-tests
- cypress-schematic
- design-system
- eslint-plugin-dev
