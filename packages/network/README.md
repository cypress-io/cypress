# network

This package contains networking-related classes and utilities.

## Exports

You can see a list of the modules exported from this package in [./lib/index.ts](./lib/index.ts). Here is a brief description of what's available:

* `agent` is a HTTP/HTTPS [agent][1] with support for HTTP/HTTPS proxies and keepalive whenever possible
* `allowDestroy` can be used to wrap a `net.Server` to add a `.destroy()` method
* `blocked` is a utility for matching blocked globs
* `concatStream` is a wrapper around [`concat-stream@1.6.2`][2] that makes it always yield a `Buffer`
* `connect` contains utilities for making network connections, including `createRetryingSocket`
* `cors` contains utilities for Cross-Origin Resource Sharing
* `uri` contains utilities for URL parsing and formatting

See the individual class files in [`./lib`](./lib) for more information.

## Building

Note: you should not ever need to build the .js files manually. `@packages/ts` provides require-time transpilation when in development.

```shell
yarn workspace @packages/network build-prod
```

## Testing

Tests are located in [`./test`](./test)

To run tests:

```shell
yarn workspace @packages/network test
yarn workspace @packages/network test-watch
yarn workspace @packages/network test-debug
```

[1]: https://devdocs.io/node/http#http_class_http_agent
[2]: https://github.com/maxogden/concat-stream/tree/v1.6.2
