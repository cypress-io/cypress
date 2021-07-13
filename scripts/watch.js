const chokidar = require('chokidar')
const childProcess = require('child_process')
const path = require('path')
const pDefer = require('p-defer')

const watcher = chokidar.watch('packages/server/lib/graphql/**/*.{js,ts}', {
  cwd: path.join(__dirname, '..'),
  ignored: '*.gen.ts',
  ignoreInitial: true,
})

/**
 * @type {childProcess.ChildProcess}
 */
let child

let isClosing = false
let isRestarting = false

function runServer () {
  if (child) {
    child.removeAllListeners()
  }

  child = childProcess.fork(path.join(__dirname, 'start.js'), ['--devWatch'], {
    stdio: 'inherit',
  })

  child.on('exit', (code) => {
    if (isClosing) {
      process.exit(code)
    }
  })

  child.on('disconnect', () => {
    child = null
  })
}

async function restartServer () {
  if (isRestarting) {
    return
  }

  const dfd = pDefer()

  if (child) {
    child.on('exit', dfd.resolve)
    isRestarting = true
    child.send('close')
  } else {
    dfd.resolve()
  }

  await dfd.promise
  isRestarting = false
  runServer()
}

watcher.on('add', restartServer)
watcher.on('change', restartServer)

runServer()

process.on('beforeExit', () => {
  isClosing = true
  child?.send('close')
})
