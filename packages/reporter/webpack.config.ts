// @ts-ignore
import commonConfig, { HtmlWebpackPlugin } from '@packages/web-config/webpack.config.base'
import path from 'path'
import PostCompile from '@packages/webpack-plugin-post-compile'
import { cd, exec } from 'shelljs'

const getTestingPlugins = () => {
  const { TEST_ENV } = process.env

  if (TEST_ENV === 'development') {
    return [
      PostCompile(() => {
        cd(path.join(__dirname))
        exec('yarn cypress:open', { async: true })
      }, { once: true }),
    ]
  }

  return []
}

const config: typeof commonConfig = {
  // @ts-ignore
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
].concat(getTestingPlugins())

export default config
