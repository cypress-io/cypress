import Debug from 'debug'
import { StartDevServer } from '.'
import { createServer, ViteDevServer, InlineConfig } from 'vite'
import { dirname, resolve } from 'path'
import { makeCypressPlugin } from './makeCypressPlugin'
import { EventEmitter } from 'events'

const debug = Debug('cypress:vite-dev-server:start')

// TODO: Pull in types for Options so we can infer these
const serverConfig = (projectRoot: string, supportFilePath: string, devServerEvents: EventEmitter): InlineConfig => {
  return {
    root: resolve(__dirname, projectRoot),
    plugins: [makeCypressPlugin(projectRoot, supportFilePath, devServerEvents)],
    server: {
      port: 0,
    },
    resolve: {
      alias: {
        // Necessary to avoid a "prefixIdentifiers" issue from slots mounting
        // Could be resolved in test-utils
        '@vue/compiler-core': resolve(dirname(require.resolve('@vue/compiler-core')), 'dist', 'compiler-core.cjs.js'),
      },
    },
  }
}

const resolveServerConfig = ({ viteConfig, options }: StartDevServer) => {
  const defaultServerConfig = serverConfig(
    options.config.projectRoot,
    options.config.supportFile,
    options.devServerEvents,
  )

  const requiredOptions = {
    base: defaultServerConfig.base,
    root: defaultServerConfig.root,
  }

  const finalConfig = { ...defaultServerConfig, ...viteConfig, ...requiredOptions }

  finalConfig.plugins = [...(viteConfig.plugins || []), defaultServerConfig.plugins[0]]
  finalConfig.server.port = defaultServerConfig.server.port

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
