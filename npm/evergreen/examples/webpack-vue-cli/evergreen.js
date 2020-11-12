const { startEvergreen } = require('@cypress/evergreen')

const webpackConfig = require('@vue/cli-service/webpack.config')

const projectRoot = __dirname
const testPattern = 'src/**/*.spec.js'
const componentSupportFile = './component-helpers.js'

startEvergreen(webpackConfig,
  {
    projectRoot,
    testPattern,
    componentSupportFile,
    ...require('./cypress.json'),
  })
