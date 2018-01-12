# Cypress Webpack Preprocessor [![CircleCI](https://circleci.com/gh/cypress-io/cypress-webpack-preprocessor.svg?style=svg)](https://circleci.com/gh/cypress-io/cypress-webpack-preprocessor) [![semantic-release][semantic-image] ][semantic-url]

Cypress preprocessor for bundling JavaScript via webpack

## Installation

Requires [Node](https://nodejs.org/en/) version 6.5.0 or above.

```sh
npm install --save-dev @cypress/webpack-preprocessor
```

## Usage

In your project's [plugins file](https://on.cypress.io/guides/guides/plugins.html):

```javascript
const webpack = require('@cypress/webpack-preprocessor')

module.exports = (on) => {
  on('file:preprocessor', webpack())
}
```

## Options

Pass in options as the second argument to `webpack`:

```javascript
const webpack = require('@cypress/webpack-preprocessor')
module.exports = (on) => {
  const options = {
    // send in the options from your webpack.config.js, so it works the same
    // as your app's code
    webpackOptions: require('../../webpack.config'),
    watchOptions: {},
  }

  on('file:preprocessor', webpack(options))
}
```

### webpackOptions

Object of webpack options. Just `require` in the options from your `webpack.config.js` to use the same options as your app.

**Default**:

```javascript
{
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: [/node_modules/],
        use: [{
          loader: 'babel-loader',
          options: {
            presets: [
              'babel-preset-env',
              'babel-preset-react',
            ],
          },
        }],
      },
    ],
  },
}
```

### watchOptions

Object of options for watching. See [webpack's docs](https://webpack.github.io/docs/node.js-api.html#compiler).

**Default**: `{}`

## Modifying default options

The default options are provided as `webpack.defaultOptions` so they can be more easily modified.

If, for example, you want to update the options for the `babel-loader` to add the [stage-3 preset](https://babeljs.io/docs/plugins/preset-stage-3/), you could do the following:

```javascript
const webpack = require('@cypress/webpack-preprocessor')

module.exports = (on) => {
  const options = webpack.defaultOptions
  options.webpackOptions.module.rules[0].use[0].options.presets.push('babel-preset-stage-3')

  on('file:preprocessor', webpack(options))
}
```

## Contributing

Run all tests once:

```shell
npm test
```

Run tests in watch mode:

```shell
npm run test-watch
```

## License

This project is licensed under the terms of the [MIT license](/LICENSE.md).

[semantic-image]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-url]: https://github.com/semantic-release/semantic-release
