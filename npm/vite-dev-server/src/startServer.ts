import Debug from 'debug'
import { createServer, ViteDevServer, InlineConfig, UserConfig } from 'vite'
import { dirname, resolve } from 'path'
import getPort from 'get-port'
import { makeCypressPlugin } from './makeCypressPlugin'

const debug = Debug('cypress:vite-dev-server:start')

interface Options {
  specs: Cypress.Cypress['spec'][]
  config: Record<string, string>
  devServerEvents: EventEmitter
  [key: string]: unknown
}

export interface StartDevServer {
  /* this is the Cypress options object */
  options: Options
  /* support passing a path to the user's webpack config */
  viteConfig?: UserConfig // TODO: implement taking in the user's vite configuration. Right now we don't
}

const resolveServerConfig = async ({ viteConfig, options }: StartDevServer): Promise<InlineConfig> => {
  const { projectRoot, supportFile } = options.config

  const requiredOptions: InlineConfig = {
    base: '/__cypress/src/',
    root: projectRoot,
  }

  const finalConfig: InlineConfig = { ...viteConfig, ...requiredOptions }

  finalConfig.plugins = [...(viteConfig.plugins || []), makeCypressPlugin(projectRoot, supportFile, options.devServerEvents)]

  // This alias is necessary to avoid a "prefixIdentifiers" issue from slots mounting
  // only cjs compiler-core accepts using prefixIdentifiers in slots which vue test utils use.
  // Could we resolve this usage in test-utils?
  finalConfig.resolve = finalConfig.resolve || {}
  finalConfig.resolve.alias = {
    ...finalConfig.resolve.alias,
    '@vue/compiler-core': resolve(dirname(require.resolve('@vue/compiler-core')), 'dist', 'compiler-core.cjs.js'),
  },

  finalConfig.server = finalConfig.server || {}

  finalConfig.server.port = await getPort({ port: 3000, host: 'localhost' }),

  debug(`the resolved server config is ${JSON.stringify(finalConfig, null, 2)}`)

  return finalConfig
}

export async function start (devServerOptions: StartDevServer): Promise<ViteDevServer> {
  if (!devServerOptions.viteConfig) {
    debug('User did not pass in any Vite dev server configuration')
    devServerOptions.viteConfig = {}
  }

  debug('starting vite dev server')
  const resolvedConfig = await resolveServerConfig(devServerOptions)

  return createServer(resolvedConfig)
}
