const path = require('path')
const webpack = require('webpack')
const log = require('debug')('cypress:webpack')

const createDeferred = require('./deferred')

const bundles = {}

// by default, we transform JavaScript (up to anything at stage-4) and JSX
const defaultOptions = {
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

// export a function that returns another function, making it easy for users
// to configure like so:
//
// register('on:spec:file:preprocessor', webpack(config, userOptions))
//
const preprocessor = (config, userOptions = {}) => {
  if (!config || typeof config.isTextTerminal !== 'boolean') {
    throw new Error(`Cypress Webpack Preprocessor must be called with the Cypress config as its first argument. You passed: ${JSON.stringify(config, null, 2)}`)
  }

  log('user options:', userOptions)


  // we return function that accepts the arguments provided by
  // the event 'on:spec:file:preprocessor'
  //
  // this function will get called for the support file when a project is loaded
  // (if the support file is not disabled)
  // it will also get calledfor a spec file when that spec is requested by
  // the Cypress runner
  //
  // when running in the GUI, it will likely get called multiple times
  // with the same filePath, as the user could re-run the tests, causing
  // the supported file and spec file to be requested again
  return (filePath, util) => {
    log('get', filePath)

    // since this function can get called multiple times with the same
    // filePath, we return the cached bundle promise if we already have one
    // since we don't want or need to re-initiate webpack for it
    if (bundles[filePath]) {
      log(`already have bundle for ${filePath}`)
      return bundles[filePath]
    }

    // if we're in a text terminal, this is a one-time run, probably in CI
    // so we don't need to watch
    const shouldWatch = !config.isTextTerminal
    // util.getOutputPath returns a path alongside Cypress's other app data
    // files so we don't have to worry about where to put the bundled
    // file on disk
    const outputPath = util.getOutputPath(filePath)

    // user can override the default options
    let webpackOptions = Object.assign({}, defaultOptions.webpackOptions, userOptions.webpackOptions)
    let watchOptions = Object.assign({}, defaultOptions.watchOptions, userOptions.watchOptions)

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

    // we keep a reference to the latest bundle in this scope
    // it's a deferred object that will be resolved or rejected in
    // the `handle` function below and its promise is what is ultimately
    // returned from this function
    let latestBundle = createDeferred()
    // cache the bundle promise, so it can be returned if this function
    // is invoked again with the same filePath
    bundles[filePath] = latestBundle.promise

    // this function is called when bundling is finished, once at the start
    // and, if watching, each time watching triggers a re-bundle
    const handle = (err, stats) => {
      if (err) {
        err.filePath = filePath
        // backup the original stack before it's
        // potentially modified from bluebird
        err.originalStack = err.stack
        log(`errored bundling ${outputPath}`, err)
        return latestBundle.reject(err)
      }

      // these stats are really only useful for debugging
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
      // resolve with the outputPath so Cypress knows where to serve
      // the file from
      latestBundle.resolve(outputPath)
    }

    // this event is triggered when watching and a file is saved
    compiler.plugin('compile', () => {
      log('compile', filePath)
      // we overwrite the latest bundle, so that a new call to this function
      // returns a promise that resolves when the bundling is finished
      latestBundle = createDeferred()
      bundles[filePath] = latestBundle.promise.tap(() => {
        log('- compile finished for', filePath)
        // when the bundling is finished, we call `util.fileUpdated`
        // to let Cypress know to re-run the spec
        util.fileUpdated(filePath)
      })
    })

    if (shouldWatch) {
      log('watching')
    }

    const bundler = shouldWatch ?
      compiler.watch(watchOptions, handle) :
      compiler.run(handle)

    // when the spec or project is closed, we need to clean up the cached
    // bundle promise and stop the watcher via `bundler.close()`
    util.onClose(() => {
      log('close', filePath)
      delete bundles[filePath]

      if (shouldWatch) {
        bundler.close()
      }
    })

    // return the promise, which will resolve with the outputPath or reject
    // with any error encountered
    return bundles[filePath]
  }
}

// provide a clone of the default options
preprocessor.defaultOptions = JSON.parse(JSON.stringify(defaultOptions))

module.exports = preprocessor
