import {
  getCommonConfig,
  HtmlWebpackPlugin,
} from '@packages/web-config/webpack.config.base'
import path from 'path'
import type webpack from 'webpack'

const common = getCommonConfig({ postcssPlugins: [
  require('tailwindcss'),
  require('autoprefixer'),
] })

// @ts-ignore
const config: webpack.Configuration = {
  ...common,
  entry: {
    app: path.resolve(__dirname, 'src/main'),
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
]

config.resolve = {
  ...config.resolve,
  alias: {
    bluebird: require.resolve('bluebird'),
    '@assets': path.resolve(__dirname, 'assets'),
  },
}

export default config
