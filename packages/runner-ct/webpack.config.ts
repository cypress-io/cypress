process.env.NO_LIVERELOAD = '1'

import _ from 'lodash'
import path from 'path'
import webpack from 'webpack'
import { getCommonConfig, HtmlWebpackPlugin } from '@packages/web-config/webpack.config.base'
import type { Plugin, Configuration } from 'webpack'
import { VueLoaderPlugin } from 'vue-loader'
import WindiCSS from 'windicss-webpack-plugin'

// const common = getCommonConfig()

// // existing webpack config relating to styles
// // has some conflicts with windicss.
// // vue-loader gives us most of these things out of the box,
// // like scoped css, etc, so just remove them for now.

// const config: Configuration = {
//   ...common as Configuration,
//   entry: {
//     app: path.resolve(__dirname, 'src/main'),
//   },
//   module: {
//     ...common.module!,
//     rules: [
//       {
//         test: /css$/i,
//         loader: ['style-loader', 'css-loader'],
//       },
//       {
//         test: /.vue$/,
//         loader: 'vue-loader',
//       },
//       {
//         test: /\.ts$/,
//         loader: 'ts-loader',
//         options: { appendTsSuffixTo: [/\.vue$/] },
//       },
//       {
//         test: /\.(jpe?g|gif|png|svg)$/,
//         loader: 'file-loader?name=assets/[name].[ext]',
//       },
//     ],
//   },
//   output: {
//     path: path.resolve(__dirname, 'dist'),
//     filename: '[name].js',
//   },
// }

// config.resolve = {
//   ...config.resolve,
//   alias: {
//     bluebird: require.resolve('bluebird'),
//     '@assets': path.resolve(__dirname, 'assets'),
//   },
// }

// export default config

const commonConfig = getCommonConfig()

// commonConfig.module!.rules = commonConfig.module!.rules.filter((x) => {
//   return !['css', 's[ac]ss'].some((x) => x.match(x))
// })

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

pngRule.use[0].options = {
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
      {
        test: /.vue$/,
        loader: 'vue-loader',
      },
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
  new WindiCSS(),
  new VueLoaderPlugin(),
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
