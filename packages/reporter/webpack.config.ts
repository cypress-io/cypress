import getCommonConfig, { HtmlWebpackPlugin } from '@packages/web-config/webpack.config.base'
import path from 'path'
import webpack from 'webpack'

// @ts-ignore
const config: webpack.Configuration = {
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
]

config.resolve = {
  ...config.resolve,
  alias: {
    'lodash': require.resolve('lodash'),
    'mobx': require.resolve('mobx'),
    'mobx-react': require.resolve('mobx-react'),
    'react': require.resolve('react'),
    'react-dom': require.resolve('react-dom'),
  },
}

export default config
