// @ts-check
// uses webpack to load your .babelrc file
const debug = require('debug')('@cypress/react')

const webpackConfigLoadsBabel = {
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
  },
  mode: 'development',
  devtool: false,
  output: {
    publicPath: '/',
    chunkFilename: '[name].bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|mjs|ts|tsx)$/,
        loader: 'babel-loader',
      },
    ],
  },
}

module.exports = (on, config) => {
  debug('env object %o', config.env)

  debug('initial environments %o', {
    BABEL_ENV: process.env.BABEL_ENV,
    NODE_ENV: process.env.NODE_ENV,
  })

  const nodeEnvironment = 'test'

  if (!process.env.BABEL_ENV) {
    debug('setting BABEL_ENV to %s', nodeEnvironment)
    process.env.BABEL_ENV = nodeEnvironment
  }

  if (!process.env.NODE_ENV) {
    debug('setting NODE_ENV to %s', nodeEnvironment)
    process.env.NODE_ENV = nodeEnvironment
  }

  debug('environments %o', {
    BABEL_ENV: process.env.BABEL_ENV,
    NODE_ENV: process.env.NODE_ENV,
  })

  return webpackConfigLoadsBabel
}
