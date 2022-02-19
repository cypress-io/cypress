import Debug from 'debug'
import path from 'path'
import _ from 'lodash'
import EE from 'events'
import type { OldCypressConfig } from '.'
import cp from 'child_process'

const debug = Debug('cypress:data-context:sources:migration:initOldPlugins')

let pluginsProcess: cp.ChildProcess | null = null

const getChildOptions = (): cp.ForkOptions => {
  const childOptions: cp.ForkOptions = {
    stdio: 'pipe',
    env: {
      ...process.env,
      NODE_OPTIONS: process.env.ORIGINAL_NODE_OPTIONS || '',
    },
  }

  return childOptions
}

function wrapIpc (aProcess: cp.ChildProcess) {
  const emitter = new EE()

  aProcess.on('message', (message: any) => {
    return emitter.emit(message.event, ...message.args)
  })

  // prevent max listeners warning on ipc
  // @see https://github.com/cypress-io/cypress/issues/1305#issuecomment-780895569
  emitter.setMaxListeners(Infinity)

  return {
    send (event: string, ...args: any[]) {
      if (aProcess.killed) {
        return
      }

      return aProcess.send({
        event,
        args,
      })
    },

    on: emitter.on.bind(emitter),
    removeListener: emitter.removeListener.bind(emitter),
  }
}

export const initOldPlugins = (config: OldCypressConfig, options: {
  projectRoot: string
  configFile: string
  testingType: 'e2e' | 'component'
  onError: (err: Error) => void
}): Promise<OldCypressConfig> => {
  debug('plugins.init', config.pluginsFile)

  return new Promise((_resolve, _reject) => {
    // provide a safety net for fulfilling the promise because the
    // 'handleError' function below can potentially be triggered
    // before or after the promise is already fulfilled
    let fulfilled = false

    // eslint-disable-next-line @cypress/dev/arrow-body-multiline-braces
    const fulfill = (_fulfill: typeof _resolve) => (value: any) => {
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

    const childDirPath = require.resolve('@packages/server/lib/plugins/child/require_async_child')

    const pluginsFile = config.pluginsFile || path.join(childDirPath, 'default_plugins_file.js')
    const childIndexFilename = require.resolve('@packages/server/lib/plugins/child/require_async_child')
    const childArguments = ['--file', pluginsFile, '--projectRoot', options.projectRoot]
    const childOptions = getChildOptions()

    debug('forking to run %s', childIndexFilename)
    pluginsProcess = cp.fork(childIndexFilename, childArguments, childOptions)

    if (pluginsProcess.stdout && pluginsProcess.stderr) {
      // manually pipe plugin stdout and stderr for dashboard capture
      // @see https://github.com/cypress-io/cypress/issues/7434
      pluginsProcess.stdout.on('data', (data) => process.stdout.write(data))
      pluginsProcess.stderr.on('data', (data) => process.stderr.write(data))
    } else {
      debug('stdout and stderr not available on subprocess, the plugin launch should error')
    }

    const ipc = wrapIpc(pluginsProcess)

    _.extend(config, {
      projectRoot: options.projectRoot,
      configFile: options.configFile,
      version: '10.0.0',
      testingType: options.testingType,
    })

    ipc.on('ready', () => {
      ipc.send('load', config)
    })

    ipc.on('loaded', (newCfg: OldCypressConfig) => {
      _.omit(config, 'projectRoot', 'configFile')

      debug('resolving with new config %o', newCfg)

      resolve(newCfg)
    })

    ipc.on('load:error', (type, ...args) => {
      debug('load:error %s, rejecting', type, ...args)

      reject(new Error('There was an error loading the plugins file.'))
    })

    const killPluginsProcess = () => {
      pluginsProcess && pluginsProcess.kill()
      pluginsProcess = null
    }

    const handleError = (err: Error) => {
      debug('plugins process error:', err.stack)

      if (!pluginsProcess) return // prevent repeating this in case of multiple errors

      killPluginsProcess()

      // this can sometimes trigger before the promise is fulfilled and
      // sometimes after, so we need to handle each case differently
      if (fulfilled) {
        options.onError(err)
      } else {
        reject(err)
      }
    }

    pluginsProcess.on('error', handleError)
    ipc.on('error', handleError)

    // see timers/parent.js line #93 for why this is necessary
    process.on('exit', killPluginsProcess)
  })
}
