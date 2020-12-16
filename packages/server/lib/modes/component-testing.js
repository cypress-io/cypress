const serverCt = require('@packages/server-ct')
const runMode = require('./run')

const DEFAULT_BROWSER_NAME = 'chrome'

// 1. create new express routes for serving top
// 2. boot websocket server
// 3. open browser to runner-ct entrypoint (top)

const run = (options) => {
  const { projectRoot, runProject } = options

  // set options.browser to chrome unless already set
  options.browser = options.browser || DEFAULT_BROWSER_NAME

  // if we're in run mode with component
  // testing then just pass this through
  // without waiting on electron to be ready
  if (runProject) {
    return require('./run').ready(options)
  }

  return serverCt.start(projectRoot, options)
}

module.exports = {
  run,
}
