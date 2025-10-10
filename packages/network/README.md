# network

This package contains networking-related classes and utilities pertaining to the Node.js execution context.

## Exports

You can see a list of the modules exported from this package in [./lib/index.ts](./lib/index.ts). Here is a brief description of what's available:

* `agent` is a HTTP/HTTPS [agent][1] with support for HTTP/HTTPS proxies and keepalive whenever possible
* `allowDestroy` can be used to wrap a `net.Server` to add a `.destroy()` method
* `blocked` is a utility for matching blocked globs
* `concatStream` is a wrapper around [`concat-stream@1.6.2`][2] that makes it always yield a `Buffer`
* `connect` contains utilities for making network connections, including `createRetryingSocket`

See the individual class files in [`./lib`](./lib) for more information.

## Building

We currently build a CommonJS and an ESM version of this package. However, since this package is only consumed via CommonJS, we currently only build the CommonJS variant of the package.

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
