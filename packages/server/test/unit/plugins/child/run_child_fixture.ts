import childProcess from 'child_process'
import path from 'path'

const REQUIRE_ASYNC_CHILD_PATH = require.resolve('@packages/server/lib/plugins/child/require_async_child.ts')

let proc

function killGrandchild () {
  if (proc && !proc.killed) {
    proc.kill('SIGKILL')
  }
}

;['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => {
    killGrandchild()
    process.exit(signal === 'SIGINT' ? 130 : 143)
  })
})

process.on('exit', () => {
  killGrandchild()
})

process.on('message', (msg) => {
  if (msg.msg === 'spawn') {
    proc = childProcess.fork(REQUIRE_ASYNC_CHILD_PATH, ['--projectRoot', msg.data.projectRoot, '--file', path.join(msg.data.projectRoot, 'cypress.config.js')], {
      env: {
        // since some files are being converted to TypeScript AND we are using tsx to load the config process, we can reliably use it to load the async child here
        NODE_OPTIONS: '--import tsx',
      },
    })

    proc.on('message', (msg) => {
      process.send({ childMessage: msg })
    })

    process.send({ childPid: proc.pid })
  }

  if (msg.msg === 'toChild') {
    proc.send(msg.data)
  }
})

// If the parent test process goes away, tear down the grandchild so it cannot keep running (e.g. Ping... loop).
process.on('disconnect', () => {
  killGrandchild()
  process.exit()
})
