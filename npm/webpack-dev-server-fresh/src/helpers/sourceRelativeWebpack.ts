import path from 'path'
import type { Server } from 'http'

import type { WebpackDevServerConfig } from '../devServer'

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

  console.log(result)

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
