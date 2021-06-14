const chokidar = require('chokidar')
const childProcess = require('child_process')
const path = require('path')
const pDefer = require('p-defer')

const watcher = chokidar.watch('packages/server/lib/**/*.{js,ts}', {
  cwd: path.join(__dirname, '..'),
  ignored: '*.gen.ts',
  ignoreInitial: true,
})

/**
 * @type {childProcess.ChildProcess}
 */
let child

let isRestarting = false

function runServer () {
  if (child) {
    child.removeAllListeners()
  }

  child = childProcess.fork(path.join(__dirname, 'start.js'), ['--devWatch'], {
    stdio: 'inherit',
  })

  child.on('exit', (code) => {
    if (!isRestarting) {
      process.exit(code)
    }
  })
}
async function restartServer () {
  const dfd = pDefer()

  isRestarting = true
  child.on('exit', dfd.resolve)
  child.send('close')
  await dfd.promise
  isRestarting = false
  runServer()
}

watcher.on('add', restartServer)
watcher.on('change', restartServer)

runServer()

process.on('beforeExit', () => {
  child.send('close')
  watcher.close()
})
