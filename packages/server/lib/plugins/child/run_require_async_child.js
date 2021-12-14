require('graceful-fs').gracefulify(require('fs'))
const stripAnsi = require('strip-ansi')
const debug = require('debug')('cypress:server:plugins:child')
const tsNodeUtil = require('../../util/ts_node')
const util = require('../util')
const RunPlugins = require('./run_plugins')

let tsRegistered = false

/**
 * Executes and returns the passed `requiredFile` file in the ipc `load` event
 * @param {*} ipc Inter Process Comunication protocol
 * @param {*} requiredFile the file we are trying to load
 * @param {*} projectRoot the root of the typescript project (useful mainly for tsnode)
 * @returns
 */
function run (ipc, requiredFile, projectRoot) {
  let areSetupNodeEventsLoaded = false

  debug('requiredFile:', requiredFile)
  debug('projectRoot:', projectRoot)
  if (!projectRoot) {
    throw new Error('Unexpected: projectRoot should be a string')
  }

  if (!tsRegistered) {
    debug('register typescript for required file')
    tsNodeUtil.register(projectRoot, requiredFile)

    // ensure typescript is only registered once
    tsRegistered = true
  }

  process.on('uncaughtException', (err) => {
    debug('uncaught exception:', util.serializeError(err))
    ipc.send(areSetupNodeEventsLoaded ? 'error:plugins' : 'error', util.serializeError(err))

    return false
  })

  process.on('unhandledRejection', (event) => {
    const err = (event && event.reason) || event

    debug('unhandled rejection:', util.serializeError(err))
    ipc.send('error', util.serializeError(err))

    return false
  })

  const isValidSetupNodeEvents = (setupNodeEvents) => {
    if (setupNodeEvents && typeof setupNodeEvents !== 'function') {
      ipc.send('load:error:plugins', 'SETUP_NODE_EVENTS_IS_NOT_FUNCTION', requiredFile, setupNodeEvents)

      return false
    }

    return true
  }

  ipc.on('load', () => {
    try {
      debug('try loading', requiredFile)
      const exp = require(requiredFile)

      const result = exp.default || exp

      ipc.send('loaded', result)

      ipc.on('plugins', (testingType) => {
        const runPlugins = new RunPlugins(ipc, projectRoot, requiredFile)

        areSetupNodeEventsLoaded = true
        if (testingType === 'component') {
          if (!isValidSetupNodeEvents(result.component?.setupNodeEvents)) {
            return
          }

          runPlugins.runSetupNodeEvents((on, config) => {
            if (result.component?.devServer) {
              on('dev-server:start', (options) => result.component.devServer(options, result.component?.devServerConfig))
            }

            const setupNodeEvents = result.component?.setupNodeEvents ?? ((on, config) => {})

            return setupNodeEvents(on, config)
          })
        } else if (testingType === 'e2e') {
          if (!isValidSetupNodeEvents(result.e2e?.setupNodeEvents)) {
            return
          }

          const setupNodeEvents = result.e2e?.setupNodeEvents ?? ((on, config) => {})

          runPlugins.runSetupNodeEvents(setupNodeEvents)
        } else {
          // Notify the plugins init that there's no plugins to resolve
          ipc.send('empty:plugins')
        }
      })

      debug('config %o', result)
    } catch (err) {
      if (err.name === 'TSError') {
        // beause of this https://github.com/TypeStrong/ts-node/issues/1418
        // we have to do this https://stackoverflow.com/questions/25245716/remove-all-ansi-colors-styles-from-strings/29497680
        const cleanMessage = stripAnsi(err.message)
        // replace the first line with better text (remove potentially misleading word TypeScript for example)
        .replace(/^.*\n/g, 'Error compiling file\n')

        ipc.send('load:error', err.name, requiredFile, cleanMessage)
      } else {
        const realErrorCode = err.code || err.name

        debug('failed to load file:%s\n%s: %s', requiredFile, realErrorCode, err.message)

        ipc.send('load:error', realErrorCode, requiredFile, err.message)
      }
    }
  })
}

module.exports = run
