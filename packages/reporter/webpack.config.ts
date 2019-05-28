import runnerConfig, { HtmlWebpackPlugin } from '../runner/webpack.config'
import path from 'path'

const config: typeof runnerConfig = {
  ...runnerConfig,
  entry: {
    cypress_reporter: ['./src']
  },
  output: {
    path: path.resolve(__dirname, 'dist')
  },

}

config.plugins = config.plugins!.slice(1).concat(
  [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'static/index.html')
    })
  ]
)


export default config

