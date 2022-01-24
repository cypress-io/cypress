@tooling/system-tests
===

This package contains Cypress's suite of system tests.

These tests launch the [Cypress server](../packages/server) process for each test and run different specs and projects under specific environment conditions, to get tests that can be as close to "real world" as possible.

These tests run in CI in Electron, Chrome, and Firefox under the `system-tests` job family.

## Running System Tests

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

To debug the Cypress process under test, you can pass `--cypress-inspect-brk`:

```sh
yarn test test/go_spec.js --browser chrome --no-exit
```

## Developing Tests

System tests cover the entire Cypress run, so they are good for testing features that do not fit into a normal integration or unit test. However, they do take more resources to run, so consider carefully if you really *need* to write a system test, or if you could achieve 100% coverage via an integration or unit test instead.

There are two parts to a system test:

1. A test written using the [`systemTests`](./lib/system-tests) Mocha wrapper that lives in [`./test`](./test), and
2. A matching Cypress [test project](#Test-Projects) that lives in the [`./projects`](./projects) directory.

For example, if you initialized a new project in `./projects/my-new-project`, and you wanted to assert that 2 tests fail and take a snapshot of the `stdout`, you'd write a test like this:

```ts
// ./test/my-new-project.spec.ts
import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

describe('my new project', () => {
    // scaffold projects
    systemTests.setup()

    systemTests.it('fails as expected', {
        project: Fixtures.projectPath('my-new-project'),
        snapshot: true,
        spec: '*',
        expectedExitCode: 2
    })
})
```

From here, you could run this test with `yarn test my-new-project`.

There are many more options available for `systemTests.it` and `systemTests.setup`. You can massage the stdout, do pre-run tasks, set up HTTP/S servers, and more. Explore the typedocs in [`./lib/system-tests`](./lib/system-tests) for more information.

### Updating Snaphots

Prepend `SNAPSHOT_UPDATE=1` to any test command. See [`snap-shot-it` instructions](https://github.com/bahmutov/snap-shot-it#advanced-use) for more info.

```bash
SNAPSHOT_UPDATE=1 yarn test go_spec
```

### Test Projects

Every folder in [`./projects`](./lib/projects) represents a self-contained Cypress project. When you pass the `project` property to `systemTests.it` or `systemTests.exec`, Cypress launches using this project.

If a test project has a `package.json` file, the `systemTests.exec` helper will attempt to install the correct `node_modules` by running `yarn install` against the project. This is cached in CI and locally to speed up test times.

`systemTests.exec` *copies* the project directory to a temporary folder outside of the monorepo root. This means that temporary projects will not inherit the `node_modules` from this package or the monorepo. So, you must add the dependencies required for your project in `dependencies` or `devDependencies`.

The exception is some commonly used packages that are scaffolded for all projects, like `lodash` and `debug`. You can see the list by looking at `scaffoldCommonNodeModules` in [`./lib/fixtures.ts`](./lib/fixtures.ts) These packages do not need to be added to a test project's `package.json`.

You can also set special properties in a test project's `package.json` to influence the helper's behavior when running `yarn`:

`package.json` Property Name | Type | Description
--- | --- | ---
`_cySkipYarnInstall` | `boolean` | If `true`, skip the automatic `yarn install` for this package, even though it has a `package.json`.
`_cyYarnV311` | `boolean` | Run the yarn v3.1.1-style install command instead of yarn v1-style.
`_cyRunScripts` | `boolean` | By default, the automatic `yarn install` will not run postinstall scripts. This option, if set, will cause postinstall scripts to run for this project.

Run `yarn projects:yarn:install` to run `yarn install` for all projects with a `package.json`.

Use the `UPDATE_YARN_LOCK=1` environment variable with `yarn test` or `yarn projects:yarn:install` to allow the `yarn.lock` to be updated and synced back to the monorepo from the temp dir.
