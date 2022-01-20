# cypress-ct-example-vue-cli

An Example of how to use Cypress component testing within the Vue CLI

## Install Cypress component testing in Vue CLI

When using, `vue create` to scaffold a new vue project, we can use these steps to setup component testing.

### Install dependencies

TLDR:

```bash
yarn add -D cypress @cypress/webpack-dev-server @cypress/vue
```

We need to install:
- `cypress` as it contains all the tools for finding items, clicking on buttons and do what we would do in the tests.
- `@cypress/webpack-dev-server` to see the tested components in an environment similar to your app, where they will be used,. We do this to enable importing css files, importing typescript libraries, allow custom webpack aliases. This will enable for example the use of `~` `require('~/assets/styles.css')`.
- `@cypress/vue` will offer a simple and standard function to mount the components in our test window so that we can use cypress to check if they behave as we expect.


### Configure Cypress

To setup any Cypress runner, the standard way is to create a `cypress.json` file at the root of your project. Checkout [the docs](https://on.cypress.io/guides/configuration) to know the extend of your options.

Here is the `cypress.json` file at work in this project:

```js
// cypress.json
{
  // Set this porperty to false to avoid cypress creating 
  // example `fixture` and `support` folders for fixtures and support files
  // Remove the 2 lines if you are
  "fixturesFolder": false,
  "supportFile": false,
  // Tell Cypress how to recognize spec files  
  "testFiles": "**/*spec.js",
  // All the component test files are 
  // located in this directory and its sub-directory
  "componentFolder": "src"
}
```

### Setup Cypress plugins

For the last step of the install process, create a `cypress/plugin/index.js` file.
This file will let Cypress know how to start the testing server with your Nuxt configuration.

Since Vue CLI uses webpack under the hood to build your app, it can export a webpack config object.
Ask Vue CLi to return this config this webpack config using the `@vue/cli-service/webpack.config` import.

```js
/// <reference types="cypress" />
const { startDevServer } = require('@cypress/webpack-dev-server')
const webpackConfig = require('@vue/cli-service/webpack.config')

/**
 * @type Cypress.PluginConfig
 */
module.exports = (on, config) => {
  on('dev-server:start', (options) => {
    return startDevServer({
      options,
      webpackConfig: modifiedWebpackConfig,
    })
  })

  return config
}

```

> NOTE: both the `on` handler function and the PluginConfig return something. Don't forget those returns.


### PWA Plugin compatibility

The PWA plugin for vue cli uses an unsupported version of HTMLWebpackPlugin: version 3
To avoid Cypress failing to mount, you can remove the faulty webpack plugin by doing this in your `on('dev-start')` handler:

```js
const modifiedWebpackConfig = {
    ...webpackConfig,
    plugins: (webpackConfig.plugins || []).filter((x) => {
        return x.constructor.name !== 'HtmlPwaPlugin'
    }),
}
```