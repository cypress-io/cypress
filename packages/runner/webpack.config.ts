import _ from 'lodash'
import { waitUntilIconsBuilt } from '../../scripts/ensure-icons'
import { getCommonConfig, getSimpleConfig, getCopyWebpackPlugin } from '@packages/web-config/webpack.config.base'
import path from 'path'
import type webpack from 'webpack'

const commonConfig = getCommonConfig()
const CopyWebpackPlugin = getCopyWebpackPlugin()

const babelLoader = _.find(commonConfig.module.rules, (rule) => {
  // @ts-expect-error - rule.use is a union of loader shapes, and only some of them have a single loader
  return _.includes(rule.use.loader, 'babel-loader')
})

// @ts-expect-error - babelLoader.use is a union of loader shapes, and only the babel-loader one has options
babelLoader.use.options.plugins.push([require.resolve('babel-plugin-prismjs'), {
  'languages': ['javascript', 'typescript', 'jsx', 'tsx'],
  'plugins': ['line-numbers', 'line-highlight'],
  'theme': 'default',
  'css': false,
}])

// @ts-expect-error - getCommonConfig() returns an untyped literal, so fields such as module.rules[].enforce widen to string
const mainConfig: webpack.Configuration = {
  ...commonConfig,
  entry: {
    cypress_runner: [path.resolve(__dirname, 'src/index.ts')],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
}

mainConfig.resolve = {
  ...mainConfig.resolve,
  alias: {
    'bluebird': require.resolve('bluebird'),
    'lodash': require.resolve('lodash'),
  },
}

// @ts-expect-error - getCommonConfig() returns an untyped literal, so fields such as module.rules[].enforce widen to string
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

// @ts-expect-error - getSimpleConfig() returns an untyped literal, so resolve.fallback widens to boolean values webpack doesn't accept
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

// @ts-expect-error - getSimpleConfig() returns an untyped literal, so resolve.fallback widens to boolean values webpack doesn't accept
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
