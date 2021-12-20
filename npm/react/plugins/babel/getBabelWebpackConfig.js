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

/**
  * `on` and `config` are mandatory and must be forwarded from
  * your plugins file (`cypress/plugins/index.js` by default).
  * the third argument is an optional object with a `setWebpackConfig`
  * property. It's a function that will receive the webpack configuration
  * (after babel-loader is added) that allows you to further modify
  * the webpack configuration
  *
  * @example
  * module.exports = (on, config) => {
  *   require('@cypress/react/plugins/babel')(on, config, {
  *     setWebpackConfig: (webpackConfig) => {
  *       webpackConfig.resolve.alias = {
  *         '@my-monorepo/my-package': '../../my-package/src',
  *       }
  *       return webpackConfig
  *     }
  *   })
  *   return config
  * }
  */
module.exports = (config, { setWebpackConfig } = { setWebpackConfig: null }) => {
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

  if (setWebpackConfig) {
    return setWebpackConfig(webpackConfigLoadsBabel)
  }

  return webpackConfigLoadsBabel
}
