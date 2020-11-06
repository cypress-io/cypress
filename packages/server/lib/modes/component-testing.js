const serverCt = require('@packages/server-ct')

// 1. create new express routes for serving top
// 2. boot websocket server
// 3. open browser to runner-ct entrypoint (top)

const run = (options) => {
  const { projectRoot } = options

  return serverCt.start(projectRoot, options)
}

module.exports = {
  run,
}
