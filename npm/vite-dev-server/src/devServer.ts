import debugFn from 'debug'
import semverMajor from 'semver/functions/major.js'
import type { UserConfig } from 'vite-7'
import { getVite, Vite_7, Vite_8 } from './getVite.js'
import { createViteDevServerConfig, isVite8 } from './resolveConfig.js'
import { getSpecRelativeUrl, getSupportFileRelativePath } from './warmupTargets.js'

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

  await server.listen()
  const { port } = server.config.server

  if (!port) {
    throw new Error('Missing vite dev server port.')
  }

  debug('Successfully launched the vite server on port', port)

  // Warm up the support file and every spec, then waitForRequestsIdle, so
  // Vite's deps optimizer has fully processed any node_modules imports
  // they pull in before the browser fetches them. Skipping this can race
  // a mid-test optimizer re-bundle and surface "Failed to fetch
  // dynamically imported module".
  //
  // Per-spec warmup is required: preprocessor or auto-import plugins can
  // inject node_modules imports during transform that Vite's static deps
  // scanner doesn't see, so the optimizer would otherwise first discover
  // them when the browser fetches the spec.
  const warmupTargets: string[] = []
  const supportPath = getSupportFileRelativePath(config.cypressConfig)

  if (supportPath) {
    warmupTargets.push(supportPath)
  }

  for (const spec of config.specs ?? []) {
    warmupTargets.push(getSpecRelativeUrl(spec, config.cypressConfig))
  }

  if (warmupTargets.length > 0) {
    debug('Warming up module graph for %d targets', warmupTargets.length)
    await Promise.all(warmupTargets.map((target) => server.warmupRequest(target)))
    await server.waitForRequestsIdle()
    debug('Module graph is ready')
  }

  return {
    port,
    // Close is for unit testing only. We kill this child process which will handle the closing of the server
    close (cb) {
      debug('closing dev server')

      return server.close().then(() => {
        debug('closed dev server')
        cb?.()
      }).catch(cb)
    },
  }
}

devServer.create = async function createDevServer (devServerConfig: ViteDevServerConfig, vite: Vite_7 | Vite_8) {
  try {
    // Handling here is mainly for conditional generics to make sure we get the types correct between vite 7 and vite 8.
    // Eventually, vite 8 will be the default and we can remove this logic
    if (isVite8(vite)) {
      const config = await createViteDevServerConfig<Vite_8>(devServerConfig, vite as Vite_8)

      return await (vite as Vite_8).createServer(config)
    }

    const config = await createViteDevServerConfig<Vite_7>(devServerConfig, vite as Vite_7)

    return await (vite as Vite_7).createServer(config)
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }

    throw new Error(err as string)
  }
}
