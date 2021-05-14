import Debug from 'debug'
import { createServer, ViteDevServer, InlineConfig, UserConfig, Plugin } from 'vite'
import { dirname, resolve } from 'path'
import getPort from 'get-port'
import { makeCypressPlugin } from './makeCypressPlugin'

const debug = Debug('cypress:vite-dev-server:start')

interface Options {
  specs: Cypress.Cypress['spec'][]
  config: Record<string, string>
  devServerEvents: EventEmitter
  [key: string]: unknown
}

export interface StartDevServer {
  /**
   * the Cypress options object
   */
  options: Options
  /**
   * By default, vite will use your vite.config file to
   * Start the server. If you need additional plugins or
   * to override some options, you can do so using this.
   * @optional
   */
  viteConfig?: UserConfig
}

const INIT_VIRTUAL_TEST_PATH = resolve(__dirname, '../client/initVirtualTest.js')

const makeVirtualId = (id: string) => `/@virtual:${id}`

const virtualStoriesPlugin = (registeredStories: Set<string>): Plugin => {
  debug('Setting up plugin')

  return {
    name: '@cypress/vite-dev-server/storybook',
    load: (fileId) => {
      debug(`Loading ${fileId}`)
      if (registeredStories.has(fileId)) {
        // Virtual story spec
        debug('Loading virtual')

        return `import * as stories from '/${fileId.replace('/@virtual:', '')}';
        import virtualTest from '${INIT_VIRTUAL_TEST_PATH}';
        virtualTest(stories);`
      }

      return null
    },
    enforce: 'pre',
  }
}

const resolveServerConfig = async ({ viteConfig, options }: StartDevServer): Promise<InlineConfig> => {
  const { projectRoot, supportFile } = options.config

  const requiredOptions: InlineConfig = {
    base: '/__cypress/src/',
    root: projectRoot,
  }

  const finalConfig: InlineConfig = { ...viteConfig, ...requiredOptions }

  const storybookStorySpecs = options.specs.filter((s) => {
    return s.specType === 'component' && s.source === 'storybook'
  }).map((s) => `/${s.relative}`)

  finalConfig.plugins = [...(viteConfig.plugins || []), virtualStoriesPlugin(new Set(storybookStorySpecs)), makeCypressPlugin(projectRoot, supportFile, options.devServerEvents, options.specs)]

  // This alias is necessary to avoid a "prefixIdentifiers" issue from slots mounting
  // only cjs compiler-core accepts using prefixIdentifiers in slots which vue test utils use.
  // Could we resolve this usage in test-utils?
  try {
    finalConfig.resolve = finalConfig.resolve || {}
    finalConfig.resolve.alias = {
      ...finalConfig.resolve.alias,
      '@vue/compiler-core': resolve(dirname(require.resolve('@vue/compiler-core')), 'dist', 'compiler-core.cjs.js'),
    }
  } catch (e) {
    // Vue 3 is not installed
  }

  finalConfig.server = finalConfig.server || {}

  finalConfig.server.port = await getPort({ port: finalConfig.server.port || 3000, host: 'localhost' }),

  // Ask vite to pre-optimize all dependencies of the specs
  finalConfig.optimizeDeps = finalConfig.optimizeDeps || {}

  // finalConfig.optimizeDeps.entries = [...options.specs.map((spec) => spec.specType === 'component' && spec.source === 'storybook' ? makeVirtualId(spec.absolute) : spec.absolute), supportFile]

  debug(`the resolved server config is ${JSON.stringify(finalConfig, null, 2)}`)

  return finalConfig
}

export async function start (devServerOptions: StartDevServer): Promise<ViteDevServer> {
  if (!devServerOptions.viteConfig) {
    debug('User did not pass in any Vite dev server configuration')
    devServerOptions.viteConfig = {}
  }

  debug('starting vite dev server')
  const resolvedConfig = await resolveServerConfig(devServerOptions)

  return createServer(resolvedConfig)
}
