# Cypress Webpack Preprocessor (Batteries Included)

Cypress preprocessor for bundling JavaScript via webpack, with dependencies included and support for:

- Various proposal-stage ES features
- TypeScript
- CoffeeScript

## Why?

This preprocessor is a wrapper for [@cypress/webpack-preprocessor](https://github.com/cypress-io/cypress/tree/develop/npm/webpack-preprocessor#readme). The webpack preprocessor does not include any extra dependencies (e.g. `babel-loader`, `ts-loader`), since most users will use their own `webpack.config.js` with it and already have the necessary dependencies installed. This preprocessor is for users who do not have those dependencies installed and would prefer not to configure the preprocessor to handle things like TypeScript and CoffeeScript.

## Installation

Note that installing [@cypress/webpack-preprocessor](https://github.com/cypress-io/cypress-webpack-preprocessor) is also required. This allows you to update its version separately from this wrapper.

For webpack `v5`, use `@cypress/webpack-batteries-included-preprocessor@3.x.x` and up. For webpack `v4`, use `@cypress/webpack-batteries-included-preprocessor@2.x.x`.

```sh
npm install --save-dev @cypress/webpack-batteries-included-preprocessor @cypress/webpack-preprocessor
```

## Usage

In your project's [cypress.config.js file](https://on.cypress.io/guides/tooling/plugins-guide.html):

```javascript
const webpackPreprocessor = require('@cypress/webpack-batteries-included-preprocessor')

module.exports = (on) => {
  on('file:preprocessor', webpackPreprocessor())
}
```

To enable TypeScript support, install TypeScript (if not already installed in your project `npm install --save-dev typescript`) and provide its location with the `typescript` option:

```javascript
const webpackPreprocessor = require('@cypress/webpack-batteries-included-preprocessor')

module.exports = (on) => {
  on('file:preprocessor', webpackPreprocessor({
    typescript: require.resolve('typescript')
  }))
}
```

As of version `4.x.x`, `@cypress/webpack-batteries-included-preprocessor` only includes the `buffer`, `path`, `process`, `os`, and `stream` built-ins. If your project requires built-ins not provided, you can retrieve the preprocessor's default Webpack options and decorate them as needed.

```javascript
const webpackPreprocessor = require('@cypress/webpack-batteries-included-preprocessor')

function getWebpackOptions () {
  const options = webpackPreprocessor.getFullWebpackOptions()

  // add built-ins as needed
  options.resolve.fallback.zlib = require.resolve('browserify-zlib')

  return options
}

module.exports = (on) => {
  on('file:preprocessor', webpackPreprocessor({
    webpackOptions: getWebpackOptions()
  }))
}
```

Please see [resolve.fallback](see https://webpack.js.org/configuration/resolve/#resolvefallback) for more information on what built-ins can be shimmed.

Other than the `typescript` option, this preprocessor supports the same options as [@cypress/webpack-preprocessor](https://github.com/cypress-io/cypress/tree/develop/npm/webpack-preprocessor#readme), so see its [README](https://github.com/cypress-io/cypress/tree/develop/npm/webpack-preprocessor#readme) for more information.

## Debugging

If having issues with chunk load errors or bundle size problems, specifically in your end-to-end tests, please try setting `DEBUG=cypress-verbose:webpack-batteries-included-preprocessor:bundle-analyzer` before starting Cypress to get a `webpack-bundle-analyzer` report to help determine the cause of the issue. If filing an issue with Cypress, please include this report with your issue to better help us serve your issue.

## Contributing

Use the [version of Node that matches Cypress](https://github.com/cypress-io/cypress/blob/develop/.node-version).

Run the tests:

```shell
yarn test
```

## License

This project is licensed under the terms of the [MIT license](/LICENSE.md).

[semantic-image]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-url]: https://github.com/semantic-release/semantic-release

## Changelog

[Changelog](./CHANGELOG.md)
