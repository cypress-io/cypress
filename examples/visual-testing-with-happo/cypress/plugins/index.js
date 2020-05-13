const preprocessor = require('../../../../plugins/react-scripts')
const happoTask = require('happo-cypress/task')

module.exports = (on, config) => {
  on('task', happoTask)
  preprocessor(on, config)
  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
