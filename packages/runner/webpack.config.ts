import getCommonConfig, { HtmlWebpackPlugin } from '@packages/web-config/webpack.config.base'
import path from 'path'

const commonConfig = getCommonConfig()

const config: typeof commonConfig = {
  ...commonConfig,
  entry: {
    cypress_runner: [path.resolve(__dirname, 'src/index.js')],
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
    template: path.resolve(__dirname, './static/index.html'),
    inject: false,
  }),
]

config.resolve = {
  ...config.resolve,
  alias: {
    'bluebird': require.resolve('bluebird'),
    'lodash': require.resolve('lodash'),
    'mobx': require.resolve('mobx'),
    'mobx-react': require.resolve('mobx-react'),
    'react': require.resolve('react'),
    'react-dom': require.resolve('react-dom'),
  },
}

export default config
