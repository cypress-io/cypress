import commonConfig, { HtmlWebpackPlugin, CopyWebpackPlugin } from '@packages/web-config/webpack.config.base'
import path from 'path'

const config: typeof commonConfig = {
  ...commonConfig,
  entry: {
    cypress_runner: [path.resolve(__dirname, 'src')],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    devtoolModuleFilenameTemplate: '[namespace]/[resource-path]'
  },
}

config.plugins = [
  ...config.plugins!,
  // new CopyWebpackPlugin([{ from: path.resolve(__dirname, 'static/fonts'), to: 'fonts' }]),
  new HtmlWebpackPlugin({
    template: path.resolve(__dirname, 'static/index.html')
  }),
]


export default config

