/**
 * The logic inside of this file is heavily reused from
 * Vitest's own config resolution logic.
 * You can find it here https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/node/create.ts
 */
import debugFn from 'debug'
import { importModule } from 'local-pkg'
import { relative, resolve } from 'pathe'
import type { InlineConfig } from 'vite'
import path from 'path'

import { configFiles } from './constants'
import type { ViteDevServerConfig } from './devServer'
import { Cypress, CypressInspect } from './plugins/index'
import type { Vite } from './getVite'

const debug = debugFn('cypress:vite-dev-server:resolve-config')

export const createViteDevServerConfig = async (config: ViteDevServerConfig, vite: Vite) => {
  const { specs, cypressConfig, viteConfig: viteOverrides = {} } = config
  const root = cypressConfig.projectRoot
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

  // Vite caches its output in the .vite directory in the node_modules where vite lives.
  // So we want to find that node_modules path and ensure it's added to the "allow" list
  const vitePathNodeModules = path.dirname(path.dirname(require.resolve(`vite/package.json`, {
    paths: [root],
  })))

  const viteBaseConfig: InlineConfig = {
    root,
    base: `${cypressConfig.devServerPublicPathRoute}/`,
    configFile,
    optimizeDeps: {
      entries: [
        ...specs.map((s) => relative(root, s.relative)),
        ...(cypressConfig.supportFile ? [resolve(root, cypressConfig.supportFile)] : []),
      ].filter((v) => v != null),
    },
    server: {
      fs: {
        allow: [
          root,
          vitePathNodeModules,
          cypressConfig.cypressBinaryRoot,
        ],
      },
    },
    plugins: [
      Cypress(config, vite),
      CypressInspect(config),
    ],
  }

  const finalConfig = vite.mergeConfig(viteBaseConfig, viteOverrides as Record<string, any>)

  debug('The resolved server config is', JSON.stringify(finalConfig, null, 2))

  return finalConfig
}
