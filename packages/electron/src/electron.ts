/*
 *  ^- disabled because even though the eslint config for this pkg disables
 * 'no-console', certain IDEs will still show errors.
 */

import os from 'os'
import path from 'path'
import Debug from 'debug'
import minimist from 'minimist'
import execa from 'execa'
import * as _install from './install'

const debugElectron = Debug('cypress:electron:electron')

import { open } from './open'

export { open }

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

export function cli (argv: string[] = []) {
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
