const cp = require('child_process')
const os = require('os')
const path = require('path')
const debug = require('debug')('cypress:electron')
const Promise = require('bluebird')
const minimist = require('minimist')
const inspector = require('inspector')
const execa = require('execa')
const paths = require('./paths')
const install = require('./install')
let fs = require('fs-extra')

fs = Promise.promisifyAll(fs)

/**
 * If running as root on Linux, no-sandbox must be passed or Chrome will not start
 */
const isSandboxNeeded = () => {
  // eslint-disable-next-line no-restricted-properties
  return (os.platform() === 'linux') && (process.geteuid() === 0)
}

module.exports = {
  installIfNeeded () {
    return install.check()
  },

  install (...args) {
    debug('installing %o', { args })

    return install.package.apply(install, args)
  },

  getElectronVersion () {
    return install.getElectronVersion()
  },

  /**
   * Returns the Node version bundled inside Electron.
   */
  getElectronNodeVersion () {
    debug('getting Electron Node version')

    const args = []

    if (isSandboxNeeded()) {
      args.push('--no-sandbox')
    }

    // runs locally installed "electron" bin alias
    const localScript = path.join(__dirname, 'print-node-version.js')

    debug('local script that prints Node version %s', localScript)

    args.push(localScript)

    const options = {
      preferLocal: true, // finds the "node_modules/.bin/electron"
      timeout: 5000, // prevents hanging Electron if there is an error for some reason
    }

    debug('Running Electron with %o %o', args, options)

    return execa('electron', args, options)
    .then((result) => result.stdout)
  },

  icons () {
    return install.icons()
  },

  cli (argv = []) {
    const opts = minimist(argv)

    debug('cli options %j', opts)

    const pathToApp = argv[0]

    if (opts.install) {
      return this.installIfNeeded()
    }

    if (pathToApp) {
      return this.open(pathToApp, argv)
    }

    throw new Error('No path to your app was provided.')
  },

  open (appPath, argv, cb) {
    debug('opening %s', appPath)

    appPath = path.resolve(appPath)
    const dest = paths.getPathToResources('app')

    debug('appPath %s', appPath)
    debug('dest path %s', dest)

    // make sure this path exists!
    return fs.statAsync(appPath)
    .then(() => {
      debug('appPath exists %s', appPath)

      // clear out the existing symlink
      return fs.removeAsync(dest)
    }).then(() => {
      const symlinkType = paths.getSymlinkType()

      debug('making symlink from %s to %s of type %s', appPath, dest, symlinkType)

      return fs.ensureSymlinkAsync(appPath, dest, symlinkType)
    }).then(() => {
      const execPath = paths.getPathToExec()

      if (isSandboxNeeded()) {
        argv.unshift('--no-sandbox')
      }

      // we have an active debugger session
      if (inspector.url()) {
        const dp = process.debugPort + 1

        argv.unshift(`--inspect-brk=${dp}`)
      } else {
        const opts = minimist(argv)

        if (opts.inspectBrk) {
          argv.unshift('--inspect-brk=5566')
        }
      }

      debug('spawning %s with args', execPath, argv)

      if (debug.enabled) {
        // enable the internal chromium logger
        argv.push('--enable-logging')
      }

      return cp.spawn(execPath, argv, { stdio: 'inherit' })
      .on('close', (code, signal) => {
        debug('electron closing %o', { code, signal })

        if (signal) {
          debug('electron exited with a signal, forcing code = 1 %o', { signal })
          code = 1
        }

        if (cb) {
          debug('calling callback with code', code)

          return cb(code)
        }

        debug('process.exit with code', code)

        return process.exit(code)
      })
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.debug(err.stack)

      return process.exit(1)
    })
  },
}
