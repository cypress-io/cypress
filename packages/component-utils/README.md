# component-utils

This package contains the Core lib for Framework-specific Component Testing Libraries to hook into.

## Building

Note: you should not ever need to build the .js files manually. `@packages/ts` provides require-time transpilation when in development.

```shell
yarn lerna run build-prod --scope @packages/component-utils --stream
```

## Testing

Tests are located in [`./test`](./test)

To run tests:

```shell
yarn lerna run test --scope @packages/component-utils --stream
```
