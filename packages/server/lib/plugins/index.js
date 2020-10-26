const _ = require('lodash')
const cp = require('child_process')
const path = require('path')
const debug = require('debug')('cypress:server:plugins')
const resolve = require('resolve')
const Promise = require('bluebird')
const errors = require('../errors')
const util = require('./util')
const pkg = require('@packages/root')

let pluginsProcess = null
let registeredEvents = {}
let handlers = []

const register = (event, callback) => {
  debug(`register event '${event}'`)

  if (!_.isString(event)) {
    throw new Error(`The plugin register function must be called with an event as its 1st argument. You passed '${event}'.`)
  }

  if (!_.isFunction(callback)) {
    throw new Error(`The plugin register function must be called with a callback function as its 2nd argument. You passed '${callback}'.`)
  }

  registeredEvents[event] = callback
}

const getPluginPid = () => {
  if (pluginsProcess) {
    return pluginsProcess.pid
  }
}

const registerHandler = (handler) => {
  handlers.push(handler)
}

const init = (config, options) => {
  debug('plugins.init', config.pluginsFile)

  // test and warn for incompatible plugin
  try {
    const retriesPluginPath = path.dirname(resolve.sync('cypress-plugin-retries', {
      basedir: options.projectRoot,
    }))

    options.onWarning(errors.get('INCOMPATIBLE_PLUGIN_RETRIES', path.relative(options.projectRoot, retriesPluginPath)))
  } catch (e) {
    // noop, incompatible plugin not installed
  }

  return new Promise((_resolve, _reject) => {
    // provide a safety net for fulfilling the promise because the
    // 'handleError' function below can potentially be triggered
    // before or after the promise is already fulfilled
    let fulfilled = false

    // eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
    const fulfill = (_fulfill) => (value) => {
      if (fulfilled) return

      fulfilled = true
      _fulfill(value)
    }

    const resolve = fulfill(_resolve)
    const reject = fulfill(_reject)

    if (!config.pluginsFile) {
      debug('no user plugins file')
    }

    if (pluginsProcess) {
      debug('kill existing plugins process')
      pluginsProcess.kill()
    }

    registeredEvents = {}

    const pluginsFile = config.pluginsFile || path.join(__dirname, 'child', 'default_plugins_file.js')
    const childIndexFilename = path.join(__dirname, 'child', 'index.js')
    const childArguments = ['--file', pluginsFile, '--projectRoot', options.projectRoot]
    const childOptions = {
      stdio: 'inherit',
    }

    if (config.resolvedNodePath) {
      debug('launching using custom node version %o', _.pick(config, ['resolvedNodePath', 'resolvedNodeVersion']))
      childOptions.execPath = config.resolvedNodePath
    }

    debug('forking to run %s', childIndexFilename)
    pluginsProcess = cp.fork(childIndexFilename, childArguments, childOptions)
    const ipc = util.wrapIpc(pluginsProcess)

    for (let handler of handlers) {
      handler(ipc)
    }

    _.extend(config, {
      projectRoot: options.projectRoot,
      configFile: options.configFile,
      version: pkg.version,
    })

    ipc.send('load', config)

    ipc.on('loaded', (newCfg, registrations) => {
      _.omit(config, 'projectRoot', 'configFile')

      _.each(registrations, (registration) => {
        debug('register plugins process event', registration.event, 'with id', registration.eventId)

        register(registration.event, (...args) => {
          return util.wrapParentPromise(ipc, registration.eventId, (invocationId) => {
            debug('call event', registration.event, 'for invocation id', invocationId)
            const ids = {
              eventId: registration.eventId,
              invocationId,
            }

            // no argument is passed for cy.task()
            // This is necessary because undefined becomes null when it is sent through ipc.
            if (args[1] === undefined) {
              args[1] = {
                __cypress_task_no_argument__: true,
              }
            }

            ipc.send('execute', registration.event, ids, args)
          })
        })
      })

      debug('resolving with new config %o', newCfg)

      resolve(newCfg)
    })

    ipc.on('load:error', (type, ...args) => {
      debug('load:error %s, rejecting', type)

      reject(errors.get(type, ...args))
    })

    const killPluginsProcess = () => {
      pluginsProcess && pluginsProcess.kill()
      pluginsProcess = null
    }

    const handleError = (err) => {
      debug('plugins process error:', err.stack)

      if (!pluginsProcess) return // prevent repeating this in case of multiple errors

      killPluginsProcess()

      err = errors.get('PLUGINS_UNEXPECTED_ERROR', config.pluginsFile, err.annotated || err.stack || err.message)
      err.title = 'Error running plugin'

      // this can sometimes trigger before the promise is fulfilled and
      // sometimes after, so we need to handle each case differently
      if (fulfilled) {
        options.onError(err)
      } else {
        reject(err)
      }
    }

    const handleWarning = (warningErr) => {
      debug('plugins process warning:', warningErr.stack)
      if (!pluginsProcess) return // prevent repeating this in case of multiple warnings

      return options.onWarning(warningErr)
    }

    pluginsProcess.on('error', handleError)
    ipc.on('error', handleError)
    ipc.on('warning', handleWarning)

    // see timers/parent.js line #93 for why this is necessary
    process.on('exit', killPluginsProcess)
  })
}

const has = (event) => {
  const isRegistered = !!registeredEvents[event]

  debug('plugin event registered? %o', {
    event,
    isRegistered,
  })

  return isRegistered
}

const execute = (event, ...args) => {
  debug(`execute plugin event '${event}' Node '${process.version}' with args: %o %o %o`, ...args)

  return registeredEvents[event](...args)
}

const _reset = () => {
  registeredEvents = {}
  handlers = []
}

const _setPluginsProcess = (_pluginsProcess) => {
  pluginsProcess = _pluginsProcess
}

module.exports = {
  getPluginPid,
  execute,
  has,
  init,
  register,
  registerHandler,

  // for testing purposes
  _reset,
  _setPluginsProcess,
}
