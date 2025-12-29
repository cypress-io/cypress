import debugFn from 'debug'
import semverMajor from 'semver/functions/major.js'
import type { UserConfig } from 'vite-7'
import { getVite, Vite } from './getVite.js'
import { createViteDevServerConfig } from './resolveConfig.js'
import express from 'express'

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
  const vite = await getVite(config)

  let majorVersion: number | undefined = undefined

  if (vite.version) {
    majorVersion = semverMajor(vite.version)
    debug(`Found vite version v${majorVersion}`)
  } else {
    debug(`vite version not found`)
  }

  debug('Creating Vite Server')
  const server = await devServer.create(config, vite)

  debug('Vite server created')

  let instance = await server.listen(5678)
  const port = 5678

  if (!port) {
    throw new Error('Missing vite dev server port.')
  }

  let isRunning = true

  // this is working to reproduce the problem of the server "reloading"
  // instead, we are actually starting/stopping the server dynamically to simulate the reloading scenario.
  setTimeout(() => {
    let interval = setInterval(async () => {
      if (isRunning) {
        debug('disabling vite server on port', port)

        instance.close()
        isRunning = false
      } else {
        debug('enabling vite server on port', port)
        instance = await server.listen(port)
        isRunning = true
        clearInterval(interval)
      }
    }, 1500)
  }, 5000)

  debug('Successfully launched the vite server on port', port)

  return {
    port,
    // Close is for unit testing only. We kill this child process which will handle the closing of the server
    close (cb) {
      debug('closing dev server')

      // no-op for now
    },
  }
}

devServer.create = async function createDevServer (devServerConfig: ViteDevServerConfig, vite: Vite) {
  try {
    const app = express()
    const config = await createViteDevServerConfig(devServerConfig, vite)

    config.server!.middlewareMode = true
    config.appType = 'custom'

    const viteServer = await vite.createServer(config)

    // Use vite's connect instance as middleware
    app.use(viteServer.middlewares)

    // for testing purposes, use an express server that wraps the the vite server that we can dynamically start/stop
    // in order to recreate a "optimizing dependencies" scenario that would cause the vite server to reload
    // and possibly fail to load the scripts requested inside Cypress CT.
    return app
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }

    throw new Error(err as string)
  }
}
