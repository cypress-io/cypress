import Module from 'module'
import path from 'path'
import type { Frameworks, WebpackDevServerConfig } from '../devServer'
import debugFn from 'debug'

const debug = debugFn('cypress:webpack-dev-server:sourceRelativeWebpackModules')

class CypressWebpackDevServerError extends Error {
  constructor (message: string) {
    super(message)
    this.name = 'CypressWebpackDevServerError'
  }
}

export type ModuleClass = typeof Module & {
  _load(id: string, parent: Module, isMain: boolean): any
  _resolveFilename(request: string, parent: Module, isMain: boolean, options?: { paths: string[] }): string
  _cache: Record<string, Module>
}

export interface PackageJson {
  name: string
  version: string
}

export interface SourcedDependency {
  importPath: string
  packageJson: PackageJson
}

export interface SourcedWebpack extends SourcedDependency {
  module: Function
  majorVersion: 4 | 5
}

export interface SourcedWebpackDevServer extends SourcedDependency {
  module: {
    new (...args: unknown[]): unknown
  }
  majorVersion: 4 | 5
}

export interface SourcedHtmlWebpackPlugin extends SourcedDependency {
  module: unknown
  majorVersion: 4 | 5
}

export interface SourceRelativeWebpackResult {
  framework: SourcedDependency | null
  webpack: SourcedWebpack
  webpackDevServer: SourcedWebpackDevServer
  htmlWebpackPlugin: SourcedHtmlWebpackPlugin
}

const originalModuleLoad = (Module as ModuleClass)._load
const originalModuleResolveFilename = (Module as ModuleClass)._resolveFilename

// We ship webpack@4 as part of '@cypress/webpack-batteries-included-preprocessor'. The path to this module
// serves as our fallback.
export const cypressWebpackPath = (config: WebpackDevServerConfig) => {
  return require.resolve('@cypress/webpack-batteries-included-preprocessor', {
    paths: [config.cypressConfig.cypressBinaryRoot],
  })
}

type FrameworkWebpackMapper = { [Property in Frameworks]: string | undefined }

const frameworkWebpackMapper: FrameworkWebpackMapper = {
  react: undefined,
  vue: undefined,
  next: 'next',
  'angular': '@angular-devkit/build-angular',
  'svelte': undefined,
}

// Source the users framework from the provided projectRoot. The framework, if available, will serve
// as the resolve base for webpack dependency resolution.
export function sourceFramework (config: WebpackDevServerConfig): SourcedDependency | null {
  debug('Framework: Attempting to source framework for %s', config.cypressConfig.projectRoot)
  if (!config.framework) {
    debug('Framework: No framework provided')

    return null
  }

  const sourceOfWebpack = frameworkWebpackMapper[config.framework]

  if (!sourceOfWebpack) {
    debug('Not a higher-order framework so webpack dependencies should be resolvable from projectRoot')

    return null
  }

  const framework = { } as SourcedDependency

  try {
    const frameworkJsonPath = require.resolve(`${sourceOfWebpack}/package.json`, {
      paths: [config.cypressConfig.projectRoot],
    })
    const frameworkPathRoot = path.dirname(frameworkJsonPath)

    // Want to make sure we're sourcing this from the user's code. Otherwise we can
    // warn and tell them they don't have their dependencies installed
    framework.importPath = frameworkPathRoot
    framework.packageJson = require(frameworkJsonPath)

    debug('Framework: Successfully sourced framework - %o', framework)

    return framework
  } catch (e) {
    debug('Framework: Failed to source framework - %s', e)

    // TODO
    return null
  }
}

