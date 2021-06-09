const injectDevServer = require('@cypress/react/plugins/react-scripts')
const happoTask = require('happo-cypress/task')

module.exports = (on, config) => {
  on('task', happoTask)
  injectDevServer(on, config)
}
