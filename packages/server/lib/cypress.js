require('./environment')

// we are not requiring everything up front
// to optimize how quickly electron boots while
// in dev or linux production. the reasoning is
// that we likely may need to spawn a new child process
// and its a huge waste of time (about 1.5secs) of
// synchronous requires the first go around just to
// essentially do it all again when we boot the correct
// mode.

const Promise = require('bluebird')
const debug = require('debug')('cypress:server:cypress')
const { getPublicConfigKeys } = require('@packages/config')
const argsUtils = require('./util/args')
const { telemetry } = require('@packages/telemetry')
const { getCtx, hasCtx } = require('@packages/data-context')

const warning = (code, args) => {
  return require('./errors').warning(code, args)
}

const exit = async (code = 0) => {
  // TODO: we shouldn't have to do this
  // but cannot figure out how null is
  // being passed into exit
  debug('about to exit with code', code)

  if (hasCtx()) {
    await getCtx().lifecycleManager.mainProcessWillDisconnect().catch((err) => {
      debug('mainProcessWillDisconnect errored with: ', err)
    })
  }

  const span = telemetry.getSpan('cypress')

  span?.setAttribute('exitCode', code)
  span?.end()

  await telemetry.shutdown().catch((err) => {
    debug('telemetry shutdown errored with: ', err)
  })

  return process.exit(code)
}

const showWarningForInvalidConfig = (options) => {
  const publicConfigKeys = getPublicConfigKeys()
  const invalidConfigOptions = require('lodash').keys(options.config).reduce((invalid, option) => {
    if (!publicConfigKeys.find((configKey) => configKey === option)) {
      invalid.push(option)
    }

    return invalid
  }, [])

  if (invalidConfigOptions.length && options.invokedFromCli) {
    return warning('INVALID_CONFIG_OPTION', invalidConfigOptions)
  }
}

const exit0 = () => {
  return exit(0)
}

const exitErr = (err) => {
  // log errors to the console
  // and potentially raygun
  // and exit with 1
  debug('exiting with err', err)

  return require('./errors').logException(err)
  .then(() => {
    debug('calling exit 1')

    return exit(1)
  })
}

module.exports = {
  isCurrentlyRunningElectron () {
    return require('./util/electron-app').isRunning()
  },

  runElectron (mode, options) {
    // wrap all of this in a promise to force the
    // promise interface - even if it doesn't matter
    // in dev mode due to cp.spawn
    return Promise.try(() => {
      // if we have the electron property on versions
      // that means we're already running in electron
      // like in production and we shouldn't spawn a new
      // process
      if (this.isCurrentlyRunningElectron()) {
        // if we weren't invoked from the CLI
        // then display a warning to the user
        if (!options.invokedFromCli) {
          warning('INVOKED_BINARY_OUTSIDE_NPM_MODULE')
        }

        debug('running Electron currently')

        return require('./modes')(mode, options)
      }

      return new Promise((resolve) => {
        debug('starting Electron')
        const cypressElectron = require('@packages/electron')

        const fn = (code) => {
          // juggle up the totalFailed since our outer
          // promise is expecting this object structure
          debug('electron finished with', code)

          if (mode === 'smokeTest') {
            return resolve(code)
          }

          return resolve({ totalFailed: code })
        }

        const args = require('./util/args').toArray(options)

        debug('electron open arguments %o', args)

        // const mainEntryFile = require.main.filename
        const serverMain = require('./cwd')()

        return cypressElectron.open(serverMain, args, fn)
      })
    })
  },

  start (argv = []) {
    debug('starting cypress with argv %o', argv)

    // if the CLI passed "--" somewhere, we need to remove it
    // for https://github.com/cypress-io/cypress/issues/5466
    argv = argv.filter((val) => val !== '--')

    let options

    try {
      options = argsUtils.toObject(argv)

      showWarningForInvalidConfig(options)
    } catch (argumentsError) {
      debug('could not parse CLI arguments: %o', argv)

      // note - this is promise-returned call
      return exitErr(argumentsError)
    }

    debug('from argv %o got options %o', argv, options)

    telemetry.exporter()?.attachRecordKey(options.key)

    if (options.headless) {
      // --headless is same as --headed false
      if (options.headed) {
        throw new Error('Impossible options: both headless and headed are true')
      }

      options.headed = false
    }

    if (options.runProject && !options.headed) {
      debug('scaling electron app in headless mode')
      // scale the electron browser window
      // to force retina screens to not
      // upsample their images when offscreen
      // rendering
      require('./util/electron-app').scale()
    }

    // make sure we have the appData folder
    return Promise.all([
      require('./util/app_data').ensure(),
      require('./util/electron-app').setRemoteDebuggingPort(),
    ])
    .then(() => {
      // else determine the mode by
      // the passed in arguments / options
      // and normalize this mode
      let mode = options.mode || 'interactive'

      if (options.version) {
        mode = 'version'
      } else if (options.smokeTest) {
        mode = 'smokeTest'
      } else if (options.returnPkg) {
        mode = 'returnPkg'
      } else if (!(options.exitWithCode == null)) {
        mode = 'exitWithCode'
      } else if (options.runProject) {
        // go into headless mode when running
        // until completion + exit
        mode = 'run'
      }

      return this.startInMode(mode, options)
    })
  },

  startInMode (mode, options) {
    debug('starting in mode %s with options %o', mode, options)

    switch (mode) {
      case 'version':
        return require('./modes/pkg')(options)
        .get('version')
        .then((version) => {
          return console.log(version) // eslint-disable-line no-console
        }).then(exit0)
        .catch(exitErr)

      case 'info':
        return require('./modes/info')(options)
        .then(exit0)
        .catch(exitErr)

      case 'smokeTest':
        return this.runElectron(mode, options)
        .then((pong) => {
          if (!this.isCurrentlyRunningElectron()) {
            return pong
          }

          if (pong === options.ping) {
            return 0
          }

          return 1
        }).then(exit)
        .catch(exitErr)

      case 'returnPkg':
        return require('./modes/pkg')(options)
        .then((pkg) => {
          return console.log(JSON.stringify(pkg)) // eslint-disable-line no-console
        }).then(exit0)
        .catch(exitErr)

      case 'exitWithCode':
        return require('./modes/exit')(options)
        .then(exit)
        .catch(exitErr)

      case 'run':
        // run headlessly and exit
        // with num of totalFailed
        return this.runElectron(mode, options)
        .then((results) => {
          if (results.runs) {
            const isCanceled = results.runs.filter((run) => run.skippedSpec).length

            if (isCanceled) {
              // eslint-disable-next-line no-console
              console.log(require('chalk').magenta('\n  Exiting with non-zero exit code because the run was canceled.'))

              return 1
            }
          }

          return results.totalFailed
        })
        .then(exit)
        .catch(exitErr)

      case 'interactive':
        return this.runElectron(mode, options)

      default:
        throw new Error(`Cannot start. Invalid mode: '${mode}'`)
    }
  },
}
