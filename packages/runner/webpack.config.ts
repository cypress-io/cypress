import _ from 'lodash'
import path from 'path'
import type webpack from 'webpack'
import { getCommonConfig, getCopyWebpackPlugin, getSimpleConfig } from '@packages/web-config/webpack.config.base'
import * as cyIcons from '@packages/icons'

const commonConfig = getCommonConfig()
const CopyWebpackPlugin = getCopyWebpackPlugin()

// @ts-ignore
const babelLoader = _.find(commonConfig.module.rules, (rule) => {
  // @ts-ignore
  return _.includes(rule.use.loader, 'babel-loader')
})

// @ts-ignore
babelLoader.use.options.plugins.push([require.resolve('babel-plugin-prismjs'), {
  languages: ['javascript', 'coffeescript', 'typescript', 'jsx', 'tsx'],
  plugins: ['line-numbers', 'line-highlight'],
  theme: 'default',
  css: false,
}])

let pngRule
// @ts-ignore
const nonPngRules = _.filter(commonConfig.module.rules, (rule) => {
  // @ts-ignore
  if (rule.test.toString().includes('png')) {
    pngRule = rule

    return false
  }

  return true
})

if (!pngRule || !pngRule.use) {
  throw Error('Could not find png loader')
}

pngRule.use[0].options = {
  name: '[name].[ext]',
  outputPath: 'img',
  publicPath: '/__cypress/runner/img/',
}

// @ts-ignore
const getMainConfig = (): webpack.Configuration => {
  const config = {
    ...commonConfig,
    module: {
      rules: [
        ...nonPngRules,
        pngRule,
      ],
    },
    entry: {
      cypress_runner: [path.resolve(__dirname, 'src', 'index.js')],
    },

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      chunkFilename: '[name].[chunkhash].js',
    },
  } as webpack.Configuration

  config.plugins = [
    // @ts-ignore
    ...config.plugins,
    new CopyWebpackPlugin([{
      // @ts-ignore // There's a race condition in how these types are generated.
      from: cyIcons.getPathToFavicon('favicon.ico'),
    }]),
  ]

  config.resolve = {
    ...config.resolve,
    alias: {
      bluebird: require.resolve('bluebird'),
      lodash: require.resolve('lodash'),
      mobx: require.resolve('mobx'),
      'mobx-react': require.resolve('mobx-react'),
      react: require.resolve('react'),
      'react-dom': require.resolve('react-dom'),
    },
  }

  return config
}

// @ts-ignore
const crossOriginConfig: webpack.Configuration = {
  ...commonConfig,
  entry: {
    cypress_cross_origin_runner: [path.resolve(__dirname, 'src', 'cross-origin.js')],
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
    injection: [path.resolve(__dirname, 'injection', 'main.js')],
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
    injection_cross_origin: [path.resolve(__dirname, 'injection', 'cross-origin.js')],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
}

export default [
  getMainConfig(),
  mainInjectionConfig,
  crossOriginConfig,
  crossOriginInjectionConfig,
]
