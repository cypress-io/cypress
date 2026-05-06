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

  // Warm up every URL the browser will dynamically import via
  // initCypressTests.js — the support file plus every spec the dev server
  // was started with — so each one's transitive deps go through Vite's
  // transform pipeline and the deps optimizer picks up any node_modules
  // imports they need. waitForRequestsIdle then blocks until all pending
  // transforms (including a deps-optimizer run triggered by the warmups)
  // have settled.
  //
  // After both resolve, the browser's subsequent fetches for the support
  // file, the specs, and their transitive imports are served from Vite's
  // cache without racing the optimizer — the source of the intermittent
  // "Failed to fetch dynamically imported module" failures (#25913).
  //
  // Per-spec warmup is required (not just support + optimizeDeps.entries):
  // transform-injected node_modules imports — e.g. from
  // @badeball/cypress-cucumber-preprocessor's rollup plugin compiling a
  // .feature spec, or unplugin-auto-import injecting helpers — aren't
  // visible to Vite's static deps scanner. Without warming the spec, the
  // optimizer first sees those deps when the browser fetches the spec,
  // which can trigger a mid-test "optimized dependencies changed.
  // reloading" and reproduce #25913 / #33752.
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
