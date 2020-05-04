# Recipes

- [Do nothing](#do-nothing)
- [React scripts](#react-scripts)
- [Your own Webpack config](#your-webpack-config)
- [Your own Babelrc](#your-babelrc-file)

## Do nothing

Cypress Test Runner understands plain JSX by default, so for simple React applications it ... might just test components right out of the box!

But usually you want to point Cypress at your application's current Webpack configuration, so the specs can import your components correctly. The next recipes discuss common ways for doing this.

## React Scripts

If you are using Create-React-App v3 or `react-scripts`, and want to reuse the built in webpack before ejecting, this module ships with Cypress preprocessor in [plugins](plugins) folder.

```js
// cypress/plugins/index.js
module.exports = (on, config) => {
  require('cypress-react-unit-test/plugins/react-scripts')(on, config)
  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
```

See example repo [bahmutov/try-cra-with-unit-test](https://github.com/bahmutov/try-cra-with-unit-test)

**Tip:** `plugins/react-scripts` is just loading `plugins/cra-v3`.

**⚠️ Note:** when using `react-scripts` you must place component specs in the `src` folder too, otherwise they won't be transpiled correctly.

## Your webpack config

If you have your own webpack config, you can use included plugins file to load it. You can pass the webpack config file name (with respect to the root folder where `cypress.json` file sits) via plugins file or via an `env` variable in `cypress.json`

```js
// cypress/plugins/index.js
module.exports = (on, config) => {
  // from the root of the project (folder with cypress.json file)
  config.env.webpackFilename = 'webpack.config.js'
  require('cypress-react-unit-test/plugins/load-webpack')(on, config)
  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
```

See example in [bahmutov/Jscrambler-Webpack-React](https://github.com/bahmutov/Jscrambler-Webpack-React).

## Your `.babelrc` file

If you are using Babel without Webpack to transpile, you can use the plugin that tells Babel loader to use your configuration file.

```js
// cypress/plugins/index.js
module.exports = (on, config) => {
  // tell Cypress to bundle specs and components using project's .babelrc file
  require('cypress-react-unit-test/plugins/babelrc')(on, config)
  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
```

**Bonus:** in order to enable code instrumentation, add the `babel-plugin-istanbul` (included in this plugin) to your `.babelrc` setup. You can place it under `test` environment to avoid instrumenting production code. Example `.babelrc` config file that you can execute with `BABEL_ENV=test npx cypress open`

```json
{
  "presets": [
    "@babel/preset-env",
    "@babel/preset-react",
    {
      "plugins": ["@babel/plugin-proposal-class-properties"]
    },
    "@emotion/babel-preset-css-prop"
  ],
  "env": {
    "test": {
      "plugins": ["babel-plugin-istanbul"]
    }
  }
}
```

See [bahmutov/react-loading-skeleton](https://github.com/bahmutov/react-loading-skeleton) example
