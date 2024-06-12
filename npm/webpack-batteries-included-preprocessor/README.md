# Cypress Webpack Preprocessor (Batteries Included)

Cypress preprocessor for bundling JavaScript via webpack, with dependencies included and support for:

- Various proposal-stage ES features
- TypeScript
- CoffeeScript

## Why?

This preprocessor is a wrapper for [@cypress/webpack-preprocessor](https://github.com/cypress-io/cypress/tree/develop/npm/webpack-preprocessor#readme). The webpack preprocessor does not include any extra dependencies (e.g. `babel-loader`, `ts-loader`), since most users will use their own `webpack.config.js` with it and already have the necessary dependencies installed. This preprocessor is for users who do not have those dependencies installed and would prefer not to configure the preprocessor to handle things like TypeScript and CoffeeScript.

## Installation

Note that installing [@cypress/webpack-preprocessor](https://github.com/cypress-io/cypress-webpack-preprocessor) is also required. This allows you to update its version separately from this wrapper.

For webpack `v5`, use `@cypress/webpack-batteries-included-preprocessor@3.x.x`. For webpack `v4`, use `@cypress/webpack-batteries-included-preprocessor@2.x.x`.

```sh
npm install --save-dev @cypress/webpack-batteries-included-preprocessor @cypress/webpack-preprocessor
```

## Usage

In your project's [plugins file](https://on.cypress.io/guides/tooling/plugins-guide.html):

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

Other than the `typescript` option, this preprocessor supports the same options as [@cypress/webpack-preprocessor](https://github.com/cypress-io/cypress/tree/develop/npm/webpack-preprocessor#readme), so see its README for more information.

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
