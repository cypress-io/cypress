/**
 * How the Cypress backend is started and watched. Formerly
 * `node scripts/cypress.js open` or `node scripts/cypress.js run`
 *
 * @summary Gulp tasks to run the Cypress app.
 */

import chokidar from 'chokidar'
import path from 'path'
import childProcess, { ChildProcess } from 'child_process'
import pDefer from 'p-defer'

import { monorepoPaths } from '../monorepoPaths'
import { getGulpGlobal, CYPRESS_INTERNAL_GQL_PORT, CYPRESS_INTERNAL_GQL_TEST_PORT } from '../gulpConstants'

const gqlPort = process.env.CYPRESS_INTERNAL_GQL_PORT || `${CYPRESS_INTERNAL_GQL_PORT}`
const gqlTestPort = process.env.CYPRESS_INTERNAL_GQL_TEST_PORT || `${CYPRESS_INTERNAL_GQL_TEST_PORT}`

const pathToCli = path.resolve(monorepoPaths.root, 'cli', 'bin', 'cypress')

/**------------------------------------------------------------------------
 *                            Cypress CLI
 * Starts Cypress, like a user would.
 *  * startCypress - Normal `cypress open` command
 *  * runCypress - Normal `cypress run` command
 *------------------------------------------------------------------------**/

export async function startCypress () {
  return spawnCypressWithMode('open', 'dev', {
    CYPRESS_INTERNAL_GQL_PORT: gqlPort,
  })
}

export async function runCypress () {
  return spawnCypressWithMode('run', 'prod', {
    CYPRESS_INTERNAL_ENV: process.env.CYPRESS_INTERNAL_ENV || 'production',
    CYPRESS_INTERNAL_GQL_PORT: gqlPort,
  })
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
  return spawnCypressWithMode('open', 'test', {
    CYPRESS_INTERNAL_ENV: 'production',
    CYPRESS_INTERNAL_GQL_PORT: gqlTestPort,
    CYPRESS_INTERNAL_E2E_TESTING_SELF: 'true',
  })
}

export async function runCypressAgainstDist () {
  return spawnCypressWithMode('run', 'test', {
    CYPRESS_INTERNAL_ENV: 'staging',
    CYPRESS_INTERNAL_GQL_PORT: gqlPort,
  })
}

/**------------------------------------------------------------------------
 *                         Start and Watch Utils
 *  * spawnCypressWithMode - Formerly known as: `node ./scripts/cypress.js run`
 *  * watchCypress - Watch the dev server and graphql files
 *------------------------------------------------------------------------**/

async function spawnCypressWithMode (mode: 'open' | 'run', type: 'dev' | 'prod' | 'test', env: Record<string, string> = {}) {
  const argv = process.argv.slice(3)

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

  return childProcess.fork(pathToCli, [mode, ...argv], {
    stdio: 'inherit',
    execArgv: [],
    env: finalEnv,
  })
}

/**------------------------------------------------------------------------
 *                            Watch Commands
 * Starts Cypress, but watches the GraphQL files, and restarts the server.
 *  * startCypressWatch - Normal `cypress open` command, with watching
 *------------------------------------------------------------------------**/

export async function startCypressWatch () {
  const shouldWatch = getGulpGlobal('shouldWatch')

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
    child = await spawnCypressWithMode('open', 'dev', {
      CYPRESS_INTERNAL_DEV_WATCH: 'true',
      CYPRESS_INTERNAL_GQL_PORT: gqlPort,
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

    if (child) {
      child.removeAllListeners()
    }

    await startCypressWithListeners()
  }

  if (shouldWatch) {
    watcher?.on('add', restartServer)
    watcher?.on('change', restartServer)
  }

  await startCypressWithListeners()

  process.on('beforeExit', () => {
    isClosing = true
    child?.send('close')
  })
}
