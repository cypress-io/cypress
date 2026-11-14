import { waitUntilIconsBuilt } from '../../scripts/ensure-icons'
import { getCommonConfig, getSimpleConfig, getCopyWebpackPlugin } from '@packages/web-config/webpack.config.base'
import { HOST_MODULES_GLOBAL, HOST_MODULE_SPECIFIERS } from '@packages/types/src/host-modules'
import path from 'path'
import type webpack from 'webpack'

const commonConfig = getCommonConfig()
const CopyWebpackPlugin = getCopyWebpackPlugin()

const [babelLoader] = commonConfig.module.rules.flatMap(({ use }) => {
  return use && !Array.isArray(use) && use.loader.includes('babel-loader') ? [use] : []
})

const prismPlugin = [require.resolve('babel-plugin-prismjs'), {
  'languages': ['javascript', 'typescript', 'jsx', 'tsx'],
  'plugins': ['line-numbers', 'line-highlight'],
  'theme': 'default',
  'css': false,
}]

// @ts-expect-error - plugins is typed from web-config's own entries, none of which take prism's options
babelLoader.options.plugins.push(prismPlugin)

const mainConfig: webpack.Configuration = {
  ...commonConfig,
  entry: {
    cypress_runner: [path.resolve(__dirname, 'src/assert-host-modules.ts'), path.resolve(__dirname, 'src/index.ts')],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  externalsType: 'window',
  externals: Object.fromEntries(HOST_MODULE_SPECIFIERS.map((specifier) => [specifier, [HOST_MODULES_GLOBAL, specifier]])),
}

// The runner and reporter compile against their own react, react-dom and mobx
// but run against the app's copies, so all three packages must resolve the
// same versions.
function assertHostModuleVersionsMatch () {
  const packageNames = [...new Set(HOST_MODULE_SPECIFIERS.map((specifier) => specifier.split('/')[0]))]
  const consumers = ['app', 'runner', 'reporter']

  for (const name of packageNames) {
    const versions = consumers.map((consumer) => {
      const manifest = require.resolve(`${name}/package.json`, { paths: [path.resolve(__dirname, '..', consumer)] })

      return { consumer, version: require(manifest).version as string }
    })

    if (new Set(versions.map(({ version }) => version)).size > 1) {
      const found = versions.map(({ consumer, version }) => `${consumer}: ${version}`).join(', ')

      throw new Error(`${name} must resolve to one version for app, runner and reporter, which share it at runtime. Found ${found}`)
    }
  }
}

mainConfig.resolve = {
  ...mainConfig.resolve,
  alias: {
    'bluebird': require.resolve('bluebird'),
    'lodash': require.resolve('lodash'),
  },
}

const crossOriginConfig: webpack.Configuration = {
  ...commonConfig,
  entry: {
    cypress_cross_origin_runner: [path.resolve(__dirname, 'src/cross-origin.ts')],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
}

const mainInjectionConfig: webpack.Configuration = {
  ...getSimpleConfig(),
  mode: 'production',
  entry: {
    injection: [path.resolve(__dirname, 'injection/main.js')],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
}

const crossOriginInjectionConfig: webpack.Configuration = {
  ...getSimpleConfig(),
  mode: 'production',
  entry: {
    injection_cross_origin: [path.resolve(__dirname, 'injection/cross-origin.js')],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
}

export default async function () {
  assertHostModuleVersionsMatch()

  await waitUntilIconsBuilt()

  const cyIcons = await import('@packages/icons')

  mainConfig.plugins = [
    ...mainConfig.plugins,
    new CopyWebpackPlugin({
      patterns: [{
        from: cyIcons.getPathToFavicon('favicon.ico'),
      }],
    }),
  ]

  return [
    mainConfig,
    mainInjectionConfig,
    crossOriginConfig,
    crossOriginInjectionConfig,
  ]
}
