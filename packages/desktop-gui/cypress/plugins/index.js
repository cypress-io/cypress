const percyHealthCheck = require('@percy/cypress/task')
const useMyWebpack = require('cypress-react-unit-test/plugins/load-webpack')

module.exports = (on, config) => {
  on('task', percyHealthCheck)

  return useMyWebpack(on, config)
}
