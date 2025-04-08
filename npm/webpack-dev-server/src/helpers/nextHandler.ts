import debugLib from 'debug'
import Module from 'module'
import type { Configuration } from 'webpack'
import * as fs from 'fs'
import * as path from 'path'
import type { PresetHandlerResult, WebpackDevServerConfig } from '../devServer'
import { cypressWebpackPath, getMajorVersion, ModuleClass, SourcedDependency, SourcedWebpack, sourceFramework, sourceHtmlWebpackPlugin, sourceWebpackDevServer } from './sourceRelativeWebpackModules'

const debug = debugLib('cypress:webpack-dev-server-fresh:nextHandler')

export async function nextHandler (devServerConfig: WebpackDevServerConfig): Promise<PresetHandlerResult> {
  const webpackConfig = await loadWebpackConfig(devServerConfig)

  debug('resolved next.js webpack config %o', webpackConfig)

  checkSWC(webpackConfig, devServerConfig.cypressConfig)
  watchEntryPoint(webpackConfig)
  allowGlobalStylesImports(webpackConfig)
  changeNextCachePath(webpackConfig)

  return { frameworkConfig: webpackConfig, sourceWebpackModulesResult: sourceNextWebpackDeps(devServerConfig) }
}

/**
 * Acquire the modules needed to load the Next webpack config. We are using Next's APIs to grab the webpackConfig
 * but since this is in the binary, we have to `require.resolve` them from the projectRoot
 * `loadConfig` acquires the next.config.js
 * `getNextJsBaseWebpackConfig` acquires the webpackConfig dependent on the next.config.js
 */
function getNextJsPackages (devServerConfig: WebpackDevServerConfig) {
  const resolvePaths = { paths: [devServerConfig.cypressConfig.projectRoot] }
  const packages = {} as {
    loadConfig: (phase: 'development', dir: string) => Promise<any>
    getNextJsBaseWebpackConfig: Function
    nextLoadJsConfig: Function
    getSupportedBrowsers: (dir: string, isDevelopment: boolean, nextJsConfig: any) => Promise<string[] | undefined>
  }

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

  try {
    const loadJsConfigPath = require.resolve('next/dist/build/load-jsconfig', resolvePaths)

    packages.nextLoadJsConfig = require(loadJsConfigPath).default
  } catch (e: any) {
    throw new Error(`Failed to load "next/dist/build/load-jsconfig" with error: ${ e.message ?? e}`)
  }

  // Does not exist prior to Next 13.
  try {
    const getUtilsPath = require.resolve('next/dist/build/utils', resolvePaths)

    packages.getSupportedBrowsers = require(getUtilsPath).getSupportedBrowsers ?? (() => Promise.resolve([]))
  } catch (e: any) {
    throw new Error(`Failed to load "next/dist/build/utils" with error: ${ e.message ?? e}`)
  }

  return packages
}

