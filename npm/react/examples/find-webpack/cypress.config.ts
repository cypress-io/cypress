import { defineConfig } from 'cypress'
import { devServer } from '@cypress/webpack-dev-server'

export default defineConfig({
  'video': true,
  'projectId': 'jq5xpp',
  'component': {
    devServer (cypressDevServerConfig) {
      const findReactScriptsWebpackConfig = require('@cypress/react/plugins/react-scripts/findReactScriptsWebpackConfig')
      const _ = require('lodash')

      const map = _.map([4, 8], (n) => n * 2)

      console.log(map)
      const webpackConfig = findReactScriptsWebpackConfig(cypressDevServerConfig.config)

      const rules = webpackConfig.module.rules.find((rule) => !!rule.oneOf).oneOf
      const babelRule = rules.find((rule) => typeof rule.loader === 'string' && /babel-loader/.test(rule.loader))

      typeof babelRule.options !== 'string' && babelRule.options.plugins.push(require.resolve('babel-plugin-istanbul'))

      return devServer(cypressDevServerConfig, { webpackConfig })
    },
    setupNodeEvents (on, config) {
      require('@cypress/code-coverage/task')(on, config)

      // IMPORTANT to return the config object
      // with the any changed environment variables
      return config
    },
  },
  'env': {
    'cypress-react-selector': {
      'root': '#__cy_root',
    },
  },
})
