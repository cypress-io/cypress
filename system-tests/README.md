@tooling/system-tests
===

This package contains Cypress's suite of system tests.

These tests launch the [Cypress server](../packages/server) process for each test and run different specs and projects under specific environment conditions, to get tests that can be as close to "real world" as possible.

These tests run in CI in Electron, Chrome, and Firefox under the `system-tests` job family.

## Running system tests

```bash
yarn test <path/to/test>
yarn test test/async_timeouts_spec.js
## or
yarn test async_timeouts ## shorthand, uses globbing to find spec
```

To keep the browser open after a spec run (for easier debugging and iterating on specs), you can pass the `--no-exit` flag to the test command. Live reloading due to spec changes should also work:

```sh
yarn test test/go_spec.js --browser chrome --no-exit
```

## Developing tests

TODO

## Updating snaphots

Prepend `SNAPSHOT_UPDATE=1` to any test command. See [`snap-shot-it` instructions](https://github.com/bahmutov/snap-shot-it#advanced-use) for more info.

```bash
SNAPSHOT_UPDATE=1 yarn test go_spec
```