/**
 * Types for `getNextJsBaseWebpackConfig` based on version:
 * - v11.1.4
  [
    dir: string,
    options: {
      buildId: string
      config: NextConfigComplete
      dev?: boolean
      isServer?: boolean
      pagesDir: string
      target?: string
      reactProductionProfiling?: boolean
      entrypoints: WebpackEntrypoints
      rewrites: CustomRoutes['rewrites']
      isDevFallback?: boolean
      runWebpackSpan: Span
    }
  ]

 * - v12.0.0 = Same as v11.1.4

 * - v12.1.6
  [
    dir: string,
    options: {
      buildId: string
      config: NextConfigComplete
      compilerType: 'client' | 'server' | 'edge-server'
      dev?: boolean
      entrypoints: webpack5.EntryObject
      hasReactRoot: boolean
      isDevFallback?: boolean
      pagesDir: string
      reactProductionProfiling?: boolean
      rewrites: CustomRoutes['rewrites']
      runWebpackSpan: Span
      target?: string
    }
  ]

 * - v13.0.0
  [
    dir: string,
    options: {
      buildId: string
      config: NextConfigComplete
      compilerType: CompilerNameValues
      dev?: boolean
      entrypoints: webpack.EntryObject
      hasReactRoot: boolean
      isDevFallback?: boolean
      pagesDir?: string
      reactProductionProfiling?: boolean
      rewrites: CustomRoutes['rewrites']
      runWebpackSpan: Span
      target?: string
      appDir?: string
      middlewareMatchers?: MiddlewareMatcher[]
    }
  ]

 * - v13.0.1
  [
    dir: string,
    options: {
      buildId: string
      config: NextConfigComplete
      compilerType: CompilerNameValues
      dev?: boolean
      entrypoints: webpack.EntryObject
      isDevFallback?: boolean
      pagesDir?: string
      reactProductionProfiling?: boolean
      rewrites: CustomRoutes['rewrites']
      runWebpackSpan: Span
      target?: string
      appDir?: string
      middlewareMatchers?: MiddlewareMatcher[]
    }
  ]

 * - v13.2.1
  [
    dir: string,
    options:  {
    buildId: string
    config: NextConfigComplete
    compilerType: CompilerNameValues
    dev?: boolean
    entrypoints: webpack.EntryObject
    isDevFallback?: boolean
    pagesDir?: string
    reactProductionProfiling?: boolean
    rewrites: CustomRoutes['rewrites']
    runWebpackSpan: Span
    target?: string
    appDir?: string
    middlewareMatchers?: MiddlewareMatcher[]
    noMangling?: boolean
    jsConfig: any
    resolvedBaseUrl: string | undefined
    supportedBrowsers: string[] | undefined
    clientRouterFilters?: {
        staticFilter: ReturnType<
          import('../shared/lib/bloom-filter').BloomFilter['export']
        >
        dynamicFilter: ReturnType<
          import('../shared/lib/bloom-filter').BloomFilter['export']
        >
      }
    }
  ]
 */
async function loadWebpackConfig (devServerConfig: WebpackDevServerConfig): Promise<Configuration> {
  const { loadConfig, getNextJsBaseWebpackConfig, nextLoadJsConfig, getSupportedBrowsers } = getNextJsPackages(devServerConfig)

  const nextConfig = await loadConfig('development', devServerConfig.cypressConfig.projectRoot)
  const runWebpackSpan = getRunWebpackSpan(devServerConfig)
  const reactVersion = getReactVersion(devServerConfig.cypressConfig.projectRoot)
  const jsConfigResult = await nextLoadJsConfig?.(devServerConfig.cypressConfig.projectRoot, nextConfig)
  const supportedBrowsers = await getSupportedBrowsers(devServerConfig.cypressConfig.projectRoot, true, nextConfig)

  const webpackConfig = await getNextJsBaseWebpackConfig(
    devServerConfig.cypressConfig.projectRoot,
    {
      buildId: `@cypress/react-${Math.random().toString()}`,
      config: nextConfig,
      dev: true,
      pagesDir: await findPagesDir(devServerConfig.cypressConfig.projectRoot),
      entrypoints: {},
      rewrites: { fallback: [], afterFiles: [], beforeFiles: [] },
      ...runWebpackSpan,
      // Client webpack config for Next.js <= 12.1.5
      isServer: false,
      // Client webpack config for Next.js > 12.1.5
      compilerType: 'client',
      // Required for Next.js > 13
      hasReactRoot: reactVersion === 18,
      // Required for Next.js > 13.2.0 to respect TS/JS config
      jsConfig: jsConfigResult.jsConfig,
      // Required for Next.js > 13.2.0 to respect tsconfig.compilerOptions.baseUrl
      resolvedBaseUrl: jsConfigResult.resolvedBaseUrl,
      // Added in Next.js 13, passed via `...info`: https://github.com/vercel/next.js/pull/45637/files
      supportedBrowsers,
    },
  )

  return webpackConfig
}

/**
 * Check if Next is using the SWC compiler. Compilation will fail if user has `nodeVersion: "bundled"` set
 * due to SWC certificate issues.
 */
function checkSWC (
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
  // @ts-expect-error nodeVersion has been removed as of 13.0.0 however this plugin can be used with many versions of cypress
  if (hasSWCLoader && cypressConfig.nodeVersion === 'bundled') {
    throw new Error(`Cypress cannot compile your Next.js application when "nodeVersion" is set to "bundled". Please remove this option from your Cypress configuration file.`)
  }

  return false
}

