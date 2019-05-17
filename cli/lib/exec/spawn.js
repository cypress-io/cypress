const _ = require('lodash')
const os = require('os')
const cp = require('child_process')
const path = require('path')
const Promise = require('bluebird')
const debug = require('debug')('cypress:cli')
const debugElectron = require('debug')('cypress:electron')
const { stripIndent } = require('common-tags')

const util = require('../util')
const state = require('../tasks/state')
const xvfb = require('./xvfb')
const logger = require('../logger')
const logSymbols = require('log-symbols')
const { throwFormErrorText, errors } = require('../errors')

const isXlibOrLibudevRe = /^(?:Xlib|libudev)/
const isHighSierraWarningRe = /\*\*\* WARNING/
const isBrokenGtkDisplayRe = /Gtk: cannot open display/

const GARBAGE_WARNINGS = [isXlibOrLibudevRe, isHighSierraWarningRe]

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

    isPossibleLinuxWithIncorrectDisplay(),
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
    // due to starting the XVFB process on linux
    return ['inherit', 'inherit', 'pipe']
  }

  return 'inherit'
}

const isPossibleLinuxWithIncorrectDisplay = () => {
  return isPlatform('linux') && process.env.DISPLAY
}

module.exports = {
  start (args, options = {}) {
    const needsXvfb = xvfb.isNeeded()
    let executable = state.getPathToExecutable(state.getBinaryDir())

    if (util.getEnv('CYPRESS_RUN_BINARY')) {
      executable = path.resolve(util.getEnv('CYPRESS_RUN_BINARY'))
    }

    debug('needs to start own XVFB?', needsXvfb)

    // always push cwd into the args
    args = [].concat(args, '--cwd', process.cwd())

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
            path.resolve(__dirname, '..', '..', '..', 'scripts', 'start.js')
          )
        }

        const { onStderrData, electronLogging } = overrides
        const envOverrides = util.getEnvOverrides()
        const electronArgs = _.clone(args)
        const node11WindowsFix = isPlatform('win32')

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

        if (isPossibleLinuxWithIncorrectDisplay()) {
          // make sure we use the latest DISPLAY variable if any
          debug('passing DISPLAY', process.env.DISPLAY)
          stdioOptions.env.DISPLAY = process.env.DISPLAY
        }

        debug('spawning Cypress with executable: %s', executable)
        debug('spawn args %o %o', electronArgs, _.omit(stdioOptions, 'env'))

        const child = cp.spawn(executable, electronArgs, stdioOptions)

        child.on('close', resolve)
        child.on('error', reject)

        child.stdin && child.stdin.pipe(process.stdin)
        child.stdout && child.stdout.pipe(process.stdout)

        // if this is defined then we are manually piping for linux
        // to filter out the garbage
        child.stderr &&
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

        // https://github.com/cypress-io/cypress/issues/1841
        // In some versions of node, it will throw on windows
        // when you close the parent process after piping
        // into the child process. unpiping does not seem
        // to have any effect. so we're just catching the
        // error here and not doing anything.
        process.stdin.on('error', (err) => {
          if (err.code === 'EPIPE') {
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
      .then(() => {
        // call userFriendlySpawn ourselves
        // to prevent result of previous promise
        // from becoming a parameter to userFriendlySpawn
        debug('spawning Cypress after starting XVFB')

        return userFriendlySpawn()
      })
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
            if (isBrokenGtkDisplayRe.test(str)) {
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
          debug('Cypress exited due to a broken gtk display because of a potential invalid DISPLAY env... retrying after starting XVFB')

          // if we get this error, we are on Linux and DISPLAY is set
          logger.warn(stripIndent`

            ${logSymbols.warning} Warning: Cypress failed to start.

            This is likely due to a misconfigured DISPLAY environment variable.

            DISPLAY was set to: "${process.env.DISPLAY}"

            Cypress will attempt to fix the problem and rerun.
          `)
          logger.warn()

          return spawnInXvfb()
        }

        return code
      })
      .catch(throwFormErrorText(errors.unexpected))
    }

    if (needsXvfb) {
      return spawnInXvfb()
    }

    // if we are on linux and there's already a DISPLAY
    // set, then we may need to rerun cypress after
    // spawning our own XVFB server
    const linuxWithDisplayEnv = isPossibleLinuxWithIncorrectDisplay()

    return userFriendlySpawn(linuxWithDisplayEnv)
  },
}
