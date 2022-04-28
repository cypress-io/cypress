import debugFn from 'debug'
import getPort from 'get-port'
import { getVite, Vite } from './getVite'
import { createViteDevServerConfig } from './resolveConfig'

const debug = debugFn('cypress:vite-dev-server:devServer')

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
  // This has to be the first thing we do as we need to source vite from their project's dependencies
  const vite = getVite(config)

  debug('Creating Vite Server')
  const server = await devServer.create(config, vite)

  debug('Vite server created')
  const port = await getPort({ port: 3000 })

  debug('Starting Vite Server on port %i', port)
  await server.listen(port)

  debug('Successfully launched the vite server on port', port)

  return {
    port,
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
