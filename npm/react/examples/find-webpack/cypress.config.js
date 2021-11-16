// @ts-check
const { defineConfig } = require('cypress')

const findReactScriptsWebpackConfig = require('@cypress/react/plugins/react-scripts/findReactScriptsWebpackConfig')
const { devServer } = require('@cypress/webpack-dev-server')

module.exports = defineConfig({
  video: true,
  projectId: 'jq5xpp',
  env: {
    'cypress-react-selector': {
      root: '#__cy_root',
    },
  },
  component: {
    componentFolder: 'src',
    specPattern: '**/*.spec.{js,ts,jsx,tsx}',
    devServer(cypressDevServerConfig) {
      const webpackConfig = findReactScriptsWebpackConfig(cypressDevServerConfig)

      const rules = webpackConfig.module.rules.find((rule) => !!rule.oneOf).oneOf
      const babelRule = rules.find(
        (rule) => {
          return typeof rule.loader === 'string' && /babel-loader/.test(rule.loader)
        },
      )

      if (typeof babelRule.options !== 'string') {
        babelRule.options.plugins.push(
          require.resolve('babel-plugin-istanbul'),
        )
      }

      return devServer(cypressDevServerConfig, { webpackConfig })
    },
    setupNodeEvents (on, config) {
      require('@cypress/code-coverage/task')(on, config)

      // IMPORTANT to return the config object
      // with the any changed environment variables
      return config
    },
  },
})
