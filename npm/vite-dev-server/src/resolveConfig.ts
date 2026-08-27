/**
 * The logic inside of this file is heavily reused from
 * Vitest's own config resolution logic.
 * You can find it here https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/node/create.ts
 */
import debugFn from 'debug'
import type { InlineConfig } from 'vite-8'
import path from 'path'
import { createRequire } from 'module'
import { configFiles } from './constants.js'
import type { ViteDevServerConfig } from './devServer.js'
import { Cypress, CypressSourcemap } from './plugins/index.js'
import type { Vite } from './getVite.js'

const debug = debugFn('cypress:vite-dev-server:resolve-config')

// Limit jsxRefreshInclude/exclude matching to scripts. With only jsxRefreshExclude set, Vite builds
// createFilter(undefined, exclude) which matches every non-excluded path — CSS would hit transformWithOxc and fail.
// @see https://github.com/vitejs/vite/blob/main/packages/vite/src/node/plugins/oxc.ts (transform + jsxRefreshFilter)
/** Passed as `oxc.jsxRefreshInclude` so JSX refresh excludes do not match CSS or other assets. */
export const JSX_REFRESH_SCRIPT_RE = /\.(?:[cm]?js|[cm]?ts|[jt]sx)$/

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

function makeCypressViteConfig (config: ViteDevServerConfig, vite: Vite): InlineConfig {
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

  const viteConfig: InlineConfig = {
    root: projectRoot,
    base: `${devServerPublicPathRoute}/`,
    // Vite 8 Rolldown/react-plugin can wrap JSX specs with `import.meta.hot.accept`, re-evaluating
    // the module in headed mode and registering describe/it twice. Excluding CT specs from JSX refresh fixes it.
    // @see https://github.com/cypress-io/cypress/issues/33750
    oxc: {
      jsxRefreshInclude: JSX_REFRESH_SCRIPT_RE,
      jsxRefreshExclude: specs.map((s) => s.absolute),
    },
    // No rolldown plugin to downgrade dep-optimizer errors to warnings (see #21599).
    // The original workaround was an esbuild plugin under `optimizeDeps.esbuildOptions.plugins`;
    // when Vite 8 switched dep optimization to rolldown (#33580) the callback was moved to
    // `rolldownOptions.plugins` but kept esbuild's `setup(build).onEnd(...)` shape, which
    // rolldown never invokes. Rolldown reports per-module parse errors without aborting the
    // optimizer, so the mitigation is no longer needed; re-add via `onLog`/`onwarn` only if
    // a real hang regression appears.
    optimizeDeps: {
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
