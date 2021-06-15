import { getCommonConfig, HtmlWebpackPlugin } from '@packages/web-config/webpack.config.base'
import * as path from 'path'
import type { Plugin, Configuration } from 'webpack'
import { VueLoaderPlugin } from 'vue-loader'
import WindiCSS from 'windicss-webpack-plugin'

const common = getCommonConfig()

// existing webpack config relating to styles
// has some conflicts with windicss.
// vue-loader gives us most of these things out of the box,
// like scoped css, etc, so just remove them for now.
common.module!.rules = common.module!.rules.filter((x) => {
  return !['css', 's[ac]ss'].some((x) => x.match(x))
})

const config: Configuration = {
  ...common as Configuration,
  entry: {
    app: path.resolve(__dirname, 'src/main'),
  },
  module: {
    ...common.module!,
    rules: [
      {
        test: /css$/i,
        loader: ['style-loader', 'css-loader'],
      },
      {
        test: /.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: { appendTsSuffixTo: [/\.vue$/] },
      },
      {
        test: /\.(jpe?g|gif|png|svg)$/,
        loader: 'file-loader?name=assets/[name].[ext]',
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
}

const htmlWebpackPlugin = new HtmlWebpackPlugin({
  template: path.resolve(__dirname, './src/index.html'),
  env: process.env.NODE_ENV,
  inject: false,
}) as unknown as Plugin

config.plugins = [
  ...config.plugins!,
  htmlWebpackPlugin,
  new WindiCSS(),
  new VueLoaderPlugin(),
]

config.resolve = {
  ...config.resolve,
  alias: {
    bluebird: require.resolve('bluebird'),
    '@assets': path.resolve(__dirname, 'assets'),
  },
}

export default config
