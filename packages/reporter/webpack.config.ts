import { getCommonConfig, HtmlWebpackPlugin, getCleanWebpackPlugin } from '@packages/web-config/webpack.config.base'
import path from 'path'
import type { Configuration } from 'webpack'

const CleanWebpackPlugin = getCleanWebpackPlugin()

// @ts-ignore
const config: Configuration = {
  ...getCommonConfig(),
  entry: {
    reporter: [path.resolve(__dirname, 'src')],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    devtoolModuleFilenameTemplate: 'cypress://[namespace]/[resource-path]',
  },
}

// @ts-ignore
config.plugins = [
  // @ts-ignore
  ...config.plugins,
  new HtmlWebpackPlugin({
    template: path.resolve(__dirname, 'static/index.html'),
    inject: false,
  }),
  new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
]

config.resolve = {
  ...config.resolve,
  alias: {
    'lodash': require.resolve('lodash'),
  },
}

export default config
