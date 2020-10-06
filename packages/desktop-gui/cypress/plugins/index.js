const cp = require('child_process')
const percyHealthCheck = require('@percy/cypress/task')
const useMyWebpack = require('cypress-react-unit-test/plugins/load-webpack')

cp.exec('http-server -p 5005 dist')

module.exports = (on, config) => {
  on('task', percyHealthCheck)

  return useMyWebpack(on, config)
}
