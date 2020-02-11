# proxy

This package contains the code for Cypress's HTTP interception proxy.

## HTTP interception

[`./lib/http`](./lib/http) contains the code that intercepts HTTP requests. The bulk of the proxy's behavior is in three files:

* [`request-middleware.ts`](./lib/http/request-middleware.ts) contains code that manipulates HTTP requests from the browser
* [`response-middleware.ts`](./lib/http/responseest-middleware.ts) contains code that manipulates HTTP responses to the browser
* [`error-middleware.ts`](./lib/http/responseest-middleware.ts) handles errors that occur in the request/response cycle

## Building

Note: you should not ever need to build the .js files manually. `@packages/ts` provides require-time transpilation when in development.

```shell
yarn lerna run build-js --scope @packages/proxy --stream
```

## Testing

Tests are located in [`./test`](./test)

To run tests:

```shell
yarn lerna run test --scope @packages/proxy --stream
```

Additionally, the `server` package contains tests that use the `proxy`.
