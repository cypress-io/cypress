process.env.NO_LIVERELOAD = '1'

import _ from 'lodash'
import path from 'path'
import type webpack from 'webpack'
import { getCommonConfig, HtmlWebpackPlugin, getCopyWebpackPlugin } from '@packages/web-config/webpack.config.base'
import cyIcons from '@cypress/icons'

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

interface PngRuleObject {
  nonPngRules: webpack.RuleSetRule[]
  pngRule?: webpack.RuleSetRule
}

const { pngRule, nonPngRules } = commonConfig?.module?.rules?.reduce((acc, rule) => {
  if (typeof rule !== 'object') {
    return acc
  }

  if (rule.test?.toString().includes('png')) {
    return {
      ...acc,
      pngRule: rule,
    } as PngRuleObject
  }

  return {
    ...acc,
    nonPngRules: [...acc.nonPngRules, rule],
  } as PngRuleObject
}, {
  nonPngRules: [],
  pngRule: undefined,
} as PngRuleObject) ?? { nonPngRules: [] } as PngRuleObject

if (!pngRule || !pngRule.use) {
  throw Error('Could not find png loader')
}

(pngRule.use as webpack.RuleSetLoader[])[0].options = {
  name: '[name].[ext]',
  outputPath: 'img',
  publicPath: '/__cypress/runner/img/',
}

// @ts-ignore
const config: webpack.Configuration = {
  ...commonConfig,
  module: {
    rules: [
      ...nonPngRules,
      pngRule,
    ],
  },
  entry: {
    cypress_runner: [path.resolve(__dirname, 'src/index.js')],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    chunkFilename: '[name].[chunkhash].js',
  },
}

// @ts-ignore
config.plugins = [
  // @ts-ignore
  ...config.plugins,
  new HtmlWebpackPlugin({
    template: path.resolve(__dirname, './static/index.html'),
    inject: false,
  }),
  new CopyWebpackPlugin([{
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

export default config
