import getCommonConfig, { HtmlWebpackPlugin } from '@packages/web-config/webpack.config.base'
import path from 'path'

const commonConfig = getCommonConfig()

const config: typeof commonConfig = {
  ...commonConfig,
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
  }),
]

export default config
