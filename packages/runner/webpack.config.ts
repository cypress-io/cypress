import _ from 'lodash'
import getCommonConfig, { HtmlWebpackPlugin } from '@packages/web-config/webpack.config.base'
import path from 'path'
import webpack from 'webpack'

const lessCommonConfig = getCommonConfig()

let pngRule
// @ts-ignore
const nonPngRules = _.filter(lessCommonConfig.module.rules, (rule) => {
  // @ts-ignore
  if (rule.test.toString().includes('png')) {
    pngRule = rule

    return false
  }

  return true
})

pngRule.use[0].options = {
  name: '[name].[ext]',
  outputPath: 'img',
  publicPath: '/__cypress/runner/img/',
}

// @ts-ignore
lessCommonConfig.module.rules[1].use.options.plugins.push([require.resolve('babel-plugin-prismjs'), {
  'languages': ['javascript'],
  'plugins': ['line-numbers', 'line-highlight'],
  'theme': 'default',
  'css': false,
}])

// @ts-ignore
const config: webpack.Configuration = {
  ...lessCommonConfig,
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
]

config.resolve = {
  ...config.resolve,
  alias: {
    'bluebird': require.resolve('bluebird'),
    'lodash': require.resolve('lodash'),
    'mobx': require.resolve('mobx'),
    'mobx-react': require.resolve('mobx-react'),
    'react': require.resolve('react'),
    'react-dom': require.resolve('react-dom'),
  },
}

export default config
