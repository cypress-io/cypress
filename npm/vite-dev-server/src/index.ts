import debugFn from 'debug'
import getPort from 'get-port'
import { createServer as viteCreateServer } from 'vite'
import { createConfig } from './resolveConfig'
import type { CypressViteDevServerConfig, StartDevServer } from './types'

const debug = debugFn('cypress:vite-dev-server:index')

export const startDevServer = async ({ options, viteConfig = {} }: StartDevServer) => {
  debug('Starting Vite Server')
  let server

  try {
    const config = await createConfig({ options, viteConfig })

    server = await viteCreateServer(config)
  } catch (err) {
    throw new Error(err as string)
  }

  debug('Vite server created')
  const port = await getPort({ port: 3000 })

  await server.listen(port)
  debug('Successfully launched the vite server on port', port)

  return {
    port,
    close: server.close,
  }
}

export function devServer (cypressDevServerConfig: Cypress.DevServerConfig, devServerConfig?: CypressViteDevServerConfig) {
  return startDevServer({ options: cypressDevServerConfig, viteConfig: devServerConfig })
}
