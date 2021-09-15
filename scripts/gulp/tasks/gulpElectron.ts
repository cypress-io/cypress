import chokidar from 'chokidar'
import path from 'path'
import childProcess, { ChildProcess } from 'child_process'
import pDefer from 'p-defer'

import { monorepoPaths } from '../monorepoPaths'

/**
 *
 */
export function startElectronWatch () {
  const watcher = chokidar.watch('src/**/*.{js,ts}', {
    cwd: monorepoPaths.pkgGraphql,
    ignored: /\.gen\.ts/,
    ignoreInitial: true,
  })
  let child: ChildProcess | null = null

  let isClosing = false
  let isRestarting = false

  function runServer () {
    if (child) {
      child.removeAllListeners()
    }

    child = childProcess.fork(path.join(__dirname, '../..', 'start.js'), ['--devWatch', ...process.argv], {
      stdio: 'inherit',
      env: {
        ...process.env,
        LAUNCHPAD: '1',
      },
    })

    child.on('exit', (code) => {
      if (isClosing) {
        process.exit(code ?? 0)
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
}
