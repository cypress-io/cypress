# network-tools

A low-level package that contains networking-related classes and utilities to be used in the browser and Node.js environment.

## Exports

You can see a list of the modules exported from this package in [./lib/index.ts](./lib/index.ts). Here is a brief description of what's available:

* `cors` contains utilities for Cross-Origin Resource Sharing
* `document-domain-injection` contains utilities related to document.domain injection of the Cypress driver
* `uri` contains utilities for URL parsing and formatting

See the individual class files in [`./lib`](./lib) for more information.

## Building

We currently build a CommonJS and an ESM version of this package. However, since this package is only consumed via CommonJS, we currently only build the CommonJS variant of the package.

```shell
yarn workspace @packages/network-tools build-prod
```

## Testing

Tests are located in [`./test`](./test)

To run tests:

```shell
yarn workspace @packages/network-tools test
yarn workspace @packages/network-tools test-watch
yarn workspace @packages/network-tools test-debug
```
