# net-stubbing

This package contains the server-side code and type definitions for Cypress's network stubbing feature.

Driver-side code is contained in the `driver` package.

## Building

Note: you should not ever need to build the .js files manually. `@packages/ts` provides require-time transpilation when in development.

```shell
yarn build-prod
```

## Testing

Tests are located in [`./test`](./test)

To run tests:

```shell
yarn test
```

Additionally, `net_stubbing_spec` in the `driver` package tests the functionality in this repo.
