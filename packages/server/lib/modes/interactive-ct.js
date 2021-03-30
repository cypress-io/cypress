const serverCt = require('@packages/server-ct')

const run = (options) => {
  const { projectRoot } = options

  options.browser = options.browser || 'electron'

  return serverCt.start(projectRoot, options)
}

module.exports = {
  run,
}
