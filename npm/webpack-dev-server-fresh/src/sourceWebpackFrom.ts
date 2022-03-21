import type { StartFreshDevServerArgs } from '.'

export function sourceWebpackFrom (args: StartFreshDevServerArgs, relativeTo: string) {
  const { options: { config: { cypressBinaryRoot } } } = args

  const webpackPackageJsonPath = require.resolve('webpack/package.json', {
    paths: [relativeTo],
  })

  const webpackDevServerPackageJsonPath = require.resolve('webpack-dev-server/package.json', {
    paths: [relativeTo],
  })

  const webpackJson = require(webpackPackageJsonPath)
  const webpackDevServerJson = require(webpackDevServerPackageJsonPath)

  let htmlWebpackPluginJsonPath

  // First, try to use the user's local html-webpack-plugin
  try {
    htmlWebpackPluginJsonPath = require.resolve('html-webpack-plugin/package.json', {
      paths: [relativeTo],
    })
  } catch (e) {
    // If they don't have one, then check the version of webpack, and return the appropriate one
    // based on what we need
    if (webpackJson.version.startsWith('4')) {
      htmlWebpackPluginJsonPath = require.resolve('html-webpack-plugin-4/package.json', {
        paths: [cypressBinaryRoot || __filename],
      })
    } else if (webpackJson.version.startsWith('5')) {
      htmlWebpackPluginJsonPath = require.resolve('html-webpack-plugin-5/package.json', {
        paths: [cypressBinaryRoot || __filename],
      })
    }
  }

  return {
    webpackJson,
    webpackDevServerJson,
    htmlWebpackPluginJsonPath,
    webpackPackageJsonPath,
    webpackDevServerPackageJsonPath,
  }
}