const exists = async (file: string) => {
  try {
    await fs.promises.access(file, fs.constants.F_OK)

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
async function findPagesDir (projectRoot: string) {
  // prioritize ./pages over ./src/pages
  let pagesDir = path.join(projectRoot, 'pages')

  if (await exists(pagesDir)) {
    return pagesDir
  }

  pagesDir = path.join(projectRoot, 'src', 'pages')
  if (await exists(pagesDir)) {
    return pagesDir
  }

  return projectRoot
}

// Starting with v11.1.1, a trace is required.
// 'next/dist/telemetry/trace/trace' only exists since v10.0.9
// and our peerDeps support back to v8 so try-catch this import
// Starting from 12.0 trace is now located in 'next/dist/trace/trace'
function getRunWebpackSpan (devServerConfig: WebpackDevServerConfig): { runWebpackSpan?: any } {
  let trace: (name: string) => any

  try {
    try {
      const traceImportPath = require.resolve('next/dist/telemetry/trace/trace', { paths: [devServerConfig.cypressConfig.projectRoot] })

      trace = require(traceImportPath).trace

      return { runWebpackSpan: trace('cypress') }
    } catch (_) {
      // @ts-ignore
      const traceImportPath = require.resolve('next/dist/trace/trace', { paths: [devServerConfig.cypressConfig.projectRoot] })

      trace = require(traceImportPath).trace

      return { runWebpackSpan: trace('cypress') }
    }
  } catch (_) {
    return {}
  }
}

const originalModuleLoad = (Module as ModuleClass)._load

function sourceNextWebpackDeps (devServerConfig: WebpackDevServerConfig) {
  const framework = sourceFramework(devServerConfig)!
  const webpack = sourceNextWebpack(devServerConfig, framework)
  const webpackDevServer = sourceWebpackDevServer(devServerConfig, webpack.majorVersion, framework)
  const htmlWebpackPlugin = sourceHtmlWebpackPlugin(devServerConfig, framework, webpack)

  return {
    framework,
    webpack,
    webpackDevServer,
    htmlWebpackPlugin,
  }
}

function sourceNextWebpack (devServerConfig: WebpackDevServerConfig, framework: SourcedDependency) {
  const searchRoot = framework.importPath

  debug('NextWebpack: Attempting to load NextWebpack from %s', searchRoot)

  let webpackJsonPath: string
  const webpack = {} as SourcedWebpack

  try {
    webpackJsonPath = require.resolve('next/dist/compiled/webpack/package.json', {
      paths: [searchRoot],
    })
  } catch (e) {
    debug('NextWebpack: Failed to load NextWebpack - %s', e)
    throw e
  }

  // Next 11 allows the choice of webpack@4 or webpack@5, depending on the "webpack5" property in their next.config.js
  // The webpackModule.init" for Next 11 returns a webpack@4 or webpack@4 compiler instance based on this boolean
  let webpack5 = true
  const importPath = path.join(path.dirname(webpackJsonPath), 'webpack.js')
  const webpackModule = require(importPath)

  try {
    const nextConfig = require(path.resolve(devServerConfig.cypressConfig.projectRoot, 'next.config.js'))

    debug('NextWebpack: next.config.js found - %o', nextConfig)

    if (nextConfig.webpack5 === false) {
      webpack5 = false
    }
  } catch (e) {
    // No next.config.js, assume webpack 5
  }

  debug('NextWebpack: webpack5 - %s', webpack5)
  webpackModule.init(webpack5)

  const packageJson = require(webpackJsonPath)

  webpack.importPath = importPath
  // The package.json of "next/dist/compiled/webpack/package.json" has no version so we supply the version for later use
  webpack.packageJson = { ...packageJson, version: webpack5 ? '5' : '4' }
  webpack.module = webpackModule.webpack
  webpack.majorVersion = getMajorVersion(webpack.packageJson, [4, 5])

  debug('NextWebpack: Successfully loaded NextWebpack - %o', webpack)

  ;(Module as ModuleClass)._load = function (request, parent, isMain) {
    // Next with webpack@4 doesn't ship certain dependencies that HtmlWebpackPlugin requires, so we patch the resolution through to our bundled version
    if ((request === 'webpack' || request.startsWith('webpack/')) && webpack.majorVersion === 4) {
      const resolvePath = require.resolve(request, {
        paths: [cypressWebpackPath(devServerConfig)],
      })

      debug('NextWebpack: Module._load for webpack@4 - %s', resolvePath)

      return originalModuleLoad(resolvePath, parent, isMain)
    }

    if (request === 'webpack' || request.startsWith('webpack/')) {
      const resolvePath = require.resolve(request, {
        paths: [framework.importPath],
      })

      debug('NextWebpack: Module._load - %s', resolvePath)

      return originalModuleLoad(resolvePath, parent, isMain)
    }

    return originalModuleLoad(request, parent, isMain)
  }

  return webpack
}

// Next webpack compiler ignored watching any node_modules changes, but we need to watch
// for changes to 'dist/browser.js' in order to detect new specs that have been added
function watchEntryPoint (webpackConfig: Configuration) {
  if (webpackConfig.watchOptions && Array.isArray(webpackConfig.watchOptions.ignored)) {
    webpackConfig.watchOptions = {
      ...webpackConfig.watchOptions,
      ignored: [...webpackConfig.watchOptions.ignored.filter((pattern: string) => !/node_modules/.test(pattern)), '**/node_modules/!(@cypress/webpack-dev-server/dist/browser.js)**'],
    }

    debug('found options next.js watchOptions.ignored %O', webpackConfig.watchOptions.ignored)
  }
}

// We are matching the Next.js regex rules exactly. If we were writing our own loader, we could
// condense these regex rules into a single rule but we need the regex.source to be identical to what
// we get from Next.js webpack config
// see: https://github.com/vercel/next.js/blob/20486c159d8538a337da6b07b0b4490a3a0d6b91/packages/next/build/webpack/config/blocks/css/index.ts#L18
const globalCssRe = [/(?<!\.module)\.css$/, /(?<!\.module)\.(scss|sass)$/]
const globalCssModulesRe = [/\.module\.css$/, /\.module\.(scss|sass)$/]

export const allCssTests = [...globalCssRe, ...globalCssModulesRe]

// Next does not allow global styles to be loaded outside of the main <App /> component.
// We want users to be able to import the global styles into their component support file so we
// delete the "issuer" from the rules that process css/scss files.
// see: https://github.com/cypress-io/cypress/issues/22525
// Motivated by: https://github.com/bem/next-global-css
function allowGlobalStylesImports (webpackConfig: Configuration) {
  const rules = webpackConfig.module?.rules || []

  for (const rule of rules) {
    if (typeof rule !== 'string' && rule.oneOf) {
      for (const oneOf of rule.oneOf) {
        if (oneOf.test && allCssTests.some((re) => re.source === (oneOf as any).test?.source)) {
          delete oneOf.issuer
        }
      }
    }
  }
}

// Our modifications of the Next webpack config can corrupt the cache used for local development.
// We separate the cache used for CT from the normal cache (".next/cache/webpack" -> ".next/cache/cypress-webpack") so they don't interfere with each other
function changeNextCachePath (webpackConfig: Configuration) {
  if (typeof webpackConfig.cache === 'object' && ('cacheDirectory' in webpackConfig.cache) && webpackConfig.cache.cacheDirectory) {
    const { cacheDirectory } = webpackConfig.cache

    webpackConfig.cache.cacheDirectory = cacheDirectory.replace(/webpack$/, 'cypress-webpack')

    debug('Changing Next cache path from %s to %s', cacheDirectory, webpackConfig.cache.cacheDirectory)
  }
}

function getReactVersion (projectRoot: string): number | undefined {
  try {
    const reactPackageJsonPath = require.resolve('react/package.json', { paths: [projectRoot] })
    const { version } = require(reactPackageJsonPath)

    return Number(version.split('.')[0])
  } catch (e) {
    debug('Failed to source react with error: ', e)
  }
}
