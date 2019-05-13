const _ = require('lodash')
const os = require('os')
const cp = require('child_process')
const path = require('path')
const Promise = require('bluebird')
const debug = require('debug')('cypress:cli')
const { stripIndent } = require('common-tags')

const util = require('../util')
const state = require('../tasks/state')
const xvfb = require('./xvfb')
const logger = require('../logger')
const logSymbols = require('log-symbols')
const { throwFormErrorText, errors } = require('../errors')

const isXlibOrLibudevRe = /^(?:Xlib|libudev)/
const isHighSierraWarningRe = /\*\*\* WARNING/

function isPlatform (platform) {
  return os.platform() === platform
}

function needsStderrPiped (needsXvfb) {
  return isPlatform('darwin') || (needsXvfb && isPlatform('linux'))
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
      env: process.env,
      detached: false,
      stdio: getStdio(needsXvfb),
    })

    const spawn = () => {
      return new Promise((resolve, reject) => {
        if (options.dev) {
          // if we're in dev then reset
          // the launch cmd to be 'npm run dev'
          executable = 'node'
          args.unshift(
            path.resolve(__dirname, '..', '..', '..', 'scripts', 'start.js')
          )
        }

        const overrides = util.getEnvOverrides()
        const node11WindowsFix = isPlatform('win32')

        debug('spawning Cypress with executable: %s', executable)
        debug('spawn forcing env overrides %o', overrides)
        debug('spawn args %o %o', args, _.omit(options, 'env'))

        // strip dev out of child process options
        options = _.omit(options, 'dev')
        options = _.omit(options, 'binaryFolder')

        // figure out if we're going to be force enabling or disabling colors.
        // also figure out whether we should force stdout and stderr into thinking
        // it is a tty as opposed to a pipe.
        options.env = _.extend({}, options.env, overrides)
        if (node11WindowsFix) {
          options = _.extend({}, options, { windowsHide: false })
        }

        if (os.platform() === 'linux' && process.env.DISPLAY) {
          // make sure we use the latest DISPLAY variable if any
          debug('passing DISPLAY', process.env.DISPLAY)
          options.env.DISPLAY = process.env.DISPLAY
        }

        const child = cp.spawn(executable, args, options)

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
            if (
              isXlibOrLibudevRe.test(str) ||
              isHighSierraWarningRe.test(str)
            ) {
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

        if (options.detached) {
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
        return userFriendlySpawn()
      })
      .finally(xvfb.stop)
    }

    const userFriendlySpawn = (shouldRetryOnDisplayProblem) => {
      debug('spawning, should retry on display problem?', Boolean(shouldRetryOnDisplayProblem))
      if (os.platform() === 'linux') {
        debug('DISPLAY is %s', process.env.DISPLAY)
      }

      return spawn()
      .then((code) => {
        const POTENTIAL_DISPLAY_PROBLEM_EXIT_CODE = 234

        if (shouldRetryOnDisplayProblem && code === POTENTIAL_DISPLAY_PROBLEM_EXIT_CODE) {
          debug('Cypress thinks there is a display problem')
          debug('retrying the command with our XVFB')

          // if we get this error, we are on Linux and DISPLAY is set
          logger.warn(`${stripIndent`

            ${logSymbols.warning} Warning: Cypress process has finished very quickly with an error,
            which might be related to a potential problem with how the DISPLAY is configured.

            DISPLAY was set to "${process.env.DISPLAY}"

            We will attempt to spin our XVFB server and run Cypress again.
          `}\n`)

          return spawnInXvfb()
        }

        return code
      })
      .catch(throwFormErrorText(errors.unexpected))
    }

    if (needsXvfb) {
      return spawnInXvfb()
    }

    return userFriendlySpawn(os.platform() === 'linux')
  },
}
