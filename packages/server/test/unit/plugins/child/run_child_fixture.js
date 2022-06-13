const childProcess = require('child_process')
const path = require('path')

const REQUIRE_ASYNC_CHILD_PATH = require.resolve('@packages/server/lib/plugins/child/require_async_child')

let proc

process.on('message', (msg) => {
  if (msg.msg === 'spawn') {
    proc = childProcess.fork(REQUIRE_ASYNC_CHILD_PATH, ['--projectRoot', msg.data.projectRoot, '--file', path.join(msg.data.projectRoot, 'cypress.config.js')])
    proc.on('message', (msg) => {
      process.send({ childMessage: msg })
    })

    process.send({ childPid: proc.pid })
  }

  if (msg.msg === 'toChild') {
    proc.send(msg.data)
  }
})

// Just incase the test exits
process.on('disconnect', () => {
  process.exit()
})
