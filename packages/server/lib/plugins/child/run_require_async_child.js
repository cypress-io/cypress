require('graceful-fs').gracefulify(require('fs'))
const stripAnsi = require('strip-ansi')
const debug = require('debug')(`cypress:lifecycle:child:run_require_async_child:${process.pid}`)
const tsNodeUtil = require('./ts_node')
const util = require('../util')
const { RunPlugins } = require('./run_plugins')

let tsRegistered = false

/**
 * Executes and returns the passed `file` (usually `configFile`) file in the ipc `loadConfig` event
 * @param {*} ipc Inter Process Communication protocol
 * @param {*} file the file we are trying to load
 * @param {*} projectRoot the root of the typescript project (useful mainly for tsnode)
 * @returns
 */
function run (ipc, file, projectRoot) {
  debug('configFile:', file)
  debug('projectRoot:', projectRoot)
  if (!projectRoot) {
    throw new Error('Unexpected: projectRoot should be a string')
  }

  if (!tsRegistered) {
    debug('register typescript for required file')
    tsNodeUtil.register(projectRoot, file)

    // ensure typescript is only registered once
    tsRegistered = true
  }

  process.on('uncaughtException', (err) => {
    debug('uncaught exception:', util.serializeError(err))
    ipc.send('childProcess:unhandledError', util.serializeError(err))

    return false
  })

  process.on('unhandledRejection', (event) => {
    let err = event

    debug('unhandled rejection:', event)

    // Rejected Bluebird promises will return a reason object.
    // OpenSSL error returns a reason as user-friendly string.
    if (event && event.reason && typeof event.reason === 'object') {
      err = event.reason
    }

    ipc.send('childProcess:unhandledError', util.serializeError(err))

    return false
  })

  const isValidSetupNodeEvents = (config, testingType) => {
    if (config[testingType] && config[testingType].setupNodeEvents && typeof config[testingType].setupNodeEvents !== 'function') {
      ipc.send('setupTestingType:error', util.serializeError(
        require('@packages/errors').getError('SETUP_NODE_EVENTS_IS_NOT_FUNCTION', file, testingType, config[testingType].setupNodeEvents),
      ))

      return false
    }

    return true
  }

  const isValidDevServer = (config) => {
    const { devServer } = config

    if (devServer && typeof devServer === 'function') {
      return true
    }

    ipc.send('setupTestingType:error', util.serializeError(
      require('@packages/errors').getError('CONFIG_FILE_DEV_SERVER_IS_NOT_A_FUNCTION', file, config),
    ))

    return false
  }

  ipc.on('loadLegacyPlugins', async (legacyConfig) => {
    try {
      let legacyPlugins = require(file)

      if (legacyPlugins && typeof legacyPlugins.default === 'function') {
        legacyPlugins = legacyPlugins.default
      }

      // invalid or empty plugins file
      if (typeof legacyPlugins !== 'function') {
        ipc.send('loadLegacyPlugins:reply', { config: legacyConfig })

        return
      }

      // we do not want to execute any tasks - the purpose
      // of this is to get any modified config returned
      // by plugins.
      const noop = () => {}
      const legacyPluginsConfig = await legacyPlugins(noop, legacyConfig)

      // match merging strategy from 9.x
      const mergedLegacyConfig = {
        ...legacyConfig,
        ...legacyPluginsConfig,
      }

      if (legacyConfig.e2e || legacyPluginsConfig.e2e) {
        mergedLegacyConfig.e2e = {
          ...(legacyConfig.e2e || {}),
          ...(legacyPluginsConfig.e2e || {}),
        }
      }

      if (legacyConfig.component || legacyPluginsConfig.component) {
        mergedLegacyConfig.component = {
          ...(legacyConfig.component || {}),
          ...(legacyPluginsConfig.component || {}),
        }
      }

      ipc.send('loadLegacyPlugins:reply', { config: mergedLegacyConfig })
    } catch (e) {
      ipc.send('loadLegacyPlugins:error', util.serializeError(
        require('@packages/errors').getError('LEGACY_CONFIG_ERROR_DURING_MIGRATION', file, e),
      ))
    }
  })

  ipc.on('loadConfig', () => {
    try {
      debug('try loading', file)
      const exp = require(file)

      const result = exp.default || exp

      const replacer = (_key, val) => {
        return typeof val === 'function' ? `[Function ${val.name}]` : val
      }

      ipc.send('loadConfig:reply', { initialConfig: JSON.stringify(result, replacer), requires: util.nonNodeRequires() })

      let hasSetup = false

      ipc.on('setupTestingType', (testingType, options) => {
        if (hasSetup) {
          throw new Error('Already Setup')
        }

        hasSetup = true

        debug(`setupTestingType %s %o`, testingType, options)

        const runPlugins = new RunPlugins(ipc, projectRoot, file)

        if (!isValidSetupNodeEvents(result, testingType)) {
          return
        }

        if (testingType === 'component') {
          if (!isValidDevServer((result.component || {}))) {
            return
          }

          runPlugins.runSetupNodeEvents(options, (on, config) => {
            const setupNodeEvents = result.component && result.component.setupNodeEvents || ((on, config) => {})

            const { devServer } = result.component

            on('dev-server:start', (options) => devServer(options, result.component && result.component.devServerConfig))

            return setupNodeEvents(on, config)
          })
        } else if (testingType === 'e2e') {
          const setupNodeEvents = result.e2e && result.e2e.setupNodeEvents || ((on, config) => {})

          runPlugins.runSetupNodeEvents(options, setupNodeEvents)
        } else {
          // Notify the plugins init that there's no plugins to resolve
          ipc.send('setupTestingType:reply', {
            requires: util.nonNodeRequires(),
          })
        }
      })

      debug('loaded config from %s %o', file, result)
    } catch (err) {
      if (err.name === 'TSError') {
        // because of this https://github.com/TypeStrong/ts-node/issues/1418
        // we have to do this https://stackoverflow.com/questions/25245716/remove-all-ansi-colors-styles-from-strings/29497680
        const cleanMessage = stripAnsi(err.message)
        // replace the first line with better text (remove potentially misleading word TypeScript for example)
        .replace(/^.*\n/g, 'Error compiling file\n')

        // Regex to pull out the error from the message body of a TSError. It displays the relative path to a file
        const tsErrorRegex = /\n(.*?)\((\d+),(\d+)\):/g
        const failurePath = tsErrorRegex.exec(cleanMessage)

        err.tsErrorLocation = failurePath ? { filePath: failurePath[1], line: Number(failurePath[2]), column: Number(failurePath[3]) } : null
        err.originalMessage = err.message
        err.message = cleanMessage
      }

      ipc.send('loadConfig:error', util.serializeError(
        require('@packages/errors').getError('CONFIG_FILE_REQUIRE_ERROR', file, err),
      ))
    }
  })

  ipc.send('ready')
}

module.exports = run
