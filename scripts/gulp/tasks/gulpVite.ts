/**
 * The Launchpad and App clients are both built with Vite and largely
 * share the same test pipeline and build commands.
 *
 * @summary Build pipeline for the Vite frontend(s):
 *          @packages/launchpad + @packages/app
 * @docs https://vitejs.dev
 */

import type { SpawnOptions } from 'child_process'

import { monorepoPaths } from '../monorepoPaths'
import { AllSpawnableApps, spawned, spawnUntilMatch } from '../utils/childProcessUtils'
import { CYPRESS_INTERNAL_GQL_TEST_PORT, CYPRESS_INTERNAL_VITE_APP_PORT, CYPRESS_INTERNAL_VITE_LAUNCHPAD_PORT } from '../gulpConstants'

/**------------------------------------------------------------------------
 *                      Local Development Workflow
 * Spawn the Vite frontend dev servers in watch mode.
 * * viteApp
 * * viteLaunchpad
 * * watchViteBuild
 *------------------------------------------------------------------------**/

export function viteApp () {
  return spawnViteDevServer('vite-app', `yarn vite --port ${CYPRESS_INTERNAL_VITE_APP_PORT} --base /__vite__/`, {
    cwd: monorepoPaths.pkgApp,
  })
}

export function viteLaunchpad () {
  return spawnViteDevServer('vite-launchpad', `yarn vite --port ${CYPRESS_INTERNAL_VITE_LAUNCHPAD_PORT}`, {
    cwd: monorepoPaths.pkgLaunchpad,
  })
}

// This watcher task is generally used within cypress:open when running in
// end-to-end mode.
function watchViteBuild (
  prefix: AllSpawnableApps,
  command: string,
  options: SpawnOptions = {},
) {
  // This will match strings like "built in 200ms" and "built in 5s"
  return spawnUntilMatch(prefix, {
    command,
    match: /built in (\d+)(m?s)/i,
    options,
  })
}

function spawnViteDevServer (
  prefix: AllSpawnableApps,
  command: string,
  options: SpawnOptions = {},
) {
  return spawnUntilMatch(prefix, {
    command,
    match: 'dev server running at',
    options,
  })
}

/**------------------------------------------------------------------------
 *                             Build Tasks
 * Build the Vite frontend(s) for production to be served by the Launchpad
 * and App. Generally used in CI.
 *  * viteBuildApp
 *  * viteBuildLaunchpad
 *------------------------------------------------------------------------**/

export function viteBuildApp () {
  return spawned('vite:build-app', `yarn vite build`, {
    cwd: monorepoPaths.pkgApp,
    waitForExit: true,
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  })
}

export function viteBuildLaunchpad () {
  return spawned('vite:build-launchpad', `yarn vite build`, {
    cwd: monorepoPaths.pkgLaunchpad,
    waitForExit: true,
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  })
}

export function viteCleanApp () {
  return spawned('vite-clean', `yarn clean`, {
    cwd: monorepoPaths.pkgApp,
    waitForExit: true,
  })
}

export function viteCleanLaunchpad () {
  return spawned('vite-clean', `yarn clean`, {
    cwd: monorepoPaths.pkgLaunchpad,
    waitForExit: true,
  })
}

/**------------------------------------------------------------------------
 *                             Testing Tasks
 * Build and serve the Vite frontend(s) as web apps on a static server.
 *  * viteBuildLaunchpadForTest
 *  * viteBuildAppForTest
 *  * viteServeLaunchpadForTest
 *  * viteServeAppForTest
 *------------------------------------------------------------------------**/

// After running `viteServeLaunchpadForTest`, you're able to visit
// `http://localhost:5555` to access the Launchpad frontend.
export function viteServeLaunchpadForTest () {
  return spawned('vite:serve-launchpad-for-test', `yarn serve ./dist-e2e -p 5555`, {
    cwd: monorepoPaths.pkgLaunchpad,
  })
}

export function viteBuildLaunchpadForTest () {
  return spawned('vite:build-launchpad-for-test', `yarn vite build --outDir=./dist-e2e`, {
    cwd: monorepoPaths.pkgLaunchpad,
    waitForExit: true,
    env: {
      NODE_ENV: 'production',
      VITE_CYPRESS_INTERNAL_GQL_PORT: `${CYPRESS_INTERNAL_GQL_TEST_PORT}`,
      ...process.env,
    },
  })
}

export async function viteWatchBuildLaunchpadForTest () {
  return watchViteBuild('vite:build-watch-launchpad-for-test', `yarn vite build --watch --outDir=./dist-e2e`, {
    cwd: monorepoPaths.pkgLaunchpad,
    env: {
      NODE_ENV: 'production',
      VITE_CYPRESS_INTERNAL_GQL_PORT: `${CYPRESS_INTERNAL_GQL_TEST_PORT}`,
      ...process.env,
    },
  })
}

/**----------------------
 *todo    Implement E2E tests for the App.
 *------------------------**/
// /* Serve */
// export function viteServeAppForTest() {
//   return spawned('vite:serve-app-for-test', `yarn serve ./dist-e2e -p 5555`, {
//     cwd: monorepoPaths.pkgLaunchpad
//   })
// }
//
//
// /* Build */
// export function viteBuildAppForTest() {
//   return spawned('vite:build-app-for-test', `yarn vite build --outDir=./dist-e2e`, {
//     cwd: monorepoPaths.pkgApp,
//     waitForExit: true,
//     env: {
//       [`VITE_${CYPRESS_INTERNAL_GQL_PORT}`]: `${CYPRESS_INTERNAL_GQL_PORT}`,
//       ...process.env
//     }
//   })
// }
