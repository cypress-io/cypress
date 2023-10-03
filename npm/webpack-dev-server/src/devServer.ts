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
import { angularHandler } from './helpers/angularHandler'

const debug = debugLib('cypress:webpack-dev-server:devServer')

export type Frameworks = Extract<Cypress.DevServerConfigOptions, { bundler: 'webpack' }>['framework']

type FrameworkConfig = {
  framework?: Exclude<Frameworks, 'angular'>
} | {
  framework: 'angular'
  options?: {
    projectConfig: Cypress.AngularDevServerProjectConfig
  }
}

export type ConfigHandler =
  Partial<Configuration>
  | (() => Partial<Configuration> | Promise<Partial<Configuration>>)

export type WebpackDevServerConfig = {
  specs: Cypress.Spec[]
  cypressConfig: Cypress.PluginConfigOptions
  devServerEvents: NodeJS.EventEmitter
  onConfigNotFound?: (devServer: 'webpack', cwd: string, lookedIn: string[]) => void
  webpackConfig?: ConfigHandler // Derived from the user's webpack config
} & FrameworkConfig

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

    // @ts-expect-error
    const { port } = result.server?.options

    if (result.version === 3) {
      const srv = result.server.listen(port || 0, '127.0.0.1', () => {
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

export type PresetHandlerResult = { frameworkConfig: Configuration, sourceWebpackModulesResult: SourceRelativeWebpackResult }

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>

const thirdPartyDefinitionPrefixes = {
  // matches @org/cypress-ct-*
  namespacedPrefixRe: /^@.+?\/cypress-ct-.+/,
  globalPrefix: 'cypress-ct-',
}

export function isThirdPartyDefinition (framework: string) {
  return framework.startsWith(thirdPartyDefinitionPrefixes.globalPrefix) ||
    thirdPartyDefinitionPrefixes.namespacedPrefixRe.test(framework)
}

async function getPreset (devServerConfig: WebpackDevServerConfig): Promise<Optional<PresetHandlerResult, 'frameworkConfig'>> {
  const defaultWebpackModules = () => ({ sourceWebpackModulesResult: sourceDefaultWebpackDependencies(devServerConfig) })

  // Third party library (eg solid-js, lit, etc)
  if (devServerConfig.framework && isThirdPartyDefinition(devServerConfig.framework)) {
    return defaultWebpackModules()
  }

  switch (devServerConfig.framework) {
    case 'create-react-app':
      return createReactAppHandler(devServerConfig)
    case 'nuxt':
      return await nuxtHandler(devServerConfig)

    case 'vue-cli':
      return await vueCliHandler(devServerConfig)

    case 'next':
      return await nextHandler(devServerConfig)

    case 'angular':
      return await angularHandler(devServerConfig)

    case 'react':
    case 'vue':
    case 'svelte':
    case undefined:
      return defaultWebpackModules()

    default:
      throw new Error(`Unexpected framework ${(devServerConfig as any).framework}, please visit https://on.cypress.io/component-framework-configuration to see a list of supported frameworks`)
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
