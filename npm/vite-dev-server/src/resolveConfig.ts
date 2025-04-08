/**
 * The logic inside of this file is heavily reused from
 * Vitest's own config resolution logic.
 * You can find it here https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/node/create.ts
 */
import debugFn from 'debug'
import type { InlineConfig } from 'vite-6'
import path from 'path'
import semverGte from 'semver/functions/gte'

import { configFiles } from './constants'
import type { ViteDevServerConfig } from './devServer'
import { Cypress, CypressSourcemap } from './plugins/index'
import type { Vite } from './getVite'
import { dynamicImport } from './dynamic-import'

const debug = debugFn('cypress:vite-dev-server:resolve-config')

export const createViteDevServerConfig = async (config: ViteDevServerConfig, vite: Vite): Promise<InlineConfig> => {
  const { viteConfig: inlineViteConfig, cypressConfig: { projectRoot } } = config
  let resolvedOverrides: InlineConfig = {}

  if (inlineViteConfig) {
    debug(`Received a custom viteConfig`, inlineViteConfig)

    if (typeof inlineViteConfig === 'function') {
      resolvedOverrides = await inlineViteConfig()
    } else if (typeof inlineViteConfig === 'object') {
      resolvedOverrides = inlineViteConfig
    }

    // Set "configFile: false" to disable auto resolution of <project-root>/vite.config.js
    resolvedOverrides = { configFile: false, ...resolvedOverrides }
  } else {
    const { findUp } = await dynamicImport<typeof import('find-up')>('find-up')

    const configFile = await findUp(configFiles, { cwd: projectRoot })

    if (!configFile) {
      if (config.onConfigNotFound) {
        config.onConfigNotFound('vite', projectRoot, configFiles)
        // The config process will be killed from the parent, but we want to early exit so we don't get
        // any additional errors related to not having a config
        process.exit(0)
      } else {
        throw new Error(`Your component devServer config for vite is missing a required viteConfig property, since we could not automatically detect one.\n Please add one to your ${config.cypressConfig.configFile}`)
      }
    }

    debug('Resolved config file at', configFile, 'using root', projectRoot)

    resolvedOverrides = { configFile }
  }

  const finalConfig = vite.mergeConfig(
    resolvedOverrides,
    makeCypressViteConfig(config, vite),
  )

  debug('The resolved server config is', JSON.stringify(finalConfig, null, 2))

  return finalConfig
}

function makeCypressViteConfig (config: ViteDevServerConfig, vite: Vite): InlineConfig | InlineConfig {
  const {
    cypressConfig: {
      port,
      projectRoot,
      devServerPublicPathRoute,
      supportFile,
      cypressBinaryRoot,
      isTextTerminal,
    },
    specs,
  } = config

  const vitePort = port ?? undefined

  // Vite caches its output in the .vite directory in the node_modules where vite lives.
  // So we want to find that node_modules path and ensure it's added to the "allow" list
  const vitePathNodeModules = path.dirname(path.dirname(require.resolve(`vite/package.json`, {
    paths: [projectRoot],
  })))

  // Our Vite typings do not have the 'incremental' field since it was removed in 4.2, but users' version
  // of Vite may be older and we want to use it if it's there
  type Vite_4_1_Config = { optimizeDeps: { esbuildOptions: { incremental?: boolean } } }

  const viteConfig: InlineConfig & Vite_4_1_Config = {
    root: projectRoot,
    base: `${devServerPublicPathRoute}/`,
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
        ...specs.map((s) => path.relative(projectRoot, s.relative)),
        ...(supportFile ? [path.resolve(projectRoot, supportFile)] : []),
      ].filter((v) => v != null),
    },
    server: {
      fs: {
        allow: [
          projectRoot,
          vitePathNodeModules,
          cypressBinaryRoot,
          // Allow in monorepo: https://vitejs.dev/config/server-options.html#server-fs-allow
          // Supported from Vite v3 - add null check for v2 users.
          vite.searchForWorkspaceRoot?.(process.cwd()),
        ],
      },
      port: vitePort,
      host: '127.0.0.1',
      // Disable file watching and HMR when executing tests in `run` mode
      ...(isTextTerminal
        ? { watch: { ignored: '**/*' }, hmr: false }
        : {}),
    },
    plugins: [
      Cypress(config, vite),
      CypressSourcemap(config, vite),
    ],
  }

  if (vite.version && semverGte(vite.version, '4.2.0')) {
    delete viteConfig.optimizeDeps?.esbuildOptions?.incremental
  }

  return viteConfig
}
