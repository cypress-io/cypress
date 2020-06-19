import getCommonConfig, { HtmlWebpackPlugin } from '@packages/web-config/webpack.config.base'
import path from 'path'
import webpack from 'webpack'

// @ts-ignore
const config: webpack.Configuration = {
  ...getCommonConfig(),
  entry: {
    components: [path.resolve(__dirname, 'cypress', 'support', 'test-entry.jsx')],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    devtoolModuleFilenameTemplate: 'cypress://[namespace]/[resource-path]',
  },
}

config.plugins = [
  // @ts-ignore
  ...config.plugins,
  new HtmlWebpackPlugin({
    template: path.resolve(__dirname, 'cypress/support/test-entry.html'),
  }),
]

export default config
