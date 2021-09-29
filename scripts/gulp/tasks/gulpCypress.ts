/**
 * How the Cypress backend is started and watched. Formerly
 * `node scripts/cypress.js open` or `node scripts/cypress.js run`
 *
 * @summary Gulp tasks to run the Cypress app.
 */

import chokidar from 'chokidar'
import path from 'path'
import type { ChildProcess } from 'child_process'
import pDefer from 'p-defer'

import { monorepoPaths } from '../monorepoPaths'
import { ENV_VARS, getGulpGlobal } from '../gulpConstants'
import { forked } from '../utils/childProcessUtils'

const pathToCli = path.resolve(monorepoPaths.root, 'cli', 'bin', 'cypress')

/**------------------------------------------------------------------------
 *                            Cypress CLI
 * Starts Cypress, like a user would.
 *  * openCypress - Normal `cypress open` command
 *  * runCypress - Normal `cypress run` command
 *------------------------------------------------------------------------**/

export async function openCypressLaunchpad () {
  return spawnCypressWithMode('open', 'dev', ENV_VARS.DEV_OPEN, ['--project', monorepoPaths.pkgLaunchpad])
}

export async function runCypressProd () {
  return spawnCypressWithMode('run', 'prod', ENV_VARS.PROD)
}

/**------------------------------------------------------------------------
 *                             Testing Tasks
 * Building and running the Cypress app and graphql server for testing.
 *  * startCypressForTest - Start the Cypress server, but without watching
 *  * runCypressAgainstDist - Serve the dist'd frontend over file://
 *------------------------------------------------------------------------**/

// Use the GQL Test Port (52100 by default, defined in ./gulp/gulpConstants)
// Spawns Cypress in "Test Cypress within Cypress" mode
export async function startCypressForTest () {
  return spawnCypressWithMode('open', 'test', ENV_VARS.E2E_TEST_TARGET)
}

export async function runCypressAgainstDist () {
  return spawnCypressWithMode('run', 'test', ENV_VARS.E2E_TEST_TARGET)
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
  const argv = process.argv.slice(3).concat(additionalArgv)

  const debugFlag = getGulpGlobal('debug')

  console.log(debugFlag)

  if (debugFlag) {
    env = { ...env, CYPRESS_INTERNAL_DEV_DEBUG: debugFlag }
  }

  if (mode === 'open') {
    if (!argv.includes('--project') && !argv.includes('--global')) {
      argv.push('--global')
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
  const watcher = chokidar.watch([
    'packages/graphql/src/**/*.{js,ts}',
    'packages/server/lib/graphql/**/*.{js,ts}',
  ], {
    cwd: monorepoPaths.root,
    ignored: /\.gen\.ts/,
    ignoreInitial: true,
  })

  let isClosing = false
  let isRestarting = false
  let child: ChildProcess | null = null

  async function startCypressWithListeners () {
    let WATCH_ENV: Record<string, string> = {
      ...ENV_VARS.DEV,
      CYPRESS_INTERNAL_DEV_WATCH: `true`,
    }

    child = await spawnCypressWithMode('open', 'dev', WATCH_ENV)

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
      child.send('gulpWatcherClose')
    } else {
      dfd.resolve()
    }

    await dfd.promise
    isRestarting = false

    if (child) {
      child.removeAllListeners()
    }

    await startCypressWithListeners()
  }

  watcher.on('add', restartServer)
  watcher.on('change', restartServer)

  await startCypressWithListeners()

  process.on('beforeExit', () => {
    isClosing = true
    watcher.close()
    child?.send('gulpWatcherClose')
  })
}
