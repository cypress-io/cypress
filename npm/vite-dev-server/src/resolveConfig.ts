/**
 * The logic inside of this file is heavily reused from
 * Vitest's own config resolution logic.
 * You can find it here https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/node/create.ts
 */
import debugFn from 'debug'
import { importModule } from 'local-pkg'
import { relative, resolve } from 'pathe'
import { mergeConfig } from 'vite'
import { configFiles } from './constants'
import { Cypress, CypressInspect } from './plugins/index'
import type { StartDevServer } from './types'

const debug = debugFn('cypress:vite-dev-server:resolve-config')

export const createConfig = async ({ options, viteConfig: viteOverrides = {} }: StartDevServer) => {
  const root = options.config.projectRoot || resolve(process.cwd())
  const { default: findUp } = await importModule('find-up')
  const configFile = await findUp(configFiles, { cwd: root } as { cwd: string })

  // INFO logging, a lot is logged here.
  // debug('all dev-server options are', options)

  if (configFile) {
    debug('resolved config file at', configFile, 'using root', root)
  } else if (viteOverrides) {
    debug('Couldn\'t find a Vite config file, however we received a custom viteConfig', viteOverrides)
  } else {
    debug(`
    Didn\'t resolve a Vite config AND the user didn\'t pass in a custom viteConfig.
    Falling back to Vite\'s defaults.`)
  }

  const config = {
    root,
    base: `/${options.config.namespace}/src/`,
    configFile,
    optimizeDeps: {
      entries: [
        ...options.specs.map((s) => relative(root, s.relative)),
        options.config.supportFile ?? resolve(root, options.config.supportFile),
      ].filter((v) => v != null),
    },
    plugins: [
      Cypress(options),
      await CypressInspect(),
    ],
  }

  const finalConfig = mergeConfig(config, viteOverrides)

  debug('The resolved server config is', JSON.stringify(finalConfig, null, 2))

  return finalConfig
}
