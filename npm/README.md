# npm

This directory contains packages that are both used internally inside the Cypress monorepo [`packages`](../packages) and also published independently on npm under the Cypress organization using the `@cypress` prefix. For example, `vite-dev-server` is published as `@cypress/vite-dev-server`.

These are automatically released based on [Semantic Version](https://semver.org) commit message prefixes (`feat`, `chore` etc). A package is automatically released when changes are merged into `develop`. You can read more about this process in [`CONTRIBUTING`](../CONTRIBUTING.md#committing-code). 

