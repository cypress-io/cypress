import { getCommonConfig, HtmlWebpackPlugin } from '@packages/web-config/webpack.config.base'
import path from 'path'
import webpack from 'webpack'
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
        test: /.css$/,
        loader: ['style-loader', 'css-loader'],
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
  new WindiCSS(),
  new VueLoaderPlugin(),
]

config.resolve = {
  ...config.resolve,
  alias: {
    bluebird: require.resolve('bluebird'),
  },
}

export default config
