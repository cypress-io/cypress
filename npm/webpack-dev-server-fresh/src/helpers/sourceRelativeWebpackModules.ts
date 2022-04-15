import Module from 'module'
import path from 'path'
import type { WebpackDevServerConfig } from '../devServer'
import debugFn from 'debug'

const debug = debugFn('cypress:webpack-dev-server-fresh:sourceRelativeWebpackModules')

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
  htmlWebpackPlugin: SourcedHtmlWebpackPlugin
}

const originalModuleLoad = (Module as ModuleClass)._load
const originalModuleResolveFilename = (Module as ModuleClass)._resolveFilename

export const cypressWebpackPath = require.resolve('@cypress/webpack-batteries-included-preprocessor', {
  paths: [__dirname],
})

export function sourceFramework (config: WebpackDevServerConfig): SourcedDependency | null {
  if (!config.framework) {
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

    return framework
  } catch (e) {
    // TODO
    return null
  }
}

export function sourceWebpack (config: WebpackDevServerConfig, framework: SourcedDependency | null): SourcedWebpack {
  const searchRoot = framework?.importPath ?? config.cypressConfig.projectRoot

  const webpack = { } as SourcedWebpack

  let webpackJsonPath: string

  try {
    webpackJsonPath = require.resolve('webpack/package.json', {
      paths: [searchRoot],
    })
  } catch (e) {
    if ((e as {code?: string}).code !== 'MODULE_NOT_FOUND') {
      throw e
    }

    webpackJsonPath = require.resolve('webpack/package.json', {
      paths: [cypressWebpackPath],
    })
  }

  webpack.importPath = path.dirname(webpackJsonPath)
  webpack.packageJson = require(webpackJsonPath)
  webpack.module = require(webpack.importPath)
  webpack.majorVersion = getMajorVersion(webpack.packageJson, [4, 5])

  ;(Module as ModuleClass)._load = function (request, parent, isMain) {
    if (request === 'webpack' || request.startsWith('webpack/')) {
      const resolvePath = require.resolve(request, {
        paths: [webpack.importPath],
      })

      debug('Resolve path %s', resolvePath)

      return originalModuleLoad(resolvePath, parent, isMain)
    }

    return originalModuleLoad(request, parent, isMain)
  }

  ;(Module as ModuleClass)._resolveFilename = function (request, parent, isMain, options) {
    if (request === 'webpack' || request.startsWith('webpack/') && !options?.paths) {
      return originalModuleResolveFilename(request, parent, isMain, {
        paths: [webpack.importPath],
      })
    }

    return originalModuleResolveFilename(request, parent, isMain, options)
  }

  return webpack
}

export function sourceWebpackDevServer (config: WebpackDevServerConfig, framework?: SourcedDependency | null): SourcedWebpackDevServer {
  const searchRoot = framework?.importPath ?? config.cypressConfig.projectRoot

  const webpackDevServer = { } as SourcedWebpackDevServer
  let webpackDevServerJsonPath: string

  try {
    webpackDevServerJsonPath = require.resolve('webpack-dev-server/package.json', {
      paths: [searchRoot],
    })
  } catch (e) {
    if ((e as {code?: string}).code !== 'MODULE_NOT_FOUND') {
      throw e
    }

    webpackDevServerJsonPath = require.resolve('webpack-dev-server/package.json', {
      paths: [cypressWebpackPath],
    })
  }

  webpackDevServer.importPath = path.dirname(webpackDevServerJsonPath)
  webpackDevServer.packageJson = require(webpackDevServerJsonPath)
  webpackDevServer.module = require(webpackDevServer.importPath)
  webpackDevServer.majorVersion = getMajorVersion(webpackDevServer.packageJson, [3, 4])

  return webpackDevServer
}

export function sourceHtmlWebpackPlugin (config: WebpackDevServerConfig, framework: SourcedDependency | null, webpack: SourcedWebpack): SourcedHtmlWebpackPlugin {
  const searchRoot = framework?.importPath ?? config.cypressConfig.projectRoot

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
      throw e
    }

    const htmlWebpack = `html-webpack-plugin-${webpack.majorVersion}`

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

  return htmlWebpackPlugin
}

export function sourceDefaultWebpackDependencies (config: WebpackDevServerConfig): SourceRelativeWebpackResult {
  const framework = sourceFramework(config)
  const webpack = sourceWebpack(config, framework)
  const webpackDevServer = sourceWebpackDevServer(config, framework)
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
