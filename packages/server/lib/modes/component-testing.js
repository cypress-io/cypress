const runnerCt = require('@packages/runner-ct')
const config = require('../config')

const run = (options) => {
  const { projectRoot } = options

  return config.get(projectRoot, options)
  .then((cfg) => {
    return runnerCt.start(projectRoot, options)
  })
}

module.exports = {
  run,
}
