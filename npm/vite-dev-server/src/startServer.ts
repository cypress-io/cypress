import Debug from 'debug'
import { createServer, ViteDevServer, InlineConfig } from 'vite'
import { dirname, resolve } from 'path'
import getPort from 'get-port'
import { makeCypressPlugin } from './makeCypressPlugin'

const debug = Debug('cypress:vite-dev-server:start')

export interface StartDevServerOptions {
  /**
   * the Cypress dev server configuration object
   */
  options: Cypress.DevServerConfig
  /**
   * By default, vite will use your vite.config file to
   * Start the server. If you need additional plugins or
   * to override some options, you can do so using this.
   * @optional
   */
  viteConfig?: Omit<InlineConfig, 'base' | 'root'>
  /**
   * Path to an index.html file that will serve as the template in
   * which your components will be rendered.
   */
  indexHtml?: string
}

const resolveServerConfig = async ({ viteConfig, options, indexHtml }: StartDevServerOptions): Promise<InlineConfig> => {
  const { projectRoot, supportFile } = options.config

  const requiredOptions: InlineConfig = {
    base: '/__cypress/src/',
    root: projectRoot,
  }

  const finalConfig: InlineConfig = { ...viteConfig, ...requiredOptions }

  finalConfig.plugins = [...(finalConfig.plugins || []), makeCypressPlugin(projectRoot, supportFile, options.devServerEvents, options.specs, indexHtml)]

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

  finalConfig.server.port = await getPort({ port: finalConfig.server.port || 3000 }),

  // Ask vite to pre-optimize all dependencies of the specs
  finalConfig.optimizeDeps = finalConfig.optimizeDeps || {}

  // pre-optimize all the specs
  if ((options.specs && options.specs.length)) {
    // fix: we must preserve entries configured on target project
    const existingOptimizeDepsEntries = finalConfig.optimizeDeps.entries

    if (existingOptimizeDepsEntries) {
      finalConfig.optimizeDeps.entries = [...existingOptimizeDepsEntries, ...options.specs.map((spec) => spec.relative)]
    } else {
      finalConfig.optimizeDeps.entries = [...options.specs.map((spec) => spec.relative)]
    }

    // only optimize a supportFile is it is not false or undefined
    if (supportFile) {
      // fix: on windows we need to replace backslashes with slashes
      finalConfig.optimizeDeps.entries.push(supportFile.replace(/\\/g, '/'))
    }
  }

  debug(`the resolved server config is ${JSON.stringify(finalConfig, null, 2)}`)

  return finalConfig
}

export async function start (devServerOptions: StartDevServerOptions): Promise<ViteDevServer> {
  if (!devServerOptions.viteConfig) {
    debug('User did not pass in any Vite dev server configuration')
    devServerOptions.viteConfig = {}
  }

  debug('starting vite dev server')
  const resolvedConfig = await resolveServerConfig(devServerOptions)

  return createServer(resolvedConfig)
}
