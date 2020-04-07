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

const GARBAGE_WARNINGS = [isXlibOrLibudevRe, isHighSierraWarningRe, isRenderWorkerRe]

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

    // 1. Start arguments with "--" so Electron knows these are OUR
    // arguments and does not try to sanitize them. Otherwise on Windows
    // an url in one of the arguments crashes it :(
    // https://github.com/cypress-io/cypress/issues/5466

    // 2. Always push cwd into the args
    // which additionally acts as a signal to the
    // binary that it was invoked through the NPM module
    args = ['--'].concat(args, '--cwd', process.cwd())

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

        if (options.dev) {
          // if we're in dev then reset
          // the launch cmd to be 'npm run dev'
          executable = 'node'
          args.unshift(
            path.resolve(__dirname, '..', '..', '..', 'scripts', 'start.js'),
          )

          debug('in dev mode the args became %o', args)
        }

        const { onStderrData, electronLogging } = overrides
        const envOverrides = util.getEnvOverrides(options)
        const electronArgs = _.clone(args)
        const node11WindowsFix = isPlatform('win32')

        if (!options.dev && verify.needsSandbox()) {
          // this is one of the Electron's command line switches
          // thus it needs to be before "--" separator
          electronArgs.unshift('--no-sandbox')
        }

        // strip dev out of child process options
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

        debug('spawning Cypress with executable: %s', executable)
        debug('spawn args %o %o', electronArgs, _.omit(stdioOptions, 'env'))

        const child = cp.spawn(executable, electronArgs, stdioOptions)

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
