import debugFn from 'debug'
import type { UserConfig } from 'vite'
import { getVite, Vite } from './getVite'
import { createViteDevServerConfig } from './resolveConfig'

const debug = debugFn('cypress:vite-dev-server:devServer')

const ALL_FRAMEWORKS = ['react', 'vue'] as const

type ConfigHandler = UserConfig | (() => UserConfig | Promise<UserConfig>)

export type ViteDevServerConfig = {
  specs: Cypress.Spec[]
  cypressConfig: Cypress.PluginConfigOptions
  devServerEvents: NodeJS.EventEmitter
  onConfigNotFound?: (devServer: 'vite', cwd: string, lookedIn: string[]) => void
} & {
  framework?: typeof ALL_FRAMEWORKS[number] // Add frameworks here as we implement
  viteConfig?: ConfigHandler // Derived from the user's vite config
}

export async function devServer (config: ViteDevServerConfig): Promise<Cypress.ResolvedDevServerConfig> {
  // This has to be the first thing we do as we need to source vite from their project's dependencies
  const vite = getVite(config)

  debug('Creating Vite Server')
  const server = await devServer.create(config, vite)

  debug('Vite server created')

  await server.listen()
  const { port } = server.config.server

  if (!port) {
    throw new Error('Missing vite dev server port.')
  }

  debug('Successfully launched the vite server on port', port)

  return {
    port,
    // Close is for unit testing only. We kill this child process which will handle the closing of the server
    close (cb) {
      return server.close().then(() => cb?.()).catch(cb)
    },
  }
}

devServer.create = async function createDevServer (devServerConfig: ViteDevServerConfig, vite: Vite) {
  try {
    const config = await createViteDevServerConfig(devServerConfig, vite)

    return await vite.createServer(config)
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }

    throw new Error(err as string)
  }
}
