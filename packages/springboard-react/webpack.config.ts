import {
  getCommonConfig,
  HtmlWebpackPlugin,
} from '@packages/web-config/webpack.config.base'
import path from 'path'
import type webpack from 'webpack'

// @ts-ignore
const config: webpack.Configuration = {
  ...getCommonConfig({
    postcssPlugins: [
      require('tailwindcss'),
      require('autoprefixer')({ overrideBrowserslist: ['last 2 versions'], cascade: false }),
    ],
  }),
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
