import path from 'path'
import { access, remove, ensureSymlink } from 'fs-extra'
import { getPathToResources, getSymlinkType, getPathToExec } from './paths'
import { filter, DEBUG_PREFIX } from '@packages/stderr-filtering'
import minimist from 'minimist'
import inspector from 'inspector'
import { ChildProcess, spawn } from 'child_process'
import Debug from 'debug'
import os from 'os'

function getInspectFromUrl (url: string): string {
  const flag = process.execArgv.some((f) => f === '--inspect' || f.startsWith('--inspect=')) ? '--inspect' : '--inspect-brk'
  const port = process.debugPort + 1

  return `${flag}=${port}`
}

function getInspectFromOpts (argv: string[]): string | undefined {
  const opts = minimist(argv)

  if (opts.inspectBrk) {
    if (process.env.CYPRESS_DOCKER_DEV_INSPECT_OVERRIDE) {
      return `--inspect-brk=${process.env.CYPRESS_DOCKER_DEV_INSPECT_OVERRIDE}`
    }

    return '--inspect-brk=5566'
  }

  return undefined
}

export async function open (appPath: string, argv: string[]): Promise<ChildProcess> {
  const debugElectron = Debug('cypress:electron')
  const debugStderr = Debug('cypress:internal-stderr')

  debugElectron('opening %s', appPath)

  appPath = path.resolve(appPath)
  const dest = getPathToResources('app')

  debugElectron('appPath %s', appPath)

  debugElectron('dest path %s', dest)

  try {
    await access(appPath)
    debugElectron('appPath is accessible %s', appPath)

    await remove(dest)

    const symlinkType = getSymlinkType()

    debugElectron('making symlink from %s to %s of type %s', appPath, dest, symlinkType)

    await ensureSymlink(appPath, dest, symlinkType)

    const execPath = getPathToExec()

    // we have an active debugger session
    const inspectorUrl = inspector.url()
    const inspectArg = inspectorUrl ?
      getInspectFromUrl(inspectorUrl) :
      getInspectFromOpts(argv)

    debugElectron('spawning %s with args', execPath, argv)

    const spawned = spawn(
      execPath,
      [
        ...argv,
        debugElectron.enabled ? '--enable-logging' : '',
        // eslint-disable-next-line no-restricted-properties
        os.platform() === 'linux' && (process.geteuid?.() === 0) ? '--no-sandbox' : '',
        inspectArg ?? '',
      ].filter(Boolean),
      { stdio: 'pipe' },
    )

    spawned.on('error', (err) => {
      console.error(err)

      process.exit(1)
    })

    spawned.on('close', (code, signal) => {
      debugElectron('electron closing %o', { code, signal })

      if (signal) {
        debugElectron('electron exited with a signal, forcing code = 1 %o', { signal })
        code = 1
      }

      process.exit(code)
    })

    if (
      (process.env.ELECTRON_ENABLE_LOGGING ?? '') === '1' ||
      debugElectron.enabled ||
      (process.env.CYPRESS_INTERNAL_ENV ?? '') === 'development'
    ) {
      spawned.stderr.pipe(process.stderr)
    } else {
      spawned.stderr.pipe(filter(process.stderr, debugStderr, DEBUG_PREFIX))
    }

    spawned.stdout.pipe(process.stdout)
    process.stdin.pipe(spawned.stdin)

    return spawned
  } catch (err) {
    console.debug((err as Error).stack)
    process.exit(1)
  }
}
