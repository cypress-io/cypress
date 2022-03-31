/// <reference types="cypress" />

import type WebpackDevServer3 from 'webpack-dev-server-3'
import type WebpackDevServer from 'webpack-dev-server'

import { createWebpackDevServer } from './createWebpackDevServer'
import { sourceRelativeWebpackModules } from './helpers/sourceRelativeWebpack'
import type { AddressInfo } from 'net'
import debugLib from 'debug'

const debug = debugLib('cypress:webpack-dev-server-fresh:devServer')

export type WebpackDevServerConfig = {
  specs: Cypress.Spec[]
  cypressConfig: Cypress.PluginConfigOptions
  devServerEvents: NodeJS.EventEmitter
} & {
  framework?: typeof ALL_FRAMEWORKS[number] // Add frameworks here as we implement
  webpackConfig?: unknown // Derived from the user's webpack
}

const ALL_FRAMEWORKS = ['create-react-app', 'nuxt', 'react'] as const

/**
 * @internal
 */
type DevServerCreateResult = {
  version: 3
  server: WebpackDevServer3
} | {
  version: 4
  server: WebpackDevServer
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
  return new Promise((resolve, reject) => {
    const result = devServer.create(devServerConfig) as DevServerCreateResult

    if (result.version === 3) {
      const srv = result.server.listen(0, '127.0.0.1', () => {
        const port = (srv.address() as AddressInfo).port

        debug('Component testing webpack server 3 started on port %s', port)

        resolve({
          port,
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

    debugger
    result.server.start().then(() => {
      if (!result.server.options.port) {
        return reject(new Error(`Expected port ${result.server.options.port} to be a number`))
      }

      debug('Component testing webpack server 4 started on port %s', result.server.options.port)

      resolve({
        port: result.server.options.port as number,
        close: (done) => {
          debug('closing dev server')
          result.server.stop().then(() => done?.()).catch(done).finally(() => {
            debug('closed dev server')
          })
        },
      })
    }).catch(reject)
  })
}

/**
 * Syncronously create the webpack server instance, without starting.
 * Useful for testing
 *
 * @internal
 */
devServer.create = function (devServerConfig: WebpackDevServerConfig) {
  const sourceWebpackModulesResult = sourceRelativeWebpackModules(devServerConfig)

  let frameworkConfig: object | undefined

  // If we have a framework specified, source the associated config
  if (typeof devServerConfig.framework === 'string') {
    switch (devServerConfig.framework) {
      case 'create-react-app':
        // frameworkConfig = createReactApp()
        break
      case 'react':
        break
      case 'nuxt':
        break
      default:
        throw new Error(`Unexpected framework ${devServerConfig.framework}, expected one of ${ALL_FRAMEWORKS.join(', ')}`)
    }
  }

  const server = createWebpackDevServer({
    devServerConfig,
    frameworkConfig,
    sourceWebpackModulesResult,
  })

  return {
    server,
    version: sourceWebpackModulesResult.webpackDevServer.majorVersion,
  }
}

export default devServer
