/**
 * The logic inside of this file is heavily reused from
 * Vitest's own config resolution logic.
 * You can find it here https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/node/create.ts
 */
import debugFn from 'debug'
import type { InlineConfig as InlineConfig_7, DepOptimizationOptions as DepOptimizationOptions_7 } from 'vite-7'
import type { InlineConfig as InlineConfig_8, DepOptimizationOptions as DepOptimizationOptions_8 } from 'vite-8'
import type { Plugin, PluginBuild, BuildResult } from 'esbuild'
import path from 'path'
import { createRequire } from 'module'
import semverGte from 'semver/functions/gte.js'

import { configFiles } from './constants.js'
import type { ViteDevServerConfig } from './devServer.js'
import { Cypress, CypressSourcemap } from './plugins/index.js'
import type { Vite_7, Vite_8 } from './getVite.js'

const debug = debugFn('cypress:vite-dev-server:resolve-config')

export const isVite8 = (vite: Vite_7 | Vite_8): boolean => {
  const isVite8 = vite.version && semverGte(vite.version, '8.0.0') || false

  debug('is vite 8 being used:', isVite8)

  return isVite8
}

export const createViteDevServerConfig = async <T extends Vite_7 | Vite_8>(config: ViteDevServerConfig, vite: T): Promise<T extends Vite_7 ? InlineConfig_7 : InlineConfig_8> => {
  const { viteConfig: inlineViteConfig, cypressConfig: { projectRoot } } = config
  let resolvedOverrides: InlineConfig_7 | InlineConfig_8 = {}

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
    const { findUp } = await import('find-up')

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

function makeCypressViteConfig (config: ViteDevServerConfig, vite: Vite_7 | Vite_8): InlineConfig_7 | InlineConfig_8 {
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

  const require = createRequire(import.meta.url)

  // Vite caches its output in the .vite directory in the node_modules where vite lives.
  // So we want to find that node_modules path and ensure it's added to the "allow" list
  const vitePathNodeModules = path.dirname(path.dirname(require.resolve(`vite/package.json`, {
    paths: [projectRoot],
  })))

  const cypress_esbuild_plugin: Plugin = {
    name: 'cypress-esbuild-plugin',
    setup (build: PluginBuild) {
      build.onEnd(function (result: BuildResult) {
        // We don't want to completely fail the build here on errors so we treat the errors as warnings
        // which will handle things more gracefully. Vite will 500 on files that have errors when they
        // are requested later and Cypress will display an error message.
        // See: https://github.com/cypress-io/cypress/pull/21599
        result.warnings = [...(result.warnings || []), ...(result.errors || [])]
        result.errors = []
      })
    },
  }

  let options: DepOptimizationOptions_7 | DepOptimizationOptions_8

  if (isVite8(vite)) {
    // @see https://main.vite.dev/guide/migration
    options = {
      rolldownOptions: {
        plugins: [
          // @see https://vite.dev/guide/rolldown#withfilter-wrapper
          (vite as Vite_8).withFilter(
            cypress_esbuild_plugin,
            {},
          ),
        ],
      },
    }
  } else {
    options = {
      esbuildOptions: {
        // Type assertion needed due to esbuild version mismatch between vite-dev-server and vite
        plugins: [
          cypress_esbuild_plugin as any,
        ],
      },
    }
  }

  const viteConfig: InlineConfig_7 | InlineConfig_8 = {
    root: projectRoot,
    base: `${devServerPublicPathRoute}/`,
    optimizeDeps: {
      ...options,
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

  return viteConfig
}
