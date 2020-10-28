const { startEvergreen } = require('@cypress/evergreen')

const webpackConfig = require('@vue/cli-service/webpack.config')

const projectRoot = __dirname

startEvergreen(webpackConfig,
  {
    projectRoot,
    ...require('./cypress.json'),
  })
