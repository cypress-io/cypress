/**
 * How the Cypress backend is started and watched. Formerly
 * `node scripts/cypress.js open` or `node scripts/cypress.js run`
 *
 * @summary Gulp tasks to run the Cypress app.
 */
import chokidar from 'chokidar'
import path from 'path'
import pDefer from 'p-defer'
import fs from 'fs-extra'
import { DevActions } from '@packages/data-context/src/actions/DevActions'

import { monorepoPaths } from '../monorepoPaths'
import { ENV_VARS } from '../gulpConstants'
import { forked } from '../utils/childProcessUtils'
import { exitAndRemoveProcess } from './gulpRegistry'
import { ChildProcess, exec } from 'child_process'

const pathToCli = path.resolve(monorepoPaths.root, 'cli', 'bin', 'cypress')

/**------------------------------------------------------------------------
 *                            Cypress CLI
 * Starts Cypress, like a user would.
 *  * openCypress - Normal `cypress open` command
 *  * runCypress - Normal `cypress run` command
 *------------------------------------------------------------------------**/

export async function killExistingCypress () {
  const dfd = pDefer()
  const child = exec('killall Cypress')

  child.on('error', dfd.resolve)
  child.on('exit', dfd.resolve)
}

export async function openCypressLaunchpad () {
  return spawnCypressWithMode('open', 'dev', ENV_VARS.DEV_OPEN, ['--project', monorepoPaths.pkgLaunchpad])
}

export async function openCypressApp () {
  return spawnCypressWithMode('open', 'dev', ENV_VARS.DEV_OPEN, ['--project', monorepoPaths.pkgApp])
}

export async function runCypressLaunchpad () {
  return spawnCypressWithMode('run', 'dev', ENV_VARS.PROD, ['--project', monorepoPaths.pkgLaunchpad])
}

export async function runCypressApp () {
  return spawnCypressWithMode('run', 'dev', ENV_VARS.PROD, ['--project', monorepoPaths.pkgApp])
}

export async function runCypressProd () {
  return spawnCypressWithMode('run', 'prod', ENV_VARS.PROD)
}

/**------------------------------------------------------------------------
 *                         Start and Watch Utils
 *  * spawnCypressWithMode - Formerly known as: `node ./scripts/cypress.js run`
 *  * watchCypress - Watch the dev server and graphql files
 *------------------------------------------------------------------------**/

async function spawnCypressWithMode (
  mode: 'open' | 'run',
  type: 'dev' | 'prod' | 'test',
  env: Record<string, string> = {},
  additionalArgv: string[] = process.argv.slice(3).filter((a) => a !== '--no-respawning'),
) {
  let argv = [...additionalArgv]

  let debugFlag = process.execArgv.find((s) => s.startsWith('--inspect'))

  if (debugFlag) {
    if (process.debugPort) {
      debugFlag = `${debugFlag}=${process.debugPort + 1}`
    }

    env = { ...env, CYPRESS_INTERNAL_DEV_DEBUG: debugFlag }
  }

  if (mode === 'open') {
    env.CYPRESS_INTERNAL_GRAPHQL_PORT = process.env.CYPRESS_INTERNAL_GRAPHQL_PORT ?? '4444'
    if (!argv.includes('--project') && !argv.includes('--global')) {
      argv.push('--global')
    }

    // If we've passed --record, it's for a "run" mode, probably in the same pipeline.
    if (argv.includes('--record')) {
      argv = argv.slice(0, argv.indexOf('--record'))
    }
  }

  if (!argv.includes('--dev')) {
    argv.push('--dev')
  }

  const finalEnv: Record<string, string | undefined> = {
    ...process.env,
    ...env,
    LAUNCHPAD: '1',
    TS_NODE_COMPILER: 'typescript-cached-transpile',
  }

  // If we are running in CircleCI, we want to run the tests using the
  // existing E2E runner, so we need to remove process.env.LAUNCHPAD,
  // or it will serve the new runner.
  if (process.env.CIRCLECI) {
    delete finalEnv.LAUNCHPAD
  }

  return await forked(`cy:${mode}:${type}`, pathToCli, [mode, ...argv], {
    cwd: monorepoPaths.root,
    env: finalEnv,
    waitForData: false,
    execArgv: [],
  })
}

/**------------------------------------------------------------------------
 *                            Watch Commands
 * Starts Cypress, but watches the GraphQL files, and restarts the server.
 *  * startCypressWatch - Normal `cypress open` command, with watching
 *------------------------------------------------------------------------**/

export async function startCypressWatch () {
  let isClosing = false
  let isRestarting = false
  let child: ChildProcess | null = null

  async function startCypressWithListeners () {
    child = await spawnCypressWithMode('open', 'dev', ENV_VARS.DEV)

    child.on('exit', (code) => {
      if (isClosing) {
        process.exit(code ?? 0)
      }
    })

    child.on('disconnect', () => {
      child = null
    })
  }

  // Ensure that the directory we're using to touch the file for update exists
  fs.ensureDirSync(path.dirname(DevActions.CY_STATE_PATH))

  function signalRestart () {
    if (!child) {
      startCypressWithListeners()
    } else {
      fs.writeFile(DevActions.CY_STATE_PATH, JSON.stringify(new Date().toString()))
    }
  }

  /**
   * We touch a file within
   */
  async function restartServer () {
    if (isRestarting) {
      return
    }

    const dfd = pDefer()

    if (child) {
      isRestarting = true
      child.on('exit', dfd.resolve)
      await exitAndRemoveProcess(child)
    } else {
      dfd.resolve()
    }

    await dfd.promise

    if (child) {
      child.removeAllListeners()
    }

    await startCypressWithListeners()
    isRestarting = false
  }

  const watcher = chokidar.watch([
    'packages/{graphql,data-context}/src/**/*.{js,ts}',
    'packages/server/lib/**/*.{js,ts}',
  ], {
    cwd: monorepoPaths.root,
    ignored: /\.gen\.ts/,
    ignoreInitial: true,
  })

  watcher.on('add', signalRestart)
  watcher.on('change', signalRestart)

  process.on('beforeExit', () => {
    isClosing = true
    watcher.close()
  })

  const restartWatcher = chokidar.watch(DevActions.CY_TRIGGER_UPDATE, {
    ignoreInitial: true,
  })

  restartWatcher.on('add', restartServer)
  restartWatcher.on('change', restartServer)

  await startCypressWithListeners()
}

export function wrapRunWithExit (proc: ChildProcess) {
  function killAndExit (code: number) {
    process.exit(code)
  }

  proc.on('exit', (code) => {
    killAndExit(code ?? 0)
  })

  proc.on('error', (err) => {
    console.error({ err })
    killAndExit(1)
  })

  proc.on('disconnect', () => {
    console.error('disconnected')
  })
}
