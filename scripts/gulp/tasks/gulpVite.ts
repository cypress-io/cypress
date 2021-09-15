import type { SpawnOptions } from 'child_process'
import getenv from 'getenv'
import pDefer from 'p-defer'
import { monorepoPaths } from '../monorepoPaths'
import { AllSpawnableApps, spawned } from '../utils/childProcessUtils'

const CYPRESS_VITE_APP_PORT = getenv.int('CYPRESS_VITE_APP_PORT', 3333)
const CYPRESS_VITE_LAUNCHPAD_PORT = getenv.int('CYPRESS_VITE_LAUNCHPAD_PORT', 3001)

export function viteApp () {
  return viteDev('vite-app', `yarn vite --port ${CYPRESS_VITE_APP_PORT} --base /__vite__/`, {
    cwd: monorepoPaths.pkgApp,
  })
}

export function viteLaunchpad () {
  return viteDev('vite-launchpad', `yarn vite --port ${CYPRESS_VITE_LAUNCHPAD_PORT}`, {
    cwd: monorepoPaths.pkgLaunchpad,
  })
}

export function viteBuildApp () {
  return spawned('vite:build-app', `yarn vite build`, {
    cwd: monorepoPaths.pkgApp,
  })
}

export function viteBuildLaunchpad () {
  return spawned('vite:build-launchpad', `yarn vite build`, {
    cwd: monorepoPaths.pkgLaunchpad,
  })
}

export function viteCleanApp () {
  return spawned('vite-clean', `yarn clean`, {
    cwd: monorepoPaths.pkgApp,
  })
}

export function viteCleanLaunchpad () {
  return spawned('vite-clean', `yarn clean`, {
    cwd: monorepoPaths.pkgLaunchpad,
  })
}

function viteDev (
  prefix: AllSpawnableApps,
  command: string,
  opts: SpawnOptions = {},

) {
  const dfd = pDefer()
  let ready = false

  spawned(prefix, command, opts, {
    tapOut (chunk, enc, cb) {
      if (!ready && String(chunk).includes('dev server running at')) {
        ready = true
        setTimeout(() => dfd.resolve(), 20) // flush the rest of the chunks
      }

      cb(null, chunk)
    },
  })

  return dfd.promise
}
