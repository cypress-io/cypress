import commonConfig, { HtmlWebpackPlugin, CopyWebpackPlugin } from '@packages/web-config/webpack.config.base'
import path from 'path'

const config: typeof commonConfig = {
  ...commonConfig,
  entry: {
    cypress_runner: [path.resolve(__dirname, 'src/index.js')],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    devtoolModuleFilenameTemplate: '[namespace]/[resource-path]'
  },
}

config.plugins = [
  ...config.plugins!,
  new HtmlWebpackPlugin({
    template: path.resolve(__dirname, './static/index.html'),
    inject: false,
  }),
  new CopyWebpackPlugin([{ from: path.resolve(__dirname, 'static/fonts'), to: 'fonts' }]),
]

config.resolve = {
  ...config.resolve,
  alias: {
    'react': require.resolve('react')
  },
}


export default config
