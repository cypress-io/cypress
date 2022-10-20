/**
 * The logic inside of this file is heavily reused from
 * Vitest's own config resolution logic.
 * You can find it here https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/node/create.ts
 */
import debugFn from 'debug'
import { importModule } from 'local-pkg'
import { relative, resolve } from 'pathe'
import type { InlineConfig, UserConfig } from 'vite'
import path from 'path'

import { configFiles } from './constants'
import type { ViteDevServerConfig } from './devServer'
import { Cypress, CypressInspect, CypressSourcemap } from './plugins/index'
import type { Vite } from './getVite'

const debug = debugFn('cypress:vite-dev-server:resolve-config')

export const createViteDevServerConfig = async (config: ViteDevServerConfig, vite: Vite): Promise<InlineConfig> => {
  const { specs, cypressConfig, viteConfig: viteOverrides } = config
  const root = cypressConfig.projectRoot
  const { default: findUp } = await importModule('find-up')
  const configFile = await findUp(configFiles, { cwd: root } as { cwd: string })

  // INFO logging, a lot is logged here.
  // debug('all dev-server options are', options)

  if (configFile) {
    debug('resolved config file at', configFile, 'using root', root)
  } else if (viteOverrides) {
    debug(`Couldn't find a Vite config file, however we received a custom viteConfig`, viteOverrides)
  } else {
    if (config.onConfigNotFound) {
      config.onConfigNotFound('vite', root, configFiles)
      // The config process will be killed from the parent, but we want to early exit so we don't get
      // any additional errors related to not having a config
      process.exit(0)
    } else {
      throw new Error(`Your component devServer config for vite is missing a required viteConfig property, since we could not automatically detect one.\n Please add one to your ${config.cypressConfig.configFile}`)
    }
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
      esbuildOptions: {
        incremental: true,
        plugins: [
          {
            name: 'cypress-esbuild-plugin',
            setup (build) {
              build.onEnd(function (result) {
                // We don't want to completely fail the build here on errors so we treat the errors as warnings
                // which will handle things more gracefully. Vite will 500 on files that have errors when they
                // are requested later and Cypress will display an error message.
                // See: https://github.com/cypress-io/cypress/pull/21599
                result.warnings = [...result.warnings, ...result.errors]
                result.errors = []
              })
            },
          },
        ],
      },
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
      host: '127.0.0.1',
    },
    plugins: [
      Cypress(config, vite),
      CypressInspect(config),
      CypressSourcemap(config, vite),
    ].filter((p) => p != null),
  }

  if (config.cypressConfig.isTextTerminal) {
    viteBaseConfig.server = {
      ...(viteBaseConfig.server || {}),
      // Disable file watching and HMR when executing tests in `run` mode
      watch: {
        ignored: '**/*',
      },
      hmr: false,
    }
  }

  let resolvedOverrides: UserConfig = {}

  if (typeof viteOverrides === 'function') {
    resolvedOverrides = await viteOverrides()
  } else if (typeof viteOverrides === 'object') {
    resolvedOverrides = viteOverrides
  }

  const finalConfig = vite.mergeConfig(viteBaseConfig, resolvedOverrides)

  debug('The resolved server config is', JSON.stringify(finalConfig, null, 2))

  return finalConfig
}
