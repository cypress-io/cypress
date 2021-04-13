<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200"
      src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
  <h1>Lazy Compile Webpack Plugin</h1>
  <p>Plugin that saves a tremendous amount of time.</p>
</div>

## Fork from https://github.com/liximomo/lazy-compile-webpack-plugin/

To enable windows compatibility we forked this repo and fixed the windows issue.

## Why

Starting the development server is taking you a long time when the codebase is large. You have tried dynamic imports, it only does a load-on-demand, the whole project was still been compiled. We don't want to wait a couple of minutes for a simple modification. People don't waste time for the things they have never used!

## Install

```sh
# npm
npm i -D lazy-compile-webpack-plugin

# yarn
yarn add -D lazy-compile-webpack-plugin
```

## Usage

```js
const LazyCompilePlugin = require('lazy-compile-webpack-plugin');

module.exports = {
  entry: 'index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'bundle.js',
  },
  plugins: [new LazyCompilePlugin()],
};
```

## Options

|                       Name                        |          Type           |   Default   | Description                                              |
| :-----------------------------------------------: | :---------------------: | :---------: | :------------------------------------------------------- |
| **[`refreshAfterCompile`](#refreshAfterCompile)** |        `boolean`        |   `false`   | Enable/Disable _page refresh_ when compilation is finish |
|             **[`ignores`](#ignores)**             | `RegExp[] \| Function[]` | `undefined` | Request to be ignored from lazy compiler                 |

### `refreshAfterCompile`

Type: `boolean`
Default: `false`

Set `false` for a seamless dev experience.

### `ignores`

Type: `RegExp[] | ((request: string, wpModule: object) => boolean)`
Default: `undefined`

Request to be ignored from lazy compiler, `html-webpack-plugin` is always ignored.

Specifically, an Angular app should enable this option like following:

```js
new LazyCompileWebpackPlugin({
  ignores: [
    /\b(html|raw|to-string)-loader\b/,
    /\bexports-loader[^?]*\?exports\.toString\(\)/
  ],
});
```
