import debugLib from 'debug'
import { pathToFileURL } from 'url'
import * as util from '../util'
import { RunPlugins } from './run_plugins'
import type { ConfigFileExport, DevServerInfo, PluginChildIpc, SetupNodeEventsFn } from './types'
import { getError } from '@packages/errors'
import type { TestingType } from '@packages/types'
import type { TransformError } from '@packages/types'

const debug = debugLib(`cypress:lifecycle:child:run_require_async_child:${process.pid}`)

const dynamicImport = new Function('id', 'return import(id)') as (id: string) => Promise<unknown>

interface BluebirdRejectionEvent {
  reason?: unknown
}

/**
 * Executes and returns the passed `file` (usually `configFile`) file in the ipc `loadConfig` event
 * @param {*} ipc Inter Process Communication protocol
 * @param {*} file the file we are trying to load
 * @param {*} projectRoot the root of the typescript project
 */
export function run (ipc: PluginChildIpc, file: string, projectRoot: string, shouldLoadAsEsm: boolean): void {
  debug('configFile:', file)
  debug('projectRoot:', projectRoot)
  debug('shouldLoadAsEsm:', shouldLoadAsEsm)
  if (!projectRoot) {
    throw new Error('Unexpected: projectRoot should be a string')
  }

  process.on('uncaughtException', (err) => {
    debug('uncaught exception:', util.serializeError(err))
    ipc.send('childProcess:unhandledError', util.serializeError(err))
  })

  process.on('unhandledRejection', (event: BluebirdRejectionEvent | unknown) => {
    let err: unknown = event

    debug('unhandled rejection:', event)

    // Rejected Bluebird promises will return a reason object.
    // OpenSSL error returns a reason as user-friendly string.
    if (event && typeof event === 'object' && 'reason' in event && typeof (event as BluebirdRejectionEvent).reason === 'object') {
      err = (event as BluebirdRejectionEvent).reason
    }

    ipc.send('childProcess:unhandledError', util.serializeError(err as Error))
  })

  const isValidSetupNodeEvents = (config: ConfigFileExport, testingType: TestingType): boolean => {
    const testingTypeConfig = config[testingType] as ConfigFileExport['component'] | undefined

    if (testingTypeConfig?.setupNodeEvents && typeof testingTypeConfig.setupNodeEvents !== 'function') {
      ipc.send('setupTestingType:error', util.serializeError(
        getError('SETUP_NODE_EVENTS_IS_NOT_FUNCTION', file, testingType, testingTypeConfig.setupNodeEvents),
      ))

      return false
    }

    return true
  }

  const getValidDevServer = async (config: NonNullable<ConfigFileExport['component']>): Promise<DevServerInfo | false> => {
    const { devServer } = config

    if (devServer && typeof devServer === 'function') {
      return { devServer: devServer as DevServerInfo['devServer'], objApi: false }
    }

    if (devServer && typeof devServer === 'object') {
      if ((devServer as { bundler?: string }).bundler === 'webpack') {
        const { devServer } = await import('@cypress/webpack-dev-server')

        return { devServer: devServer as DevServerInfo['devServer'], objApi: true }
      }

      if ((devServer as { bundler?: string }).bundler === 'vite') {
        // Preserves native dynamic import when compiled to CJS
        const { devServer } = (await dynamicImport('@cypress/vite-dev-server')) as { devServer: DevServerInfo['devServer'] }

        return { devServer: devServer as DevServerInfo['devServer'], objApi: true }
      }
    }

    ipc.send('setupTestingType:error', util.serializeError(
      getError('CONFIG_FILE_DEV_SERVER_IS_NOT_VALID', file, config),
    ))

    return false
  }

  // Config file loading of modules is tested within
  // system-tests/projects/config-cjs-and-esm/*
  const loadFile = async (configFilePath: string): Promise<ConfigFileExport> => {
    if (shouldLoadAsEsm) {
      // pathToFileURL for windows interop: https://github.com/nodejs/node/issues/31710
      const fileURL = pathToFileURL(configFilePath).href

      debug('importing config as esm file %s', fileURL)

      // Preserves native dynamic import when compiled to CJS
      return (await dynamicImport(fileURL)) as ConfigFileExport
    }

    debug('loading config as cjs file %s', configFilePath)

    return require(configFilePath)
  }

  ipc.on('loadConfig', async () => {
    try {
      debug('try loading', file)
      const configFileExport = await loadFile(file)

      debug('loaded config file', file)
      const result = (configFileExport.default || configFileExport) as ConfigFileExport

      const replacer = (_key: string, val: unknown) => {
        return typeof val === 'function' ? `[Function ${(val as { name: string }).name}]` : val
      }

      ipc.send('loadConfig:reply', { initialConfig: JSON.stringify(result, replacer), requires: util.nonNodeRequires() })

      let hasSetup = false

      ipc.on('setupTestingType', async (testingType: TestingType, options: Cypress.PluginConfigOptions) => {
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
          const devServerInfo = await getValidDevServer(result.component || {})

          if (!devServerInfo) {
            return
          }

          const { devServer, objApi } = devServerInfo

          runPlugins.runSetupNodeEvents(options, (on, config) => {
            const setupNodeEvents = (result.component?.setupNodeEvents || ((_, _cfg) => ({}))) as SetupNodeEventsFn

            const onConfigNotFound = (devServerName: 'vite' | 'webpack', root: string, searchedFor: string[]) => {
              ipc.send('setupTestingType:error', util.serializeError(
                getError('DEV_SERVER_CONFIG_FILE_NOT_FOUND', devServerName, root, searchedFor),
              ))
            }

            on('dev-server:start', (devServerOpts) => {
              if (objApi) {
                const { specs, devServerEvents } = devServerOpts

                return devServer({
                  cypressConfig: config,
                  onConfigNotFound,
                  ...(result.component?.devServer as object),
                  specs,
                  devServerEvents,
                })
              }

              devServerOpts.cypressConfig = config

              return devServer(devServerOpts, result.component?.devServerConfig)
            })

            return setupNodeEvents(on as Parameters<SetupNodeEventsFn>[0], config)
          })
        } else if (testingType === 'e2e') {
          const setupNodeEvents = (result.e2e?.setupNodeEvents || ((_, _cfg) => ({}))) as SetupNodeEventsFn

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
      const loadErr = err as TransformError & Error & {
        errors?: Array<{ location?: { file: string, line: number, column: number } }>
        compilerErrorLocation?: { filePath: string, line: number, column: number }
        originalMessage?: string
      }

      // With tsx, errors now come in as TransformErrors instead of TSErrors (as they also include JavaScript errors).
      if (loadErr.name === 'TransformError' || loadErr.stack?.includes('TransformError')) {
        const { compilerErrorLocation, originalMessage, message } = util.buildErrorLocationFromTransformError(loadErr, projectRoot)

        loadErr.compilerErrorLocation = compilerErrorLocation ?? undefined
        loadErr.originalMessage = originalMessage
        loadErr.message = message
      } else if (Array.isArray(loadErr.errors)) {
        // The stack trace of the esbuild error, do not give to much information related with the user error,
        // we have the errors array which includes the users file and information related with the error
        const firstError = loadErr.errors.filter((e) => Boolean(e.location))[0]

        if (firstError?.location?.file) {
          loadErr.compilerErrorLocation = { filePath: firstError.location.file, line: Number(firstError.location.line), column: Number(firstError.location.column) }
        }
      }

      ipc.send('loadConfig:error', util.serializeError(
        getError('CONFIG_FILE_REQUIRE_ERROR', file, loadErr),
      ))
    }
  })

  ipc.send('ready')
}
