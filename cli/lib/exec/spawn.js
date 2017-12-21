const _ = require('lodash')
const os = require('os')
const cp = require('child_process')
const tty = require('tty')
const path = require('path')
const Promise = require('bluebird')
const debug = require('debug')('cypress:cli')

const util = require('../util')
const info = require('../tasks/info')
const xvfb = require('./xvfb')
const { throwFormErrorText, errors } = require('../errors')

const isXvfbOrLibudevRe = /^(Xlib|libudev)/

function needsStderrPipe (needsXvfb) {
  return needsXvfb && os.platform() === 'linux'
}

function getStdio (needsXvfb) {
  // https://github.com/cypress-io/cypress/issues/921
  if (needsStderrPipe(needsXvfb)) {
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

    debug('needs XVFB?', needsXvfb)

    args = [].concat(args)

    _.defaults(options, {
      detached: false,
      stdio: getStdio(needsXvfb),
    })

    const spawn = () => {
      return new Promise((resolve, reject) => {
        let cypressPath = info.getPathToExecutable()

        if (options.dev) {
          // if we're in dev then reset
          // the launch cmd to be 'npm run dev'
          cypressPath = 'node'
          args.unshift(path.resolve(__dirname, '..', '..', '..', 'scripts', 'start.js'))
        }

        debug('spawning Cypress %s', cypressPath)
        debug('spawn args %j', args, options)

        // strip dev out of child process options
        options = _.omit(options, 'dev')

        // when running in electron in windows
        // it never supports color but we're
        // going to force it anyway as long
        // as our parent cli process can support
        // colors!
        //
        // also when we are in linux and using the 'pipe'
        // option our process.stderr.isTTY will not be true
        // which ends up disabling the colors =(
        if (util.supportsColor()) {
          process.env.FORCE_COLOR = 1
          process.env.DEBUG_COLORS = 1
          process.env.MOCHA_COLORS = 1
        }
        const child = cp.spawn(cypressPath, args, options)
        child.on('close', resolve)
        child.on('error', reject)

        // if this is defined then we are manually piping for linux
        // to filter out the garbage
        child.stderr && child.stderr.on('data', (data) => {
          // bail if this is a line from xlib or libudev
          if (isXvfbOrLibudevRe.test(data.toString())) {
            return
          }

          // else pass it along!
          process.stderr.write(data)
        })

        if (options.detached) {
          child.unref()
        }
      })
    }

    const userFriendlySpawn = () =>
      spawn().catch(throwFormErrorText(errors.unexpected))

    if (needsXvfb) {
      return xvfb.start()
      .then(userFriendlySpawn)
      .finally(xvfb.stop)
    } else {
      return userFriendlySpawn()
    }
  },
}
