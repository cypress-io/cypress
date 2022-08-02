# CLI

The CLI is used to build the [cypress npm module](https://www.npmjs.com/package/cypress) to be run within a terminal.

**The CLI has the following responsibilities:**

- Allow users to print CLI commands
- Allow users to install the Cypress executable
- Allow users to print their current Cypress version
- Allow users to run Cypress tests from the terminal
- Allow users to open Cypress in the interactive Test Runner.
- Allow users to verify that Cypress is installed correctly and executable
- Allow users to manages the Cypress binary cache
- Allow users to pass in options that change way tests are ran or recorded (browsers used, specfiles ran, grouping, parallelization)

## Building

See `scripts/build.js`. Note that the built npm package will include [NPM_README.md](NPM_README.md) as its public README file.

## Testing

### Automated

From the repo's root, you can run unit tests with:

```bash
yarn test-unit --scope cypress
yarn test-watch --scope cypress
yarn test-debug --scope cypress
```

### Updating snapshots

Prepend `SNAPSHOT_UPDATE=1` to any test command. See [`snap-shot-it` instructions](https://github.com/bahmutov/snap-shot-it#advanced-use) for more info.

```bash
SNAPSHOT_UPDATE=1 yarn test-unit --scope cypress
```

#### Type Linting

When testing with `dtslint`, you may need to remove existing typescript installations before running the type linter (for instance, on OS X, you might `rm -rf ~/.dts/typescript-installs`) in order to reproduce issues with new versions of typescript (i.e., `@next`).

### Manual

To build and test an NPM package:

- `yarn`
- `yarn build`

This creates `build` folder.

- `cd build; yarn pack`

This creates an archive, usually named `cypress-v<version>.tgz`. You can install this archive from other projects, but because there is no corresponding binary yet (probably), skip binary download. For example from inside `cypress-example-kitchensink` folder

```shell
yarn add ~/{your-dirs}/cypress/cli/build/cypress-3.3.1.tgz --ignore-scripts
```

Which installs the `tgz` file we have just built from folder `Users/jane-lane/{your-dirs}/cypress/cli/build`.

#### Sub-package API

> How do deep imports from cypress/* get resolved?

The cypress npm package comes pre-assembled with mounting libraries for major front-end frameworks. These mounting libraries are the first examples of Cypress providing re-exported sub-packages. These sub-packages follow the same naming convention they do when they're published on **npm**, but without a leading **`@`** sign. For example:

##### An example of a sub-package: @cypress/vue, @cypress/react, @cypress/mount-utils

**Let's discuss the Vue mounting library that Cypress ships.**

If you'd installed the `@cypress/vue` package from NPM, you could write the following code.

This would be necessary when trying to use a version of Vue, React, or other library that may be newer or older than the current version of cypress itself.

```js
import { mount } from '@cypress/vue'
```

Now, with the sub-package API, you're able to import the latest APIs directly from Cypress without needing to install a separate dependency.

```js
import { mount } from 'cypress/vue'
```

The only difference is the import name, and if you still need to use a specific version of one of our external sub-packages, you may install it and import it directly.

##### Adding a new sub-package

There are a few steps when adding a new sub-package.

1. Make sure the sub-package's rollup build is _self-contained_ or that any dependencies are also declared in the CLI's **`package.json`**.
2. Now, in the **`postbuild`** script for the sub-package you'd like to embed, invoke `node ./scripts/sync-exported-npm-with-cli.js` (relative to the sub-package, see **`npm/vue`** for an example).
3. Add the sub-package's name to the following locations:
  - **`cli/.gitignore`**
  - **`cli/scripts/post-build.js`**
  - **`.eslintignore`** (under cli/sub-package)
4. DO NOT manually update the **package.json** file. Running `yarn build` will automate this process.
5. Commit the changed files.

[Here is an example Pull Request](https://github.com/cypress-io/cypress/pull/20930/files#diff-21b1fe66043572c76c549a4fc5f186e9a69c330b186fc91116b9b70a4d047902)

#### Module API

The module API can be tested locally using something like:

```typescript
/* @ts-ignore */
import cypress from '../../cli/lib/cypress'

const run = cypress.run as (options?: Partial<CypressCommandLine.CypressRunOptions>) => Promise<CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult>

run({
  spec: './cypress/component/advanced/framer-motion/Motion.spec.tsx',
  testingType: 'component',
  /* @ts-ignore */
  dev: true,
}).then(results => {
  console.log(results)
})
```

Note that the `dev` flag is required for local testing, as otherwise the command will fail with a binary error.
