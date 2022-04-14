import type { CreateFinalWebpackConfig } from '../createWebpackDevServer'
import debugLib from 'debug'
import type { Configuration } from 'webpack'
import * as fs from 'fs'
import * as path from 'path'

type PresetHandler = Omit<CreateFinalWebpackConfig, 'frameworkConfig'>

const debug = debugLib('cypress:webpack-dev-server-fresh:nextHandler')

export async function nextHandler ({ devServerConfig, sourceWebpackModulesResult }: PresetHandler) {
  const webpackConfig = await loadWebpackConfig({ devServerConfig, sourceWebpackModulesResult })

  debug('resolved next.js webpack config %o', webpackConfig)

  checkSWC(webpackConfig, devServerConfig.cypressConfig)

  // Next webpack compiler ignored watching any node_modules changes, but we need to watch
  // for changes to 'dist/browser.js' in order to detect new specs that have been added
  if (webpackConfig.watchOptions && Array.isArray(webpackConfig.watchOptions.ignored)) {
    webpackConfig.watchOptions = {
      ...webpackConfig.watchOptions,
      ignored: [...webpackConfig.watchOptions.ignored.filter((pattern: string) => !/node_modules/.test(pattern)), '**/node_modules/!(@cypress/webpack-dev-server/dist/browser.js)**'],
    }

    debug('found options next.js watchOptions.ignored %O', webpackConfig.watchOptions.ignored)
  }

  return webpackConfig
}

/**
 * Acquire the modules needed to load the Next webpack config
 * `loadConfig` acquires the next.config.js
 * `getNextJsBaseWebpackConfig` acquires the webpackConfig dependent on the next.config.js
 */
function getNextJsPackages ({ devServerConfig }: PresetHandler) {
  const resolvePaths = { paths: [devServerConfig.cypressConfig.projectRoot] }
  const packages = {} as { loadConfig: Function, getNextJsBaseWebpackConfig: Function }

  try {
    const loadConfigPath = require.resolve('next/dist/server/config', resolvePaths)

    packages.loadConfig = require(loadConfigPath).default
  } catch (e: any) {
    throw new Error(`Failed to load "next/dist/server/config" with error: ${e.message ?? e}`)
  }

  try {
    const getNextJsBaseWebpackConfigPath = require.resolve('next/dist/build/webpack-config', resolvePaths)

    packages.getNextJsBaseWebpackConfig = require(getNextJsBaseWebpackConfigPath).default
  } catch (e: any) {
    throw new Error(`Failed to load "next/dist/build/webpack-config" with error: ${ e.message ?? e}`)
  }

  return packages
}

async function loadWebpackConfig ({ devServerConfig, sourceWebpackModulesResult }: PresetHandler): Promise<Configuration> {
  const { loadConfig, getNextJsBaseWebpackConfig } = getNextJsPackages({ devServerConfig, sourceWebpackModulesResult })

  const nextConfig = await loadConfig('development', devServerConfig.cypressConfig.projectRoot)
  const runWebpackSpan = await getRunWebpackSpan()
  const webpackConfig = await getNextJsBaseWebpackConfig(
    devServerConfig.cypressConfig.projectRoot,
    {
      buildId: `@cypress/react-${Math.random().toString()}`,
      config: nextConfig,
      dev: true,
      isServer: false,
      pagesDir: findPagesDir(devServerConfig.cypressConfig.projectRoot),
      entrypoints: {},
      rewrites: { fallback: [], afterFiles: [], beforeFiles: [] },
      ...runWebpackSpan,
    },
  )

  return webpackConfig
}

/**
 * Check if Next is using the SWC compiler. Compilation will fail if user has `nodeVersion: "bundled"` set
 * due to SWC certificate issues.
 */
export function checkSWC (
  webpackConfig: Configuration,
  cypressConfig: Cypress.PluginConfigOptions,
) {
  const hasSWCLoader = webpackConfig.module?.rules?.some((rule) => {
    return typeof rule !== 'string' && rule.oneOf?.some(
      (oneOf) => (oneOf.use as any)?.loader === 'next-swc-loader',
    )
  })

  // "resolvedNodePath" is only set when using the user's Node.js, which is required to compile Next.js with SWC optimizations
  // If it is not set, they have either explicitly set "nodeVersion" to "bundled" or are are using Cypress < 9.0.0 where it was set to "bundled" by default
  if (hasSWCLoader && cypressConfig.nodeVersion === 'bundled') {
    throw new Error(`Cypress cannot compile your Next.js application when "nodeVersion" is set to "bundled". Please remove this option from your Cypress configuration file.`)
  }

  return false
}

const existsSync = (file: string) => {
  try {
    fs.accessSync(file, fs.constants.F_OK)

    return true
  } catch (_) {
    return false
  }
}

/**
 * Next allows the `pages` directory to be located at either
 * `${projectRoot}/pages` or `${projectRoot}/src/pages`.
 * If neither is found, return projectRoot
 */
export function findPagesDir (projectRoot: string) {
  // prioritize ./pages over ./src/pages
  let pagesDir = path.join(projectRoot, 'pages')

  if (existsSync(pagesDir)) {
    return pagesDir
  }

  pagesDir = path.join(projectRoot, 'src', 'pages')
  if (existsSync(pagesDir)) {
    return pagesDir
  }

  return projectRoot
}

// Starting with v11.1.1, a trace is required.
// 'next/dist/telemetry/trace/trace' only exists since v10.0.9
// and our peerDeps support back to v8 so try-catch this import
// Starting from 12.0 trace is now located in 'next/dist/trace/trace'
export async function getRunWebpackSpan (): Promise<{ runWebpackSpan?: any }> {
  let trace: (name: string) => any

  try {
    try {
      trace = await import('next/dist/telemetry/trace/trace').then((m) => m.trace)

      return { runWebpackSpan: trace('cypress') }
    } catch (_) {
      // @ts-ignore
      trace = await import('next/dist/trace/trace').then((m) => m.trace)

      return { runWebpackSpan: trace('cypress') }
    }
  } catch (_) {
    return {}
  }
}
