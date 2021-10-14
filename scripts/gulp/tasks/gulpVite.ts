/**
 * The Launchpad and App clients are both built with Vite and largely
 * share the same test pipeline and build commands.
 *
 * @summary Build pipeline for the Vite frontend(s):
 *          @packages/launchpad + @packages/app
 * @docs https://vitejs.dev
 */

import type { SpawnOptions } from 'child_process'
import { ENV_VARS } from '../gulpConstants'

import { monorepoPaths } from '../monorepoPaths'
import { AllSpawnableApps, spawned, spawnUntilMatch } from '../utils/childProcessUtils'

/**------------------------------------------------------------------------
 *                      Local Development Workflow
 * Spawn the Vite frontend dev servers in watch mode.
 * * viteApp
 * * viteLaunchpad
 * * watchViteBuild
 *------------------------------------------------------------------------**/

export function viteApp () {
  const APP_PORT = ENV_VARS.DEV.CYPRESS_INTERNAL_VITE_APP_PORT

  return spawnViteDevServer('vite-app', `yarn vite --port ${APP_PORT} --base /__vite__/`, {
    cwd: monorepoPaths.pkgApp,
  })
}

export function viteLaunchpad () {
  const LAUNCHPAD_PORT = ENV_VARS.DEV.CYPRESS_INTERNAL_VITE_LAUNCHPAD_PORT

  return spawnViteDevServer('vite-launchpad', `yarn vite --port ${LAUNCHPAD_PORT}`, {
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

export async function symlinkViteProjects () {
  await Promise.all([
    spawned('cmd-symlink', 'ln -s ../app/dist dist-app', {
      cwd: monorepoPaths.pkgLaunchpad,
      waitForExit: true,
    }).catch((e) => {}),
    spawned('cmd-symlink', 'ln -s dist dist-app', {
      cwd: monorepoPaths.pkgApp,
      waitForExit: true,
    }).catch((e) => {}),
    spawned('cmd-symlink', 'ln -s dist dist-launchpad', {
      cwd: monorepoPaths.pkgLaunchpad,
      waitForExit: true,
    }).catch((e) => {}),
    spawned('cmd-symlink', 'ln -s ../launchpad/dist dist-launchpad', {
      cwd: monorepoPaths.pkgApp,
      waitForExit: true,
    }).catch((e) => {}),
  ])
}

export function viteBuildApp () {
  return spawned('vite:build-app', `yarn vite build`, {
    cwd: monorepoPaths.pkgApp,
    waitForExit: true,
    env: {
      // ...process.env,
      NODE_ENV: 'production',
    },
  })
}

export function viteBuildAndWatchApp () {
  return watchViteBuild('vite:build-watch-app', `yarn vite build --watch`, {
    cwd: monorepoPaths.pkgApp,
    env: {
      // ...process.env,
      NODE_ENV: 'production',
    },
  })
}

export function viteBuildLaunchpad () {
  return spawned('vite:build-launchpad', `yarn vite build`, {
    cwd: monorepoPaths.pkgLaunchpad,
    waitForExit: true,
  })
}

export function viteBuildAndWatchLaunchpad () {
  return watchViteBuild('vite:build-watch-launchpad', `yarn vite build --watch`, {
    cwd: monorepoPaths.pkgLaunchpad,
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
