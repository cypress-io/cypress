# Cypress Webpack Preprocessor

Cypress preprocessor for bundling JavaScript via webpack

## Installation

Requires [Node](https://nodejs.org/en/) version 6.5.0 or above.

```sh
npm install --save-dev cypress-webpack-preprocessor
```

## Usage

In your project's [plugins file](https://on.cypress.io/guides/plugins):

```javascript
const webpack = require('@cypress/webpack-preprocessor')

module.exports = (register, config) => {
  register('on:spec:file:preprocessor', webpack(config))
}
```

## Options

Pass in options as the second argument to `webpack`:

```javascript
module.exports = (register, config) => {
  const options = {
    // send in the options from your webpack.config.js, so it works the same
    // as your app's code
    webpackOptions: require('../../webpack.config'),
    watchOptions: {},
  }

  register('on:spec:file:preprocessor', webpack(config, options))
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

module.exports = (register, config) => {
  const options = webpack.defaultOptions
  options.webpackOptions.module.rules[0].use.options.presets.push('babel-preset-stage-3')

  register('on:spec:file:preprocessor', webpack(config, options))
}
```

## License

This project is licensed under the terms of the [MIT license](/LICENSE.md).
