import _ from 'lodash'
import commonConfig, { HtmlWebpackPlugin } from '@packages/web-config/webpack.config.base'
import path from 'path'

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

pngRule.use[0].options = {
  name: '[name].[ext]',
  outputPath: 'img',
  publicPath: '/__cypress/runner/img/',
}

const config: typeof commonConfig = {
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
