import debugFn from 'debug'
import getPort from 'get-port'
import { createServer as viteCreateServer } from 'vite'
import { createViteDevServerConfig } from './resolveConfig'

const debug = debugFn('cypress:vite-dev-server:index')

const ALL_FRAMEWORKS = ['react', 'vue'] as const

export type ViteDevServerConfig = {
  specs: Cypress.Spec[]
  cypressConfig: Cypress.PluginConfigOptions
  devServerEvents: NodeJS.EventEmitter
} & {
  framework?: typeof ALL_FRAMEWORKS[number] // Add frameworks here as we implement
  viteConfig?: unknown // Derived from the user's webpack
}

export async function devServer (config: ViteDevServerConfig): Promise<Cypress.ResolvedDevServerConfig> {
  debug('Creating Vite Server')
  const server = await devServer.create(config) as import('vite').ViteDevServer

  debug('Vite server created')
  const port = await getPort({ port: 3000 })

  debug('Starting Vite Server on port %i', port)
  await server.listen(port)

  debug('Successfully launched the vite server on port', port)

  return {
    port,
    close (cb) {
      return server.close().then(() => cb?.()).catch(cb)
    },
  }
}

devServer.create = async function createDevServer (devServerConfig: ViteDevServerConfig) {
  try {
    const config = await createViteDevServerConfig(devServerConfig)

    return await viteCreateServer(config)
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }

    throw new Error(err as string)
  }
}
