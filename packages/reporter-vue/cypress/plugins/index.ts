// const cp = require('child_process')

// cp.exec('http-server -p 5006 dist')

const express = require('express')

express().use(express.static('dist')).listen(5006)
/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on: Function, config) => {
  if (config.testingType === 'e2e') {

  } else {
    // const { startDevServer } = require('@cypress/webpack-dev-server')
    // const webpackConfig = {
    //   resolve: {
    //     extensions: ['.js', '.ts', '.jsx', '.tsx'],
    //   },
    //   mode: 'development',
    //   devtool: false,
    //   output: {
    //     publicPath: '/',
    //     chunkFilename: '[name].bundle.js',
    //   },
    //   // TODO: update with valid configuration for your components
    //   module: {
    //     rules: [
    //       {
    //         test: /\.(js|jsx|mjs|ts|tsx)$/,
    //         loader: 'babel-loader',
    //         options: { ...babelConfig, cacheDirectory: path.resolve(__dirname, '.babel-cache') },
    //       },
    //     ],
    //   },
    // }

    // on('dev-server:start', (options) => {
    //   return startDevServer({ options, webpackConfig })
    // })
  }

  return config
}

module.exports = () => {
  return
}
