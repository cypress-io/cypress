const path = require('path')
const webpack = require('webpack')
const debug = require('debug')('cypress:webpack')

const createDeferred = require('./deferred')
const stubbableRequire = require('./stubbable-require')

const bundles = {}

// we don't automatically load the rules, so that the babel dependencies are
// not required if a user passes in their own configuration
const getDefaultWebpackOptions = () => {
  debug('load default options')

  return {
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: [/node_modules/],
          use: [
            {
              loader: stubbableRequire.resolve('babel-loader'),
              options: {
                presets: [stubbableRequire.resolve('@babel/preset-env')],
              },
            },
          ],
        },
      ],
    },
  }
}

// export a function that returns another function, making it easy for users
// to configure like so:
//
// on('file:preprocessor', webpack(options))
//
const preprocessor = (options = {}) => {
  debug('user options:', options)

  // we return function that accepts the arguments provided by
  // the event 'file:preprocessor'
  //
  // this function will get called for the support file when a project is loaded
  // (if the support file is not disabled)
  // it will also get called for a spec file when that spec is requested by
  // the Cypress runner
  //
  // when running in the GUI, it will likely get called multiple times
  // with the same filePath, as the user could re-run the tests, causing
  // the supported file and spec file to be requested again
  return (file) => {
    const filePath = file.filePath

    debug('get', filePath)

    // since this function can get called multiple times with the same
    // filePath, we return the cached bundle promise if we already have one
    // since we don't want or need to re-initiate webpack for it
    if (bundles[filePath]) {
      debug(`already have bundle for ${filePath}`)

      return bundles[filePath]
    }

    // user can override the default options
    let webpackOptions = options.webpackOptions || getDefaultWebpackOptions()
    const watchOptions = options.watchOptions || {}

    debug('webpackOptions: %o', webpackOptions)
    debug('watchOptions: %o', watchOptions)

    const entry = [filePath].concat(options.additionalEntries || [])
    // we're provided a default output path that lives alongside Cypress's
    // app data files so we don't have to worry about where to put the bundled
    // file on disk
    const outputPath = file.outputPath

    // we need to set entry and output
    webpackOptions = Object.assign(webpackOptions, {
      entry,
      output: {
        path: path.dirname(outputPath),
        filename: path.basename(outputPath),
      },
    })

    if (webpackOptions.devtool !== false) {
      webpackOptions.devtool = 'inline-source-map'
    }

    debug(`input: ${filePath}`)
    debug(`output: ${outputPath}`)

    const compiler = webpack(webpackOptions)

    // we keep a reference to the latest bundle in this scope
    // it's a deferred object that will be resolved or rejected in
    // the `handle` function below and its promise is what is ultimately
    // returned from this function
    let latestBundle = createDeferred()
    // cache the bundle promise, so it can be returned if this function
    // is invoked again with the same filePath
    bundles[filePath] = latestBundle.promise

    const rejectWithErr = (err) => {
      err.filePath = filePath
      // backup the original stack before it's potentially modified by bluebird
      err.originalStack = err.stack
      debug(`errored bundling ${outputPath}`, err)
      latestBundle.reject(err)
    }

    // this function is called when bundling is finished, once at the start
    // and, if watching, each time watching triggers a re-bundle
    const handle = (err, stats) => {
      if (err) {
        return rejectWithErr(err)
      }

      const jsonStats = stats.toJson()

      if (stats.hasErrors()) {
        err = new Error('Webpack Compilation Error')
        err.stack = jsonStats.errors.join('\n\n')
        return rejectWithErr(err)
      }

      // these stats are really only useful for debugging
      if (jsonStats.warnings.length > 0) {
        debug(`warnings for ${outputPath}`)
        debug(jsonStats.warnings)
      }

      debug('finished bundling', outputPath)
      // resolve with the outputPath so Cypress knows where to serve
      // the file from
      latestBundle.resolve(outputPath)
    }

    // this event is triggered when watching and a file is saved
    const plugin = { name: 'CypressWebpackPreprocessor' }

    const onCompile = () => {
      debug('compile', filePath)
      // we overwrite the latest bundle, so that a new call to this function
      // returns a promise that resolves when the bundling is finished
      latestBundle = createDeferred()
      bundles[filePath] = latestBundle.promise.tap(() => {
        debug('- compile finished for', filePath)
        // when the bundling is finished, emit 'rerun' to let Cypress
        // know to rerun the spec
        file.emit('rerun')
      })
    }

    // when we should watch, we hook into the 'compile' hook so we know when
    // to rerun the tests
    if (file.shouldWatch) {
      debug('watching')

      if (compiler.hooks) {
        compiler.hooks.compile.tap(plugin, onCompile)
      } else {
        compiler.plugin('compile', onCompile)
      }
    }

    const bundler = file.shouldWatch ? compiler.watch(watchOptions, handle) : compiler.run(handle)

    // when the spec or project is closed, we need to clean up the cached
    // bundle promise and stop the watcher via `bundler.close()`
    file.on('close', () => {
      debug('close', filePath)
      delete bundles[filePath]

      if (file.shouldWatch) {
        bundler.close()
      }
    })

    // return the promise, which will resolve with the outputPath or reject
    // with any error encountered
    return bundles[filePath]
  }
}

// provide a clone of the default options, lazy-loading them
// so they aren't required unless the user utilizes them
Object.defineProperty(preprocessor, 'defaultOptions', {
  get () {
    debug('get default options')

    return {
      webpackOptions: getDefaultWebpackOptions(),
      watchOptions: {},
    }
  },
})

module.exports = preprocessor
