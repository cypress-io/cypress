const path = require('path')
const webpack = require('webpack')
const log = require('debug')('cypress:webpack')

const createDeferred = require('./deferred')

const bundles = {}

const defaults = {
  webpackOptions: {
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: [/node_modules/],
          use: [{
            loader: require.resolve('babel-loader'),
            options: {
              presets: [
                'babel-preset-env',
                'babel-preset-react',
              ].map(require.resolve),
            },
          }],
        },
      ],
    },
  },
  watchOptions: {},
}

module.exports = (config, userOptions = {}) => {
  if (!config || typeof config.isTextTerminal !== 'boolean') {
    throw new Error(`Cypress Webpack Preprocessor must be called with the Cypress config as its first argument. You passed: ${JSON.stringify(config, null, 2)}`)
  }

  log('user options:', userOptions)

  return (filePath, util) => {
    log('get', filePath)

    if (bundles[filePath]) {
      log(`already have bundle for ${filePath}`)
      return bundles[filePath]
    }

    const shouldWatch = !config.isTextTerminal
    const outputPath = util.getOutputPath(filePath)

    // user can override the default options
    let webpackOptions = Object.assign({}, defaults.webpackOptions, userOptions.webpackOptions)
    let watchOptions = Object.assign({}, defaults.watchOptions, userOptions.watchOptions)

    // we need to set entry and output
    webpackOptions = Object.assign(webpackOptions, {
      entry: filePath,
      output: {
        path: path.dirname(outputPath),
        filename: path.basename(outputPath),
      },
    })

    log(`input: ${filePath}`)
    log(`output: ${outputPath}`)

    const compiler = webpack(webpackOptions)

    let latestBundle = createDeferred()
    bundles[filePath] = latestBundle.promise

    const handle = (err, stats) => {
      if (err) {
        err.filePath = filePath
        //// backup the original stack before it's
        //// potentially modified from bluebird
        err.originalStack = err.stack
        log(`errored bundling ${outputPath}`, err)
        return latestBundle.reject(err)
      }

      const jsonStats = stats.toJson()
      if (jsonStats.errors.length > 0) {
        log(`soft errors for ${outputPath}`)
        log(jsonStats.errors)
      }
      if (jsonStats.warnings.length > 0) {
        log(`warnings for ${outputPath}`)
        log(jsonStats.warnings)
      }

      log('finished bundling', outputPath)
      latestBundle.resolve(outputPath)
    }

    compiler.plugin('compile', () => {
      log('compile', filePath)
      latestBundle = createDeferred()
      bundles[filePath] = latestBundle.promise.tap(() => {
        log('- compile finished for', filePath)
        util.fileUpdated(filePath)
      })
    })

    if (shouldWatch) {
      log('watching')
    }

    const bundler = shouldWatch ?
      compiler.watch(watchOptions, handle) :
      compiler.run(handle)

    util.onClose(() => {
      log('close', filePath)
      delete bundles[filePath]

      if (shouldWatch) {
        bundler.close()
      }
    })

    return bundles[filePath]
  }
}
