# cypress-ct-example-vite

Example of usage of Cypress component testing within Vite

## Disclaimer

This package is meant to run within the cypress monorepo.
If you copy this project out of the Cypress monorepo, It will work.
Do not forget to replace the cypress commands in the `package.json` scripts:

- Open `package.json`
- find the `test` and `cy:open` scripts
- In those scripts, replace `node ../../../../scripts/cypress` by only `cypress`

You should obtain 

```diff
{
  "scripts":{
-    "cy:open": "node ../../../../scripts/cypress open-ct",
+    "cy:open": "cypress open-ct",
-    "test": "node ../../../../scripts/cypress run-ct"
+    "test": "cypress run-ct"
  }
}
```



## Build Setup

```bash
# install dependencies
$ yarn install

# start Cypress component testing
$ yarn cy:open

# run all component tests at once for example on CI
$ yarn test
```

## Installing Cypress component testing

In a project created using nuxt-create-app, install Cypress component testing by following these steps:

### Install dependencies

TLDR:

```bash
yarn add -D cypress @cypress/vite-dev-server @cypress/vue@3
```

We need to install:
- `cypress` as it contains all the tools for finding items, clicking on buttons and do what we would do in the tests.
- `@cypress/vite-dev-server` to see the tested components in an environment similar to your app, where they will be used,. We do this to enable importing css files, importing typescript libraries, allow custom webpack aliases. This will enable for example the use of `~` `require('~/assets/styles.css')`.
- `@cypress/vue` will offer a simple and standard function to mount the components in our test window so that we can use cypress to check if they behave as we expect.


### Configure Cypress

To setup any Cypress runner, the standard way is to create a `cypress.json` file at the root of your project. Checkout [the docs](https://docs.cypress.io/guides/references/configuration) to know the extend of your options.

Here is the `cypress.json` file at work in this project:

```js
// cypress.json
{
  // Set this porperty to false to avoid cypress creating 
  // example `fixture` and `support` folders for fixtures and support files
  // Remove the 2 lines if you are
  "fixturesFolder": false,
  // Tell Cypress how to recognize spec files  
  "testFiles": "**/*spec.ts",
  // All the component test files are 
  // located in this directory and its sub-directory
  "componentFolder": "src"
}
```

### Setup Cypress plugins

For the last step of the install process, create a `cypress/plugin/index.js` file.
This file will let Cypress know how to start the testing server.

```js
/// <reference types="cypress" />
const { startDevServer } = require('@cypress/vite-dev-server')

/**
 * @type Cypress.PluginConfig
 */
module.exports = (on, config) => {
  on('dev-server:start', async (options) => {
    // We start the server
    return startDevServer({
      options,
    })
  })

  return config
}
```

> NOTE: both the `on` handler function and the PluginConfig return something. Don't forget those returns.




