@tooling/system-tests
===

This package contains Cypress's suite of system tests.

These tests launch the [Cypress server](../packages/server) process for each test and run different specs and projects under specific environment conditions, to get tests that can be as close to "real world" as possible.

These tests run in CI in Electron, Chrome, Firefox, and WebKit under the `system-tests` job family.

## Running System Tests

```bash
yarn test # runs all tests
## or use globbing to find spec in folders as defined in "glob-in-dir" param in package.json
yarn test screenshot*element # runs screenshot_element_capture_spec.js
yarn test screenshot # runs screenshot_element_capture_spec.js, screenshot_fullpage_capture_spec.js, ..., etc.

```

To keep the browser open after a spec run (for easier debugging and iterating on specs), you can pass the `--no-exit` flag to the test command. Live reloading due to spec changes should also work:

```sh
yarn test go_spec.js --browser chrome --no-exit
```

To debug the Cypress process under test, you can pass `--cypress-inspect-brk`:

```sh
yarn test go_spec.js --browser chrome --no-exit --cypress-inspect-brk
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
        project: 'my-new-project',
        snapshot: true,
        spec: '*',
        expectedExitCode: 2
    })
})
```

From here, you could run this test with `yarn test my-new-project`.

There are many more options available for `systemTests.it` and `systemTests.setup`. You can massage the stdout, do pre-run tasks, set up HTTP/S servers, and more. Explore the typedocs in [`./lib/system-tests`](./lib/system-tests) for more information.

These tests run in the `system-tests-*` CI jobs.

### Reusable Project Fixtures

In some situations, we want to test the same cypress project against multiple `node_modules` configurations. This is very common in component testing, where we want to ensure that the `cypress/react` package is compatible with different versions of React, or ensure that the `cypress/webpack-dev-server` is compatible with different versions of webpack.

The [project-fixtures](./project-fixtures) directory helps us here. Rather than duplicating the same set of files and needing to update in multiple places, we can specify a Cypress project in a folder, and if the project's `package.json` specifies a:

```
"projectFixtureDirectory": "$PROJECT_FIXTURE_FOLDER"`
```

We will automatically copy the contents of the `project-fixtures` folder into the project just after it has been scaffolded.

See the [package.json](./projects/webpack5_wds5-react/package.json) for the [webpack5_wds5-react](./projects/webpack5_wds5-react) package as an example of this pattern, and the [webpack-dev-server react tests](../npm/webpack-dev-server/cypress/e2e/react.cy.ts) as an example use.

### Developing Docker-based tests against built binary

Specs in the [`./test`](./test) directory are run against an unbuilt Cypress App. They don't test `cypress` NPM package installation or other prod app behavior. This is done so that they can run as fast as possible in CI, without waiting for a full build of the Cypress App.

Specs in [`./test-binary`](./test-binary) are run against the *built Cypress App*. They also run inside of their own Docker containers to give a blank slate environment for Cypress to run in. Before each test, the prod CLI is `npm install`ed along with the built Cypress `.zip`, and real `cypress run` commands are used to run the tests. There should be no functional difference between running a project in these tests and running real prod Cypress inside of Docker in CI.

The purpose of these tests is to test things that we normally can't inside of regular `system-tests`, such as testing Cypress with different Node versions, with/without Xvfb, or inside of different operating system versions.

An example of using `dockerImage` and `withBinary` to write a binary system test:

```ts
// ./test-binary/node-versions.spec.ts
import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

describe('node versions', () => {
    systemTests.it('runs in node 12', {
        dockerImage: 'cypress:node/12',
        project: 'todos',
        withBinary: true,
    })
})
```

Running `yarn test node-versions` would spin up a local Docker container for `cypress:node/12`, install Cypress from `../cypress.zip` and `../cli/build`, and then call the regular `cypress run` command within the container. Other options for `systemTests.it` such as `onRun` and `expectedExitCode` still function normally.

These tests run in the `binary-system-tests` CI job.

### Updating Snapshots

Prepend `SNAPSHOT_UPDATE=1` to any test command. See [`snap-shot-it` instructions](https://github.com/bahmutov/snap-shot-it#advanced-use) for more info.

```bash
SNAPSHOT_UPDATE=1 yarn test go_spec
```

If you are on a Retina device, you may get mismatching screenshot dimensions when updating snapshots. To resolve this, you can set the `SNAPSHOT_BROWSER` environment variable to `chrome` when you update the snapshots.

### Test Projects

Every folder in [`./projects`](./lib/projects) represents a self-contained Cypress project. When you pass the `project` property to `systemTests.it` or `systemTests.exec`, Cypress launches using this project.

If a test project has a `package.json` file, the `systemTests.exec` helper will attempt to install the correct `node_modules` by running `yarn install` or `npm install` (depending on which lockfile is present) against the project. This is cached in CI and locally to speed up test times.

`systemTests.exec` *copies* the project directory to a temporary folder outside of the monorepo root. This means that temporary projects will not inherit the `node_modules` from this package or the monorepo. So, you must add the dependencies required for your project in `dependencies` or `devDependencies`.

The exception is some commonly used packages that are scaffolded for all projects, like `lodash` and `debug`. You can see the list by looking at `scaffoldCommonNodeModules` in [`./lib/fixtures.ts`](./lib/fixtures.ts) These packages do not need to be added to a test project's `package.json`.

You can also set special properties in a test project's `package.json` to influence the helper's behavior when running `yarn` or `npm`:

`package.json` Property Name | Type | Description
--- | --- | ---
`_cySkipDepInstall` | `boolean` | If `true`, skip the automatic `yarn install` or `npm install` for this package, even though it has a `package.json`.
`_cyYarnV311` | `boolean` | Run the yarn v3.1.1-style install command instead of yarn v1-style.
`_cyRunScripts` | `boolean` | By default, the automatic install will not run postinstall scripts. This option, if set, will cause postinstall scripts to run for this project.

Run `yarn projects:yarn:install` to run `yarn install`/`npm install` for all applicable projects.

Use the `UPDATE_LOCK_FILE=1` environment variable with `yarn test` or `yarn projects:yarn:install` to allow the `yarn.lock` or `package-lock.json` to be updated and synced back to the monorepo from the temp dir.
