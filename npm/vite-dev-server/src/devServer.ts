import debugFn from 'debug'
import type { AddressInfo } from 'net'
import { createCypressViteServer } from './createCypressViteServer'
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

  return await devServer.create(config, vite)
}

devServer.create = async function createDevServer (devServerConfig: ViteDevServerConfig, vite: Vite) {
  try {
    const config = await createViteDevServerConfig(devServerConfig, vite)

    if (devServerConfig.cypressConfig.isTextTerminal) {
      const server = await createCypressViteServer(devServerConfig, config, vite)

      debug('Vite server created')

      server.listen()

      return {
        port: (server.address() as AddressInfo)?.port,
        async close (cb: ((err?: Error | undefined) => any) | undefined) {
          server.close(cb)
        },
      }
    }

    const server = await vite.createServer(config)

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
      async close (cb: ((err?: Error | undefined) => any) | undefined) {
        try {
          await server.close()
          cb?.()
        } catch {
          cb?.()
        }
      },
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }

    throw new Error(err as string)
  }
}
