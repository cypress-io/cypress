/// <reference types="cypress" />

import type WebpackDevServer from 'webpack-dev-server'
import type { Compiler, Configuration } from 'webpack'

import { createWebpackDevServer } from './createWebpackDevServer'
import type { AddressInfo } from 'net'
import debugLib from 'debug'
import type { Server } from 'http'
import { vueCliHandler } from './helpers/vueCliHandler'
import { nuxtHandler } from './helpers/nuxtHandler'
import { createReactAppHandler } from './helpers/createReactAppHandler'
import { nextHandler } from './helpers/nextHandler'
import { sourceDefaultWebpackDependencies, SourceRelativeWebpackResult } from './helpers/sourceRelativeWebpackModules'

const debug = debugLib('cypress:webpack-dev-server:devServer')

export type WebpackDevServerConfig = {
  specs: Cypress.Spec[]
  cypressConfig: Cypress.PluginConfigOptions
  devServerEvents: NodeJS.EventEmitter
  onConfigNotFound?: (devServer: 'webpack', cwd: string, lookedIn: string[]) => void
} & {
  framework?: typeof ALL_FRAMEWORKS[number] // Add frameworks here as we implement
  webpackConfig?: unknown // Derived from the user's webpack
}

export const ALL_FRAMEWORKS = ['create-react-app', 'nuxt', 'react', 'vue-cli', 'next', 'vue'] as const

/**
 * @internal
 */
type DevServerCreateResult = {
  version: 3
  server: Server
  compiler: Compiler
} | {
  version: 4
  server: WebpackDevServer
  compiler: Compiler
}

/**
 * import { devServer } from '@cypress/webpack-dev-server'
 *
 * Creates & returns a WebpackDevServer for serving files related
 * to Cypress Component Testing
 *
 * @param config
 */
export function devServer (devServerConfig: WebpackDevServerConfig): Promise<Cypress.ResolvedDevServerConfig> {
  return new Promise(async (resolve, reject) => {
    const result = await devServer.create(devServerConfig) as DevServerCreateResult

    if (result.version === 3) {
      const srv = result.server.listen(0, '127.0.0.1', () => {
        const port = (srv.address() as AddressInfo).port

        debug('Component testing webpack server 3 started on port %s', port)

        resolve({
          port,
          // Close is for unit testing only. We kill this child process which will handle the closing of the server
          close: (done) => {
            srv.close((err) => {
              if (err) {
                debug('closing dev server, with error', err)
              }

              debug('closed dev server')
              done?.(err)
            })
          },
        })
      })

      return
    }

    result.server.start().then(() => {
      if (!result.server.options.port) {
        return reject(new Error(`Expected port ${result.server.options.port} to be a number`))
      }

      debug('Component testing webpack server 4 started on port %s', result.server.options.port)

      resolve({
        port: result.server.options.port as number,
        // Close is for unit testing only. We kill this child process which will handle the closing of the server
        close: async (done) => {
          debug('closing dev server')
          result.server.stop().then(() => done?.()).catch(done).finally(() => {
            debug('closed dev server')
          })
        },
      })
    }).catch(reject)
  })
}

export type PresetHandlerResult = { frameworkConfig?: Configuration, sourceWebpackModulesResult: SourceRelativeWebpackResult }

async function getPreset (devServerConfig: WebpackDevServerConfig): Promise<PresetHandlerResult> {
  switch (devServerConfig.framework) {
    case 'create-react-app':
      return createReactAppHandler(devServerConfig)
    case 'nuxt':
      return await nuxtHandler(devServerConfig)

    case 'vue-cli':
      return vueCliHandler(devServerConfig)

    case 'next':
      return await nextHandler(devServerConfig)

    case 'react':
    case 'vue':
    case undefined:
      return { sourceWebpackModulesResult: sourceDefaultWebpackDependencies(devServerConfig) }

    default:
      throw new Error(`Unexpected framework ${devServerConfig.framework}, expected one of ${ALL_FRAMEWORKS.join(', ')}`)
  }
}

/**
 * Synchronously create the webpack server instance, without starting.
 * Useful for testing
 *
 * @internal
 */
devServer.create = async function (devServerConfig: WebpackDevServerConfig) {
  const { frameworkConfig, sourceWebpackModulesResult } = await getPreset(devServerConfig)

  const { server, compiler } = await createWebpackDevServer({
    devServerConfig,
    frameworkConfig,
    sourceWebpackModulesResult,
  })

  const result = {
    server,
    compiler,
    version: sourceWebpackModulesResult.webpackDevServer.majorVersion,
  }

  return result
}

export default devServer
