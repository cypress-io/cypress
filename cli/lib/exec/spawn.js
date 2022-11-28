const _ = require('lodash')
const os = require('os')
const cp = require('child_process')
const path = require('path')
const Promise = require('bluebird')
const debug = require('debug')('cypress:cli')
const debugElectron = require('debug')('cypress:electron')

const util = require('../util')
const state = require('../tasks/state')
const xvfb = require('./xvfb')
const verify = require('../tasks/verify')
const errors = require('../errors')

const isXlibOrLibudevRe = /^(?:Xlib|libudev)/
const isHighSierraWarningRe = /\*\*\* WARNING/
const isRenderWorkerRe = /\.RenderWorker-/

// Chromium (which Electron uses) always makes several attempts to connect to the system dbus.
// This works fine in most desktop environments, but in a docker container, there is no dbus service
// and Chromium emits several error lines, similar to these:

// [1957:0406/160550.146820:ERROR:bus.cc(392)] Failed to connect to the bus: Failed to connect to socket /var/run/dbus/system_bus_socket: No such file or directory
// [1957:0406/160550.147994:ERROR:bus.cc(392)] Failed to connect to the bus: Address does not contain a colon

// These warnings are absolutely harmless. Failure to connect to dbus means that electron won't be able to access the user's
// credential wallet (none exists in a docker container) and won't show up in the system tray (again, none exists).
// Failure to connect is expected and normal here, but users frequently misidentify these errors as the cause of their problems.

// https://github.com/cypress-io/cypress/issues/19299
const isDbusWarning = /Failed to connect to the bus:/

