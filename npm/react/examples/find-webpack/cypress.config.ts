import { defineConfig } from 'cypress'

export default defineConfig({
  'video': true,
  'projectId': 'jq5xpp',
  'component': {
    'testFiles': '**/*.spec.{js,ts,jsx,tsx}',
    'componentFolder': 'src',
    setupNodeEvents (on, config) {
      const findReactScriptsWebpackConfig = require('@cypress/react/plugins/react-scripts/findReactScriptsWebpackConfig')
      const { startDevServer } = require('@cypress/webpack-dev-server')
      const _ = require('lodash')

      const map = _.map([4, 8], (n) => n * 2)

      console.log(map)
      require('@cypress/code-coverage/task')(on, config)
      const webpackConfig = findReactScriptsWebpackConfig(config)

      const rules = webpackConfig.module.rules.find((rule) => !!rule.oneOf).oneOf
      const babelRule = rules.find((rule) => typeof rule.loader === 'string' && /babel-loader/.test(rule.loader))

      typeof babelRule.options !== 'string' && babelRule.options.plugins.push(require.resolve('babel-plugin-istanbul'))

      on('dev-server:start', (options) => {
        return startDevServer({ options, webpackConfig })
      })

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
