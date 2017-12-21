const _ = require('lodash')
const os = require('os')
const cp = require('child_process')
const path = require('path')
const Promise = require('bluebird')
const devNull = require('dev-null')
const debug = require('debug')('cypress:cli')

const info = require('../tasks/info')
const xvfb = require('./xvfb')
const { throwFormErrorText, errors } = require('../errors')

function getStdio () {
  // https://github.com/cypress-io/cypress/issues/717
  // need to switch this else windows crashes
  if (os.platform() === 'win32') {
    return ['inherit', 'pipe', 'pipe']
  }

  return ['inherit', 'inherit', 'ignore']
}

module.exports = {
  start (args, options = {}) {
    args = [].concat(args)

    _.defaults(options, {
      detached: false,
      stdio: getStdio(),
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

        // if these are defined then we manually pipe for windows
        child.stdout && child.stdout.pipe(process.stdout)
        child.stderr && child.stderr.pipe(devNull())

        if (options.detached) {
          child.unref()
        }
      })
    }

    const userFriendlySpawn = () =>
      spawn().catch(throwFormErrorText(errors.unexpected))

    const needsXvfb = xvfb.isNeeded()
    debug('needs XVFB?', needsXvfb)

    if (needsXvfb) {
      return xvfb.start()
      .then(userFriendlySpawn)
      .finally(xvfb.stop)
    } else {
      return userFriendlySpawn()
    }
  },
}
