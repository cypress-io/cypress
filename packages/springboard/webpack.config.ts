import { getCommonConfig, HtmlWebpackPlugin } from '@packages/web-config/webpack.config.base'
import path from 'path'
import webpack from 'webpack'
import { VueLoaderPlugin } from 'vue-loader'

const common = getCommonConfig()
// @ts-ignore
const config: webpack.Configuration = {
  ...common,
  entry: {
    app: path.resolve(__dirname, 'src/main'),
  },
  module: {
    ...common.module!,
    rules: [
      ...common.module!.rules,
      {
        test: /.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: { appendTsSuffixTo: [/\.vue$/] },
      },
    ],
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
    template: path.resolve(__dirname, './src/index.html'),
    env: process.env.NODE_ENV,
    inject: false,
  }),
  new VueLoaderPlugin(),
]

config.resolve = {
  ...config.resolve,
  alias: {
    bluebird: require.resolve('bluebird'),
  },
}

export default config
