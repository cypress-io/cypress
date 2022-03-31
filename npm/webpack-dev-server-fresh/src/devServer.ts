/// <reference types="cypress" />

import type WebpackDevServer from 'webpack-dev-server'
import type { Compiler } from 'webpack'

import { createWebpackDevServer } from './createWebpackDevServer'
import { sourceRelativeWebpackModules } from './helpers/sourceRelativeWebpack'
import type { AddressInfo } from 'net'
import debugLib from 'debug'
import type { Server } from 'http'

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
  server: Server
  compiler: Compiler
} | {
  version: 4
  server: WebpackDevServer
  compiler: Compiler
}

const normalizeError = (error: Error | string) => {
  return typeof error === 'string' ? error : error.message
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

    // When compiling in run mode
    // Stop the clock early, no need to run all the tests on a failed build
    result.compiler.hooks.done.tap('cyCustomErrorBuild', function (stats) {
      if (stats.hasErrors()) {
        console.log(stats)
        const errors = stats.compilation.errors

        devServerConfig.devServerEvents.emit('dev-server:compile:error', normalizeError(errors[0]))
        if (devServerConfig.cypressConfig.isTextTerminal) {
          process.exit(1)
        }
      }
    })

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

  const { server, compiler } = createWebpackDevServer({
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
