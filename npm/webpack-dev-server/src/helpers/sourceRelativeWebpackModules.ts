import Module from 'module'
import path from 'path'
import type { WebpackDevServerConfig } from '../devServer'
import debugFn from 'debug'

const debug = debugFn('cypress:webpack-dev-server:sourceRelativeWebpackModules')

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
  majorVersion: 3 | 4
}

export interface SourcedHtmlWebpackPlugin extends SourcedDependency {
  module: unknown
  majorVersion: 4 | 5
}

export interface SourceRelativeWebpackResult {
  framework: SourcedDependency | null
  webpack: SourcedWebpack
  webpackDevServer: SourcedWebpackDevServer
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

const higherOrderFrameworks = ['create-react-app', 'nuxt', 'vue-cli', 'next']

// Source the users framework from the provided projectRoot. The framework, if available, will server
// as the resolve base for webpack dependency resolution.
export function sourceFramework (config: WebpackDevServerConfig): SourcedDependency | null {
  debug('Framework: Attempting to source framework for %s', config.cypressConfig.projectRoot)
  if (!config.framework || !higherOrderFrameworks.includes(config.framework)) {
    debug('Framework: No framework provided')

    return null
  }

  const framework = { } as SourcedDependency

  try {
    const frameworkJsonPath = require.resolve(`${config.framework}/package.json`, {
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
export function sourceWebpackDevServer (config: WebpackDevServerConfig, framework?: SourcedDependency | null): SourcedWebpackDevServer {
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
  webpackDevServer.majorVersion = getMajorVersion(webpackDevServer.packageJson, [3, 4])

  debug('WebpackDevServer: Successfully sourced webpack-dev-server - %o', webpackDevServer)

  return webpackDevServer
}

// Most frameworks follow a similar path for sourcing webpack dependencies so this is a utility to handle all the sourcing.
export function sourceDefaultWebpackDependencies (config: WebpackDevServerConfig): SourceRelativeWebpackResult {
  const framework = sourceFramework(config)
  const webpack = sourceWebpack(config, framework)
  const webpackDevServer = sourceWebpackDevServer(config, framework)

  return {
    framework,
    webpack,
    webpackDevServer,
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
