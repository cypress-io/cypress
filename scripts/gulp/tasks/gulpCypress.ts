/**
 * How the Cypress backend is started and watched. Formerly
 * `node scripts/cypress.js open` or `node scripts/cypress.js run`
 *
 * @summary Gulp tasks to run the Cypress app.
 */
// @ts-expect-error - no types
import chokidar from 'chokidar'
import path from 'path'
import pDefer from 'p-defer'

import { monorepoPaths } from '../monorepoPaths'
import { ENV_VARS, getGulpGlobal } from '../gulpConstants'
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
  additionalArgv: string[] = [],
) {
  let argv = process.argv.slice(3).concat(additionalArgv)

  const debugFlag = getGulpGlobal('debug')

  if (debugFlag) {
    env = { ...env, CYPRESS_INTERNAL_DEV_DEBUG: debugFlag }
  }

  if (mode === 'open') {
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

  const finalEnv = {
    ...process.env,
    ...env,
    LAUNCHPAD: '1',
  }

  return await forked(`cy:${mode}:${type}`, pathToCli, [mode, ...argv], {
    cwd: monorepoPaths.root,
    env: finalEnv,
    waitForData: false,
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

  if (getGulpGlobal('shouldWatch')) {
    const watcher = chokidar.watch([
      'packages/{graphql,data-context}/src/**/*.{js,ts}',
      'packages/server/lib/**/*.{js,ts}',
    ], {
      cwd: monorepoPaths.root,
      ignored: /\.gen\.ts/,
      ignoreInitial: true,
    })

    watcher.on('add', restartServer)
    watcher.on('change', restartServer)

    process.on('beforeExit', () => {
      isClosing = true
      watcher.close()
    })
  }

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
