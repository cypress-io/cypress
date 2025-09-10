/* eslint-disable no-console */
/*
 *  ^- disabled because even though the eslint config for this pkg disables
 * 'no-console', certain IDEs will still show errors.
 */

import cp from 'child_process'
import os from 'os'
import path from 'path'
import Debug from 'debug'
import minimist from 'minimist'
import inspector from 'inspector'
import execa from 'execa'
import * as paths from './paths'
import * as _install from './install'
import { ensureSymlink, access, remove } from 'fs-extra'
import { filter, DEBUG_PREFIX } from '@packages/stderr-filtering'

const debugElectron = Debug('cypress:electron:electron')
const debugStderr = Debug('cypress:internal-stderr')

/**
 * If running as root on Linux, no-sandbox must be passed or Chrome will not start
 */
const isSandboxNeeded = () => {
  // eslint-disable-next-line no-restricted-properties
  return (os.platform() === 'linux') && (process.geteuid?.() === 0)
}

export function installIfNeeded () {
  return _install.check()
}

export function install (...args: Parameters<typeof _install.packageAndExit>) {
  debugElectron('installing %o', { args })

  return _install.packageAndExit(...args)
}

export function getElectronVersion () {
  return _install.getElectronVersion()
}

/**
 * Returns the Node version bundled inside Electron.
 */
export function getElectronNodeVersion () {
  debugElectron('getting Electron Node version')

  const args = []

  if (isSandboxNeeded()) {
    args.push('--no-sandbox')
  }

  // runs locally installed "electron" bin alias
  const localScript = path.join(__dirname, 'print-node-version.js')

  debugElectron('local script that prints Node version %s', localScript)

  args.push(localScript)

  const options = {
    preferLocal: true, // finds the "node_modules/.bin/electron"
    timeout: 10000, // prevents hanging Electron if there is an error for some reason
  }

  debugElectron('Running Electron with %o %o', args, options)

  return execa('electron', args, options)
  .then((result) => result.stdout)
}

export function icons () {
  return _install.icons()
}

export function cli (argv = []) {
  const opts = minimist(argv)

  debugElectron('cli options %j', opts)

  if (opts.install) {
    return installIfNeeded()
  }

  if (opts.help || opts.h) {
    console.log(`
Usage: cypress-electron [options] [app-path]

Options:
  --install    Install/build the Electron binary
  --help, -h   Show this help message

Examples:
  cypress-electron --install
  cypress-electron /path/to/your/app
`)

    return
  }

  const pathToApp = argv[0]

  if (pathToApp) {
    return open(pathToApp, argv)
  }

  throw new Error('No path to your app was provided.')
}

export async function open (appPath: string, argv: string[]) {
  debugElectron('opening %s', appPath)

  appPath = path.resolve(appPath)
  const dest = paths.getPathToResources('app')

  debugElectron('appPath %s', appPath)

  debugElectron('dest path %s', dest)

  try {
    await access(appPath)
    debugElectron('appPath is accessible %s', appPath)

    await remove(dest)

    const symlinkType = paths.getSymlinkType()

    debugElectron('making symlink from %s to %s of type %s', appPath, dest, symlinkType)

    await ensureSymlink(appPath, dest, symlinkType)

    const execPath = paths.getPathToExec()

    if (isSandboxNeeded()) {
      argv.unshift('--no-sandbox')
    }

    // we have an active debugger session
    if (inspector.url()) {
      const dp = process.debugPort + 1
      const inspectFlag = process.execArgv.some((f) => f === '--inspect' || f.startsWith('--inspect=')) ? '--inspect' : '--inspect-brk'

      argv.unshift(`${inspectFlag}=${dp}`)
    } else {
      const opts = minimist(argv)

      if (opts.inspectBrk) {
        if (process.env.CYPRESS_DOCKER_DEV_INSPECT_OVERRIDE) {
          argv.unshift(`--inspect-brk=${process.env.CYPRESS_DOCKER_DEV_INSPECT_OVERRIDE}`)
        } else {
          argv.unshift('--inspect-brk=5566')
        }
      }
    }

    debugElectron('spawning %s with args', execPath, argv)

    if (debugElectron.enabled) {
      argv.push('--enable-logging')
    }

    const spawned = cp.spawn(execPath, argv, { stdio: 'pipe' })

    spawned.on('error', (err) => {
      console.error(err)

      return process.exit(1)
    })

    spawned.on('close', (code, signal) => {
      debugElectron('electron closing %o', { code, signal })

      if (signal) {
        debugElectron('electron exited with a signal, forcing code = 1 %o', { signal })
        code = 1
      }

      process.exit(code)
    })

    if ([1, '1'].includes(process.env.ELECTRON_ENABLE_LOGGING ?? '')) {
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