// Source the webpack module from the provided framework or projectRoot. We override the module resolution
// so that other packages that import webpack resolve to the version we found.
// If none is found, we fallback to the bundled version in '@cypress/webpack-batteries-included-preprocessor'.
export function sourceWebpack (config: WebpackDevServerConfig, framework: SourcedDependency | null): SourcedWebpack {
  const searchRoot = framework?.importPath ?? config.cypressConfig.projectRoot

  debug('Webpack: Attempting to source webpack from %s', searchRoot)

  const webpack = { } as SourcedWebpack

  let webpackJsonPath: string

  try {
    webpackJsonPath = require.resolve('webpack/package.json', {
      paths: [searchRoot],
    })
  } catch (e) {
    if ((e as {code?: string}).code !== 'MODULE_NOT_FOUND') {
      debug('Webpack: Failed to source webpack - %s', e)
      throw e
    }

    debug('Webpack: Falling back to bundled version')

    webpackJsonPath = require.resolve('webpack/package.json', {
      paths: [cypressWebpackPath(config)],
    })
  }

  webpack.importPath = path.dirname(webpackJsonPath)
  webpack.packageJson = require(webpackJsonPath)
  webpack.module = require(webpack.importPath)
  webpack.majorVersion = getMajorVersion(webpack.packageJson, [4, 5])

  debug('Webpack: Successfully sourced webpack - %o', webpack)

  ;(Module as ModuleClass)._load = function (request, parent, isMain) {
    if (request === 'webpack' || request.startsWith('webpack/')) {
      const resolvePath = require.resolve(request, {
        paths: [webpack.importPath],
      })

      debug('Webpack: Module._load resolvePath - %s', resolvePath)

      return originalModuleLoad(resolvePath, parent, isMain)
    }

    return originalModuleLoad(request, parent, isMain)
  }

  ;(Module as ModuleClass)._resolveFilename = function (request, parent, isMain, options) {
    if (request === 'webpack' || request.startsWith('webpack/') && !options?.paths) {
      const resolveFilename = originalModuleResolveFilename(request, parent, isMain, {
        paths: [webpack.importPath],
      })

      debug('Webpack: Module._resolveFilename resolveFilename - %s', resolveFilename)

      return resolveFilename
    }

    return originalModuleResolveFilename(request, parent, isMain, options)
  }

  return webpack
}

// Source the webpack-dev-server module from the provided framework or projectRoot.
// If none is found, we fallback to the version bundled with this package.
export function sourceWebpackDevServer (config: WebpackDevServerConfig, webpackMajorVersion: 4 | 5, framework?: SourcedDependency | null): SourcedWebpackDevServer {
  const searchRoot = framework?.importPath ?? config.cypressConfig.projectRoot

  debug('WebpackDevServer: Attempting to source webpack-dev-server from %s', searchRoot)
  const webpackDevServer = { } as SourcedWebpackDevServer
  let webpackDevServerJsonPath: string

  try {
    webpackDevServerJsonPath = require.resolve('webpack-dev-server/package.json', {
      paths: [searchRoot],
    })
  } catch (e) {
    if ((e as {code?: string}).code !== 'MODULE_NOT_FOUND') {
      debug('WebpackDevServer: Failed to source webpack-dev-server - %s', e)
      throw e
    }

    debug('WebpackDevServer: Falling back to bundled version')

    webpackDevServerJsonPath = require.resolve('webpack-dev-server/package.json', {
      paths: [__dirname],
    })
  }

  webpackDevServer.importPath = path.dirname(webpackDevServerJsonPath)
  webpackDevServer.packageJson = require(webpackDevServerJsonPath)
  webpackDevServer.module = require(webpackDevServer.importPath)
  webpackDevServer.majorVersion = getMajorVersion(webpackDevServer.packageJson, [4, 5])

  debug('WebpackDevServer: Successfully sourced webpack-dev-server - %o', webpackDevServer)
  if (webpackMajorVersion < 5 && webpackDevServer.majorVersion === 5) {
    const json = webpackDevServer.packageJson

    throw new CypressWebpackDevServerError(
      `Incompatible major versions of webpack and webpack-dev-server!
      webpack-dev-server major version ${webpackDevServer.majorVersion} only works with major versions of webpack 5 - saw webpack-dev-server version ${json.version}.
      If using webpack major version 4, please install webpack-dev-server version 4 to be used with @cypress/webpack-dev-server or upgrade to webpack 5.`,
    )
  }

  return webpackDevServer
}

