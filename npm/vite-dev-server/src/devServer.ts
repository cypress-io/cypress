import debugFn from 'debug'
import semverMajor from 'semver/functions/major.js'
import type { UserConfig } from 'vite-7'
import { getVite, Vite_7, Vite_8 } from './getVite.js'
import { createViteDevServerConfig, isVite8 } from './resolveConfig.js'
import { getSupportFileRelativePath } from './waitForSupportFile.js'

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

  // Walk the support file through Vite's transform pipeline so its module
  // graph is populated, then wait for the cascade — pre-transformed static
  // imports plus any deps-optimizer run those imports trigger — to settle.
  // After both resolve, the browser's subsequent fetches for the support
  // file and its transitive imports are served from Vite's cache without
  // racing the optimizer (the source of the intermittent "Failed to fetch
  // dynamically imported module" failures, #25913).
  //
  // Specs are intentionally not warmed up individually: `optimizeDeps.entries`
  // (set in resolveConfig.ts) already includes every spec, so Vite's static
  // deps scanner pre-bundles their node_modules imports as part of server
  // startup. Skipping per-spec warmup avoids an O(N) Vite transform per spec
  // for projects with large suites; the cost saved scales with spec count.
  // The trade-off: plugin-injected (non-static) spec imports — e.g. from
  // `unplugin-vue-components` — won't be discovered until the browser fetches
  // the spec, which can re-trigger the optimizer. In practice those usually
  // resolve to local project files (not new node_modules deps), so they
  // don't trigger a re-bundle.
  const supportPath = getSupportFileRelativePath(config.cypressConfig)

  if (supportPath) {
    debug('Warming up support file module graph', supportPath)
    await server.warmupRequest(supportPath)
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
