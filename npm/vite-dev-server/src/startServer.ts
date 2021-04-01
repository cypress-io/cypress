import Debug from 'debug'
import { StartDevServer } from '.'
import { createServer, ViteDevServer, InlineConfig } from 'vite'
import { dirname, resolve } from 'path'
import { makeCypressPlugin } from './makeCypressPlugin'

const debug = Debug('cypress:vite-dev-server:start')

const resolveServerConfig = ({ viteConfig, options }: StartDevServer) => {
  const { projectRoot, supportFile } = options.config

  const requiredOptions = {
    base: '/__cypress/src/',
    root: projectRoot,
  }

  const finalConfig = { ...viteConfig, ...requiredOptions }

  finalConfig.plugins = [...(viteConfig.plugins || []), makeCypressPlugin(projectRoot, supportFile, options.devServerEvents)]

  // This alias is necessary to avoid a "prefixIdentifiers" issue from slots mounting
  // only cjs compiler-core accepts using prefixIdentifiers in slots which vue test utils use.
  // Could we resolve this usage in test-utils?
  finalConfig.resolve = finalConfig.resolve || {}
  finalConfig.resolve.alias = {
    ...viteConfig.resolve.alias,
    '@vue/compiler-core': resolve(dirname(require.resolve('@vue/compiler-core')), 'dist', 'compiler-core.cjs.js'),
  },

  debug(`the resolved server config is ${JSON.stringify(finalConfig, null, 2)}`)

  return finalConfig
}

export async function start (devServerOptions: StartDevServer): Promise<ViteDevServer> {
  if (!devServerOptions.viteConfig) {
    debug('User did not pass in any Vite dev server configuration')
    devServerOptions.viteConfig = {}
  }

  debug('starting vite dev server')
  const resolvedConfig = resolveServerConfig(devServerOptions)

  return createServer(resolvedConfig)
}
