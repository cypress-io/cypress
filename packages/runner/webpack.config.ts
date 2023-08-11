import _ from 'lodash'
import { waitUntilIconsBuilt } from '../../scripts/ensure-icons'
import { getCommonConfig, getSimpleConfig, getCopyWebpackPlugin } from '@packages/web-config/webpack.config.base'
import path from 'path'
import webpack from 'webpack'

const commonConfig = getCommonConfig()
const CopyWebpackPlugin = getCopyWebpackPlugin()

// @ts-ignore
const babelLoader = _.find(commonConfig.module.rules, (rule) => {
  // @ts-ignore
  return _.includes(rule.use.loader, 'babel-loader')
})

// @ts-ignore
babelLoader.use.options.plugins.push([require.resolve('babel-plugin-prismjs'), {
  'languages': ['javascript', 'coffeescript', 'typescript', 'jsx', 'tsx'],
  'plugins': ['line-numbers', 'line-highlight'],
  'theme': 'default',
  'css': false,
}])

// @ts-ignore
const mainConfig: webpack.Configuration = {
  ...commonConfig,
  entry: {
    cypress_runner: [path.resolve(__dirname, 'src/index.js')],
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
    'mobx': require.resolve('mobx'),
    'mobx-react': require.resolve('mobx-react'),
    'react': require.resolve('react'),
    'react-dom': require.resolve('react-dom'),
  },
}

// @ts-ignore
const crossOriginConfig: webpack.Configuration = {
  ...commonConfig,
  entry: {
    cypress_cross_origin_runner: [path.resolve(__dirname, 'src/cross-origin.js')],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
}

// @ts-ignore
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

// @ts-ignore
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

  const cyIcons = require('@packages/icons')

  mainConfig.plugins = [
    // @ts-ignore
    ...mainConfig.plugins,
    new CopyWebpackPlugin({
      patterns: [{
        // @ts-ignore // There's a race condition in how these types are generated.
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
