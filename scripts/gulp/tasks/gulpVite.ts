/**
 * The Launchpad and App clients are both built with Vite and largely
 * share the same test pipeline and build commands.
 *
 * @summary Build pipeline for the Vite frontend(s):
 *          @packages/launchpad + @packages/app
 * @docs https://vitejs.dev
 */

import type { SpawnOptions } from 'child_process'
import fs from 'fs-extra'
import path from 'path'

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
  const baseSuffix = `--base /__cypress/assets/`

  // TODO: remove once we have sourcemap
  if (process.env.CYPRESS_INTERNAL_VITE_DEV) {
    const port = process.env.CYPRESS_INTERNAL_VITE_APP_PORT ??= '3333'

    return spawnViteDevServer('vite-app', `yarn vite --port ${port} ${baseSuffix}`, {
      cwd: monorepoPaths.pkgApp,
    })
  }

  return watchViteBuild('vite-app', `yarn vite build --mode development --minify false --watch ${baseSuffix}`, {
    cwd: monorepoPaths.pkgApp,
  })
}

export function viteLaunchpad () {
  if (process.env.CYPRESS_INTERNAL_VITE_DEV) {
    const port = process.env.CYPRESS_INTERNAL_VITE_LAUNCHPAD_PORT ??= '3001'

    return spawnViteDevServer('vite-launchpad', `yarn vite --port ${port}`, {
      cwd: monorepoPaths.pkgLaunchpad,
    })
  }

  return watchViteBuild('vite-launchpad', `yarn vite build --mode development --minify false --watch`, {
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

const DIST_SOURCES = {
  'dist-launchpad': path.join(monorepoPaths.pkgLaunchpad, 'dist'),
  'dist-app': path.join(monorepoPaths.pkgApp, 'dist'),
} as const

export async function symlinkViteProjects () {
  // If we're running the vite server script, we don't have a dist
  if (process.env.CYPRESS_INTERNAL_VITE_DEV) {
    return
  }

  for (const basePath of [monorepoPaths.pkgLaunchpad, monorepoPaths.pkgApp]) {
    for (const target of ['dist-launchpad', 'dist-app'] as const) {
      if (!fs.existsSync(path.join(basePath, target))) {
        await fs.createSymlink(DIST_SOURCES[target], path.join(basePath, target), 'dir')
      }
    }
  }
}

export function viteBuildApp () {
  return spawned('vite:build-app', `yarn vite build --outDir dist`, {
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
  return spawned('vite:build-launchpad', `yarn vite build --outDir dist`, {
    cwd: monorepoPaths.pkgLaunchpad,
    waitForExit: true,
  })
}

export function viteBuildAndWatchLaunchpad () {
  return watchViteBuild('vite:build-watch-launchpad', `yarn vite build --watch`, {
    cwd: monorepoPaths.pkgLaunchpad,
  })
}

export function generateShikiTheme () {
  return spawned('vite:build-generate-shiki-theme', `yarn generate-shiki-theme`, {
    cwd: monorepoPaths.pkgFrontendShared,
  })
}

export async function viteClean () {
  return Promise.all([
    viteCleanApp(),
    viteCleanLaunchpad(),
  ])
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
