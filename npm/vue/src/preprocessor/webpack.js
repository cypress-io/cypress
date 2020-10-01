import webpack from 'webpack'
import util from 'util'

// Cypress webpack bundler adaptor
// https://github.com/cypress-io/cypress-webpack-preprocessor
const webpackPreprocessor = require('@cypress/webpack-preprocessor')
const debug = require('debug')('@cypress/vue')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
// const { VueLoaderPlugin } = require('vue-loader')
const fw = require('find-webpack')

// Preventing chunks because we don't serve static assets
function preventChunking (options = {}) {
  if (options && options.optimization && options.optimization.splitChunks) {
    delete options.optimization.splitChunks
  }

  options.plugins = options.plugins || []
  options.plugins.push(
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1, // no chunks from dynamic imports -- includes the entry file
    }),
  )

  return options
}

// Base 64 all the things because we don't serve static assets
function inlineUrlLoadedAssets (options = {}) {
  const isUrlLoader = (use) => {
    return use && use.loader && use.loader.indexOf('url-loader') > -1
  }
  const mergeUrlLoaderOptions = (use) => {
    if (isUrlLoader(use)) {
      use.options = use.options || {}
      use.options.limit = Number.MAX_SAFE_INTEGER
    }

    return use
  }

  if (options.module && options.module.rules) {
    options.module.rules = options.module.rules.map((rule) => {
      if (Array.isArray(rule.use)) {
        rule.use = rule.use.map(mergeUrlLoaderOptions)
      }

      return rule
    })
  }

  return options
}

function compileTemplate (options = {}) {
  options.resolve = options.resolve || {}
  options.resolve.alias = options.resolve.alias || {}
  options.resolve.alias['vue$'] = 'vue/dist/vue.esm.js'
}

/**
 * Warning: modifies the input object
<<<<<<< HEAD
 * @param {WebpackOptions} options
 */

function removeForkTsCheckerWebpackPlugin (options) {
  if (!Array.isArray(options.plugins)) {
    return
  }

  options.plugins = options.plugins.filter((plugin) => {
    return plugin.typescript === undefined
  })
}

/**
 * Warning: modifies the input object
=======
>>>>>>> origin
 * @param {Cypress.ConfigOptions} config
 * @param {WebpackOptions} options
 */
function insertBabelLoader (config, options) {
  const skipCodeCoverage = config && config.env && config.env.coverage === false

  if (!options.devtool) {
    options.devtool = '#eval-source-map'
  }

  const babelRule = {
    test: /\.js$/,
    loader: 'babel-loader',
    exclude: /node_modules/,
    options: {
      plugins: [
        // this plugin allows ES6 imports mocking
        [
          '@babel/plugin-transform-modules-commonjs',
          {
            loose: true,
          },
        ],
      ],
    },
  }

  if (skipCodeCoverage) {
    debug('not adding code instrument plugin')
  } else {
    debug('adding code coverage plugin')
    // this plugin instruments the loaded code
    // which allows us to collect code coverage
    const instrumentPlugin = [
      'babel-plugin-istanbul',
      {
        // specify some options for NYC instrumentation here
        // like tell it to instrument both JavaScript and Vue files
        extension: ['.js', '.vue'],
      },
    ]

    babelRule.options.plugins.push(instrumentPlugin)
  }

  options.module = options.module || {}
  options.module.rules = options.module.rules || []
  options.module.rules.push(babelRule)
  options.plugins = options.plugins || []

  const pluginFound = options.plugins.find((plugin) => {
    return (
      plugin.constructor && plugin.constructor.name === VueLoaderPlugin.name
    )
  })

  if (!pluginFound) {
    debug('inserting VueLoaderPlugin')
    options.plugins.push(new VueLoaderPlugin())
  } else {
    debug('found plugin VueLoaderPlugin already')
  }
}

/**
 * Basic Cypress Vue Webpack file loader for .vue files.
 */
const onFileDefaultPreprocessor = (config, webpackOptions = fw.getWebpackOptions()) => {
  if (!webpackOptions) {
    debug('Could not find webpack options, starting with default')
    webpackOptions = {}
  }

  webpackOptions.mode = 'development'

  inlineUrlLoadedAssets(webpackOptions)
  preventChunking(webpackOptions)
  compileTemplate(webpackOptions)
  insertBabelLoader(config, webpackOptions)

  // if I remove it, then get another message
  // [VueLoaderPlugin Error] No matching use for vue-loader is found.
  // removeForkTsCheckerWebpackPlugin(webpackOptions)

  if (debug.enabled) {
    console.error('final webpack')
    console.error(util.inspect(webpackOptions, false, 2, true))
  }

  return webpackPreprocessor({
    webpackOptions,
  })
}

/**
 * Custom Vue loader from the client projects that already have `webpack.config.js`
 *
 * @example
 *    const {
 *      onFilePreprocessor
 *    } = require('@cypress/vue/preprocessor/webpack')
 *    module.exports = on => {
 *      on('file:preprocessor', onFilePreprocessor('../path/to/webpack.config'))
 *    }
 */
const onFilePreprocessor = (webpackOptions) => {
  if (typeof webpackOptions === 'string') {
    // load webpack config from the given path
    webpackOptions = require(webpackOptions)
  }

  return webpackPreprocessor({
    webpackOptions,
  })
}

module.exports = { onFilePreprocessor, onFileDefaultPreprocessor }
