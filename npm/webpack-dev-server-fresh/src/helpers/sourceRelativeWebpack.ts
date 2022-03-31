import Module from 'module'
import path from 'path'
import type { WebpackDevServerConfig } from '../devServer'

type ModuleClass = typeof Module & {
  _load(id: string, parent: Module, isMain: boolean): any
  _cache: Record<string, Module>
}

export interface PackageJson {
  name: string
  version: string
}

export interface SourceRelativeWebpackResult {
  framework?: {
    importPath: string
    packageJson: PackageJson
  }
  /**
   * The webpack module instance
   */
  webpack: {
    importPath: string
    module: Function
    packageJson: PackageJson
    majorVersion: 4 | 5
  }
  /**
   * The webpack dev-server instance
   */
  webpackDevServer: {
    importPath: string
    module: {
      new (...args: unknown[]): unknown
    }
    packageJson: PackageJson
    majorVersion: 3 | 4
  }
  /**
   * html-webpack-plugin
   */
  htmlWebpackPlugin: {
    importPath: string
    module: unknown
    packageJson: PackageJson
    majorVersion: 4 | 5
  }
}

/**
 * Based on the current project config, we look for the closest webpack,
 * webpack-dev-server, and html-webpack-plugin for a user's project
 *
 * @internal
 */
export function sourceRelativeWebpackModules (config: WebpackDevServerConfig) {
  let searchRoot = config.cypressConfig.projectRoot
  const result = {
    webpackDevServer: {},
    webpack: {},
    htmlWebpackPlugin: {},
  } as SourceRelativeWebpackResult

  // First, we source the framework, ensuring it's sourced from the user's project and not the
  // Cypress binary. This is the path we use to relative-resolve the
  if (config.framework) {
    try {
      const frameworkJsonPath = require.resolve(`${config.framework}/package.json`, {
        paths: [searchRoot],
      })
      const frameworkPathRoot = path.dirname(frameworkJsonPath)

      // Want to make sure we're sourcing this from the user's code. Otherwise we can
      // warn and tell them they don't have their dependencies installed
      if (!frameworkPathRoot.includes(config.cypressConfig.cypressBinaryRoot)) {
        result.framework = {
          importPath: frameworkPathRoot,
          packageJson: require(frameworkJsonPath),
        }

        searchRoot = frameworkPathRoot
      }
    } catch (e) {
      // TODO
    }
  }

  // Webpack:

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
      paths: [
        require.resolve('@cypress/webpack-batteries-included-preprocessor', {
          paths: [__dirname],
        }),
      ],
    })
  }

  result.webpack.importPath = path.dirname(webpackJsonPath)
  result.webpack.packageJson = require(webpackJsonPath)
  result.webpack.module = require(result.webpack.importPath)
  result.webpack.majorVersion = getMajorVersion(result.webpack.packageJson, [4, 5])

  // We now need to make sure that everything we subsequently require "thinks" that the webpack it's
  // looking for is this one. There are a number of modules that import from webpack directly, such as
  // this code in html-webpack-plugin v4: https://github.com/jantimon/html-webpack-plugin/blob/fce6b965d9502418af24139068aa415eb466c341/lib/file-watcher-api.js#L7-L14
  // Instead of trying to patch them all, let's just cheat and tell node when it resolves modules that
  // it's actually getting the one relative to the searchRoot:
  const moduleLoad = (Module as ModuleClass)._load;

  (Module as ModuleClass)._load = function (request, parent, isMain) {
    if (request === 'webpack' || request.startsWith('webpack/')) {
      const resolvePath = require.resolve(request, {
        paths: [searchRoot],
      })

      return moduleLoad(resolvePath, parent, isMain)
    }

    return moduleLoad(request, parent, isMain)
  }

  // Webpack dev server:

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
      paths: [
        __dirname,
      ],
    })
  }

  result.webpackDevServer.importPath = path.dirname(webpackDevServerJsonPath)
  result.webpackDevServer.packageJson = require(webpackDevServerJsonPath)
  result.webpackDevServer.module = require(result.webpackDevServer.importPath)
  result.webpackDevServer.majorVersion = getMajorVersion(result.webpackDevServer.packageJson, [3, 4])

  // Webpack HTML Plugin:

  let htmlWebpackPluginJsonPath: string

  try {
    htmlWebpackPluginJsonPath = require.resolve('html-webpack-plugin/package.json', {
      paths: [searchRoot],
    })
  } catch (e) {
    if ((e as {code?: string}).code !== 'MODULE_NOT_FOUND') {
      throw e
    }

    const htmlWebpack = `html-webpack-plugin-${result.webpack.majorVersion}`

    htmlWebpackPluginJsonPath = require.resolve(`${htmlWebpack}/package.json`, {
      paths: [
        __dirname,
      ],
    })
  }

  result.htmlWebpackPlugin.importPath = path.dirname(htmlWebpackPluginJsonPath)
  result.htmlWebpackPlugin.packageJson = require(htmlWebpackPluginJsonPath)
  result.htmlWebpackPlugin.module = require(result.htmlWebpackPlugin.importPath)
  result.htmlWebpackPlugin.majorVersion = getMajorVersion(result.htmlWebpackPlugin.packageJson, [4, 5])

  return result
}

function getMajorVersion <T extends number> (json: PackageJson, acceptedVersions: T[]): T {
  const major = Number(json.version.split('.')[0])

  if (!acceptedVersions.includes(major as T)) {
    throw new Error(
      `Unexpected major version of ${json.name}. ` +
      `Cypress webpack-dev-server works with ${json.name} versions ${acceptedVersions.join(', ')} - saw ${json.version}`,
    )
  }

  return Number(major) as T
}
