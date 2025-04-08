# Debug Logs

Many Cypress packages use the [`debug` module][debug] to log runtime info to the console.

## Choosing a namespace

The naming scheme for debug namespaces should generally follow this pattern:

```
cypress:{packageName}:{relative path to file from src root, using : to separate directories, minus index if applicable}

# examples:
# packages/server/lib/util/file.js -> cypress:server:util:file
# packages/launcher/windows/index.ts -> cypress:launcher:windows
```

`cypress-verbose` can be used instead of `cypress` if the logs are overly verbose and would make the output of `DEBUG=cypress:*` unreadable.

Exceptions to these rules:
* The `cli` uses `cypress:cli:*`.
* NPM packages should use `{moduleName}` as a prefix instead of `cypress`, like `cypress-webpack-preprocessor` for `npm/webpack-preprocessor`.
* In some places, like per-request in the `proxy` package, it's more useful to attach `debug` messages to something besides the module (like individual HTTP requests). In that case, it's okay to create namespaces as you see fit. But at least begin with `cypress:{packageName}` or `cypress-verbose:{packageName}`

## Using debug logs

Pass the `DEBUG` environment variable to select a set of logs to print to `stderr`. Example selectors:

```shell
# frequently useful to get a sense of what is happening in the app at a high level
DEBUG=cypress:*
# print all info and verbose logs, but don't print verbose logs from `some-noisy-package`
DEBUG=cypress:*,cypress-verbose:*,-cypress-verbose:some-noisy-package:*
# print out verbose per-request data for proxied HTTP requests
DEBUG=cypress-verbose:proxy:http

# in the browser, set `localStorage.DEBUG`:
localStorage.DEBUG = 'cypress:driver,cypress:driver:*'
```

For more info, see the [public documentation for printing debug logs](https://docs.cypress.io/guides/references/troubleshooting#Print-DEBUG-logs) and the [`debug` module docs][debug]

[debug]: https://github.com/debug-js/debug#readme
