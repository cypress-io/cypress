// Component testing, TypeScript, React.js, Webpack
import { startDevServer } from '@cypress/webpack-dev-server'
import webpackConfig from './webpack.config'

export default {
  component (on, config) {
    on('dev-server:start', (options) => {
      return startDevServer({ options, webpackConfig })
    })
  },
}
