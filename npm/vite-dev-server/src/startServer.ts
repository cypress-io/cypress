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
  /**
   * the Cypress options object
   */
  options: Options
  /**
   * By default, vite will use your vite.config file to
   * Start the server. If you need additional plugins or
   * to override some options, you can do so using this.
   * @optional
   */
  viteConfig?: UserConfig
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
  try {
    finalConfig.resolve = finalConfig.resolve || {}
    finalConfig.resolve.alias = {
      ...finalConfig.resolve.alias,
      '@vue/compiler-core': resolve(dirname(require.resolve('@vue/compiler-core')), 'dist', 'compiler-core.cjs.js'),
    }
  } catch (e) {
    // Vue 3 is not installed
  }

  finalConfig.server = finalConfig.server || {}

  finalConfig.server.port = await getPort({ port: finalConfig.server.port || 3000, host: 'localhost' }),

  // Ask vite to pre-optimize all dependencies of the specs
  finalConfig.optimizeDeps = finalConfig.optimizeDeps || {}

  finalConfig.optimizeDeps.entries = [...options.specs.map((spec) => spec.relative), supportFile]

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