// Electron began logging these on self-signed certs with 17.0.0-alpha.4.
// Once this is fixed upstream this regex can be removed: https://github.com/electron/electron/issues/34583
// Sample:
// [3801:0606/152837.383892:ERROR:cert_verify_proc_builtin.cc(681)] CertVerifyProcBuiltin for www.googletagmanager.com failed:
// ----- Certificate i=0 (OU=Cypress Proxy Server Certificate,O=Cypress Proxy CA,L=Internet,ST=Internet,C=Internet,CN=www.googletagmanager.com) -----
// ERROR: No matching issuer found
const isCertVerifyProcBuiltin = /(^\[.*ERROR:cert_verify_proc_builtin\.cc|^----- Certificate i=0 \(OU=Cypress Proxy|^ERROR: No matching issuer found$)/

// Electron logs a benign warning about WebSwapCGLLayer on MacOS v12 and Electron v18 due to a naming collision in shared libraries.
// Once this is fixed upstream this regex can be removed: https://github.com/electron/electron/issues/33685
// Sample:
// objc[60540]: Class WebSwapCGLLayer is implemented in both /System/Library/Frameworks/WebKit.framework/Versions/A/Frameworks/WebCore.framework/Versions/A/Frameworks/libANGLE-shared.dylib (0x7ffa5a006318) and /{path/to/app}/node_modules/electron/dist/Electron.app/Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libGLESv2.dylib (0x10f8a89c8). One of the two will be used. Which one is undefined.
const isMacOSElectronWebSwapCGLLayerWarning = /^objc\[\d+\]: Class WebSwapCGLLayer is implemented in both.*Which one is undefined\./

const GARBAGE_WARNINGS = [isXlibOrLibudevRe, isHighSierraWarningRe, isRenderWorkerRe, isDbusWarning, isCertVerifyProcBuiltin, isMacOSElectronWebSwapCGLLayerWarning]

const isGarbageLineWarning = (str) => {
  return _.some(GARBAGE_WARNINGS, (re) => {
    return re.test(str)
  })
}

function isPlatform (platform) {
  return os.platform() === platform
}

function needsStderrPiped (needsXvfb) {
  return _.some([
    isPlatform('darwin'),

    (needsXvfb && isPlatform('linux')),

    util.isPossibleLinuxWithIncorrectDisplay(),
  ])
}

function needsEverythingPipedDirectly () {
  return isPlatform('win32')
}

function getStdio (needsXvfb) {
  if (needsEverythingPipedDirectly()) {
    return 'pipe'
  }

  // https://github.com/cypress-io/cypress/issues/921
  // https://github.com/cypress-io/cypress/issues/1143
  // https://github.com/cypress-io/cypress/issues/1745
  if (needsStderrPiped(needsXvfb)) {
    // returning pipe here so we can massage stderr
    // and remove garbage from Xlib and libuv
    // due to starting the Xvfb process on linux
    return ['inherit', 'inherit', 'pipe']
  }

  return 'inherit'
}

module.exports = {
  isGarbageLineWarning,

  start (args, options = {}) {
    const needsXvfb = xvfb.isNeeded()
    let executable = state.getPathToExecutable(state.getBinaryDir())

    if (util.getEnv('CYPRESS_RUN_BINARY')) {
      executable = path.resolve(util.getEnv('CYPRESS_RUN_BINARY'))
    }

    debug('needs to start own Xvfb?', needsXvfb)

    // Always push cwd into the args
    // which additionally acts as a signal to the
    // binary that it was invoked through the NPM module
    args = args || []
    if (typeof args === 'string') {
      args = [args]
    }

    args = [...args, '--cwd', process.cwd(), '--userNodePath', process.execPath, '--userNodeVersion', process.versions.node]

    _.defaults(options, {
      dev: false,
      env: process.env,
      detached: false,
      stdio: getStdio(needsXvfb),
    })

    const spawn = (overrides = {}) => {
      return new Promise((resolve, reject) => {
        _.defaults(overrides, {
          onStderrData: false,
          electronLogging: false,
        })

        const { onStderrData, electronLogging } = overrides
        const envOverrides = util.getEnvOverrides(options)
        const electronArgs = []
        const node11WindowsFix = isPlatform('win32')

        let startScriptPath

        if (options.dev) {
          executable = 'node'
          // if we're in dev then reset
          // the launch cmd to be 'npm run dev'
          startScriptPath = path.resolve(__dirname, '..', '..', '..', 'scripts', 'start.js'),

          debug('in dev mode the args became %o', args)
        }

        if (!options.dev && verify.needsSandbox()) {
          electronArgs.push('--no-sandbox')
        }

        // strip dev out of child process options
        /**
         * @type {import('child_process').ForkOptions}
         */
        let stdioOptions = _.pick(options, 'env', 'detached', 'stdio')

        // figure out if we're going to be force enabling or disabling colors.
        // also figure out whether we should force stdout and stderr into thinking
        // it is a tty as opposed to a pipe.
        stdioOptions.env = _.extend({}, stdioOptions.env, envOverrides)

        if (node11WindowsFix) {
          stdioOptions = _.extend({}, stdioOptions, { windowsHide: false })
        }

        if (electronLogging) {
          stdioOptions.env.ELECTRON_ENABLE_LOGGING = true
        }

        if (util.isPossibleLinuxWithIncorrectDisplay()) {
          // make sure we use the latest DISPLAY variable if any
          debug('passing DISPLAY', process.env.DISPLAY)
          stdioOptions.env.DISPLAY = process.env.DISPLAY
        }

        if (stdioOptions.env.ELECTRON_RUN_AS_NODE) {
          // Since we are running electron as node, we need to add an entry point file.
          startScriptPath = path.join(state.getBinaryPkgPath(path.dirname(executable)), '..', 'index.js')
        } else {
          // Start arguments with "--" so Electron knows these are OUR
          // arguments and does not try to sanitize them. Otherwise on Windows
          // an url in one of the arguments crashes it :(
          // https://github.com/cypress-io/cypress/issues/5466
          args = [...electronArgs, '--', ...args]
        }

        if (startScriptPath) {
          args.unshift(startScriptPath)
        }

        if (process.env.CYPRESS_INTERNAL_DEV_DEBUG) {
          args.unshift(process.env.CYPRESS_INTERNAL_DEV_DEBUG)
        }

        debug('spawn args %o %o', args, _.omit(stdioOptions, 'env'))
        debug('spawning Cypress with executable: %s', executable)

        const child = cp.spawn(executable, args, stdioOptions)

        function resolveOn (event) {
          return function (code, signal) {
            debug('child event fired %o', { event, code, signal })

            if (code === null) {
              const errorObject = errors.errors.childProcessKilled(event, signal)

              return errors.getError(errorObject).then(reject)
            }

            resolve(code)
          }
        }

        child.on('close', resolveOn('close'))
        child.on('exit', resolveOn('exit'))
        child.on('error', reject)

        // if stdio options is set to 'pipe', then
        //   we should set up pipes:
        //  process STDIN (read stream) => child STDIN (writeable)
        //  child STDOUT => process STDOUT
        //  child STDERR => process STDERR with additional filtering
        if (child.stdin) {
          debug('piping process STDIN into child STDIN')
          process.stdin.pipe(child.stdin)
        }

        if (child.stdout) {
          debug('piping child STDOUT to process STDOUT')
          child.stdout.pipe(process.stdout)
        }

        // if this is defined then we are manually piping for linux
        // to filter out the garbage
        if (child.stderr) {
          debug('piping child STDERR to process STDERR')
          child.stderr.on('data', (data) => {
            const str = data.toString()

            // bail if this is warning line garbage
            if (isGarbageLineWarning(str)) {
              return
            }

            // if we have a callback and this explictly returns
            // false then bail
            if (onStderrData && onStderrData(str) === false) {
              return
            }

            // else pass it along!
            process.stderr.write(data)
          })
        }

        // https://github.com/cypress-io/cypress/issues/1841
        // https://github.com/cypress-io/cypress/issues/5241
        // In some versions of node, it will throw on windows
        // when you close the parent process after piping
        // into the child process. unpiping does not seem
        // to have any effect. so we're just catching the
        // error here and not doing anything.
        process.stdin.on('error', (err) => {
          if (['EPIPE', 'ENOTCONN'].includes(err.code)) {
            return
          }

          throw err
        })

        if (stdioOptions.detached) {
          child.unref()
        }
      })
    }

    const spawnInXvfb = () => {
      return xvfb
      .start()
      .then(userFriendlySpawn)
      .finally(xvfb.stop)
    }

    const userFriendlySpawn = (linuxWithDisplayEnv) => {
      debug('spawning, should retry on display problem?', Boolean(linuxWithDisplayEnv))

      let brokenGtkDisplay

      const overrides = {}

      if (linuxWithDisplayEnv) {
        _.extend(overrides, {
          electronLogging: true,
          onStderrData (str) {
            // if we receive a broken pipe anywhere
            // then we know that's why cypress exited early
            if (util.isBrokenGtkDisplay(str)) {
              brokenGtkDisplay = true
            }

            // we should attempt to always slurp up
            // the stderr logs unless we've explicitly
            // enabled the electron debug logging
            if (!debugElectron.enabled) {
              return false
            }
          },
        })
      }

      return spawn(overrides)
      .then((code) => {
        if (code !== 0 && brokenGtkDisplay) {
          util.logBrokenGtkDisplayWarning()

          return spawnInXvfb()
        }

        return code
      })
      // we can format and handle an error message from the code above
      // prevent wrapping error again by using "known: undefined" filter
      .catch({ known: undefined }, errors.throwFormErrorText(errors.errors.unexpected))
    }

    if (needsXvfb) {
      return spawnInXvfb()
    }

    // if we are on linux and there's already a DISPLAY
    // set, then we may need to rerun cypress after
    // spawning our own Xvfb server
    const linuxWithDisplayEnv = util.isPossibleLinuxWithIncorrectDisplay()

    return userFriendlySpawn(linuxWithDisplayEnv)
  },
}
