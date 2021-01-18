const serverCt = require('@packages/server-ct')

const DEFAULT_BROWSER_NAME = 'chrome'

// 1. create new express routes for serving top
// 2. boot websocket server
// 3. open browser to runner-ct entrypoint (top)

const run = (options) => {
  const { projectRoot } = options

  // set options.browser to chrome unless already set
  options.browser = options.browser || DEFAULT_BROWSER_NAME

  return serverCt.start(projectRoot, options)
}

module.exports = {
  run,
  DEFAULT_BROWSER_NAME,
}