// Source the html-webpack-plugin module from the provided framework or projectRoot.
// If none is found, we fallback to the version bundled with this package dependent on the major version of webpack.
// We ship both v4 and v5 of 'html-webpack-plugin' by aliasing the package with the major version (check package.json).
export function sourceHtmlWebpackPlugin (config: WebpackDevServerConfig, framework: SourcedDependency | null, webpack: SourcedWebpack): SourcedHtmlWebpackPlugin {
  const searchRoot = framework?.importPath ?? config.cypressConfig.projectRoot

  debug('HtmlWebpackPlugin: Attempting to source html-webpack-plugin from %s', searchRoot)

  const htmlWebpackPlugin = { } as SourcedHtmlWebpackPlugin
  let htmlWebpackPluginJsonPath: string

  try {
    htmlWebpackPluginJsonPath = require.resolve('html-webpack-plugin/package.json', {
      paths: [searchRoot],
    })

    htmlWebpackPlugin.packageJson = require(htmlWebpackPluginJsonPath)
    // Check that they're not using v3 of html-webpack-plugin. Since we should be the only consumer of it,
    // we shouldn't be concerned with using our own copy if they've shipped w/ an earlier version
    htmlWebpackPlugin.majorVersion = getMajorVersion(htmlWebpackPlugin.packageJson, [4, 5])
  } catch (e) {
    const err = e as Error & {code?: string}

    if (err.code !== 'MODULE_NOT_FOUND' && !err.message.includes('Unexpected major version')) {
      debug('HtmlWebpackPlugin: Failed to source html-webpack-plugin - %s', e)
      throw e
    }

    const htmlWebpack = `html-webpack-plugin-${webpack.majorVersion}`

    debug('HtmlWebpackPlugin: Falling back to bundled version %s', htmlWebpack)

    htmlWebpackPluginJsonPath = require.resolve(`${htmlWebpack}/package.json`, {
      paths: [
        __dirname,
      ],
    })
  }

  htmlWebpackPlugin.importPath = path.dirname(htmlWebpackPluginJsonPath),
  htmlWebpackPlugin.packageJson = require(htmlWebpackPluginJsonPath),
  htmlWebpackPlugin.module = require(htmlWebpackPlugin.importPath),
  htmlWebpackPlugin.majorVersion = getMajorVersion(htmlWebpackPlugin.packageJson, [4, 5])

  debug('HtmlWebpackPlugin: Successfully sourced html-webpack-plugin - %o', htmlWebpackPlugin)

  return htmlWebpackPlugin
}

// Most frameworks follow a similar path for sourcing webpack dependencies so this is a utility to handle all the sourcing.
export function sourceDefaultWebpackDependencies (config: WebpackDevServerConfig): SourceRelativeWebpackResult {
  const framework = sourceFramework(config)
  const webpack = sourceWebpack(config, framework)
  const webpackDevServer = sourceWebpackDevServer(config, webpack.majorVersion, framework)
  const htmlWebpackPlugin = sourceHtmlWebpackPlugin(config, framework, webpack)

  return {
    framework,
    webpack,
    webpackDevServer,
    htmlWebpackPlugin,
  }
}

export function getMajorVersion <T extends number> (json: PackageJson, acceptedVersions: T[]): T {
  const major = Number(json.version.split('.')[0])

  if (!acceptedVersions.includes(major as T)) {
    throw new Error(
      `Unexpected major version of ${json.name}. ` +
      `Cypress webpack-dev-server works with ${json.name} versions ${acceptedVersions.join(', ')} - saw ${json.version}`,
    )
  }

  return Number(major) as T
}

export function restoreLoadHook () {
  (Module as ModuleClass)._load = originalModuleLoad;
  (Module as ModuleClass)._resolveFilename = originalModuleResolveFilename
}
