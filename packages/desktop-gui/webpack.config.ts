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

  if (TEST_ENV === 'ci') {
    return [
      PostCompile(() => {
        cd(path.join(__dirname))
        exec('yarn cypress:run', { async: true })
      }, { once: true }),
    ]
  }

  return []
}

const config: typeof commonConfig = {
  ...commonConfig,
  entry: {
    app: [require.resolve('@babel/polyfill'), path.resolve(__dirname, 'src/main')],
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
.concat(getTestingPlugins())

config.resolve = {
  ...config.resolve,
}

export default config
