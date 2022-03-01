import { createServer as viteCreateServer } from 'vite'
import debugFn from 'debug'
import getPort from 'get-port'
import { createConfig } from './resolveConfig'
import type { CypressViteDevServerConfig, StartDevServer } from './types'

const debug = debugFn('cypress:vite-dev-server:index')

console.log('top level index')
export const startDevServer = async ({ options, viteConfig = {} }: StartDevServer) => {
  console.log('start dev server')
  debug('user has registered startDevServer for Vite')
  let server

  try {
    console.log('inside of try')
    const config = await createConfig({ options, viteConfig })

    server = await viteCreateServer(config)
    console.log('after server try', config)
  } catch (err) {
    console.log('err', err)
    throw new Error(err as string)
  }

  debug('vite server created successfully')
  const port = await getPort({ port: 3000 })

  await server.listen(port)
  debug('successfully launched the vite server on port', port)

  return {
    port,
    close: server.close,
  }
}

export function devServer (options: Cypress.DevServerConfig, viteConfig?: CypressViteDevServerConfig) {
  return startDevServer({ options, viteConfig })
}
