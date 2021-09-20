import chokidar from 'chokidar'
import path from 'path'
import childProcess, { ChildProcess } from 'child_process'
import pDefer from 'p-defer'

import { monorepoPaths } from '../monorepoPaths'
import { getGulpGlobal } from '../gulpConstants'

/**
 * Starts cypress, but watches the GraphQL files & restarts the server
 * when any of those change
 */
export function startCypressWatch () {
  const shouldWatch = getGulpGlobal('shouldWatch')

  const watcher = shouldWatch ? chokidar.watch([
    'packages/graphql/src/**/*.{js,ts}',
    'packages/server/lib/graphql/**/*.{js,ts}',
  ], {
    cwd: monorepoPaths.root,
    ignored: /\.gen\.ts/,
    ignoreInitial: true,
  }) : null

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

    const debugFlag = getGulpGlobal('debug')

    if (debugFlag) {
      process.env.CYPRESS_INTERNAL_DEV_DEBUG = debugFlag
    }

    child = childProcess.fork(pathToCli, ['open', ...argv], {
      stdio: 'inherit',
      execArgv: [],
      env: {
        ...process.env,
        LAUNCHPAD: '1',
        CYPRESS_INTERNAL_DEV_WATCH: shouldWatch ? 'true' : undefined,
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

  if (shouldWatch) {
    watcher?.on('add', restartServer)
    watcher?.on('change', restartServer)
  }

  openServer()

  process.on('beforeExit', () => {
    isClosing = true
    child?.send('close')
  })
}
