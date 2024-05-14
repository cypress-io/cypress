import debugFn from 'debug'
import type { InlineConfig, UserConfig, ViteDevServer } from 'vite'
import { getVite, Vite } from './getVite'
import { createViteDevServerConfig } from './resolveConfig'

const debug = debugFn('cypress:vite-dev-server:devServer')

const ALL_FRAMEWORKS = ['react', 'vue'] as const

export type ConfigHandler = UserConfig | (() => UserConfig | Promise<UserConfig>)

export type ViteDevServerConfig = {
  specs: Cypress.Spec[]
  cypressConfig: Cypress.PluginConfigOptions
  devServerEvents: NodeJS.EventEmitter
  onConfigNotFound?: (devServer: 'vite', cwd: string, lookedIn: string[]) => void
} & {
  framework?: typeof ALL_FRAMEWORKS[number] // Add frameworks here as we implement
  viteConfig?: ConfigHandler // Derived from the user's vite config
}

export async function devServer (config: ViteDevServerConfig): Promise<Partial<Cypress.ResolvedDevServerConfig> & { server: ViteDevServer }> {
  // This has to be the first thing we do as we need to source vite from their project's dependencies
  const vite = getVite(config)
  const viteConfig = await createViteDevServerConfig(config, vite)

  debug('Creating Vite Server')
  const server = await devServer.create(viteConfig, vite)

  debug('Vite server created')

  if (!viteConfig.server?.middlewareMode) {
    await server.listen()
    const { port } = server.config.server

    if (!port) {
      throw new Error('Missing vite dev server port.')
    }

    debug('Successfully launched the vite server on port', port)
  }

  return {
    server,
    port: server.config.server.port,
    // Close is for unit testing only. We kill this child process which will handle the closing of the server
    close (cb) {
      return server.close().then(() => cb?.()).catch(cb)
    },
  }
}

devServer.create = async function createDevServer (viteConfig: InlineConfig, vite: Vite) {
  try {
    return await vite.createServer(viteConfig)
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }

    throw new Error(err as string)
  }
}
