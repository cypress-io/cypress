import chokidar from 'chokidar'
import path from 'path'
import childProcess, { ChildProcess } from 'child_process'
import pDefer from 'p-defer'

import { monorepoPaths } from '../monorepoPaths'

/**
 * Starts cypress, but watches the GraphQL files & restarts the server
 * when any of those change
 */
export function startCypressWatch () {
  const watcher = chokidar.watch('src/**/*.{js,ts}', {
    cwd: monorepoPaths.pkgGraphql,
    ignored: /\.gen\.ts/,
    ignoreInitial: true,
  })
  let child: ChildProcess | null = null

  let isClosing = false
  let isRestarting = false

  const argv = process.argv.slice(3)
  const pathToCli = path.resolve(monorepoPaths.root, 'cli', 'bin', 'cypress')

  function openServer () {
    if (child) {
      child.removeAllListeners()
    }

    if (!argv.includes('--project') && !argv.includes('--global')) {
      argv.push('--global')
    }

    if (!argv.includes('--dev')) {
      argv.push('--dev')
    }

    child = childProcess.fork(pathToCli, ['open', ...argv], {
      stdio: 'inherit',
      execArgv: [],
      env: {
        ...process.env,
        LAUNCHPAD: '1',
        CYPRESS_INTERNAL_DEV_WATCH: 'true',
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
    openServer()
  }

  watcher.on('add', restartServer)
  watcher.on('change', restartServer)

  openServer()

  process.on('beforeExit', () => {
    isClosing = true
    child?.send('close')
  })
}
